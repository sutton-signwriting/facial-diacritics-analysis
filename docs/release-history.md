# Historical selections and local candidates

These notes describe earlier local selections and candidates, not published releases. The active plan is [publication.md](publication.md).

## Current subset (dataset v0.3.0)

This selection removes every fill and rotation of S337–S33a (Air Blow Small
Rotations, Air Suck Small Rotations, Breath Inhale, Breath Exhale) before counting
diacritics or normalizing geometry. Original source signboxes retain them.
Private collections and faces with fewer than two retained diacritics remain
excluded. The symbol-to-Unicode mapping is still `direct-symbol-order-v0.1`.

- 152 included collections; 154,755 rows emitted.
- 1,394 air/breath symbol occurrences removed across broad-query candidates.
- 84,996 zero-diacritic and 185,419 single-diacritic candidates excluded.
- 142,713 rows require a default HEAD; 1,589 retain multiple S2ff resources.
- No retained rows contain a mapped spacing resource.
- One retained-scope candidate still has an invalid ISWA key and is logged.

Compared with v0.2.0, 897 retained rows contained an air/breath symbol. After
removal, 452 fail the two-diacritic threshold and 445 remain with revised faces.
All 155 original SPML snapshots remain intact. The report and generated CSVs
describe this selection; v0.1.0 and v0.2.0 artifacts are historical local candidates.

## Additional eye gaze analysis in software v0.4.1

The corrected `eye-gaze-fills-2-3-v0.1` selection requires a positioned
`S32[1-9][23][0-9a-f]` symbol. It contains 632 occurrences from 30 collections
with results, including 39 one-diacritic signs. Of these occurrences, 228 also
contain other gaze fills; filtering to gaze fills 2 and 3 only leaves 404.
There is no diacritic-count threshold. Fills 0 and 1 do not qualify a sign;
Steve clarified that both are paired-eye forms. The source snapshot and primary
facial analysis remain unchanged.

## Initial eye gaze query in software v0.4.0 historical

A separate source scan, `eye-gaze-nonzero-fill-v0.1`, selects any sign with a
positioned S321–S329 symbol at fill 1–5, without a diacritic-count threshold.
It produced 12,356 occurrences from 50 collections with results, including 454
one-diacritic signs absent from the primary dataset. There are 835 mixed-fill
signs; excluding them leaves 11,521 occurrences. The selection is recorded
separately. These are historical counts for the broader query, superseded by
the fill-2/3 selection above. Counts are source occurrences,
including repeats, rather than a rendering success rate or a claim about eye
association. See [the eye-gaze method](eye-gaze.md).

The original facial CSVs, metadata, and report remain byte-for-byte unchanged
from the v0.3.0 subset. Site/software v0.4.0 packages both analyses.

## Previous subset (dataset v0.2.0; historical)

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
