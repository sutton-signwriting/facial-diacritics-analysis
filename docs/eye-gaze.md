# Eye gaze with fills 2 and 3

This independent listing scans the original source text, not the existing
two-diacritic CSVs. Its selection ID is `eye-gaze-fills-2-3-v0.1`; the Unicode
mapping remains `direct-symbol-order-v0.1`. The original facial analysis is
unchanged.

A source sign qualifies if it contains at least one positioned symbol with base
S321 through S329 and fill 2 or 3, at any rotation. The exact positioned-symbol
predicate is `S32[1-9][23][0-9a-f]`. Fills 0 and 1 are the paired-eye forms Steve
excluded when clarifying the intended selection. There is no minimum number of
diacritics. A gaze appearing only in the temporal prefix does not qualify.
Repeated occurrences are retained. Private collections remain excluded by the
same IDs and collection-header rule used in the primary analysis.

For the preserved November 1 snapshot, this yields 632 occurrences in 30
collections with results. The index includes all 152 eligible source files,
including empty results. Of the selected occurrences, 39 have one diacritic and
228 also contain gaze with another fill. Restricting to signs whose gaze fills
are all 2 or 3 leaves 404 occurrences. No selected occurrence in this snapshot has a
normalization error or unknown gaze variant.

The full source signbox remains available. Additional gaze symbols, including
fills 0 and 1, stay in that source and in the facial context. Mixed-fill signs are
flagged `also-other-gaze-fills`; the browser's Gaze fills selection can exclude
them or show only them. Matching gaze keys and original coordinates are listed
explicitly. This query does not infer a right or left eye association.

For facial context, retain the primary facial range minus S337–S33a, normalize
it, and apply the existing provisional Unicode mapping. A normalization failure
does not remove a matching source occurrence. Unknown gaze variants likewise
remain with a diagnostic flag.

Run only the additional analysis with:

```bash
npm run process:eye-gaze
```

Inputs default to `data/source/`; outputs are separate under `data/eye-gaze/`:

- `raw/<stem>.csv`: per-source results.
- `metadata/<stem>.json`: records, matched symbols, provenance, and counts.
- `all.csv`: every matching occurrence, with its source filename.
- `report.json`: selection, source hashes, exclusions, and totals.

CSV columns are `fsw,fsw-face,uni-face,source_file,entry_id,source_offset,gaze-keys,gaze-positions`.
Gaze keys and positioned keys retain source order, including repetitions. The
complete matched FSW with its temporal prefix is retained in the JSON sidecar.
Offsets count decoded Unicode characters, not bytes.

The command also accepts `--source /path/to/source --output /path/to/eye-gaze`.
Every regular non-hidden source file is treated as UTF-8 text using regex.
Arbitrary filenames are supported and duplicate stems are rejected.

The static builder publishes this listing at `eye-gaze/`, using its own
manifest, collection pages, CSVs, and counts. Existing facial collection pages
and record numbering remain intact. Site/software v0.4.1 corrects the earlier
nonzero-fill query to select fills 2 and 3, alongside the unchanged facial subset
selected for v0.3.0. The earlier v0.4.0 archives retain the historical broader
query; its 12,356 occurrences are not the corrected single-eye selection.
