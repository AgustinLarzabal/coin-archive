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
  {
    to: "/database/edges",
    label: "Edges",
    countKey: "edges",
  },
  {
    to: "/database/rims",
    label: "Rims",
    countKey: "rims",
  },
  {
    to: "/database/engravers",
    label: "Engravers",
    countKey: "engravers",
  },
  {
    to: "/database/issuers",
    label: "Issuers",
    countKey: "issuers",
  },
  {
    to: "/database/orientations",
    label: "Orientations",
    countKey: "orientations",
  },
  {
    to: "/database/mints",
    label: "Mints",
    countKey: "mints",
  },
] as const satisfies readonly DatabaseMaintenanceSection[]

export const databaseSecondaryMenuItems = [
  databaseGeneralMenuItem,
  ...databaseMaintenanceSections.map(({ to, label }) => ({ to, label })),
] as const
