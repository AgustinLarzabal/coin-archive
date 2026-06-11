import type {
  CatalogueOption,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  EdgeOption,
  EngraverOption,
  IssuerOption,
  MintOption,
  OrientationOption,
  RimOption,
  RulerOption,
  ShapeOption,
  TechniqueOption,
  ThemeOption,
} from "@workspace/db"
import {
  demonetizationFilterOptions,
  getCatalogueOptionLabel,
  getCompositionOptionLabel,
  getCurrencyOptionLabel,
  getDistributionOptionLabel,
  getEdgeOptionLabel,
  getEngraverOptionLabel,
  getMintOptionLabel,
  getOrientationOptionLabel,
  getRimOptionLabel,
  getRulerOptionLabel,
  getShapeOptionLabel,
  getTechniqueOptionLabel,
  getThemeOptionLabel,
} from "./coin-search"
import type { OptionWithCode, TextCoinSearchFilterName } from "./coin-search"

export type CoinFilterOptions = {
  catalogues: CatalogueOption[]
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  distributions: DistributionOption[]
  edges: EdgeOption[]
  engravers: EngraverOption[]
  issuers: IssuerOption[]
  mints: MintOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  shapes: ShapeOption[]
  techniques: TechniqueOption[]
  themes: ThemeOption[]
}

type CodeFilterConfigOf<T extends OptionWithCode> = {
  name: TextCoinSearchFilterName
  emptyMessage: string
  placeholder: string
  getItems: (options: CoinFilterOptions) => T[]
  itemToStringLabel: (item: T) => string
  renderItemLabel?: (item: T) => string
  showCode?: boolean
}

export type CodeFilterConfig = CodeFilterConfigOf<OptionWithCode>

// Erases the concrete option type. Safe because each entry's label functions
// only ever receive items produced by that same entry's getItems.
function defineCodeFilter<T extends OptionWithCode>(
  config: CodeFilterConfigOf<T>
): CodeFilterConfig {
  return config as unknown as CodeFilterConfig
}

export const coinCodeFilterConfigs: ReadonlyArray<CodeFilterConfig> = [
  defineCodeFilter<IssuerOption>({
    name: "issuer",
    emptyMessage: "No issuers found.",
    placeholder: "Filter by issuer",
    getItems: (options) => options.issuers,
    itemToStringLabel: (issuer) => issuer.name,
  }),
  defineCodeFilter<RulerOption>({
    name: "ruler",
    emptyMessage: "No rulers found.",
    placeholder: "Filter by ruler",
    getItems: (options) => options.rulers,
    itemToStringLabel: getRulerOptionLabel,
    renderItemLabel: getRulerOptionLabel,
  }),
  defineCodeFilter<CatalogueOption>({
    name: "catalogue",
    emptyMessage: "No catalogues found.",
    placeholder: "Filter by catalogue",
    getItems: (options) => options.catalogues,
    itemToStringLabel: getCatalogueOptionLabel,
    renderItemLabel: (catalogue) => catalogue.title,
  }),
  defineCodeFilter<CompositionOption>({
    name: "composition",
    emptyMessage: "No compositions found.",
    placeholder: "Filter by composition",
    getItems: (options) => options.compositions,
    itemToStringLabel: getCompositionOptionLabel,
    showCode: false,
  }),
  defineCodeFilter<CurrencyOption>({
    name: "currency",
    emptyMessage: "No currencies found.",
    placeholder: "Filter by currency",
    getItems: (options) => options.currencies,
    itemToStringLabel: getCurrencyOptionLabel,
  }),
  defineCodeFilter<DistributionOption>({
    name: "distribution",
    emptyMessage: "No distributions found.",
    placeholder: "Filter by distribution",
    getItems: (options) => options.distributions,
    itemToStringLabel: getDistributionOptionLabel,
  }),
  defineCodeFilter({
    name: "demonetization",
    emptyMessage: "No Demonetization Status values found.",
    placeholder: "Filter by demonetization status",
    getItems: () => [...demonetizationFilterOptions],
    itemToStringLabel: (option) => option.name,
  }),
  defineCodeFilter<EdgeOption>({
    name: "edge",
    emptyMessage: "No edges found.",
    placeholder: "Filter by edge",
    getItems: (options) => options.edges,
    itemToStringLabel: getEdgeOptionLabel,
  }),
  defineCodeFilter<EngraverOption>({
    name: "engraver",
    emptyMessage: "No engravers found.",
    placeholder: "Filter by engraver",
    getItems: (options) => options.engravers,
    itemToStringLabel: getEngraverOptionLabel,
  }),
  defineCodeFilter<MintOption>({
    name: "mint",
    emptyMessage: "No mints found.",
    placeholder: "Filter by mint",
    getItems: (options) => options.mints,
    itemToStringLabel: getMintOptionLabel,
  }),
  defineCodeFilter<OrientationOption>({
    name: "orientation",
    emptyMessage: "No orientations found.",
    placeholder: "Filter by orientation",
    getItems: (options) => options.orientations,
    itemToStringLabel: getOrientationOptionLabel,
  }),
  defineCodeFilter<ShapeOption>({
    name: "shape",
    emptyMessage: "No shapes found.",
    placeholder: "Filter by shape",
    getItems: (options) => options.shapes,
    itemToStringLabel: getShapeOptionLabel,
  }),
  defineCodeFilter<RimOption>({
    name: "rim",
    emptyMessage: "No rims found.",
    placeholder: "Filter by rim",
    getItems: (options) => options.rims,
    itemToStringLabel: getRimOptionLabel,
  }),
  defineCodeFilter<TechniqueOption>({
    name: "technique",
    emptyMessage: "No Minting Techniques found.",
    placeholder: "Filter by Minting Technique",
    getItems: (options) => options.techniques,
    itemToStringLabel: getTechniqueOptionLabel,
  }),
  defineCodeFilter<ThemeOption>({
    name: "theme",
    emptyMessage: "No themes found.",
    placeholder: "Filter by theme",
    getItems: (options) => options.themes,
    itemToStringLabel: getThemeOptionLabel,
  }),
]
