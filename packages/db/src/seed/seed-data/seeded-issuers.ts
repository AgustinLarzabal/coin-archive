import type { SeededIssuer } from "./types"

export const seededIssuers: SeededIssuer[] = [
  {
    code: "argentina",
    name: "Argentina",
    isoCode: "AR",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "buenos-aires",
    name: "Buenos Aires",
    isoCode: "AR",
    parentCode: "argentina",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "united-states",
    name: "United States of America",
    isoCode: "US",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "spain",
    name: "Spain",
    isoCode: "ES",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    code: "finland",
    name: "Finland",
    isoCode: "FI",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
]
