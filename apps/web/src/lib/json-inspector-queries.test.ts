import type { CoinRecord, IssuerOption } from "@workspace/db"
import { describe, expect, it } from "vitest"
import { buildJsonInspectorQueries } from "./json-inspector-queries"

const timestamp = new Date("2026-06-11T00:00:00.000Z")

const coin: CoinRecord = {
  id: "coin-1",
  title: "Spanish Test Coin",
  createdAt: timestamp,
  updatedAt: timestamp,
  comments: null,
  isDemonetized: null,
  mintage: null,
  issueYearRange: null,
  faceValue: {
    text: "1 Euro",
    numericValue: 1,
    currency: {
      id: "currency-1",
      code: "euro",
      name: "Euro",
      fullName: "Euro (2002-date)",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  orientation: null,
  edge: null,
  shape: null,
  rim: null,
  technique: null,
  obverse: null,
  reverse: null,
  measurements: {
    weight: null,
    diameter: null,
    thickness: null,
  },
  composition: {
    id: "composition-1",
    code: "silver-900",
    name: "Silver (.900)",
    description: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  distribution: {
    id: "distribution-1",
    code: "standard-circulation",
    name: "Standard circulation",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  issuer: {
    id: "issuer-1",
    code: "spain",
    isoCode: "ES",
    name: "Spain",
    createdAt: timestamp,
    updatedAt: timestamp,
    parent: {
      id: "issuer-parent-1",
      code: "iberia",
      isoCode: "ES",
      name: "Iberia",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  mints: [],
  references: [],
  rulers: [],
  themes: [],
}

const issuerOption: IssuerOption = {
  code: "spain",
  isoCode: "ES",
  name: "Spain",
}

describe("buildJsonInspectorQueries", () => {
  it("preserves issuer ISO Codes in coin and issuer debug output", () => {
    const queries = buildJsonInspectorQueries({
      coins: [coin],
      issuers: [issuerOption],
      rulers: [],
      catalogues: [],
      compositions: [],
      currencies: [],
      distributions: [],
      edges: [],
      engravers: [],
      mints: [],
      orientations: [],
      rims: [],
      shapes: [],
      techniques: [],
      themes: [],
    })

    expect(queries.coins[0]?.issuer.isoCode).toBe("ES")
    expect(queries.coins[0]?.issuer.parent?.isoCode).toBe("ES")
    expect(queries.issuers[0]?.isoCode).toBe("ES")
  })
})
