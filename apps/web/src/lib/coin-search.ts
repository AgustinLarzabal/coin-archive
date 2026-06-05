import type {
  CatalogueOption,
  DistributionOption,
  RulerOption,
} from "@workspace/db"
import { z } from "zod"

const optionalStringSchema = z.string().optional()

export const coinSearchSchema = z.object({
  catalogue: optionalStringSchema,
  distribution: optionalStringSchema,
  issuer: optionalStringSchema,
  referenceNumber: optionalStringSchema,
  ruler: optionalStringSchema,
})

export const coinListInputSchema = z.object({
  catalogueCode: optionalStringSchema,
  distributionCode: optionalStringSchema,
  issuerCode: optionalStringSchema,
  referenceNumber: optionalStringSchema,
  rulerCode: optionalStringSchema,
})

export type CoinSearch = z.infer<typeof coinSearchSchema>
export type CoinListLoaderDeps = z.infer<typeof coinListInputSchema>
export type CoinSearchFilterName = keyof CoinSearch

type OptionWithCode = { code: string }
type CatalogueOptionLabel = Pick<CatalogueOption, "title" | "code">
type DistributionOptionLabel = Pick<DistributionOption, "name" | "code">
type RulerOptionLabel = Pick<RulerOption, "name" | "group">

export function getCoinListLoaderDeps(search: CoinSearch): CoinListLoaderDeps {
  return {
    catalogueCode: search.catalogue,
    distributionCode: search.distribution,
    issuerCode: search.issuer,
    referenceNumber: search.referenceNumber,
    rulerCode: search.ruler,
  }
}

function findSelectedCodeOption<T extends OptionWithCode>(
  options: T[],
  selectedCode: string | undefined
): T | null {
  if (!selectedCode) {
    return null
  }

  const normalizedSelectedCode = selectedCode.toLowerCase()

  return (
    options.find(
      (option) => option.code.toLowerCase() === normalizedSelectedCode
    ) ?? null
  )
}

export function findSelectedCatalogueOption<T extends OptionWithCode>(
  catalogues: T[],
  selectedCatalogueCode: string | undefined
): T | null {
  return findSelectedCodeOption(catalogues, selectedCatalogueCode)
}

export function findSelectedDistributionOption<T extends OptionWithCode>(
  distributions: T[],
  selectedDistributionCode: string | undefined
): T | null {
  return findSelectedCodeOption(distributions, selectedDistributionCode)
}

export function updateCoinSearchFilter(
  currentSearch: CoinSearch,
  filterName: CoinSearchFilterName,
  filterValue: string | undefined
): CoinSearch {
  const nextSearch = { ...currentSearch }

  if (filterValue === undefined || filterValue === "") {
    delete nextSearch[filterName]

    return nextSearch
  }

  nextSearch[filterName] = filterValue

  return nextSearch
}

export function getCatalogueOptionLabel(catalogue: CatalogueOptionLabel) {
  return `${catalogue.title} · ${catalogue.code}`
}

export function getDistributionOptionLabel(
  distribution: DistributionOptionLabel
) {
  return `${distribution.name} · ${distribution.code}`
}

export function getRulerOptionLabel(ruler: RulerOptionLabel) {
  return ruler.group ? `${ruler.name} · ${ruler.group.name}` : ruler.name
}
