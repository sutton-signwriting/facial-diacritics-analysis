# Facial Diacritics Analysis

An exploratory SignPuddle data pipeline and static browser for comparing original
FSW signboxes, normalized facial subsets, and provisional official Unicode faces.

Intended repository: `sutton-signwriting/facial-diacritics-analysis`.
Intended Pages URL: `https://sutton-signwriting.github.io/facial-diacritics-analysis/`.
These are proposed targets, not claims that the repository or site is published.

## Local use

```bash
python3 -m venv .venv
npm install
.venv/bin/python scripts/process_sources.py
.venv/bin/python scripts/build_site.py
npm run preview
```

Open `http://127.0.0.1:9123`. The processing and build scripts use Python 3.12+
standard library only; the virtual environment needs no pip dependencies.
The JavaScript package and fonts are bundled into the build, so the website does
not rely on a runtime CDN. The browser has a collection index, individual file
pages, three rendering columns, diacritic-count and HEAD filters, pagination,
record provenance, copyable strings, and CSV downloads.

## Source inputs and outputs

The source folder must already exist. Processing does not download anything.
It processes **every regular, non-hidden file** directly inside `data/source/`
as UTF-8 text using regex, regardless of its extension. A source `input.txt`
produces `data/raw/input.csv` and `data/metadata/input.json`. Duplicate stems
are rejected before writing, so `input.txt` and `input.spml` cannot overwrite
one another's results. There is no XML processor.

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
```

The browser check uses Playwright. If a browser is already installed, set
`CHROMIUM_PATH` to its executable. Otherwise, `npx playwright install chromium`
installs the pinned version used by Playwright. Tests check the pipeline's
range boundaries, exclusions, duplicate preservation, geometry, modifier
mapping, arbitrary filenames, browser filters, downloads, rendering, mobile
widths, and normalization against the independent font-ttf implementation.

## GitHub Pages and archived data

Use a public build to hold the three collections whose source headers contain
“private”: `sgn97`, `sgn103`, and `sgn105`. Their local data remain intact.
Public availability alone is not treated as a resolution of those labels.

```bash
.venv/bin/python scripts/build_site.py --public
.venv/bin/python scripts/package_release.py
```

This creates a public site ZIP and a reproducibility ZIP under `artifacts/`.
Review the output before creating a public repository/release. Source snapshots
remain local; the reproducibility ZIP includes derived CSVs, row provenance,
source hashes/URLs, mapping assets, scripts, tests, and documentation. Preserve
the original source snapshot separately for exact future reanalysis: live
SignPuddle URLs can change after this download.

Upload `facial-diacritics-site-v0.1.0.zip` as a GitHub Release asset, then run
the prepared `Deploy GitHub Pages` workflow with that release tag. Set the
repository's Pages source to **GitHub Actions**. The workflow downloads the
frozen site artifact from the same repository, validates its relative paths,
and deploys it. It never silently downloads a newer SignPuddle corpus.

The separate [publication note](docs/publication.md) describes a dataset-first
release and its relationship to *Standardizing the Record*. No DOI, release,
submission, public repository, or deployment has been created by this setup.

## Layout

| Path | Role |
| --- | --- |
| `data/source/` | Untouched local source files; ignored by Git |
| `data/source-manifest.json` | Download provenance and hashes |
| `data/raw/` | Generated three-column CSVs; ignored by Git |
| `data/metadata/`, `data/report.json` | Generated provenance, counts, and failures |
| `assets/` | Pinned font and symbol-size assets with licenses and provenance |
| `scripts/` | Python processing/build/package scripts and browser verification |
| `web/` | Editable static website source |
| `dist/` | Generated portable website; ignored by Git |
| `artifacts/` | Generated release ZIPs and QA screenshots; ignored by Git |

Project code is MIT-licensed. Bundled fonts and third-party assets retain their
own licenses. Source-derived writing is credited to its SignPuddle contributors;
the code license does not relicense their data. Resolve dataset redistribution
terms and source credit before an archival public release.
