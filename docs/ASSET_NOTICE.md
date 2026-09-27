# Sources, figure assets, and reuse

## Website code

The HTML, CSS, JavaScript and helper scripts in this package are a standalone implementation. SeePhys (https://seephys.github.io/) was consulted for the broad research-site information structure: a paper/resource header, an explainer, model results, dataset examples and citation. Its HTML/CSS, logos, model scores and research figures are not bundled or copied into this template.

The MIT license in the repository applies to the newly written website code only. It does **not** relicense the paper, dataset, source problems, model logos, or figure assets.

## Manuscript results and figures

Results come from the user-supplied anonymous PhysAlign manuscript `ICLR27_PhysAlign.pdf`, 33 pages. This local manuscript is excluded from Git publication. Author, code, dataset, and contact metadata are configured; the public paper URL and BibTeX remain pending arXiv moderation. The site does not claim the paper is accepted.

Bundled figure previews are high-resolution raster crops converted to WebP, not newly generated experimental evidence:

| Website asset | Manuscript location |
|---|---|
| `assets/img/teaser.webp` | Figure 1, page 2 |
| `assets/img/pipeline.webp` | Figure 2, page 4 |
| `assets/img/coverage.webp` | Figure 3, page 5 |
| `assets/img/diagnostics.webp` | Figure 4, page 7 |
| `assets/img/case-persistent.webp` | Figure 9, page 29 |
| `assets/img/case-repair.webp` | Figure 10, page 29 |

`asset-provenance.json` records the supplied manuscript identity. For final publication, the authors should verify redistribution rights and may replace these previews with clean exports from their original figure source files. Some figures include third-party source problems/images or model marks. Their inclusion in a user-provided paper is not itself a new license for unrestricted web redistribution. The paper's own release statement requires upstream permissions or provenance/reconstruction alternatives.

No font binaries, analytics scripts, externally fetched fonts, API keys or hidden answer files are included. The anonymous manuscript PDF is retained locally and excluded from the public repository. Absence of analytics does not make GitHub Pages a guaranteed anonymous-review service: repository identity, history and hosting infrastructure can still be relevant.
