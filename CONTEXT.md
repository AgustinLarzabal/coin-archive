# Coin Archive

Coin Archive is a digital archive of coins.

## Language

**Archive**:
The complete catalogue of historical Coins maintained by Coin Archive.
_Avoid_: Collection

**Coin**:
A catalogue entry representing a historical kind of coin or coin-like object that collectors can identify as the same issue or type. Every Coin is associated with exactly one Issuer; it is not a physical specimen or an item in a user's collection.
_Avoid_: Item, Specimen, Collection item

**Face Value**:
The nominal monetary value assigned to a Coin through its Denomination, distinct from its collector price, purchasing power, or intrinsic material value. A Coin may have at most one Face Value.
_Avoid_: Value, Price, Valuation

**Denomination**:
A canonical combination of a normalized catalogue label and a positive numeric amount expressed in exactly one Currency. A Denomination may be shared by many Coins; its label is unique within its Currency regardless of letter case, while distinct labels may identify distinct Denominations with the same Currency and amount.

**Currency**:
A canonical monetary unit in which the Face Values of one or more Coins are expressed. It is independent of Issuers and shared across them; a monetary reform that creates a distinct unit creates a distinct Currency even when the everyday name is reused.

**Currency Name**:
The concise canonical catalogue-language name of a Currency. It need not be unique because distinct Currencies may share the same everyday name.

**Currency Full Name**:
The unambiguous catalogue-language label for a Currency, derived as its Currency Name followed by its required Currency Period Label in parentheses.

**Currency Period**:
The span during which a distinct Currency existed as a monetary unit, from its introduction until its replacement or abolition. It may be ongoing and is distinct from a Coin's Issue Period and from the Currency's legal-tender period.

**Currency Period Label**:
A curated catalogue-language description of a Currency's Currency Period, suitable for distinguishing it from Currencies with the same Currency Name. It may express ongoing, approximate, or discontinuous periods.

**Currency Slug**:
A unique, lowercase public identifier for a Currency that remains stable independently of its Currency Name and Currency Full Name.
_Avoid_: Currency Code, Currency ID

**Coin Distribution**:
A curated classification of a Coin's numismatic role or status, such as standard circulation, circulating commemorative, non-circulating, pattern, or contemporary counterfeit; it does not describe the channels or geography through which the Coin was released. An editor assigns every Coin exactly one value from Coin Archive's flat, controlled vocabulary; values have no parent-child relationships. Coin Archive owns this vocabulary even when a value is based on terminology used by another catalogue.
_Avoid_: Coin Category, Coin Type

**Issue Year**:
A conventional BCE or CE calendar year used to express when a Coin was issued. It is a chronological attribution, not necessarily a year inscribed on the Coin.
_Avoid_: Date, Inscribed Year

**Issue Period**:
The inclusive span from the first through the last confirmed calendar year in which a Coin's exact issue or type was officially issued. Every Coin has an Issue Period; a single-year issue has identical endpoints, while an ongoing issue's last year is the latest confirmed year. The span may include intervening years in which issuance paused, and is not the Coin's circulation period or its Issuer's reign.
_Avoid_: Circulation Period, Reign Period

**First Issue Year**:
The earliest asserted BCE or CE year in a Coin's Issue Period, using the conventional attribution of the catalogue source. It does not represent an approximate or disputed date.
_Avoid_: Minimum Year, Min Year

**Last Issue Year**:
The latest asserted BCE or CE year in a Coin's Issue Period, using the conventional attribution of the catalogue source. For an ongoing issue, it advances only after issuance in a later year is confirmed.
_Avoid_: Maximum Year, Max Year

**Issuer**:
The canonical political entity whose coinage one or more Coins belong to or purport to belong to, whether or not that entity authorized their production. Every Issuer has an Issuer Code; an Issuer may be a present-day or historical state, territory, or similar polity, and is not the central bank, mint, or place that manufactured a Coin.
_Avoid_: Country, Mint, Manufacturer

**Issuer Code**:
A unique, uppercase public identifier for an Issuer. Genuine ISO 3166-1 alpha-2 values contain exactly two ASCII letters; Archive-defined values contain 3–12 ASCII letters, digits, or hyphens.
_Avoid_: Country Code, ISO Code

**Ruling Authority**:
A canonical person, dynasty, regime, or named political period to which a Coin's issuance is attributed. A Coin may have any number of Ruling Authorities; a Ruling Authority is distinct from both its Issuer and its Issue Period and may be shared by Coins from multiple Issuers.
_Avoid_: Issuer, Reign, Ruler person

**Ruling Authority Slug**:
A unique, lowercase public identifier for a Ruling Authority. It contains 3–64 ASCII letters or digits, optionally separated by single hyphens, and remains stable independently of the Ruling Authority's display name.
_Avoid_: Ruling Authority ID, Ruler ID

**Ruling Authority Role**:
A required, curated display label describing how a Ruling Authority applies to a particular Coin, such as Pope, King, Grand Duke, or Period. It belongs to the Coin's attribution rather than permanently classifying the Ruling Authority.
_Avoid_: Ruling Authority Type, Rank

**Ruling Authority Tenure Label**:
An optional, curated description of when a Ruling Authority held the role attributed to a Coin. It is presentation text that may express open-ended, approximate, or discontinuous tenure and is independent of the Coin's Issue Period.
_Avoid_: Issue Period, Reign Dates

**Coin Surface**:
One of a Coin's three catalogueable surfaces: its Obverse, Reverse, or Edge. Each Coin Surface may have its own description and image; only the Obverse and Reverse may have Engraver credits.
_Avoid_: Side

**Obverse**:
The front face of a Coin, conventionally the face bearing the principal design or authority.
_Avoid_: Observe, Front

**Reverse**:
The face of a Coin opposite its Obverse.
_Avoid_: Back

**Edge**:
The narrow outer surface around a Coin's circumference.

**Engraver**:
A canonical person credited with engraving the Obverse or Reverse of one or more Coins. An Engraver may have many surface credits, and an Obverse or Reverse may credit multiple Engravers.
_Avoid_: Artist name, Engraver text

**Engraver Slug**:
A unique, lowercase public identifier for an Engraver used in URLs. It is assigned independently of the Engraver's full name.
_Avoid_: Engraver Code, Engraver ID

**Explore**:
The experience of browsing the Archive.
