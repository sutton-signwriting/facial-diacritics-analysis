Source-linked SignPuddle data, processing software, and a static website for inspecting facial composition and direct Unicode SignWriting mappings.

## Included data

- **154,755 facial occurrences** from 152 included collections, with at least two retained non-HEAD facial resources.
- **632 single-eye-gaze occurrences** from 30 collections, selected independently using positioned `S321`–`S329` symbols at fill 2 or 3.
- **24 selected article examples** from 10 collections, presented uniformly with source links and downloadable strings.
- Source snapshot retrieved **1 November 2026**; source hashes, collection and entry identifiers, selection rules, mapping profile, and normalization provenance are retained.

Counts describe occurrences, including repeats. The article examples are a purposive selection, without a prevalence claim.

## Downloads

| File | Contents |
| --- | --- |
| `facial-diacritics-data-v0.6.0.zip` | Public CSVs and provenance sidecars, selected examples, processing and build code, tests, methods, licenses, fonts and asset provenance. |
| `facial-diacritics-site-v0.6.0.zip` | The reviewed static inspection website, including public data and bundled fonts. |
| `SHA256SUMS.txt` | SHA-256 checksums for both packages. |

Use these attached packages to obtain the generated data. GitHub's automatically generated source archives contain the source checkout, which excludes bulk processing outputs.

The ZIP files are byte-for-byte identical to the reviewed version 0.6.0 packages. The release workflow verifies every included file and both archive checksums before publication.

## Inspect and reproduce

- [Inspection website](https://www.sutton-signwriting.io/facial-diacritics-analysis/)
- [All eye-gaze occurrences](https://www.sutton-signwriting.io/facial-diacritics-analysis/eye-gaze/)
- [All 24 selected article examples](https://www.sutton-signwriting.io/facial-diacritics-analysis/eye-gaze/examples/)
- [Frozen source commit](https://github.com/sutton-signwriting/facial-diacritics-analysis/tree/cc530141f1aa40e15a58edf40676464c3a890c8d)
- [Original SignPuddle SPML directory](http://signbank.org/signpuddle2.0/data/spml/)

To browse the site locally, extract the site ZIP, run `python3 -m http.server 8000` in that directory, and visit `http://localhost:8000/`. The live website may receive later updates; these attached packages identify the released files.

Whole SPML files, source prose, contributor profiles, email addresses, embedded media, and the three private collections are excluded. Repeating extraction requires the matching source snapshots; the packages support inspection and reuse of the emitted records.

## Mapping and interpretation

The mapping profile is **`direct-symbol-order-v0.1`**. Source coordinates are retained in FSW and the normalized facial subsets; they are not transferred to the Unicode facial sequence. Separate faces are not segmented, marks are not assigned to individual heads, and alternative fills are not searched. Display differences alone do not establish reconstruction fidelity, linguistic contrasts, or the cause of a rendering difference. The bundled Noto Sans SignWriting font is **2.005**.

This release contains the exploratory dataset and browser. The companion article's controlled comparison, annotation checks, and font-measurement package remain separate materials.

## Licenses and attribution

Code uses **MIT**. Original documentation and publisher-created compilation and annotation contributions use **CC BY 4.0**, within rights held by their author. Source writing and derived views retain applicable source terms, including the SignWriting.org **CC BY-SA 3.0** notice where applicable; no blanket relicensing of contributor writing is asserted. Legacy source-notice coverage and attribution limits are documented in `LICENSING.md` and `publication/rights.json`. Fonts and other third-party assets retain their supplied licenses.

Credit the research compilation to **Steve Slevinski** and source writing to **SignPuddle contributors and the Sutton SignWriting community**, retaining collection and entry provenance.
