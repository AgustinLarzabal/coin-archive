import { useNavigate } from "@tanstack/react-router"
import { coinDistributionSchema } from "@workspace/api"
import type { CoinDistribution, CoinListYear } from "@workspace/api"

const DISTRIBUTION_LABELS = {
  "standard-circulation": "Standard circulation",
  "circulating-commemorative": "Circulating commemorative",
  "non-circulating": "Non-circulating",
} satisfies Record<CoinDistribution, string>

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
    <select
      aria-label="Distribution"
      className="h-8 w-full border border-input bg-transparent px-2.5 text-xs md:w-auto"
      value={distribution ?? ""}
      onChange={(event) => {
        const selectedValue = event.target.value
        const nextDistribution = selectedValue
          ? (selectedValue as CoinDistribution)
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
      <option value="">All distributions</option>
      {coinDistributionSchema.options.map((distributionOption) => (
        <option key={distributionOption} value={distributionOption}>
          {DISTRIBUTION_LABELS[distributionOption]}
        </option>
      ))}
    </select>
  )
}
