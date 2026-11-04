# Mapping profile: direct-symbol-order-v0.1

Private collections (`sgn97`, `sgn103`, `sgn105`, or a collection header labelled
private) are excluded from both CSV outputs and the browser. Source snapshots
remain intact. Dataset v0.3.0 excludes all fills and rotations of air/breath
bases S337–S33a and then requires at least two diacritics; the symbol-to-Unicode
mapping profile itself is unchanged. Selection rules are recorded separately
in the report and site manifest.

This is a reproducible baseline for inspecting actual data. It does not claim
to be a faithful or complete FSW-to-official-Unicode facial converter.

1. Find every complete FSW signbox in input text by regex, including an optional
   temporal prefix. Search the spatial symbols for bases `0x2ff..0x36c` inclusive
   (`QR2fft36c`). A temporal-prefix-only match is not eligible.
2. Set `fsw` to the original spatial signbox. Preserve the complete match,
   including any temporal prefix, in the provenance sidecar. Drop style suffixes
   from this structural analysis; no style is applied to the site renderings.
3. Remove bases S337, S338, S339, and S33a in every fill and rotation. These
   are Air Blow Small Rotations, Air Suck Small Rotations, Breath Inhale, and
   Breath Exhale (U+1DA37–U+1DA3A), not facial diacritics. Their symbols remain
   in the original `fsw` field. Retain the other selected facial resources,
   preserving their serialized order.
   Count retained non-S2ff resources and keep only candidates with at least two.
   Exclude zero-diacritic and single-diacritic faces, including compositions
   containing only multiple heads. HEADs and fill/rotation modifiers do not count.
   Multi-head compositions with at least two diacritics remain flagged.
4. Normalize `fsw-face` with the 37,811-entry ISWA size table: find min anchors
   and max glyph extents, subtract `trunc((min+max)/2)-500` on each axis from
   every anchor, and set the signbox maximum to the translated maximum extents.
   The lane marker is preserved. All selected bases lie in font-ttf's horizontal
   and vertical centering ranges. Translation preserves relative geometry and
   layering. Unknown resource keys become explicit failures with original
   witnesses; no dimensions are invented.
5. Encode each retained resource as `U+(0x1D700+base)`, followed by a fill
   modifier `U+(0x1DA9A+fill)` when fill is nonzero and a rotation modifier
   `U+(0x1DAA0+rotation)` when rotation is nonzero. Inherent defaults are omitted.
6. Move the first complete S2ff block to the front of `uni-face`. Keep other
   resources in original relative order. If no S2ff exists, prepend the default
   `U+1D9FF SIGNWRITING HEAD`. Additional S2ff blocks remain and are flagged. The flag counts explicit S2ff
   resources, not visually distinct faces; no spatial grouping is inferred.
7. Count retained non-S2ff resources for the “diacritics” filter, after the
   four base exclusions. Fill and rotation modifiers do not increase that count.
   Keep a diagnostic flag for any unexpected mapped spacing resource.

The broad `matching_signs` audit count describes the initial QR2fft36c query,
before the four base exclusions. `excluded_face_symbols` counts removed symbol
occurrences across those candidates, including candidates later dropped by the
minimum threshold. Zero/single-diacritic exclusions use the retained symbols.

The baseline does not transfer positions, infer head-to-mark associations,
decompose ISWA head-bearing glyphs, change source fill meanings, sort marks by
position, test order permutations, or decide whether a resulting face preserves
the source. Those are subsequent research questions and mapping revisions.

Each retained occurrence has source filename, original FSW, character offset,
entry ID where a regex-located SPML entry surrounds it, and diagnostic flags.
Offsets count decoded Unicode characters, not bytes. Identical signs occurring
in several entries, passages, or collections remain separate rows. Input files
are not presumed independent populations or uniform lexical dictionaries.

Normalization assets and the Noto binary are pinned in `assets/manifest.json`.
The browser itself supplies shaping; a font hash identifies the font, not the
complete rendering environment. The earlier synthetic order experiment is a separate artifact and has not been
reproduced by this project. Direct-mapping display differences have not been
classified as font limitations, alternative-variant mapping issues, or missing
information. Any alternative-fill or face-segmentation transformation needs a
separate mapping profile and an explicit equivalence assessment.

## Pinned metrics and the independent browser comparison

Canonical normalization uses the preserved symbol-size table. The font-ttf
library instead measures glyph bounds using a browser canvas and includes its
own documented rounding adjustments. These inputs can differ by a pixel, so
exact agreement with a live library normalization is not assumed. The browser
check verifies retained symbol order, rigid translation, centered pinned bounds,
and recomputed extent, and reports live-metric normalization differences in
`artifacts/browser-normalization-check.json`. Unexplained disagreements and
violations of the pinned geometry contract fail the check. The current report
accompanies prepared data archives under `verification/`. No CSV is changed to
match a browser measurement, and these diagnostics do not classify face fidelity.
