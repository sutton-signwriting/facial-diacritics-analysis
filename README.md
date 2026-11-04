# Facial Diacritics Analysis

An exploratory SignPuddle data pipeline and static browser for comparing original
FSW signboxes, normalized facial subsets, and a direct mapping to official Unicode.

Source repository: [sutton-signwriting/facial-diacritics-analysis](https://github.com/sutton-signwriting/facial-diacritics-analysis), public as of 4 November 2026.
Public website: [Facial Diacritics Analysis](https://www.sutton-signwriting.io/facial-diacritics-analysis/),
version **0.6.0**, updated on 4 November 2026. The archival dataset deposit is
optional and deferred. The current release candidate is **0.6.1**, which removes
local deployment details without changing the research data or examples.

## Local use

```bash
python3 -m venv .venv
npm install
.venv/bin/python scripts/process_sources.py
.venv/bin/python scripts/process_eye_gaze.py
.venv/bin/python scripts/build_site.py
npm run preview
```

Open `http://127.0.0.1:9123`. The processing and build scripts use Python 3.12+
standard library only; the virtual environment needs no pip dependencies.
The JavaScript package and fonts are bundled into the build, so the website does
not rely on a runtime CDN. The browser has a collection index, individual file
pages, three rendering columns, diacritic-count and HEAD filters, pagination,
record provenance, copyable strings, and CSV downloads. Both indexes default to
**With facial records**; All collections remains available. The Unicode view
identifies its direct-mapping limits, and HEAD labels count explicit S2ff resources
rather than visually distinct faces.

Record links preserve rows per page (`rows=25`, `50`, `100`, or `all`), diacritic
and HEAD filters. A `#row-N` target automatically selects its containing page,
including for older links without a rows-per-page parameter. “All rows” keeps
all matching records on one page and renders FSW images as they enter view.

## Separate eye gaze listing

[Eye gaze with fills 2 and 3](https://www.sutton-signwriting.io/facial-diacritics-analysis/eye-gaze/) selects source
signs containing at least one positioned S321–S329 symbol with fill 2 or 3, at any
rotation and any diacritic count. It has its own collection index, record pages,
and combined CSV download. Exact matching keys and original coordinates appear
beside each sign. Mixed-fill signs are flagged and can be filtered out.

Run `npm run process:eye-gaze` to regenerate only this analysis. Its outputs live
under `data/eye-gaze/`, separate from the original CSVs and metadata. `npm run process`
regenerates both analyses. See [the eye-gaze method](docs/eye-gaze.md).

## Article examples

[All 24 selected eye-gaze examples](https://www.sutton-signwriting.io/facial-diacritics-analysis/eye-gaze/examples/)
appear in one uniform table, with no featured pair or pagination. Every example
has its own link, original FSW sign, normalized facial subset, Noto comparison,
full-dataset record link, and original SignPuddle entry. CSV and JSON downloads
retain the complete selection and provenance. The selection contains 21 signs
with one gaze (ten page-left and eleven page-right) and three with two gazes,
across ten collections. It is a purposive selection, not a frequency estimate;
the page links to the full 632-occurrence eye-gaze listing.

`data/eye-gaze/article-examples.json` is the curated source input. The build
checks every selected FSW string, entry ID, gaze key and source snapshot hash
against the included public eye-gaze records before resolving its direct link.
It does not depend on a local manuscript checkout or change the corpus.

## Container preview

The optional read-only container serves the generated site at
`http://127.0.0.1:7094/` by default. Set `FACIAL_BIND_ADDRESS` in an untracked `.env`
file to use a different local interface.

```bash
docker compose up -d
docker compose ps
curl -f http://127.0.0.1:7094/health
# Stop the preview:
docker compose down
```

Nginx serves only generated `dist/`, mounted read-only, and restarts automatically
unless deliberately stopped. Source SPML, scripts, and the virtual environment
are outside its served directory. Rebuild `dist/` with the Python builder when
updating the browser or processed data. Restart the service after replacing the
generated directory to refresh its bind mount: `docker compose restart web`.

## Source inputs and outputs

The source folder must already exist. Processing does not download anything.
It processes **every regular, non-hidden file** directly inside `data/source/`
as UTF-8 text using regex, regardless of its extension. A source `input.txt`
produces `data/raw/input.csv` and `data/metadata/input.json`. Duplicate stems
are rejected before writing, so `input.txt` and `input.spml` cannot overwrite
one another's results. There is no XML processor. Private collections are skipped
and their earlier generated CSVs/sidecars are removed. Only faces with at least
two retained non-S2ff resources are emitted. All fills and rotations of S337,
S338, S339, and S33a are excluded before counting and normalization, and remain
in the original `fsw` column. HEAD, fill, and rotation modifiers do not count.

```bash
.venv/bin/python scripts/process_sources.py \
  --source /path/to/source --output /path/to/raw \
  --metadata /path/to/metadata --report /path/to/report.json
```

Each CSV has exactly `fsw,fsw-face,uni-face`. See
[the mapping specification](docs/mapping.md) for normalization, ordering,
modifiers, exclusions, and limitations. The sidecars retain source witnesses,
offsets, entry IDs, flags, and normalization failures. Repeated occurrences are
retained. Reports distinguish total matches, exclusions, failures, and output
rows. No deduplication, inferred glosses, or reader judgments are introduced.

The initial ad hoc download contains 155 exact `sgn[0-9]+.spml` files from
`http://signbank.org/signpuddle2.0/data/spml/`, totaling 174,251,204 bytes.
Original files are in ignored `data/source/`. The tracked source manifest
contains retrieval timestamps, URLs, Last-Modified/ETag values, byte sizes,
and SHA-256 hashes. Source prose, profile information, and embedded media are
not copied into the browser or release bundles.

## Verify

```bash
npm test
npm run build
# In another terminal, with npm run preview running:
npm run test:browser
npm run test:links
npm run test:eye-gaze
npm run test:examples
```

The browser check uses Playwright. If a browser is already installed, set
`CHROMIUM_PATH` to its executable. Otherwise, `npx playwright install chromium`
installs the pinned version used by Playwright. Tests check the pipeline's
range boundaries, exclusions, duplicate preservation, geometry, modifier
mapping, arbitrary filenames, browser filters, downloads, rendering, mobile
widths, pinned geometry invariants, and an independent font-ttf comparison whose
live-metric differences are recorded separately. The report accompanies release
archives; it is not a face-equivalence assessment.

## GitHub Pages and archived data

All builds exclude `sgn97`, `sgn103`, `sgn105`, and any other collection with a
private-labelled header. Their source snapshots remain intact. Public release
bundles retain the primary dataset's minimum of two diacritics and the separate
eye-gaze analysis without that cutoff, matching the inspection website. The
primary selection contains 154,755 occurrences across 152 included collections.

```bash
.venv/bin/python scripts/build_site.py --public
.venv/bin/python scripts/package_release.py
```

This creates a public site ZIP and a reproducibility ZIP under `artifacts/`.
Review the output before publishing a new site version or archival release. Source snapshots
remain local; the reproducibility ZIP includes derived CSVs, row provenance,
source hashes/URLs, mapping assets, scripts, tests, and documentation. Preserve
the original source snapshot separately for exact future reanalysis: live
SignPuddle URLs can change after this download.

The active Pages publishing source is **`gh-pages`, root `/`**. That branch holds
the exact files from the reviewed site ZIP, including `.nojekyll`, the fonts,
and public CSVs. GitHub automatically deploys branch updates. `main` retains
the editable project source and ignores bulk processing outputs. Site updates
must publish a newly reviewed frozen artifact; they do not download a newer
SignPuddle corpus. The [publication plan](docs/publication.md) records the deployed
source commit, deployment commit, and artifact checksum.

The manual `Deploy GitHub Pages` workflow is an optional alternative for future
GitHub Release assets. Using it requires a matching site ZIP on a release and
switching the Pages source to GitHub Actions; it is not the active branch-based
publication method.

The [publication plan](docs/publication.md) and [prepared metadata](publication/README.md)
describe the frozen data-and-method release and its relationship to *Standardizing
the Record*. A separate peer-reviewed data/resource paper is deferred;
[venue options](docs/data-publications.md) are retained for later consideration. The source
repository, inspection website, and [GitHub releases](https://github.com/sutton-signwriting/facial-diacritics-analysis/releases)
are public. The release assets include the generated data excluded from the
automatic source archives. A Zenodo deposit is deferred; no archival DOI or
journal submission has been created.

## Layout

| Path | Role |
| --- | --- |
| `data/source/` | Untouched local source files; ignored by Git |
| `data/source-manifest.json` | Download provenance and hashes |
| `data/raw/` | Generated three-column CSVs; ignored by Git |
| `data/metadata/`, `data/report.json` | Generated provenance, counts, and failures |
| `data/eye-gaze/` | Separate generated eye-gaze CSVs, metadata, and report |
| `assets/` | Pinned font and symbol-size assets with licenses and provenance |
| `scripts/` | Python processing/build/package scripts and browser verification |
| `web/` | Editable static website source |
| `dist/` | Generated portable website; ignored by Git |
| `artifacts/` | Generated release ZIPs and QA screenshots; ignored by Git |

Project code is MIT-licensed. Original research documentation and publisher-created
compilation and annotation contributions use CC BY 4.0 within rights held by their
author. Applicable source terms, including the public CC BY-SA 3.0 notice where it
applies, remain with source writing and its derived views. No exclusive claim is
made over individual lexical signs or linguistic forms. Bundled assets retain
their own licenses. See [LICENSING.md](LICENSING.md) for the recorded source notice,
the selected layered full release and remaining source coverage/attribution
documentation. Term-only and collection-specific alternatives are deferred.

Bulk generated CSVs and sidecars remain Git-ignored on `main` intentionally;
the `gh-pages` distribution branch includes the frozen website's public data.
The release
packager explicitly includes them, the exact source manifest, licenses, metadata,
and source-file checksums. Publication documents and source manifests remain
trackable; a blanket eye-gaze-folder ignore has been replaced with precise output
paths. The site identifies a dirty source tree, and packaging rejects stale builds.

To regenerate the storage-context audit without changing the dataset:

```bash
.venv/bin/python scripts/audit_source_context.py
```

The audit distinguishes single-signbox and multi-signbox source fields, not legal
status or linguistic significance. It includes no source prose or account data.
