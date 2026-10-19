import type { CoinDistribution } from "@coin-archive/api"

export const coinDistributionLabels = {
  "standard-circulation": "Standard circulation",
  "circulating-commemorative": "Circulating commemorative",
  "non-circulating": "Non-circulating",
} satisfies Record<CoinDistribution, string>
