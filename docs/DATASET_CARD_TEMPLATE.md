---
tags:
- physics
- multimodal
- benchmark
---

# PhysAlign

A Benchmark for Evidence-Grounded Role Alignment in Multimodal Physics Reasoning.

> Maintainer: replace all TODO fields and verify the actual release before publishing this card. This card is documentation, not the dataset itself. Add a `license` metadata field only after determining the actual license(s); do not assume that a new license overrides upstream rights.

## Resources

- Paper: TODO — actual arXiv URL
- Project page: TODO — actual website URL
- Evaluation code: TODO — actual repository URL
- Dataset revision / release identifier: TODO — actual immutable revision or release tag

## Task and measurement scope

PhysAlign assesses local physical-role correspondence under fixed evidence anchors and neutral candidates. T02-single resolves a referent; T03-image reports a literal reading and its owner; T03-text reports an owner. Recognition and grounding are scored separately where independent reading targets exist. The paired +GT variant supplies predefined correct local content without revealing the queried role.

## Paper snapshot versus this release

The evaluated paper inventory contains 986 parent problems and 3,341 localized probes. Of those, 553 probes from 385 parents have eligible paired +GT variants; these are not additional unique probes. The joint set contains 412 probes from 311 parents. Paper model results use both release partitions and are not held-out test estimates.

**TODO:** State whether this actual repository revision reproduces the paper inventory or contains audit corrections, removals or additions. Document exact counts and provide a changelog. Do not automatically apply the paper's model scores to a changed revision.

## Data sources and rights

Source problems are reused from SeePhys, LiveK12Bench, PhysElite, OlympiadBench's English physics competition subset, Gaokao-MM-Physics, and PhyX-OE. Original problems are not newly authored by PhysAlign.

**TODO:** Provide a source-by-source license/provenance inventory, attribution requirements, and what is actually redistributed. Where upstream terms do not permit redistribution, supply provenance IDs and reconstruction instructions instead of the restricted images or problem text.

## Files, fields and usage

**TODO:** Document the real exported file paths, schema fields, image encoding, split configuration, and tested loading instructions. Do not present fabricated `load_dataset` configurations or evaluation commands. Keep model-visible data distinct from private targets; do not upload private files and merely hide them in the dataset viewer.

## Evaluation

**TODO:** Link the actual evaluator commit and frozen manifest. Explain balanced local aggregation, metric eligibility, observed paired support, missing responses, and partial-credit original-problem grading. Run dates and API aliases should be recorded without inventing inaccessible provider snapshots.

## Limitations

Static educational diagrams; uneven domain coverage; localized correspondence tasks rather than unrestricted scene understanding. Source problems were publicly available, so prior exposure and semantic near-duplicates cannot be ruled out. Paired local readings are not perfect perception. Independent solving and probing do not identify a model's internal reasoning trace.

## Citation

TODO — paste the final author-approved BibTeX from the actual paper record.
