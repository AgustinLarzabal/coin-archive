import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

import type { EngraverListItemResponse } from "@workspace/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

type EngraverComboboxProps = {
  engraverSlug?: string
  engravers: Array<EngraverListItemResponse>
}

type EngraverOption = {
  disabled?: boolean
  label: string
  value: string
}

export function EngraverCombobox({
  engraverSlug,
  engravers,
}: EngraverComboboxProps) {
  const { updateFilters } = useExploreSearchNavigation()
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

        updateFilters({ engraver: nextEngraverSlug })
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
