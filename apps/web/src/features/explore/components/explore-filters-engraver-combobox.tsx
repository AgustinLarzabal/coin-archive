import { useNavigate } from "@tanstack/react-router"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

import type {
  CoinDistribution,
  CoinListYear,
  EngraverListItemResponse,
} from "@workspace/api"

type EngraverComboboxProps = {
  distribution?: CoinDistribution
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
  issuerCode?: string
  rulerSlug?: string
  year?: CoinListYear
}

type EngraverOption = {
  disabled?: boolean
  label: string
  value: string
}

export function EngraverCombobox({
  distribution,
  engraverSlug,
  engravers,
  issuerCode,
  rulerSlug,
  year,
}: EngraverComboboxProps) {
  const navigate = useNavigate({ from: "/" })
  const unknownEngraverSlug =
    engraverSlug &&
    !engravers.some((engraver) => engraver.slug === engraverSlug)
      ? engraverSlug
      : undefined
  const options: Array<EngraverOption> = [
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
  ]
  const items = options.map((option) => option.value)
  const getEngraverLabel = (slug: string) =>
    options.find((option) => option.value === slug)?.label ?? slug

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

        void navigate({
          to: "/",
          search: {
            distribution,
            engraver: nextEngraverSlug,
            issuer: issuerCode,
            ruler: rulerSlug,
            year,
          },
        })
      }}
    >
      <ComboboxInput
        aria-label="Engraver"
        placeholder="All engravers"
        showClear
        className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
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
