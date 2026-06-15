import type {
  CatalogueOption,
  CoinListRecord,
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

export type JsonInspectorQueries = {
  coins: CoinListRecord[]
  issuers: IssuerOption[]
  rulers: RulerOption[]
  catalogues: CatalogueOption[]
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  distributions: DistributionOption[]
  edges: EdgeOption[]
  engravers: EngraverOption[]
  mints: MintOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  shapes: ShapeOption[]
  techniques: TechniqueOption[]
  themes: ThemeOption[]
}
