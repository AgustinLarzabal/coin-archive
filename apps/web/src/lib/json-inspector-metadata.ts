import type { JsonInspectorQueries } from "./json-inspector-queries"

export type JsonInspectorQueryKey = keyof JsonInspectorQueries

export type JsonInspectorQueryMetadata = {
  databaseTables: string[]
  requirements: string[]
  limitations: string[]
  queryNotes: string[]
}

export const jsonInspectorMetadata: Record<
  JsonInspectorQueryKey,
  JsonInspectorQueryMetadata
> = {
  catalogues: {
    databaseTables: ["catalogue"],
    requirements: ["code and title are required."],
    limitations: [
      "code is unique case-insensitively.",
      "A catalogue cannot be deleted while coin references still point to it.",
    ],
    queryNotes: [
      "The query returns id, code, title, createdAt, and updatedAt.",
      "Results are ordered by title ascending, then code ascending.",
    ],
  },
  coins: {
    databaseTables: [
      "coin",
      "catalogue",
      "coin_surface",
      "coin_face_engraver",
      "coin_mint",
      "coin_reference",
      "coin_ruler",
      "coin_theme",
      "composition",
      "currency",
      "distribution",
      "edge",
      "engraver",
      "issuer",
      "mint",
      "orientation",
      "rim",
      "ruler",
      "ruler_group",
      "shape",
      "technique",
      "theme",
    ],
    requirements: [
      "Each coin requires title, issuer, distribution, composition, face value text, positive face value numeric value, and currency.",
      "Issue years must be either fully absent or provided as both minYear and maxYear, and minYear cannot be greater than maxYear.",
      "Weight, diameter, thickness, and mintage are optional but must be positive when present.",
      "Optional relations such as orientation, edge, shape, rim, technique, mints, themes, rulers, Coin Surface details, face-only Engraver Attribution rows, and catalogue references must point to existing rows.",
    ],
    limitations: [
      "The /json page shows at most 1000 coin records, even if more rows match the filters.",
      "Deleting an issuer, distribution, composition, currency, or other referenced lookup row is restricted while any coin still points at it.",
      "Coin Surface rows are limited to one obverse, one reverse, and one edge-surface per coin.",
      "Edge remains a coin-level controlled classification, while Rim remains coin-level.",
      "Engraver Attribution remains face-specific, so only obverse and reverse Coin Surface rows may carry engraver links.",
      "Ruler ordering is per coin, must be unique per position, and must be greater than zero.",
    ],
    queryNotes: [
      "Results use the same search params as the home page.",
      "Rows are ordered by coin.createdAt descending, then coin.id descending.",
      "Many-to-many relations are collapsed into arrays for mints, themes, rulers, engravers, and references.",
      "Comments are normalized before being exposed in the JSON record shape.",
    ],
  },
  compositions: {
    databaseTables: ["composition"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
      "description is optional.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "A composition cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, description, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  currencies: {
    databaseTables: ["currency"],
    requirements: [
      "code, name, and fullName are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "A currency cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, fullName, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  distributions: {
    databaseTables: ["distribution"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "A distribution cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  edges: {
    databaseTables: ["edge"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "An edge cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  engravers: {
    databaseTables: ["engraver"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "An engraver cannot be deleted while face-only Engraver Attribution rows still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  issuers: {
    databaseTables: ["issuer"],
    requirements: [
      "name, code, and isoCode are required.",
      "code must be lowercase slug text.",
      "isoCode must be exactly two uppercase letters.",
      "parentIssuerId is optional, but cannot point to the same issuer.",
    ],
    limitations: [
      "code must be unique.",
      "A referenced issuer cannot be deleted while coins or child issuers still depend on it.",
    ],
    queryNotes: [
      "The query returns only code, isoCode, and name.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  mints: {
    databaseTables: ["coin_mint", "mint"],
    requirements: [
      "Mint rows require code and name.",
      "code must be lowercase slug text.",
      "Coin-to-mint links require a valid coinId and mintId.",
    ],
    limitations: [
      "mint.code is unique case-insensitively.",
      "The coin_mint join table prevents duplicate coinId + mintId pairs.",
      "A mint cannot be deleted while coin_mint rows still reference it.",
    ],
    queryNotes: [
      "The query returns only mint rows, not the join table rows.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  orientations: {
    databaseTables: ["orientation"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "An orientation cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  rims: {
    databaseTables: ["rim"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "A rim cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  rulers: {
    databaseTables: ["ruler", "ruler_group"],
    requirements: [
      "name and code are required.",
      "code must be lowercase slug text.",
      "rulerGroupId is optional but must reference an existing ruler group when present.",
    ],
    limitations: [
      "code must be unique.",
      "A ruler cannot be deleted while coin_ruler rows still reference it.",
    ],
    queryNotes: [
      "The query returns code, name, and an optional nested group object.",
      "Results are ordered by name ascending, then code ascending.",
      "Unlike most lookup queries, this payload does not include ids or timestamps.",
    ],
  },
  shapes: {
    databaseTables: ["shape"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "A shape cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  techniques: {
    databaseTables: ["technique"],
    requirements: [
      "code and name are required.",
      "code must be lowercase slug text.",
    ],
    limitations: [
      "code is unique case-insensitively.",
      "A technique cannot be deleted while coins still reference it.",
    ],
    queryNotes: [
      "The query returns id, code, name, createdAt, and updatedAt.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
  themes: {
    databaseTables: ["coin_theme", "theme"],
    requirements: [
      "Theme rows require code and name.",
      "code must be lowercase slug text.",
      "Coin-to-theme links require a valid coinId and themeId.",
    ],
    limitations: [
      "theme.code is unique case-insensitively.",
      "The coin_theme join table prevents duplicate coinId + themeId pairs.",
      "A theme cannot be deleted while coin_theme rows still reference it.",
    ],
    queryNotes: [
      "The query returns only theme rows, not the join table rows.",
      "Results are ordered by name ascending, then code ascending.",
    ],
  },
}
