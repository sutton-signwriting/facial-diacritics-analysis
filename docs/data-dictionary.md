# Data dictionary

## Article example selection

The tracked `data/eye-gaze/article-examples.json` supplies the article's 24
selected source compositions and recorded page-side annotations. The static
build joins each to the existing public records using collection, entry ID,
exact FSW string and source snapshot hash. It generates
`eye-gaze/data/examples.json` and `examples.csv`, including the original dataset
row number and source link. This adds an inspection view, without modifying
either extraction or the Unicode mapping profile. The 21 one-gaze and three
two-gaze cases describe the selection; they do not estimate corpus prevalence.

## Primary facial CSVs

Each file has exactly `fsw,fsw-face,uni-face`. A row is a source occurrence;
identical signboxes may occur in different entries or passages.

| Field | Meaning |
| --- | --- |
| `fsw` | Original spatial signbox; temporal prefix omitted. Symbol keys, serialized order, coordinates, and lane are retained. |
| `fsw-face` | Facial resources S2ff–S36c, excluding S337–S33a, translated together using glyph bounds. Relative geometry and overlap order are retained. |
| `uni-face` | Direct mapping to official Unicode characters and modifiers, with the first S2ff resource moved forward or a default HEAD prepended. This is not a validated reconstruction. |

The primary selection requires two or more retained non-S2ff resources. It has
154,755 rows in this snapshot. Fill and rotation modifiers do not count as
additional resources. Selection and mapping rules are separate versioned objects.

## Row sidecars

| Field | Meaning |
| --- | --- |
| `source_fsw` | Complete matched FSW witness, including any temporal prefix. |
| `source_offset` | Zero-based decoded-character offset in the source file read with UTF-8 BOM handling; not a byte offset. |
| `entry_id` | Enclosing source entry identified by regex, or null if unavailable. |
| `diacritics` | Retained non-S2ff resource count after the air/breath exclusions. |
| `head_count` | Number of explicit S2ff resources, not a visual face count. |
| `head_inserted` | True when the direct mapping prepended default HEAD because no S2ff resource was present. Other source resources may already include a head outline. |
| `flags` | Processing diagnostics, not judgments of linguistic or rendering fidelity. |

The machine flag `multiple-heads` means more than one S2ff resource. Its website
label is “Multiple S2ff resources.” It does not identify every separate face or
assign marks to a face. Source-file metadata retain the filename, byte size,
SHA-256, collection title, counts, exclusions, and normalization errors.

## Separate eye-gaze CSVs

The eye-gaze selection has no minimum diacritic count. It requires a positioned
key matching `S32[1-9][23][0-9a-f]`. It contains 632 occurrences. Its CSVs add:

| Field | Meaning |
| --- | --- |
| `source_file` | Original filename. |
| `entry_id`, `source_offset` | Source provenance as above. |
| `gaze-keys` | Matching gaze keys, serialized as documented in the CSV. |
| `gaze-positions` | Original coordinates corresponding to the matched gaze keys. |

The JSON sidecars retain `gaze_matches` with each key, x, and y. The
`also-other-gaze-fills` flag identifies occurrences that also contain gaze fills
outside 2 and 3. It does not exclude the occurrence. An unavailable normalized
view is identified explicitly while its source witness remains available.

## Source-context audit and rights

[The context summary](../publication/source-context-summary.json) describes
whether an occurrence lies in a regex-identified `term`, `text`, or unlocated
field and whether the field contains multiple complete signboxes. These are
storage categories, not legal determinations or automatic lexical classifications.

See [LICENSING.md](../LICENSING.md) for the scope of CC BY 4.0, MIT, and the
applicable source terms. Provenance must accompany redistribution; a compilation
license does not replace included works' licenses.
