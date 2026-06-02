# Coin Archive

Coin Archive is a catalog of physical coins from across history. The context exists to describe the archive's cataloguing language independently from implementation choices.

## Language

**Coin**:
A catalogued physical coin type or issue in the archive, not an individual owned example. A coin has exactly one direct issuer and may later be described by historical, geographic, minting, material, inscription, image, and reference information.
_Avoid_: Coina, specimen, item

**Coin Title**:
The human-readable display label for a coin. It is not structured catalogue data and should not be parsed to infer historical, geographic, minting, material, inscription, image, or reference information.
_Avoid_: Name, generated catalogue data

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

**Recent Coin**:
A coin record recently added to Coin Archive. Recency refers to when the archive record was created, not when the physical coin was minted or historically used.
_Avoid_: Historically recent coin
