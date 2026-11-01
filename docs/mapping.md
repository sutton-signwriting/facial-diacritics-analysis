# Mapping profile: direct-symbol-order-v0.1

This is a reproducible baseline for inspecting actual data. It does not claim
to be a faithful or complete FSW-to-official-Unicode facial converter.

1. Find every complete FSW signbox in input text by regex, including an optional
   temporal prefix. Search the spatial symbols for bases `0x2ff..0x36c` inclusive
   (`QR2fft36c`). A temporal-prefix-only match is not eligible.
2. Set `fsw` to the original spatial signbox. Preserve the complete match,
   including any temporal prefix, in the provenance sidecar. Drop style suffixes
   from this structural analysis; no style is applied to the site renderings.
3. Retain only selected facial resources, preserving their serialized order.
   Exclude a candidate containing exactly one retained symbol of base `S2ff`.
   Keep other single-resource faces and multi-head compositions.
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
   `U+1D9FF SIGNWRITING HEAD`. Additional S2ff blocks remain and are flagged.
7. Count non-S2ff source resources for the “diacritics” filter. Fill and rotation
   modifiers do not increase that count. Flag mapped spacing resources because
   the requested range includes more than Unicode nonspacing facial marks.

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
complete rendering environment. The earlier reported Noto 2.001 synthetic
experiment is a separate artifact and has not been reproduced by this project.
