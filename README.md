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
.venv/bin/python scripts/process_eye_gaze.py
.venv/bin/python scripts/build_site.py
npm run preview
```

Open `http://127.0.0.1:9123`. The processing and build scripts use Python 3.12+
standard library only; the virtual environment needs no pip dependencies.
The JavaScript package and fonts are bundled into the build, so the website does
not rely on a runtime CDN. The browser has a collection index, individual file
pages, three rendering columns, diacritic-count and HEAD filters, pagination,
record provenance, copyable strings, and CSV downloads.

Record links preserve rows per page (`rows=25`, `50`, `100`, or `all`), diacritic
and HEAD filters. A `#row-N` target automatically selects its containing page,
including for older links without a rows-per-page parameter. “All rows” keeps
all matching records on one page and renders FSW images as they enter view.

## Separate eye gaze listing

[Eye gaze with nonzero fills](http://192.168.0.87:7094/eye-gaze/) selects source
signs containing at least one positioned S321–S329 symbol with fill 1–5, at any
rotation and any diacritic count. It has its own collection index, record pages,
and combined CSV download. Exact matching keys and original coordinates appear
beside each sign. Mixed-fill signs are flagged and can be filtered out.

Run `npm run process:eye-gaze` to regenerate only this analysis. Its outputs live
under `data/eye-gaze/`, separate from the original CSVs and metadata. `npm run process`
regenerates both analyses. See [the eye-gaze method](docs/eye-gaze.md).

## LAN service

The read-only inspection site runs on **http://192.168.0.87:7094/** and is linked
from Personal Office's **http://192.168.0.111:7001/** index. Archie owns the source,
port reservation, and Compose service. The current subset excludes the three
private collections and faces with fewer than two diacritics after removing
air/breath bases S337–S33a: 152 collections and 154,755 facial-sign occurrences remain.

```bash
docker compose up -d
docker compose ps
curl -f http://192.168.0.87:7094/health
# Stop the LAN service:
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
```

The browser check uses Playwright. If a browser is already installed, set
`CHROMIUM_PATH` to its executable. Otherwise, `npx playwright install chromium`
installs the pinned version used by Playwright. Tests check the pipeline's
range boundaries, exclusions, duplicate preservation, geometry, modifier
mapping, arbitrary filenames, browser filters, downloads, rendering, mobile
widths, and normalization against the independent font-ttf implementation.

## GitHub Pages and archived data

All builds exclude `sgn97`, `sgn103`, `sgn105`, and any other collection with a
private-labelled header. Their source snapshots remain intact. Public release
bundles retain the primary dataset's minimum of two diacritics and the separate
eye-gaze analysis without that cutoff, matching the LAN browser.

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

Upload `facial-diacritics-site-v0.4.0.zip` as a GitHub Release asset, then run
the prepared `Deploy GitHub Pages` workflow with that release tag. Set the
repository's Pages source to **GitHub Actions**. The workflow downloads the
frozen site artifact from the same repository, validates its relative paths,
and deploys it. It never silently downloads a newer SignPuddle corpus.

The separate [publication note](docs/publication.md) describes a dataset-first
release and its relationship to *Standardizing the Record*. No DOI, release,
submission, public repository, or public deployment has been created by this setup.

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

Project code is MIT-licensed. Bundled fonts and third-party assets retain their
own licenses. Source-derived writing is credited to its SignPuddle contributors;
the code license does not relicense their data. Resolve dataset redistribution
terms and source credit before an archival public release.
