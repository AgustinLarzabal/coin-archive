import { amountFilterDefinition } from "./definitions/amount-filter"
import { compositionFilterDefinition } from "./definitions/composition-filter"
import { currencyFilterDefinition } from "./definitions/currency-filter"
import { distributionFilterDefinition } from "./definitions/distribution-filter"
import { engraverFilterDefinition } from "./definitions/engraver-filter"
import { issuerFilterDefinition } from "./definitions/issuer-filter"
import { mintFilterDefinition } from "./definitions/mint-filter"
import { orientationFilterDefinition } from "./definitions/orientation-filter"
import { rulerFilterDefinition } from "./definitions/ruler-filter"
import { shapeFilterDefinition } from "./definitions/shape-filter"
import { sizeFilterDefinition } from "./definitions/size-filter"
import { tagFilterDefinition } from "./definitions/tag-filter"
import { techniqueFilterDefinition } from "./definitions/technique-filter"
import { thicknessFilterDefinition } from "./definitions/thickness-filter"
import { weightFilterDefinition } from "./definitions/weight-filter"
import { yearFilterDefinition } from "./definitions/year-filter"
import type { ExploreSearch } from "../explore-search"
import type { ExploreFilterPatch } from "../explore-search-navigation"
import type {
  CompositionResponse,
  CurrencyResponse,
  DistributionResponse,
  EngraverResponse,
  IssuerResponse,
  MintResponse,
  NamedSlugResponse,
  OrientationResponse,
  RulingAuthorityResponse,
  TechniqueResponse,
} from "@coin-archive/api"
import type {
  FilterField,
  FilterOption,
  FilterQuery,
} from "@coin-archive/ui/components/reui/filters/filters-types"
import type { ReactNode } from "react"
import type { ZodType } from "zod"

export type ExploreFilterValue =
  | string
  | number
  | [number | undefined, number | undefined]

export interface ExploreFilterLists {
  currencies: Array<CurrencyResponse>
  compositions: Array<CompositionResponse>
  distributions: Array<DistributionResponse>
  techniques: Array<TechniqueResponse>
  engravers: Array<EngraverResponse>
  issuers: Array<IssuerResponse>
  mints: Array<MintResponse>
  rulingAuthorities: Array<RulingAuthorityResponse>
  tags: Array<NamedSlugResponse>
  shapes: Array<NamedSlugResponse>
  orientations: Array<OrientationResponse>
}

export interface ExploreFilterDefinition {
  id: keyof ExploreFilterPatch
  label: string
  icon: ReactNode
  schema: ZodType<string>
  options: (lists: ExploreFilterLists, search: ExploreSearch) => FilterOption[]
}

export const exploreFilterDefinitions = [
  amountFilterDefinition,
  currencyFilterDefinition,
  compositionFilterDefinition,
  shapeFilterDefinition,
  orientationFilterDefinition,
  distributionFilterDefinition,
  techniqueFilterDefinition,
  engraverFilterDefinition,
  issuerFilterDefinition,
  mintFilterDefinition,
  rulerFilterDefinition,
  tagFilterDefinition,
  sizeFilterDefinition,
  thicknessFilterDefinition,
  weightFilterDefinition,
  yearFilterDefinition,
]

export function getExploreFilterFields(
  lists: ExploreFilterLists,
  search: ExploreSearch,
  query: FilterQuery<ExploreFilterValue>
): FilterField<ExploreFilterValue>[] {
  const selected = new Set(
    query.rules.flatMap((node) => (node.type === "rule" ? [node.path[0]] : []))
  )
  const hasCurrency = query.rules.some(
    (node) =>
      node.type === "rule" &&
      node.path[0] === "currency" &&
      typeof node.value === "string"
  )

  return exploreFilterDefinitions.map((definition) => {
    if (definition.id === "amount") {
      return {
        ...definition,
        disabled: selected.has("amount") || !hasCurrency,
        description: hasCurrency ? undefined : "Choose a currency first",
      }
    }
    if (
      definition.id === "year" ||
      definition.id === "size" ||
      definition.id === "thickness" ||
      definition.id === "weight"
    ) {
      return { ...definition, disabled: selected.has(definition.id) }
    }

    return {
      id: definition.id,
      label: definition.label,
      icon: definition.icon,
      type: "select",
      options: definition.options(lists, search),
      pinSelected: true,
      operators: [{ value: "is", label: "is" }],
      defaultOperator: "is",
      autoSelectOperator: true,
      disabled: selected.has(definition.id),
    }
  })
}
