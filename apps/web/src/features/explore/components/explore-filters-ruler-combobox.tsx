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
  CoinListYear,
  RulingAuthorityListItemResponse,
} from "@workspace/api"

type RulerOption = {
  disabled?: boolean
  label: string
  value: string
}

export function RulerCombobox({
  engraverSlug,
  issuerCode,
  rulerSlug,
  rulers,
  year,
}: {
  engraverSlug?: string
  issuerCode?: string
  rulerSlug?: string
  rulers: Array<RulingAuthorityListItemResponse>
  year?: CoinListYear
}) {
  const navigate = useNavigate({ from: "/" })
  const missingSlug =
    rulerSlug && !rulers.some((ruler) => ruler.slug === rulerSlug)
      ? rulerSlug
      : undefined
  const nameCounts = new Map<string, number>()
  for (const ruler of rulers) {
    nameCounts.set(ruler.name, (nameCounts.get(ruler.name) ?? 0) + 1)
  }
  const options: Array<RulerOption> = [
    ...rulers.map((ruler) => ({
      label:
        nameCounts.get(ruler.name) === 1
          ? ruler.name
          : `${ruler.name} (${ruler.slug})`,
      value: ruler.slug,
    })),
    ...(missingSlug
      ? [
          {
            disabled: true,
            label: `Ruler / Period not found (${missingSlug})`,
            value: missingSlug,
          },
        ]
      : []),
  ]
  const items = options.map(({ value }) => value)
  const getLabel = (slug: string) =>
    options.find(({ value }) => value === slug)?.label ?? slug

  return (
    <Combobox
      autoHighlight
      items={items}
      itemToStringLabel={getLabel}
      modal={false}
      name="ruler"
      value={rulerSlug ?? null}
      onValueChange={(ruler: string | null) => {
        const nextRulerSlug = ruler || undefined
        if (nextRulerSlug === rulerSlug) return
        void navigate({
          to: "/",
          search: {
            engraver: engraverSlug,
            issuer: issuerCode,
            ruler: nextRulerSlug,
            year,
          },
        })
      }}
    >
      <ComboboxInput
        aria-label="Ruler / Period"
        placeholder="All rulers / periods"
        showClear
        className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
      />
      <ComboboxContent>
        <ComboboxEmpty>No rulers / periods found.</ComboboxEmpty>
        <ComboboxList>
          {(slug: string) => {
            const option = options.find(({ value }) => value === slug)
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
