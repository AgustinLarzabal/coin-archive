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
] as const

export const databaseSecondaryMenuItems = [
  { to: "/database", label: "General" },
  ...databaseMaintenanceSections.map(({ to, label }) => ({ to, label })),
] as const
