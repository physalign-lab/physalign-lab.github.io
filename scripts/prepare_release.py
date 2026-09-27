#!/usr/bin/env python3
"""Optional: put configured publication metadata into static HTML for link previews.
Run from any directory after editing data/site.json. No dependencies or model calls.
"""
from __future__ import annotations
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, urljoin

ROOT = Path(__file__).resolve().parents[1]
START, END = '<!-- BEGIN CONFIGURED META -->', '<!-- END CONFIGURED META -->'

def https(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError('website_url must be an absolute HTTPS homepage URL, including the project subpath where applicable.')
    return value.rstrip('/') + '/'

def main() -> None:
    config = json.loads((ROOT / 'data/site.json').read_text(encoding='utf-8'))
    if not config.get('website_url'):
        raise ValueError('Set website_url in data/site.json first. This step is optional for local preview.')
    base = https(config['website_url'])
    escape = lambda s: html.escape(str(s), quote=True)
    title = config['paper_title']
    lines = [f'<link rel="canonical" href="{escape(base)}">',
             f'<meta property="og:url" content="{escape(base)}">',
             f'<meta property="og:image" content="{escape(urljoin(base, "assets/img/teaser.webp"))}">',
             '<meta name="twitter:card" content="summary_large_image">',
             f'<meta name="citation_title" content="{escape(title)}">']
    for author in config.get('authors', []):
        lines.append(f'<meta name="citation_author" content="{escape(author["name"])}">')
    paper = config.get('links', {}).get('paper', '')
    # Do not claim citation_pdf_url for an arXiv abstract page or invent publication dates.
    if paper:
        lines.append(f'<meta name="citation_public_url" content="{escape(paper)}">')
    path = ROOT / 'index.html'
    doc = path.read_text(encoding='utf-8')
    require_block = re.escape(START) + r'.*?' + re.escape(END)
    if not re.search(require_block, doc, flags=re.S):
        raise ValueError('The configured metadata markers are missing from index.html.')
    doc = re.sub(require_block, lambda _: START + '\n  ' + '\n  '.join(lines) + '\n  ' + END, doc, flags=re.S)
    doc = re.sub(r'<title>.*?</title>', lambda _: '<title>' + escape(title) + '</title>', doc, count=1, flags=re.S)
    path.write_text(doc, encoding='utf-8')
    print('Updated static canonical, social-image and citation metadata in index.html.')
    print('Re-run this script whenever the public URL or author information changes.')

if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError) as exc:
        raise SystemExit(f'ERROR: {exc}') from exc
