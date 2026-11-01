# Facial Diacritics Analysis

- Keep this project distinct from the journal manuscript and earlier synthetic
  Noto rendering experiment. This project's mapping is exploratory.
- Preserve `data/source/` bytes. Process source text with regex, without an XML
  processor. Processing must work offline from already-present source files.
- Edit `scripts/`, `web/`, or documented assets; regenerate CSVs, metadata,
  `dist/`, and release artifacts from their inputs.
- Preserve source witnesses, relative geometry, overlap order, duplicates,
  provenance, exclusions, and failures. Name mapping changes with a new profile.
- Do not infer linguistic equivalence, orthographic significance, prevalence,
  or community consequences from a rendering or coordinate difference.
- Keep source prose, contributor profiles, emails, and embedded media out of
  site payloads. Collections labelled private require an explicit publication
  decision; local inspection may retain them.
- Publishing, pushing, releases, DOI deposits, and journal submissions require
  the user's direction. State the exact target and source/data version.
- Verify processing with `npm test`; verify the static build and relevant
  browser behavior after changes. Keep generated artifacts separate from source.
