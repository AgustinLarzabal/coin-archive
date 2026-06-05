# Coin Archive

Coin Archive is a catalog of physical coins from across history. The context exists to describe the archive's cataloguing language independently from implementation choices.

## Language

**Coin**:
A catalogued physical coin type or issue in the archive, not an individual owned example. A coin has exactly one direct issuer and may have zero or more ruler attributions. A coin may later be described by historical, geographic, minting, material, inscription, image, and reference information.
_Avoid_: Coina, specimen, item

**Coin Title**:
The human-readable display label for a coin. It is not structured catalogue data and should not be parsed to infer historical, geographic, minting, material, inscription, image, or reference information.
_Avoid_: Name, generated catalogue data

**Issue Year Range**:
The closed earliest and latest known years in which a coin type or issue is understood to have been minted or issued, represented as astronomical integer years when structured. The range describes the coin type or issue itself, not the issuer's lifetime, a ruler's reign, catalogue publication date, or archive record creation date.
_Avoid_: Creation date, open-ended date qualification, ruler reign, issuer period, catalogue year, era text

**Issue Year Range Filter**:
A catalogue filter that returns coins whose Issue Year Range overlaps the requested year or year range. Coins without an Issue Year Range are excluded when an issue year filter is applied.
_Avoid_: Contained-within filter, exact year-only filter, archive creation date filter

**Issuer**:
The historical or legal authority whose name, sovereignty, or authorization a coin was issued under. An issuer has a display name and a globally unique issuer code. The display name does not need to be globally unique. An issuer is distinct from the mint that physically produced the coin.
_Avoid_: Mint, any named entity associated with a coin, globally unique display name

**Issuer Code**:
The globally unique, stable, human-readable catalogue key for an issuer, used to identify the issuer in filters, URLs, imports, and administrative lookup. It identifies the issuer itself rather than encoding the issuer's parent grouping path. It uses lowercase slug-style text and is distinct from the issuer's display name. It should not be reused for a different issuer.
_Avoid_: Display name, temporary label, parent path

**Issuer Grouping**:
A catalogue relationship that places a more specific issuer under a broader issuer for browsing and filtering. An issuer may have many child issuers, but at most one parent issuer. Issuer groupings must not contain cycles. The relationship does not necessarily mean the child issuer was legally, politically, or historically subordinate to the parent issuer.
_Avoid_: Legal subordination, political containment, circular grouping

**Issuer Filter**:
A catalogue filter that returns coins linked to the selected issuer and coins linked to descendant issuers in that issuer's grouping.
_Avoid_: Exact issuer match only

**Ruler**:
A historical person whose reign or office is attributed to a coin. A ruler has a display name and a globally unique ruler code. A coin may be attributed to zero, one, or many rulers.
_Avoid_: Issuer, mint, monarch-only attribution

**Ruler Code**:
The globally unique, stable, human-readable catalogue key for a ruler, used to identify the ruler in filters, URLs, imports, and administrative lookup. It uses lowercase slug-style text and is distinct from the ruler's display name.
_Avoid_: Display name, temporary label, generated database identity

**Ruler Group**:
A named catalogue grouping associated with a ruler, such as a dynasty, house, office lineage, or comparable historical grouping. A ruler group has a display name and a globally unique ruler group code. Rulers may belong to zero or one ruler group, and ruler groups are flat labels rather than hierarchical groupings.
_Avoid_: Ruling house, issuer grouping, parent-child ruler hierarchy

**Ruler Group Code**:
The globally unique, stable, human-readable catalogue key for a ruler group, used to identify the ruler group in filters, URLs, imports, and administrative lookup. It uses lowercase slug-style text and is distinct from the ruler group's display name.
_Avoid_: Display name, temporary label, parent path

**Ruler Filter**:
A catalogue filter that returns coins attributed directly to the selected ruler. It does not include other rulers from the selected ruler's group.
_Avoid_: Ruler group filter, issuer-style descendant filter

**Ruler Attribution Order**:
The display order of multiple ruler attributions on a single coin. The order is meaningful only within that coin's ruler attributions.
_Avoid_: Ruler creation date, ruler update date, global ruler rank

**Catalogue**:
A named external reference work or numbering system that assigns identifiers to coin types or issues. A catalogue is shared across many coins and has both a display title and a catalogue code used when displaying catalogue references. Catalogue titles do not need to be globally unique.
_Avoid_: Coin Archive, citation source, issuer

**Catalogue Code**:
The required, globally unique short label used to identify a catalogue in a catalogue reference, such as KM. It identifies the external catalogue, not the coin's number within that catalogue. Casing differences alone do not make two catalogue codes distinct, but the preferred casing should be preserved for display.
_Avoid_: Reference number, coin code, issuer code

**Reference**:
An external identifier, citation, or source note attached to a catalogued coin type or issue. Catalogue references are one kind of reference.
_Avoid_: Internal object reference, Coin Archive id

**Catalogue Reference**:
A catalogued coin type or issue's identifier within a specific external catalogue, not an individual specimen's identifier. A coin may have multiple catalogue references from the same catalogue when the catalogue assigns distinct numbers, but repeated equivalent catalogue references are not meaningful. Catalogue references are displayed alphabetically by catalogue title.
_Avoid_: Generic reference, citation-only source, internal coin identity

**Catalogue Filter**:
A catalogue reference filter that returns coins with at least one catalogue reference from the selected catalogue.
_Avoid_: Exact reference number filter, issuer filter

**Catalogue Reference Filter**:
A catalogue reference filter that returns coins matching the selected catalogue and reference number prefix when both are present. If only one part is present, it filters by that part alone.
_Avoid_: Broad OR filter, contains search, citation search

**Reference Number**:
The opaque identifier text assigned to a coin by a specific catalogue. A reference number is meaningful only together with its catalogue and should not be parsed as a numeric value, but casing differences and insignificant whitespace alone do not make two reference numbers distinct.
_Avoid_: Catalogue code, Coin Archive id, globally unique coin id

**Recent Coin**:
A coin record recently added to Coin Archive. Recency refers to when the archive record was created, not when the physical coin was minted or historically used.
_Avoid_: Historically recent coin
