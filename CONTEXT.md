# Coin Archive

Coin Archive is a catalog of physical coins from across history. The context exists to describe the archive's cataloguing language independently from implementation choices.

## Language

**Coin**:
A catalogued physical coin type or issue in the archive, not an individual owned example. A coin has exactly one direct issuer, may have zero or more ruler attributions, and may have zero or more mint attributions. A coin may later be described by historical, geographic, minting, material, inscription, image, and reference information.
_Avoid_: Coina, specimen, item

**Coin Title**:
The human-readable display label for a coin. It is not structured catalogue data and should not be parsed to infer historical, geographic, minting, material, inscription, image, or reference information.
_Avoid_: Name, generated catalogue data

**Coin Comment**:
Optional public free-text catalogue remarks attached to a Coin. A Coin has at most one Coin Comment, and it is not structured, parsed, or filterable catalogue data.
_Avoid_: Note, private curator note, description, searchable field, structured annotation

**Issue Year Range**:
The closed earliest and latest known years in which a coin type or issue is understood to have been minted or issued, represented as astronomical integer years when structured. The range describes the coin type or issue itself, not the issuer's lifetime, a ruler's reign, catalogue publication date, or archive record creation date.
_Avoid_: Creation date, open-ended date qualification, ruler reign, issuer period, catalogue year, era text

**Issue Year Range Filter**:
A catalogue filter that returns coins whose Issue Year Range overlaps the requested year or year range. Coins without an Issue Year Range are excluded when an issue year filter is applied.
_Avoid_: Contained-within filter, exact year-only filter, archive creation date filter

**Diameter**:
The standard catalogue width of a coin type or issue, measured across the coin in millimeters. For non-round coins, Diameter means the largest measured width across the coin.
_Avoid_: Size, specimen measurement

**Weight**:
The standard catalogue mass of a coin type or issue, measured in grams.
_Avoid_: Specimen weight, unitless mass

**Thickness**:
The standard catalogue edge thickness of a coin type or issue, measured in millimeters.
_Avoid_: Specimen thickness, unitless thickness

**Orientation**:
The intended standard physical-description alignment relationship between the obverse and reverse designs of a coin type or issue, using Coin Archive's flat canonical orientation vocabulary. A coin has at most one Orientation, and it may be unknown.
_Avoid_: Specimen rotation, minting error, image rotation, source-specific orientation label, orientation grouping

**Orientation Code**:
The unique, stable, human-readable catalogue key for an orientation, used to identify the orientation in imports, filters, URLs, and administrative lookup. It is unique within orientations, uses lowercase slug-style text, and is distinct from the orientation's display name.
_Avoid_: Display name, temporary label, generated database identity

**Orientation Filter**:
A catalogue filter that returns coins linked directly to the selected Orientation. It composes with other catalogue filters using AND semantics, and coins without an Orientation are excluded when an orientation filter is applied.
_Avoid_: Image rotation filter, specimen orientation filter, unknown-orientation match

**Minting Technique**:
The production method used to manufacture a coin type or issue, such as milled, hammered, cast, or machine-struck. A coin has at most one Minting Technique, and it may be unknown.
_Avoid_: Technique, design technique, engraving technique, edge technique, mint attribution

**Minting Technique Code**:
The unique, stable, human-readable catalogue key for a minting technique, used to identify the technique in imports, filters, URLs, and administrative lookup. It is unique within minting techniques, uses lowercase slug-style text, and is distinct from the minting technique's display name.
_Avoid_: Display name, temporary label, generated database identity

**Minting Technique Filter**:
A catalogue filter that returns coins linked directly to the selected Minting Technique. It composes with other catalogue filters using AND semantics, and coins without a Minting Technique are excluded when a minting technique filter is applied.
_Avoid_: Free-text technique search, engraving technique filter, edge technique filter, unknown-technique match

**Coin Surface**:
A describable physical surface of a catalogued coin type or issue: the Obverse, Reverse, or Edge Surface. Coin Surface is the umbrella term for recorded descriptive surface text and lettering, not for controlled physical classifications such as Edge or Rim; missing surface details do not mean the physical surface is absent.
_Avoid_: Coin face, side, whole-coin description, edge classification, rim classification, required blank surface record, exergue surface, inner-ring surface, outer-ring surface

**Surface Set**:
The grouped Obverse, Reverse, and Edge Surface records for a Coin. A Surface Set may omit any surface whose details and imagery have not been recorded.
_Avoid_: Face set, sides, image set, edge classification group

**Coin Face**:
One of the two broad flat design-bearing surfaces of a catalogued coin type or issue: the Obverse or Reverse. The Edge Surface is a Coin Surface but not a Coin Face.
_Avoid_: Coin surface, edge surface, side, whole-coin description

**Obverse**:
The front Coin Face of a catalogued coin type or issue. A coin may have no recorded Obverse surface details, and its descriptive text and lettering may be known independently.
_Avoid_: Observe, heads, front image, placeholder face text

**Reverse**:
The back Coin Face of a catalogued coin type or issue. A coin may have no recorded Reverse surface details, and its descriptive text and lettering may be known independently.
_Avoid_: Tails, back image, placeholder face text

**Edge Surface**:
The outer side Coin Surface of a catalogued coin type or issue. A coin may have no recorded Edge Surface details, and its descriptive text and lettering may be known independently from its Edge classification.
_Avoid_: Edge, rim, third face, side face, edge type

**Surface Description**:
Free-text descriptive catalogue prose recorded for a Coin Surface at the coin type or issue level. Surface Description preserves entered source or editorial wording and is not parsed into structured motif, device, specimen condition, or image metadata.
_Avoid_: Obverse description field, reverse description field, edge description field, parsed design motif, specimen wear note, weak strike note, image metadata

**Surface Lettering**:
The plain text inscription recorded from a Coin Surface as catalogue data, including transcribed symbols, separators, or ornament marks when they are part of the entered inscription. Surface Lettering preserves the entered source wording and is not parsed into structured inscription tokens.
_Avoid_: Face lettering, edge lettering, parsed inscription, generated text, normalized token sequence, alphabetic-only text

**Surface Image**:
A catalogue web image URL associated with a specific Coin Surface: Obverse, Reverse, or Edge Surface. A Surface Image belongs to the coin type or issue's surface record and is distinct from Surface Description, Surface Lettering, orientation data, or whole-coin imagery.
_Avoid_: Coin image, face image, edge classification image, image binary, local file path, image metadata, specimen gallery image

**Surface Thumbnail**:
The small preview web image URL associated with a specific Coin Surface for compact catalogue presentation. A Surface Thumbnail is separate from the Surface Image used for larger display, may be omitted when the larger Surface Image is acceptable as a preview, and either image may be missing when the archive has not recorded it.
_Avoid_: Generated preview, icon, cropped face label, image binary, local file path, whole-coin thumbnail

**Engraver**:
A person credited with creating or engraving a coin face design. An Engraver may be attributed to an Obverse or Reverse, but is not a whole-coin attribution unless both faces are explicitly attributed.
_Avoid_: Artist, designer, issuer, mint worker, whole-coin engraver

**Engraver Code**:
The globally unique, stable, human-readable catalogue key for an engraver, used to identify the engraver in filters, URLs, imports, and administrative lookup. It uses lowercase slug-style text and is distinct from the engraver's display name.
_Avoid_: Display name, temporary label, generated database identity

**Engraver Attribution**:
A catalogue relationship that links an Engraver to the Obverse or Reverse face design they are credited with. Multiple engraver attributions on a single face are unordered unless the archive later defines a face-specific credit order; Engraver Attribution is face-specific, not surface-wide.
_Avoid_: Surface-wide artist tag, edge engraver attribution, coin-level artist tag, mint attribution, issuer attribution, inferred designer

**Engraver Filter**:
A catalogue filter that returns coins with the selected Engraver attributed to either the Obverse or Reverse. It composes with other catalogue filters using AND semantics.
_Avoid_: Face-specific engraver filter, whole-coin artist filter, issuer filter

**Shape**:
The intended standard physical-description outline form of a coin type or issue, using Coin Archive's flat canonical shape vocabulary. A coin has at most one Shape, and it may be unknown.
_Avoid_: Diameter, design motif, specimen deformation, specimen damage, source-specific shape label, shape grouping

**Shape Code**:
The unique, stable, human-readable catalogue key for a shape, used to identify the shape in imports, filters, URLs, and administrative lookup. It is unique within shapes, uses lowercase slug-style text, and is distinct from the shape's display name.
_Avoid_: Display name, temporary label, generated database identity

**Shape Filter**:
A catalogue filter that returns coins linked directly to the selected Shape. It composes with other catalogue filters using AND semantics, and coins without a Shape are excluded when a shape filter is applied.
_Avoid_: Diameter filter, design motif filter, unknown-shape match

**Rim**:
The intended standard physical-description border treatment recorded on the face or faces of a coin type or issue, such as raised, barred, or chained rim forms, using Coin Archive's flat canonical rim vocabulary. A coin has at most one Rim, and the Rim value may include face applicability such as both sides.
_Avoid_: Edge, edge inscription, edge lettering, obverse rim field, reverse rim field, source-specific rim label, rim grouping, weak strike, specimen wear, specimen damage

**Rim Code**:
The unique, stable, human-readable catalogue key for a rim, used to identify the rim in imports, filters, URLs, and administrative lookup. It is unique within rims, uses lowercase slug-style text, and is distinct from the rim's display name.
_Avoid_: Display name, temporary label, edge code

**Rim Filter**:
A catalogue filter that returns coins linked directly to the selected Rim. It composes with other catalogue filters using AND semantics, and coins without a Rim are excluded when a rim filter is applied.
_Avoid_: Edge filter, edge inscription filter, obverse rim filter, reverse rim filter, unknown-rim match

**Edge**:
The intended standard physical-description treatment category of the coin's Edge Surface, using Coin Archive's flat canonical edge vocabulary. A coin has at most one Edge, and coin-specific Surface Description or Surface Lettering details may be known without selecting an Edge.
_Avoid_: Rim, face border, obverse rim, reverse rim, source-specific edge label, actual edge inscription text

**Edge Code**:
The unique, stable, human-readable catalogue key for an edge, used to identify the edge in imports, filters, URLs, and administrative lookup. It is unique within edges, uses lowercase slug-style text, and is distinct from the edge's display name.
_Avoid_: Display name, temporary label, rim code

**Edge Filter**:
A catalogue filter that returns coins linked directly to the selected Edge. It composes with other catalogue filters using AND semantics, and coins without an Edge are excluded when an edge filter is applied.
_Avoid_: Rim filter, edge lettering search, unknown-edge match

**Mintage**:
The exact known production fact for the total quantity actually produced for a coin type or issue as a positive whole number, using the same cataloguing scope as the Coin record. A coin may have unknown Mintage.
_Avoid_: Archive count, owned specimen count, population estimate, rarity label, approximate mintage, authorized quantity, planned quantity, per-mint mintage, per-year mintage

**Face Value**:
The official nominal denomination assigned to a coin type or issue, such as 2 Euros or 50 Euro Cent. Every Coin has exactly one Face Value. Face Value combines authoritative display text, a numeric value expressed in the Currency's major unit, and the Currency itself. The display text is catalogue data, not a generated label. Face Value describes the denomination of the coin itself, not its market price, collector value, melt value, exchange-rate value, or current purchasing power.
_Avoid_: Value, market value, collector value, sale price, melt value, purchasing power, zero or negative denomination, minor-unit numeric value, generated denomination label

**Demonetization Status**:
Whether a Coin's Face Value is known to be no longer legally monetized by the issuing authority. Demonetization Status belongs to the Coin rather than the Currency, and it may be unknown when the archive has not established the coin's legal monetary status. It is distinct from circulation frequency, collector demand, distribution category, and current purchasing power.
_Avoid_: Circulation status, distribution, obsolete currency, collector-only status, current purchasing power

**Demonetization Status Filter**:
A catalogue filter that returns coins whose Demonetization Status is demonetized, not demonetized, or unknown. It composes with other catalogue filters using AND semantics.
_Avoid_: Circulation filter, distribution filter, legal tender checkbox

**Currency**:
The reusable monetary unit used by a coin's Face Value, such as Euro, Argentine peso, or United States dollar. A Currency has a short display name and a full display name for historical disambiguation. A Currency is distinct from an Issuer and does not imply which authority issued a specific Coin.
_Avoid_: Issuer, denomination, exchange rate, market value

**Currency Code**:
The globally unique, stable, human-readable catalogue key for a currency, used to identify the currency in imports, filters, URLs, and administrative lookup. It uses lowercase slug-style text and is distinct from the currency's display names. Currency names and full names are not archive identities.
_Avoid_: Display name, full display name, ISO currency code requirement, issuer code

**Currency Filter**:
A catalogue filter that returns coins linked directly to the selected Currency.
_Avoid_: Issuer filter, exchange-rate filter, face-value range filter

**Face Value Filter**:
A catalogue filter that returns coins whose numeric Face Value falls within the requested range. The numeric comparison uses each Face Value's major-unit value without exchange-rate conversion and composes with Currency Filter and other catalogue filters using AND semantics.
_Avoid_: Market-price filter, exchange-rate conversion filter, minor-unit filter

**Composition**:
The named material makeup of catalogued coin types or issues, with optional descriptive detail about alloys, layers, or parts of the coin. Every Coin has exactly one Composition. A Composition has a display name and a globally unique composition code, and it describes coin types or issues rather than tested individual specimens.
_Avoid_: Specimen assay, normalized metal inventory, parsed chemistry

**Composition Code**:
The globally unique, stable, human-readable catalogue key for a composition, used to identify the composition in imports, filters, URLs, and administrative lookup. It uses lowercase slug-style text and is distinct from the composition's display name.
_Avoid_: Display name, temporary label, parsed material formula

**Composition Filter**:
A catalogue filter that returns coins linked directly to the selected composition.
_Avoid_: Metal component search, contains-text material search, issuer-style descendant filter

**Measurement Filter**:
A catalogue filter that returns coins whose known Weight, Diameter, or Thickness falls within the requested measurement range. Coins without the filtered measurement are excluded only when that measurement filter is applied.
_Avoid_: Unknown-measurement match, specimen measurement filter

**Issuer**:
The historical or legal authority whose name, sovereignty, or authorization a coin was issued under. An issuer has a display name and a globally unique issuer code. The display name does not need to be globally unique. An issuer is distinct from the mint that physically produced the coin.
_Avoid_: Mint, any named entity associated with a coin, globally unique display name

**Mint**:
The named facility, institution, or minting authority associated with physically producing a coin type or issue. A Mint is distinct from the Issuer under whose authority the coin was issued.
_Avoid_: Issuer, ruler, composition, production date

**Mint Code**:
The globally unique, stable, human-readable catalogue key for a mint, used to identify the mint in filters, URLs, imports, and administrative lookup. It uses lowercase slug-style text and is distinct from the mint's display name.
_Avoid_: Display name, temporary label, issuer code

**Mint Attribution**:
A catalogue relationship that links a Coin to a Mint associated with producing that coin type or issue. Multiple mint attributions on a single Coin are unordered, and a recorded attribution means the archive attributes the coin type or issue to that Mint.
_Avoid_: Issuer attribution, ruler attribution order, production batch, mint mark, uncertain attribution note

**Mint Filter**:
A catalogue filter that returns coins attributed directly to the selected Mint. It composes with other catalogue filters using AND semantics.
_Avoid_: Issuer filter, mint grouping filter, mint name search

**Theme**:
A reusable subject, visual motif, or explicit commemorative concept intentionally represented by catalogued coin types or issues, such as a map, flag, portrait, animal, building, plant, or independence. A coin may have zero or more Themes.
_Avoid_: Design type, primary subject, image description, free-text tag, broad inferred historical topic

**Theme Code**:
The globally unique, stable, human-readable catalogue key for a theme, used to identify the theme in filters, URLs, imports, and administrative lookup. It uses lowercase slug-style text and is distinct from the theme's display name.
_Avoid_: Display name, temporary label, image label

**Theme Attribution**:
A catalogue relationship that explicitly links a Coin to a Theme depicted on or otherwise commemorated by that catalogued coin type or issue as recorded. Multiple theme attributions on a single Coin are unordered.
_Avoid_: Primary theme, incidental description, keyword tag order, inferred historical association, title-derived theme, automatic parent theme

**Theme Filter**:
A catalogue filter that returns coins attributed directly to the selected Theme. It composes with other catalogue filters using AND semantics.
_Avoid_: Free-text image search, generated tag filter, issuer-style descendant filter

**Issuer Code**:
The globally unique, stable, human-readable catalogue key for an issuer, used to identify the issuer in filters, URLs, imports, and administrative lookup. It identifies the issuer itself rather than encoding the issuer's parent grouping path. It uses lowercase slug-style text and is distinct from the issuer's display name. It should not be reused for a different issuer.
_Avoid_: Display name, temporary label, parent path

**Issuer ISO Code**:
The required currently assigned official two-letter uppercase ISO 3166-1 alpha-2 country code associated with an issuer. It is distinct from the issuer's catalogue code and may be shared by multiple issuers.
_Avoid_: Issuer code, lowercase slug, subdivision code, alpha-3 code, retired country code, exceptional reservation, optional country identifier, unique issuer identifier

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
