# PhysAlign website: result-record and leaderboard policy

This file specifies the **website template's maintenance rules**, not an additional experimental result or a replacement for the paper's evaluation protocol. The official evaluation code must supply the scores; the website does not implement model inference, probe compilation, balanced scoring, expert solution grading, or bootstrap estimation.

## The initial paper snapshot

The supplied manuscript, `ICLR27_PhysAlign.pdf`, is the source of the initial six model records. Main scores are transcribed from Table 2; observed paired support from Appendix B.5; configurations from Table 8; diagnostic values from Tables 9–10. The archive at `data/archive/paper-2026-09-26.json` preserves the initial website data.

The IDs `paper-2026-09-26`, `paper-retained-3341`, and `paper-balanced-v1` are descriptive website bookkeeping labels. They are **not** an independently verified dataset release tag, public evaluator version, or actual hash. Exact upstream dataset revisions and scorer commits were not provided and remain `null`.

| Pool | Parents | Probes | Interpretation |
|---|---:|---:|---|
| G | 986 | 3,341 | Overall Base grounding |
| L | 311 | 412 | CAcc, JAcc and Base grounding on the joint set |
| P | 385 | 553 | Paired-eligible release inventory |
| P_m, four open-weight models | 311 | 412 | Observed matched Base/+GT support |
| P_m, two API models | 304 | 397 | Observed matched Base/+GT support |
| Original solving | 986 | — | Mean normalized credit, including partial credit |

All initial scores combine development and test. They are not held-out test estimates. Equal observed counts do not establish identical probe membership across API models.

## Main ranking

The default metric is GAcc on G. Visitors may choose JAcc, CAcc, GAcc on L, or SolveAcc instead. This is a display choice, **not a composite benchmark score**. Ranks use descending point estimates within the selected track; ties share the same competition rank (1, 1, 3). Ranks are computed before text/access filtering, so an open-weight filter may start at rank 2. Clicking a column header changes display direction; rank 1 still means the highest score.

Only records with status `paper-reported` or `maintainer-verified` appear. `community-unverified` records are excluded. This is a presentation gate, not a security boundary: everything committed to a public repository or deployed website remains public. Review sensitive artifacts outside this website.

For a given ranking metric, model support must match the track's declared parent/probe counts, benchmark ID and protocol ID. When track-level dataset revision, evaluator commit or membership hash is supplied, model metadata must match it as well. A mismatching cell is marked with a dagger and is not ranked by that metric. Matching counts alone do not prove matching membership; the maintainer must check the actual manifest. Never use a manually assigned “verified” label as a substitute for that check.

## Paired and diagnostic views

These views intentionally contain **no cross-model ranks**. Paired results use model-specific observed support. Conditional grounding errors use model-specific correctly recognized subsets. Such denominators need explicit interpretation.

Store percentage scores as numbers in [0, 100], not fractions in [0, 1]. Store percentage-point differences directly as signed numbers. Keep unmeasured metrics and unavailable interval endpoints `null`; zero means an observed score of zero, not absence.

Keep the paper's independently rounded deltas: GPT-6 Astra = +1.32 pp; Gemini 3.8 Flash = +2.20 pp. Do not replace them with 1.31 or 2.19 computed from displayed endpoint values. Likewise, preserve Table 9's conditional ratios rather than re-deriving them from rounded CAcc/JAcc, particularly when CAcc is small.

If future runs provide unrounded official metrics, retain their precision in JSON and round only for display. Numerical 95% CI endpoints should come from the official paired parent-cluster resampling procedure—not from a plot-reading approximation.

## Adding a reviewed result

1. Copy `docs/new-result.example.json`. Give the record a unique ID. The same model under a different configuration is a different run/result record.
2. Record the exact checkpoint or requested API alias, reasoning controls, sampling, output cap, image preprocessing and UTC run-creation date. Unknown provider defaults stay explicitly unknown. Equal token caps do not establish equal compute.
3. Supply the dataset revision, evaluator commit, protocol, exact G/L/P_m membership, score summaries and an artifact reference. Separate returned malformed/refused/truncated answers from infrastructure failures with no response.
4. Run the existing official benchmark evaluator. Do not replace balanced aggregation with a raw probe average. Original-problem SolveAcc additionally requires the paper's applicable grading procedure.
5. Keep status `community-unverified` until a maintainer reviews provenance, scoring, coverage, configuration, licenses, and absence of hidden-target use. Then set `maintainer-verified` and append to `data/leaderboard.json` under the appropriate track.
6. Run `python scripts/validate.py`, preview the page, and inspect the new model's detail dialog. The validator checks syntax and consistency, not scientific correctness or source authenticity.
7. Commit the update with a clear change note; update the website `updated` field. Do not describe it as the model evaluation completion date.

## New dataset or evaluation protocol

Annotation corrections, removals, new candidates, changed prompts or scoring rules, a new test-only evaluation, fine-tuning on benchmark material, or a new fixed-support policy require a clearly identified track when they change comparability. Duplicate an appropriate track object, change its ID/label/description, set its actual pools, and record real version/manifest identifiers. Assign only compatible new results to it. The frontend shows one track at a time.

The current overview cards, manuscript figures, and explanatory population box describe the paper snapshot. Adding a track does not rewrite those materials. Update or add version-specific explanatory content in `index.html` when publishing a new release. Do not silently change the historical inventory to an audit-corrected count while retaining old model scores. The paper's audited subsequent release candidate and the 1,089 supplementary candidates are not the evaluated initial snapshot.

## Submission mechanism

`.github/ISSUE_TEMPLATE/submit_result.yml` supplies a GitHub issue form. After creating the website repository, set `links.submission` in `data/site.json` to:

```text
https://github.com/OWNER/WEBSITE_REPO/issues/new?template=submit_result.yml
```

An issue is a review request. It does not execute models or automatically merge a score. For more automation later, run validation in a trusted CI workflow and require maintainer review; do not allow arbitrary pull-request code to access private targets or API credentials.
