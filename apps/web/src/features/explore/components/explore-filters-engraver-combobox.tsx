import { useNavigate } from "@tanstack/react-router"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import { useCallback, useMemo } from "react"

import { exploreFilterControlClassName } from "./explore-filter-styles"
import type { EngraverListItemResponse } from "@workspace/api"

type EngraverComboboxProps = {
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
}

type EngraverOption = {
  disabled?: boolean
  label: string
  value: string
}

export function EngraverCombobox({
  engraverSlug,
  engravers,
  issuerCode,
}: EngraverComboboxProps) {
  const navigate = useNavigate({ from: "/" })
  const unknownEngraverSlug =
    engraverSlug &&
    !engravers.some((engraver) => engraver.slug === engraverSlug)
      ? engraverSlug
      : undefined
  const options = useMemo<Array<EngraverOption>>(
    () => [
      ...engravers.map((engraver) => ({
        label: engraver.fullName,
        value: engraver.slug,
      })),
      ...(unknownEngraverSlug
        ? [
            {
              disabled: true,
              label: `Unknown engraver (${unknownEngraverSlug})`,
              value: unknownEngraverSlug,
            },
          ]
        : []),
    ],
    [engravers, unknownEngraverSlug]
  )
  const items = useMemo(() => options.map((option) => option.value), [options])
  const getEngraverLabel = useCallback(
    (slug: string) =>
      options.find((option) => option.value === slug)?.label ?? slug,
    [options]
  )

  return (
    <Combobox
      autoHighlight
      items={items}
      itemToStringLabel={getEngraverLabel}
      modal={false}
      value={engraverSlug ?? null}
      onValueChange={(engraver: string | null) => {
        const nextEngraverSlug = engraver || undefined

        if (nextEngraverSlug === engraverSlug) return

        // Let Base UI finish the interaction before URL state rerenders the root.
        setTimeout(() => {
          void navigate({
            to: "/",
            search: {
              engraver: nextEngraverSlug,
              issuer: issuerCode,
            },
          })
        }, 0)
      }}
    >
      <ComboboxInput
        aria-label="Engraver"
        placeholder="All engravers"
        showClear
        className={exploreFilterControlClassName}
      />
      <ComboboxContent>
        <ComboboxEmpty>No engravers found.</ComboboxEmpty>
        <ComboboxList>
          {(slug: string) => {
            const option = options.find((item) => item.value === slug)

            return (
              <ComboboxItem key={slug} value={slug} disabled={option?.disabled}>
                {option?.label}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
