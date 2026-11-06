import { isIsoIssuerCode, issuerCodeSchema } from "@coin-archive/api"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { GlobeIcon } from "@phosphor-icons/react"
import type { ExploreFilterDefinition } from "../explore-filter-definitions"

export const issuerFilterDefinition = {
  id: "issuer",
  label: "Issuer",
  icon: <GlobeIcon />,
  schema: issuerCodeSchema,
  options: ({ issuers }) =>
    issuers.map((issuer) => ({
      label: issuer.name,
      value: issuer.code,
      icon: isIsoIssuerCode(issuer.code) ? (
        <Flag code={issuer.code} width={16} decorative />
      ) : undefined,
    })),
} satisfies ExploreFilterDefinition
