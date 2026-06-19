import type { SeededComposition } from "./types"

export const seededCompositions: SeededComposition[] = [
  {
    code: "silver-900",
    name: "Silver (.900)",
    description: "Ninety percent silver alloy.",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "copper",
    name: "Copper",
    description: null,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "copper-nickel",
    name: "Copper-nickel",
    description: null,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "copper-nickel-clad",
    name: "Copper-nickel clad",
    description: "Copper core with copper-nickel outer layers.",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    code: "bimetallic",
    name: "Copper-Aluminium-Zinc",
    description: "Ring: 75% Cu, 25% Ni. Core: 75% Cu, 20% Zn, 5% Ni",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
]
