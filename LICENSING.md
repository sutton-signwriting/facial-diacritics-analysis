# Licenses and source attribution

## Open licenses for this project

| Material | License and scope |
| --- | --- |
| Processing scripts, tests, build tools, and website implementation | [MIT](LICENSE). |
| Original research documentation and explanatory website content by Steve Slevinski | [CC BY 4.0](LICENSE-CC-BY-4.0.txt). |
| Publisher-created selection, arrangement, compilation, normalization metadata, and annotations | CC BY 4.0, to the extent Steve Slevinski holds copyright or database rights in those contributions. |
| Source SignPuddle writing and mechanically derived facial views | Retain applicable source terms. The public CC BY-SA 3.0 notice on SignWriting.org is recorded; its coverage and attribution for the contributed material in this release remain to be confirmed. The compilation's CC BY 4.0 license does not replace source terms. |
| Bundled fonts and third-party assets | Their supplied licenses remain in effect; see `assets/fonts/*-OFL.txt`, `assets/symbol-sizes-LICENSE.txt`, and the font-ttf license included in the site. |

CC BY 4.0 permits sharing and adaptation, including commercial reuse, with
attribution and an indication of changes. It applies here to the contributions
identified above. The license does not assert ownership of every source sign or
transfer rights held by other people.

## Individual signs, passages, and the compilation

No exclusive copyright claim is made here over individual words, lexical signs,
or linguistic forms. The project licenses grant only rights actually held and
do not impose license conditions on uses that copyright does not restrict.
The U.S. Copyright Office's [Circular 33](https://www.copyright.gov/circs/circ33.pdf)
distinguishes words and short phrases from protectable original expression.
That distinction supports treating linguistic forms separately from authored
passages, without deciding every source composition's status or the database
rights of an entire collection.

A row extracted from a passage is not automatically equivalent to an independent
dictionary entry for rights purposes. Many rows, together with entry IDs and
source offsets, may retain material from a larger authored work. The
[source-context audit](publication/source-context-summary.json) describes where
the records were stored; it is not a legal classification.

The selected release structure keeps MIT for code and CC BY 4.0 for original
documentation and publisher-held compilation and annotation rights. Existing
source licenses, including CC BY-SA 3.0 where applicable, remain with the source
writing and its derived views. Creative Commons explicitly distinguishes
licensing a collection from licensing each included work. No claim is made that
the site-wide notice supplies a missing rights grant from every contributor.

## Attribution

Credit this research compilation to **Steve Slevinski**, and credit the source
writing to **the SignPuddle contributors and Sutton SignWriting community**.
Retain source collection filenames, entry identifiers where available, source
URLs, source snapshot hashes, and the mapping profile. These provide a route back
to the writing rather than attributing its authorship to the dataset compiler.

Example credit:

> Slevinski, Steve. Facial Diacritics Analysis, version 0.5.0. Source writing:
> SignPuddle contributors and the Sutton SignWriting community. Source snapshot:
> 1 November 2026. Mapping: direct-symbol-order-v0.1. Original research
> documentation and publisher-created contributions: CC BY 4.0; code: MIT.
> Source writing and third-party assets retain their applicable terms.

An archival citation will replace this working credit when an actual DOI exists.
Do not infer contributor consent or blanket source licensing from this example.
If applicable source terms require additional attribution, preserve it in the
release before publication.

## Selected release model and remaining source documentation

On 4 November 2026, the publisher selected the **layered full release**. Retain
the current research selection, use the project licenses above for the new
contributions, and carry applicable source terms with the included writing.
This selects the release model; it does not establish missing contributor grants.

The remaining question is how the existing public source notice applies to this
SignPuddle-derived release, including passage-derived records, and what source
credit or exceptions should accompany it. The new code and documentation
licenses are already chosen.

The checked SPML exports do not contain a license field. The user identified the
[SignWriting.org notice](https://www.signwriting.org/), independently checked on
4 November 2026, offering site content and related Movement Writing material
under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). This is a
documented source policy; its applicability to legacy contributed collections
should be stated rather than inferred from the freedom to use the script. The
earlier platform-record plan for a minimal CC0 lexical export is a separate
proposal and is not adopted here.

The selected model and deferred alternatives are:

1. **Layered full release (selected):** retain the current research
   selection, document the scope of the existing source notice, carry forward
   applicable CC BY-SA 3.0 conditions, and license the new compilation separately
   under CC BY 4.0. Confirm source credit and any collection-specific exceptions.
2. **Term-field first release (deferred alternative):** prepare a separately named subset drawn from
   single-signbox `term` fields while reviewing passage material separately. The
   current audit finds 100,108 primary rows and 226 eye-gaze rows in that category.
   This is a storage-based selection, not an automatic copyright clearance. It
   would omit the golf-passage examples and much of the gaze selection.
3. **Collection-specific release (deferred alternative):** identify collections with a documented
   redistribution basis and defer others. Record the criteria and updated counts
   as a new release selection rather than silently changing the current data.

Prepare the site, metadata, tests, and archives using the selected model, with
the remaining source coverage and attribution questions stated explicitly.
The selection does not authorize a public repository, Pages deployment, or
Zenodo deposit; those remain separate publication actions.

## Reference points

- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- [Creative Commons guidance on marking third-party content](https://wiki.creativecommons.org/wiki/Marking/Creators/Marking_third_party_content).
- [Creative Commons on licensing collections and included works](https://creativecommons.org/faq/#what-attribution-obligations-exist-when-cc-licensed-images-are-included-in-a-published-dataset-is-linking-to-the-original-image-or-uri-required-and-if-so-is-it-adequate).
- [Source licensing notice and context](publication/source-licensing-notice.md).
- Machine-readable scope and pending source basis: [publication/rights.json](publication/rights.json).

The whole-source SPML snapshots, contributor profiles, email addresses, free-form
source prose, and embedded media are excluded from the public artifacts. Private
collections remain excluded. No additional collection exclusions are introduced
by the website cleanup.
