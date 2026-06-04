import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { CoinRecord } from "@workspace/db"
import { CoinList } from "./coin-list"

const createdAt = new Date("2026-06-04T12:00:00.000Z")
const catalogueCreatedAt = new Date("2026-05-04T12:00:00.000Z")

type CoinOverrides = Partial<
  Omit<CoinRecord, "issuer" | "references" | "rulers">
> & {
  issuer?: CoinRecord["issuer"]
  references?: CoinRecord["references"]
  rulers?: CoinRecord["rulers"]
}

function buildCoin(overrides: CoinOverrides = {}): CoinRecord {
  return {
    id: "coin-1",
    title: "Seed Coin 06",
    createdAt,
    updatedAt: createdAt,
    issuer: {
      id: "issuer-1",
      code: "spain",
      name: "Spain",
      createdAt,
      updatedAt: createdAt,
      parent: null,
    },
    rulers: [],
    references: [],
    ...overrides,
  }
}

describe("CoinList", () => {
  it("renders structured catalogue references instead of a raw JSON blob", () => {
    const markup = renderToStaticMarkup(
      <CoinList
        coins={[
          buildCoin({
            references: [
              {
                id: "reference-1",
                type: "catalogue",
                number: "1338A",
                createdAt,
                updatedAt: createdAt,
                catalogue: {
                  id: "catalogue-1",
                  code: "KM",
                  title: "Standard Catalog of World Coins",
                  createdAt: catalogueCreatedAt,
                  updatedAt: catalogueCreatedAt,
                },
              },
            ],
          }),
          buildCoin({
            id: "coin-2",
            title: "Unreferenced Coin",
          }),
        ]}
      />
    )

    expect(markup).toContain("Catalogue references")
    expect(markup).toContain("KM 1338A")
    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain("No catalogue references")
    expect(markup).not.toContain("{&quot;")
  })
})
