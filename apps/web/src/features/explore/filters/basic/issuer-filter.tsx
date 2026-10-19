import { ExploreFilterCombobox } from "./explore-filter-combobox"
import type { IssuerResponse } from "@coin-archive/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

type IssuerFilterProps = {
  issuerCode?: string
  issuers: Array<IssuerResponse>
}

type IssuerOption = {
  disabled?: boolean
  label: string
  value: string
}

export function IssuerFilter({ issuerCode, issuers }: IssuerFilterProps) {
  const { updateFilters } = useExploreSearchNavigation()
  const unknownIssuerCode =
    issuerCode && !issuers.some((issuer) => issuer.code === issuerCode)
      ? issuerCode
      : undefined
  const options: Array<IssuerOption> = [
    ...issuers.map((issuer) => ({
      label: issuer.name,
      value: issuer.code,
    })),
    ...(unknownIssuerCode
      ? [
          {
            disabled: true,
            label: `Unknown issuer (${unknownIssuerCode})`,
            value: unknownIssuerCode,
          },
        ]
      : []),
  ]
  return (
    <ExploreFilterCombobox
      id="issuer-filter"
      label="Issuer"
      placeholder="All issuers"
      emptyMessage="No issuers found."
      options={options}
      name="issuer"
      value={issuerCode ?? null}
      onValueChange={(issuer: string | null) => {
        const nextIssuerCode = issuer || undefined

        if (nextIssuerCode === issuerCode) return

        updateFilters({ issuer: nextIssuerCode })
      }}
    />
  )
}
