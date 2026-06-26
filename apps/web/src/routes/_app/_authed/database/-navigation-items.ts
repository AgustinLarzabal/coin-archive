import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

type DatabaseMaintenanceSection = {
  to: string
  label: string
  countKey: keyof DatabaseGeneralSummaryCounts
}

const databaseGeneralMenuItem = {
  to: "/database",
  label: "General",
} as const

export const databaseMaintenanceSections = [
  {
    to: "/database/catalogues",
    label: "Catalogues",
    countKey: "catalogues",
  },
  {
    to: "/database/compositions",
    label: "Compositions",
    countKey: "compositions",
  },
  {
    to: "/database/currencies",
    label: "Currencies",
    countKey: "currencies",
  },
  {
    to: "/database/distributions",
    label: "Distributions",
    countKey: "distributions",
  },
] as const satisfies readonly DatabaseMaintenanceSection[]

const [
  cataloguesSection,
  compositionsSection,
  currenciesSection,
  distributionsSection,
] = databaseMaintenanceSections

export const databaseSecondaryMenuItems = [
  databaseGeneralMenuItem,
  { to: cataloguesSection.to, label: cataloguesSection.label },
  { to: compositionsSection.to, label: compositionsSection.label },
  { to: currenciesSection.to, label: currenciesSection.label },
  { to: distributionsSection.to, label: distributionsSection.label },
] as const
