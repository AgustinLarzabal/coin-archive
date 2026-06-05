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

type CatalogueOptionWithCode = Pick<CatalogueOption, "code">
type DistributionOptionWithCode = Pick<DistributionOption, "code">
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

export function findSelectedCatalogueOption<T extends CatalogueOptionWithCode>(
  catalogues: T[],
  selectedCatalogueCode: string | undefined
): T | null {
  if (!selectedCatalogueCode) {
    return null
  }

  const normalizedSelectedCatalogueCode = selectedCatalogueCode.toLowerCase()

  return (
    catalogues.find(
      (catalogue) =>
        catalogue.code.toLowerCase() === normalizedSelectedCatalogueCode
    ) ?? null
  )
}

export function findSelectedDistributionOption<
  T extends DistributionOptionWithCode,
>(distributions: T[], selectedDistributionCode: string | undefined): T | null {
  if (!selectedDistributionCode) {
    return null
  }

  const normalizedSelectedDistributionCode =
    selectedDistributionCode.toLowerCase()

  return (
    distributions.find(
      (distribution) =>
        distribution.code.toLowerCase() === normalizedSelectedDistributionCode
    ) ?? null
  )
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
