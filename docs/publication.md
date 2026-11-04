# Versioned research release

Status: source repository and inspection website published; archival release preparation, 4 November
2026. Version 0.6.0 is available as a GitHub release; 0.6.1 removes host-specific
deployment documentation without changing the research selection. The chosen
publication route is a versioned GitHub release with explicit data, website and
checksum assets. A Zenodo deposit is optional and deferred. A separate data-paper
submission is deferred. Comprehensive face curation, segmentation, alternative
fill search, and converter validation are outside this bounded release.

A Zenodo deposit is still a public archival release, with accurate files,
provenance, license scope, and limitations. The [source repository](https://github.com/sutton-signwriting/facial-diacritics-analysis)
and [inspection website](https://www.sutton-signwriting.io/facial-diacritics-analysis/)
are public. No archival DOI or journal submission has been created.

## Objects and versions

| Object | Role and current version |
| --- | --- |
| Software/package | **0.6.1** release candidate; the public inspection website remains at **0.6.0** with the same research data. |
| Primary facial selection | **facial-subset-v0.3.0**: 154,755 occurrences, 152 included collections, at least two retained diacritics. |
| Eye-gaze selection | **eye-gaze-fills-2-3-v0.1**: 632 occurrences, 30 collections with results, no diacritic threshold. |
| Unicode mapping | **direct-symbol-order-v0.1**, unchanged. |
| Source snapshot | Retrieved **1 November 2026**; 155 preserved SPML files, with three private collections excluded from outputs. |
| Noto font | **2.005**, identified by SHA-256; browser shaping is environment-dependent. |

The source-derived CSVs, provenance sidecars, normalization, and mapping remain
unchanged by this cleanup. [Historical candidates](release-history.md) are
separate from the active publication plan.

## 1. Finish the local candidate

The browser defaults to **With facial records** on both indexes, retains All
collections, and keeps zero-result pages directly accessible. The third view is
labelled **Direct Unicode mapping**. The comparison note explains why a display
difference alone does not diagnose a mapping, font, or encoding limitation.
Explicit S2ff counts are distinguished from visual face counts, and a prepended
HEAD is distinguished from a visually headless source.

Retain source links, deep links, page-size choices, All rows, CSVs, and the
independent gaze selection. Publish the [data dictionary](data-dictionary.md),
license scope, source notice, and reproducibility instructions. Any future
face-aware transformation receives a separate mapping profile.

Verify with `npm test`, a public-filtered build, browser/deep-link/gaze checks,
and archive inspection. Canonical normalization is checked against pinned
metrics; the independent live-canvas comparison is retained separately in the
release verification report, including measured metric differences. Compare source and derived-data hashes with the
pre-cleanup state. Do not change source snapshots or extraction outputs.

## 2. Record the license layers

The user's choices are **MIT for code** and **CC BY 4.0 for original research
documentation and publisher-created compilation/annotation contributions**.
[LICENSING.md](../LICENSING.md) defines those grants.

The user also identified SignWriting.org's existing **CC BY-SA 3.0** notice.
The [source notice record](../publication/source-licensing-notice.md) documents
its source and limits. The publisher selected the layered full release on
4 November 2026. This model carries applicable source
terms with source-derived writing while licensing the new compilation separately.
No exclusive claim is made over individual lexical signs or linguistic forms.
CC BY does not replace applicable ShareAlike conditions.

For the archival deposit, finish documenting the notice's coverage for legacy
contributions, source attribution to retain, and any exceptions. A missing SPML license field
is not proof that no license exists; a site notice is also not treated as a grant
from every contributor whose terms were unrecorded.

The [context audit](../publication/source-context-summary.json) informs the
alternatives: 54,172 primary and 405 eye-gaze occurrences come from multi-signbox
`text` fields; 100,108 primary and 226 eye-gaze occurrences come from single-signbox
`term` fields. These are storage categories, not legal clearances. A term-only
release would omit the golf-passage examples and change the research coverage.
The full release is the selected model; term-only and collection-specific
alternatives are deferred. No such narrowing is applied. Any later
collection-specific or field-specific changes would need an explicit new
selection and counts.

## 3. Freeze data, source, and website packages

Public source repository: [sutton-signwriting/facial-diacritics-analysis](https://github.com/sutton-signwriting/facial-diacritics-analysis).
Public browser: [Facial Diacritics Analysis](https://www.sutton-signwriting.io/facial-diacritics-analysis/).
The GitHub-hosted address redirects to the organization's existing Pages domain.

The initial 0.5.0 deployment on 4 November 2026 published the exact 935 files in the reviewed
`facial-diacritics-site-v0.5.0.zip`, including `.nojekyll`, on `gh-pages` at `/`:

- Frozen site source commit: `73b6b65aeb1d7a53a9821b69103a79576d9c7d18`.
- Deployment commit: `8dfc841a8fa6cfe65032a5f1846854f3528d5379`.
- Site ZIP SHA-256: `e4c92a579b90faf91109e007453dc416f1d176f2850308dcfa001b26f70887a0`.
- [Successful deployment](https://github.com/sutton-signwriting/facial-diacritics-analysis/actions/runs/41904453635).

GitHub enabled branch publishing automatically on the first push. Subsequent
deployments should replace that branch's site with a newly reviewed artifact
and use a normal push. To roll back after a later update, republish the earlier
reviewed artifact as a new commit; do not rewrite branch history. Disabling Pages
is the available rollback for this first deployment, which has no earlier site.
The release-asset workflow in `main` remains an alternative requiring a future
GitHub Release and a deliberate change of Pages source to GitHub Actions.

Version 0.6.0 adds the article's complete 24-case eye-gaze selection at
`eye-gaze/examples/`, presented uniformly with direct links and downloads. The
source snapshot, 154,755 facial occurrences, 632 gaze occurrences, and mapping
profile are unchanged. The hashes above identify the initial deployment for
rollback; subsequent reviewed artifacts receive their own source and deployment
commits. The verified 0.6.0 deployment is recorded below:

- [All 24 article examples](https://www.sutton-signwriting.io/facial-diacritics-analysis/eye-gaze/examples/).
- Frozen source commit: `cc530141f1aa40e15a58edf40676464c3a890c8d`.
- Deployment commit: `5a5f1ba0b07cac17934419f526fd54f27e6eb553`.
- Site ZIP SHA-256: `5dd01d669d01a4b74b69df34c26e115b92eee4fbbe36397284c7cf7795a8c899`.
- [Successful deployment](https://github.com/sutton-signwriting/facial-diacritics-analysis/actions/runs/41919155630).

Keep bulk processing outputs outside the `main` source branch, but include them
explicitly in the data archive. The `gh-pages` distribution branch contains the
reviewed website's public CSVs and sidecars. Source manifests, publication metadata,
licenses, docs, scripts, tests, and asset provenance remain trackable.
`.gitignore` names specific eye-gaze output paths so future source documents
there are not silently hidden.

The site records its base Git commit, whether the tree is dirty, and exact
source-file checksums. Packaging rejects a site built from different source
bytes. Finalize a reviewed commit before an authorized public release; a dirty
local candidate is not the unmodified base commit.

```bash
.venv/bin/python scripts/build_site.py --public
.venv/bin/python scripts/package_release.py
```

Prepare these files under `artifacts/`:

- `facial-diacritics-data-v0.6.1.zip`: CSVs, row provenance, reports, original
  source-manifest bytes, code/tests/docs, assets and licenses, publication
  metadata, rights scope, and source-file checksums.
- `facial-diacritics-site-v0.6.1.zip`: the frozen static browser, included data,
  bundled fonts, methods, and licensing page.
- `SHA256SUMS.txt`: hashes identifying both frozen packages.

Whole SPML, source prose, profiles, emails, media, private-held data, and
`node_modules` are excluded. The data package supports reuse and rebuilding from
emitted records. Repeating the full extraction requires the matching preserved
SPML snapshot; the live directory may change. Do not claim full-corpus
re-extraction from the ZIP alone.

## 4. Optional Zenodo Dataset record — deferred

Use one **Dataset** record for the data-and-method release and upload both ZIPs
and checksums. A separate software DOI is optional. Automatic GitHub archiving
alone would miss Git-ignored datasets, so include the prepared data archive
explicitly.

The [field draft](../publication/zenodo-draft.json) and
[description HTML](../publication/zenodo-description.html) provide reviewable
material following the platform-record information pattern:

| Field | Prepared value or remaining action |
| --- | --- |
| Title | Facial Diacritics Analysis: Source-linked SignPuddle Compositions and Single-Eye Gaze |
| Creator | Steve Slevinski; ORCID copied from the existing project citation file. Confirm final creator/contributor roles. |
| Resource type | Dataset. |
| Version | 0.6.1 for the coordinated package; retain separate analysis and mapping identifiers. |
| Description | Source snapshot, counts, methods, limitations, reuse, attribution, and license layers. |
| License | CC BY 4.0 for publisher-held compilation contributions, with applicable source terms explicitly retained. Document final source coverage. |
| Keywords | SignWriting, SignPuddle, facial composition, gaze, Unicode, provenance, writing systems, research data. |
| Publisher | Zenodo. |
| Publication date | Actual public release date, not snapshot or draft date. Currently unset. |
| DOI | Reserve only in an actual Zenodo draft. Currently unset; a reservation is not a published identifier. |
| Related identifiers | Source directory as derived-from; Formal SignWriting and platform DOI as references. Repository and website URLs verified. |
| Funding/contributors | Unset until supplied accurately; no affiliation or absence-of-funding assurance is invented. |
| Files | The exact reviewed packages and checksums. |

The platform record and this resource are distinct objects. Use its DOI as a
reference, not this dataset's identifier or evidence of inclusion in the frozen
eight-series release. Add journal/article relationships only when those objects
exist. The draft JSON is a local field record, not an upload-ready API payload.
Remove the description's local preparation note after resolving its open fields.

## 5. Publish only the reviewed release

The current publication target is the GitHub release, not a Zenodo deposit. Attach
both reviewed ZIPs and `SHA256SUMS.txt` to the tag identifying their frozen source.
Keep the website as the inspection interface. Paper-specific controlled tests,
annotations and implementation measurements remain separate and may accompany
the journal submission as supplementary material. The broader dataset archive
must not be described as containing those separate materials.

For a later optional archival deposit:

The user authorized the source repository and Pages deployment, both now public.
Preserve the deployed artifact and its source commit while updating publication
status in `main`; status edits do not replace the frozen website. Once source
scope and metadata are ready, obtain direction for the concrete archival release
files and Zenodo record. Publish the reviewed packages and dataset record, then
verify returned public URLs and deposited files.

Cite the **specific GitHub release URL**, version and source commit in the
manuscript and data availability statement. If a Zenodo record is later
published, add its version DOI. The browser URL supplies convenient inspection;
it does not fix the evidence version. The manuscript's curated cases and controlled comparison
remain separately identified evidence, not validation of every browser record.

Future data or mapping changes receive a new release and archival version;
corrections must not silently replace evidence used by a published analysis.
The LAN inspection service can continue to serve the same source and public-safe
selection locally while publication preparation remains separate.

## Deferred peer review

A Zenodo dataset is already a public, citable research output. A separate
peer-reviewed data/resource paper may be considered if its benefit justifies the
additional work. The sourced [venue comparison](data-publications.md) is retained
for that decision; it is not a requirement for this release or a reason to expand
curation now. The main journal article remains a separate argument.

## Official guidance checked

- [Zenodo deposit fields](https://help.zenodo.org/docs/deposit/describe-records/).
- [Create a deposit and reserve a DOI](https://help.zenodo.org/docs/deposit/create-new-upload/).
- [Versioned records](https://help.zenodo.org/docs/deposit/manage-versions/).
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- [GitHub Pages branch publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [Creative Commons licensing guidance](https://creativecommons.org/faq/).
