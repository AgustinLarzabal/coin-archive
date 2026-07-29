import type { DatabaseGeneralSummaryCounts } from "@coin-archive/db"

type DatabaseMaintenanceSection = {
  to: string
  label: string
  countKey: keyof DatabaseGeneralSummaryCounts
}

type DatabaseSecondaryMenuItem = Pick<
  DatabaseMaintenanceSection,
  "to" | "label"
>

export const databaseMaintenanceSections = [
  {
    to: "/database/coins",
    label: "Coins",
    countKey: "coins",
  },
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
    to: "/database/shapes",
    label: "Shapes",
    countKey: "shapes",
  },
  {
    to: "/database/minting-techniques",
    label: "Minting Techniques",
    countKey: "mintingTechniques",
  },
  {
    to: "/database/engravers",
    label: "Engravers",
    countKey: "engravers",
  },
  {
    to: "/database/themes",
    label: "Themes",
    countKey: "themes",
  },
  {
    to: "/database/issuers",
    label: "Issuers",
    countKey: "issuers",
  },
  {
    to: "/database/rulers",
    label: "Rulers",
    countKey: "rulers",
  },
  {
    to: "/database/ruler-groups",
    label: "Ruler Groups",
    countKey: "rulerGroups",
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
  {
    to: "/database",
    label: "Overview",
  },
  ...databaseMaintenanceSections.map(({ to, label }) => ({ to, label })),
] as const satisfies readonly DatabaseSecondaryMenuItem[]
