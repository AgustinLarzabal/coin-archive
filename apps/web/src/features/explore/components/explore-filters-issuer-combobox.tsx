import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

import type { IssuerResponse } from "@workspace/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

type IssuerComboboxProps = {
  issuerCode?: string
  issuers: Array<IssuerResponse>
}

type IssuerOption = {
  disabled?: boolean
  label: string
  value: string
}

export function IssuerCombobox({ issuerCode, issuers }: IssuerComboboxProps) {
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
  const items = options.map((option) => option.value)
  const getIssuerLabel = (code: string) =>
    options.find((option) => option.value === code)?.label ?? code

  return (
    <Combobox
      autoHighlight
      items={items}
      itemToStringLabel={getIssuerLabel}
      modal={false}
      name="issuer"
      value={issuerCode ?? null}
      onValueChange={(issuer: string | null) => {
        const nextIssuerCode = issuer || undefined

        if (nextIssuerCode === issuerCode) return

        updateFilters({ issuer: nextIssuerCode })
      }}
    >
      <ComboboxInput
        id="issuer-filter"
        aria-label="Issuer"
        placeholder="All issuers"
        showClear
        className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
      />
      <ComboboxContent>
        <ComboboxEmpty>No issuers found.</ComboboxEmpty>
        <ComboboxList>
          {(code: string) => {
            const option = options.find((item) => item.value === code)

            return (
              <ComboboxItem key={code} value={code} disabled={option?.disabled}>
                {option?.label}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
