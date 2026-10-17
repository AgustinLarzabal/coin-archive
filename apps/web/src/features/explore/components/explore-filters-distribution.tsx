import { useNavigate } from "@tanstack/react-router"
import { coinDistributionSchema } from "@workspace/api"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import type { CoinDistribution, CoinListYear } from "@workspace/api"

import { coinDistributionLabels } from "@/features/coin-distribution"

const distributionOptions = coinDistributionSchema.options.map((value) => ({
  label: coinDistributionLabels[value],
  value,
}))
const distributionItems = distributionOptions.map(({ value }) => value)
const getDistributionLabel = (value: string) =>
  distributionOptions.find((option) => option.value === value)?.label ?? value

export function DistributionFilter({
  distribution,
  engraverSlug,
  issuerCode,
  rulerSlug,
  year,
}: {
  distribution?: CoinDistribution
  engraverSlug?: string
  issuerCode?: string
  rulerSlug?: string
  year?: CoinListYear
}) {
  const navigate = useNavigate({ from: "/" })

  return (
    <Combobox
      autoHighlight
      items={distributionItems}
      itemToStringLabel={getDistributionLabel}
      modal={false}
      name="distribution"
      value={distribution ?? null}
      onValueChange={(selectedDistribution: string | null) => {
        const nextDistribution = selectedDistribution
          ? (selectedDistribution as CoinDistribution)
          : undefined
        if (nextDistribution === distribution) return

        void navigate({
          to: "/",
          search: {
            distribution: nextDistribution,
            engraver: engraverSlug,
            issuer: issuerCode,
            ruler: rulerSlug,
            year,
          },
        })
      }}
    >
      <ComboboxInput
        aria-label="Distribution"
        placeholder="All distributions"
        showClear
        className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
      />
      <ComboboxContent>
        <ComboboxEmpty>No distributions found.</ComboboxEmpty>
        <ComboboxList>
          {(value: string) => (
            <ComboboxItem key={value} value={value}>
              {getDistributionLabel(value)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
