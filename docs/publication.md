# Dataset release and article relationship

The first useful publication is a versioned, citable data-and-method release.
Keep it distinct from the journal article's argument and conclusions.

## Recommended sequence

1. Inspect the source snapshot, invalid-resource failures, mapping flags,
   attribution/redistribution terms, and collections still labelled private.
2. Stabilize and document the intended initial mapping. The baseline intentionally
   exposes unresolved decomposition and head-association questions.
3. Publish a frozen repository/release and its static browser after author review.
   Preserve the source snapshot, manifests, scripts, CSVs, sidecars, asset hashes,
   and checksums for the exact version used in research.
4. Archive the dataset in Zenodo as a dataset with its own DOI. Software can have
   a separate software record when that distinction is useful. Link related
   records instead of using the journal article's DOI for the data.
5. Cite the exact dataset version in *Standardizing the Record*, describe the
   selection/mapping in Methods, and identify the release in Data Availability.
   The browser URL supplies reader access; the archived version fixes the
   evidence used for the analysis.

[Zenodo upload guidance](https://help.zenodo.org/docs/deposit/create-new-upload/)
explicitly distinguishes a supporting dataset DOI from an article DOI and allows
dataset/software resource types. Its
[versioning guidance](https://zenodo.org/help/versioning) explains version DOIs.
GitHub releases can also be archived through the
[Zenodo GitHub integration](https://help.zenodo.org/docs/github/enable-repository/).

An archival dataset release is already an independent citable research output;
it need not wait for a separate peer-reviewed data paper. A later data/resource
paper could be justified by reusable curation, validation, provenance, and
documented research utility. Its contribution would describe the resource and
its quality. The planned journal article would use the resource to investigate
preservation and the evidential consequences of representation. Avoid duplicating
the same argument across both articles, and disclose public antecedents to the
selected journal.

Publishing this baseline does not validate the Unicode mapping. Labeling it
provisional is part of making the next investigation reproducible. In particular,
retained occurrences are not independent words, writers, or demonstrated
orthographic contrasts.

## Current subset (dataset v0.2.0)

The November 1 selection excludes private collections and retains faces with at
least two non-S2ff resources. HEADs and fill/rotation modifiers do not count.
The Unicode mapping profile remains `direct-symbol-order-v0.1`.

- 152 included collections; `sgn97`, `sgn103`, and `sgn105` are excluded.
- 155,207 rows emitted.
- 84,959 zero-diacritic and 185,004 single-diacritic candidates excluded.
- One retained-scope candidate has an invalid ISWA key and is logged as a failure.
- 143,140 rows require a default HEAD under the baseline mapping.
- 1,590 rows retain multiple S2ff resources.
- 897 rows contain a mapped spacing resource.

All 155 original SPML snapshots remain intact. The current report and generated
CSVs describe this narrower selection. The earlier v0.1.0 release candidates are
historical baseline artifacts, separate from the current v0.2.0 candidates.

## Initial baseline observations (v0.1.0; historical)

- 155 sources; 174,251,204 downloaded bytes.
- 933,548 signbox occurrences scanned.
- 428,018 occurrences contain the requested spatial range.
- 83,213 single-S2ff cases excluded.
- 344,803 rows emitted; two candidates recorded as normalization failures.
- 316,597 rows require a default HEAD under the baseline mapping.
- 4,745 rows retain multiple S2ff resources.
- 923 rows contain a mapped spacing resource in the requested range.

These are full local-snapshot counts, including sources held from a public build.
The machine-readable report is authoritative for regenerated counts. The two
failures use keys S35120 (sgn4, entry 12380) and S33b01 (sgn46, entry 39371), which
are absent from the valid ISWA size table. Their original strings are retained.

Release status: local working project; no public release or DOI assigned.
