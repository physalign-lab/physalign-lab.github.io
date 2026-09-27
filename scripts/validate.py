#!/usr/bin/env python3
"""Validate website data and local assets. Standard library only; no evaluator calls.

Normal mode permits incomplete publication metadata and scores explicitly set to null.
--release additionally requires final public metadata. It does NOT verify scientific
correctness, sample membership, upstream licensing, or actual remote URL availability.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import math
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
WARNINGS: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        ERRORS.append(message)

def number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def score(value: object, name: str, low: float = 0, high: float = 100) -> None:
    require(value is None or (number(value) and low <= value <= high), f'{name}: expected null or a finite number in [{low}, {high}].')

def count(value: object, name: str) -> None:
    require(isinstance(value, int) and not isinstance(value, bool) and value >= 0, f'{name}: expected a nonnegative integer.')

def url(value: object, name: str, mail: bool = False) -> None:
    if value in ('', None):
        return
    require(isinstance(value, str), f'{name}: expected a URL string.')
    if not isinstance(value, str):
        return
    try:
        parsed = urlsplit(value)
        valid = (parsed.scheme in ('https', 'http') and bool(parsed.netloc) and not parsed.username and not parsed.password) or (mail and parsed.scheme == 'mailto' and bool(parsed.path))
        require(valid, f'{name}: use an absolute https URL (or mailto for contact).')
        require(not any(s in value.upper() for s in ('YOUR_', 'REPLACE_', 'EXAMPLE.COM', '<', '>')), f'{name}: contains a placeholder; leave it empty until the real URL is available.')
    except ValueError:
        ERRORS.append(f'{name}: invalid URL.')

def date(value: object, name: str, optional: bool = False) -> None:
    if optional and value is None:
        return
    try:
        dt.date.fromisoformat(value)
    except (ValueError, TypeError):
        ERRORS.append(f'{name}: expected YYYY-MM-DD' + (' or null.' if optional else '.'))

def load(relative: str) -> dict:
    try:
        value = json.loads((ROOT / relative).read_text(encoding='utf-8'))
        if not isinstance(value, dict):
            raise ValueError('Top level must be an object.')
        return value
    except (OSError, ValueError) as exc:
        raise ValueError(f'{relative}: {exc}') from exc

def validate(release: bool = False) -> None:
    site = load('data/site.json')
    data = load('data/leaderboard.json')
    require(data.get('schema_version') == 1, 'schema_version must equal 1.')
    date(data.get('updated'), 'updated')
    for key in ('project_name', 'paper_title', 'subtitle', 'tagline', 'footer_note'):
        require(isinstance(site.get(key), str) and bool(site[key].strip()), f'site.{key}: required text.')
    url(site.get('website_url'), 'website_url')
    for key in ('paper', 'code', 'dataset', 'contact', 'submission'):
        url(site.get('links', {}).get(key), f'links.{key}', mail=key == 'contact')
    for a in site.get('authors', []):
        require(isinstance(a.get('name'), str) and bool(a['name'].strip()), 'Each author needs a name.')
        url(a.get('url'), 'author.url')
    required_metadata = {
        'website_url': site.get('website_url'), 'authors': site.get('authors'), 'bibtex': site.get('bibtex'),
        **{f'links.{k}': site.get('links', {}).get(k) for k in ('paper', 'code', 'dataset')}
    }
    for k, v in required_metadata.items():
        if not v:
            (ERRORS if release else WARNINGS).append(f'{k}: not configured; corresponding publication UI is empty/disabled.')
    tracks = data.get('tracks', [])
    require(isinstance(tracks, list) and bool(tracks), 'At least one track is required.')
    track_map = {}
    for t in tracks:
        require(t.get('id') not in track_map, f'Duplicate track: {t.get("id")}')
        track_map[t.get('id')] = t
        for key in ('id', 'label', 'description', 'benchmark_id', 'protocol_id'):
            require(isinstance(t.get(key), str) and bool(t[key]), f'track.{key}: required text.')
        url(t.get('reference_url'), 'track.reference_url')
        for pool in ('G', 'L', 'P', 'solve'):
            support = t.get('pools', {}).get(pool, {})
            count(support.get('parents'), f'{t.get("id")}.{pool}.parents')
            if pool != 'solve':
                count(support.get('probes'), f'{t.get("id")}.{pool}.probes')
    require(site.get('default_track') in track_map, 'default_track must reference an existing track.')
    metric_keys = ('gacc_all', 'cacc', 'jacc', 'gacc_joint', 'solveacc')
    require(site.get('default_metric') in metric_keys, 'default_metric is not a supported main metric.')
    models = data.get('models', [])
    require(isinstance(models, list), 'models must be an array.')
    seen = set()
    for m in models:
        ident = m.get('id', '')
        require(isinstance(ident, str) and bool(ident) and ident not in seen, f'Model ID is empty or duplicate: {ident}')
        seen.add(ident)
        require(m.get('access') in ('open', 'api'), f'{ident}.access: use open or api.')
        require(m.get('status') in ('paper-reported', 'maintainer-verified', 'community-unverified'), f'{ident}.status: unsupported status.')
        for k in ('name', 'family', 'result_source'):
            require(isinstance(m.get(k), str) and bool(m[k]), f'{ident}.{k}: required text.')
        t = track_map.get(m.get('track_id'))
        require(t is not None, f'{ident}: unknown track_id.')
        if t:
            require(m.get('benchmark_id') == t.get('benchmark_id'), f'{ident}: benchmark_id differs from track.')
            require(m.get('protocol_id') == t.get('protocol_id'), f'{ident}: protocol_id differs from track.')
            for key in ('dataset_revision', 'evaluator_commit', 'membership_sha256'):
                if t.get(key):
                    require(m.get(key) == t[key], f'{ident}: {key} differs from fixed track.')
        url(m.get('model_url'), f'{ident}.model_url')
        url(m.get('artifact_url'), f'{ident}.artifact_url')
        date(m.get('run_created_utc'), f'{ident}.run_created_utc', optional=True)
        metrics = m.get('metrics', {})
        for k in metric_keys:
            require(k in metrics, f'{ident}.metrics: {k} missing; use null for unmeasured.')
            score(metrics.get(k), f'{ident}.{k}')
        c, j, g = (metrics.get(k) for k in ('cacc', 'jacc', 'gacc_joint'))
        if all(number(v) for v in (c, j, g)):
            require(j <= c + .021 and j <= g + .021, f'{ident}: JAcc cannot exceed same-set CAcc or GAccL.')
            require(100 - c - g + j >= -.031, f'{ident}: impossible negative joint quadrant.')
        for pool in ('G', 'L', 'solve'):
            support = m.get('support', {}).get(pool, {})
            count(support.get('parents'), f'{ident}.{pool}.parents')
            if pool != 'solve':
                count(support.get('probes'), f'{ident}.{pool}.probes')
            relevant = ('gacc_all',) if pool == 'G' else ('solveacc',) if pool == 'solve' else ('cacc', 'jacc', 'gacc_joint')
            if any(number(metrics.get(k)) for k in relevant):
                require(isinstance(support.get('parents'), int) and support['parents'] > 0, f'{ident}: a reported score requires nonzero {pool} support.')
                if pool != 'solve':
                    require(isinstance(support.get('probes'), int) and support['probes'] > 0, f'{ident}: a reported score requires nonzero {pool} probe support.')
        pair = m.get('paired', {})
        for k in ('parents', 'probes'):
            count(pair.get(k), f'{ident}.paired.{k}')
        for k in ('base', 'gt'):
            score(pair.get(k), f'{ident}.paired.{k}')
        score(pair.get('delta_pp'), f'{ident}.paired.delta_pp', -100, 100)
        if all(number(pair.get(k)) for k in ('base', 'gt', 'delta_pp')):
            require(abs(pair['gt'] - pair['base'] - pair['delta_pp']) <= .0201,
                    f'{ident}: paired delta differs beyond independent two-decimal rounding tolerance.')
            require(pair['parents'] > 0 and pair['probes'] > 0, f'{ident}: paired scores require observed support.')
        ci = pair.get('ci95_pp')
        if ci is not None:
            require(isinstance(ci, list) and len(ci) == 2 and all(number(v) for v in ci) and ci[0] <= ci[1], f'{ident}: CI must be [lower, upper] or null.')
        diagnostic = m.get('diagnostics', {})
        score(diagnostic.get('grounding_error_given_correct_reading'), f'{ident}.GErr|C')
        q = diagnostic.get('joint_quadrants')
        if q is not None:
            require(isinstance(q, list) and len(q) == 4, f'{ident}: expected four joint quadrants.')
            if isinstance(q, list) and len(q) == 4:
                for i, value in enumerate(q):
                    score(value, f'{ident}.quadrant{i}')
                if all(number(v) for v in q):
                    require(abs(sum(q) - 100) <= .031, f'{ident}: quadrants should sum to 100 within rounding tolerance.')
        # Do not recompute conditional ratios from rounded numbers. Low CAcc can amplify rounding.
    for required in ('index.html', '.nojekyll', 'assets/css/style.css', 'assets/js/app.js', 'docs/LEADERBOARD_PROTOCOL.md'):
        require((ROOT / required).is_file(), f'Missing file: {required}')
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    for path in re.findall(r'(?:src|href|data-zoom)="\./([^"?#]+)', html):
        require((ROOT / path).is_file(), f'Broken local asset/link: {path}')
    for p in ROOT.rglob('*'):
        if p.is_file() and p.suffix.lower() in ('.woff', '.woff2', '.ttf', '.otf'):
            ERRORS.append(f'Do not redistribute font files: {p.relative_to(ROOT)}')
    print(f'Checked {len(models)} model records, {len(tracks)} track(s), configuration and local links.')

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release', action='store_true', help='Require final authors, bibliography and public paper/code/dataset/site URLs.')
    args = parser.parse_args()
    try:
        validate(args.release)
    except (ValueError, TypeError, AttributeError, KeyError) as exc:
        ERRORS.append(str(exc))
    for warning in WARNINGS:
        print('WARNING:', warning)
    for error in ERRORS:
        print('ERROR:', error, file=sys.stderr)
    print('FAIL' if ERRORS else 'PASS (metadata warnings are allowed in preview mode)')
    return int(bool(ERRORS))

if __name__ == '__main__':
    raise SystemExit(main())
