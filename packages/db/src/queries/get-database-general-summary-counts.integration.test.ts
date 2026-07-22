import { describe, expect, it } from "vitest"

import { db, getDatabaseGeneralSummaryCounts } from "../index"
import {
  createCatalogue,
  createCoin,
  createComposition,
  createCurrency,
  createDistribution,
  createEdge,
  createEngraver,
  createIssuer,
  createMint,
  createOrientation,
  createRim,
  createRuler,
  createRulerGroup,
  createShape,
  createTheme,
  createTechnique,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getDatabaseGeneralSummaryCounts integration", () => {
  useTestDatabaseIsolation(db)

  it("returns numeric counts for all maintained record types, including unused records", async () => {
    await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const argentineRepublic = await createIssuer({
      code: "argentine-republic",
      name: "Argentine Republic",
      isoCode: "AR",
    })
    const silverComposition = await createComposition({
      code: "silver-900",
      name: "Silver .900",
    })
    const argentinePeso = await createCurrency({
      code: "argentine-peso",
      name: "Peso",
      fullName: "Argentine peso",
    })
    await createCurrency({
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
    await createCurrency({
      code: "euro",
      name: "Euro",
      fullName: "Euro",
    })
    await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    await createEdge({
      code: "reeded",
      name: "Reeded",
    })
    await createEdge({
      code: "plain",
      name: "Plain",
    })
    await createRim({
      code: "raised",
      name: "Raised rim",
    })
    await createRim({
      code: "barred",
      name: "Barred rim",
    })
    await createShape({
      code: "round",
      name: "Round",
    })
    await createShape({
      code: "scalloped",
      name: "Scalloped",
    })
    await createTechnique({
      code: "hammered",
      name: "Hammered",
    })
    await createTechnique({
      code: "machine-struck",
      name: "Machine struck",
    })
    await createEngraver({
      code: "barth",
      name: "Barth",
    })
    await createEngraver({
      code: "durand",
      name: "Durand",
    })
    await createTheme({
      code: "map",
      name: "Map",
    })
    await createTheme({
      code: "portrait",
      name: "Portrait",
    })
    await createIssuer({
      code: "united-states",
      name: "United States",
      isoCode: "US",
    })
    await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    await createRulerGroup({
      code: "julio-claudians",
      name: "Julio-Claudians",
    })
    await createRuler({
      code: "felipe-v",
      name: "Felipe V",
    })
    await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
    })
    await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    await createOrientation({
      code: "medal-alignment",
      name: "Medal alignment",
    })
    await createMint({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
    await createCoin({
      title: "Argentine Test Coin",
      issuerId: argentineRepublic.id,
      compositionId: silverComposition.id,
      currencyId: argentinePeso.id,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })

    await expect(getDatabaseGeneralSummaryCounts()).resolves.toStrictEqual({
      coins: 1,
      catalogues: 2,
      compositions: 1,
      currencies: 3,
      distributions: 1,
      edges: 2,
      rims: 2,
      shapes: 2,
      mintingTechniques: 2,
      engravers: 2,
      themes: 2,
      issuers: 2,
      rulers: 2,
      rulerGroups: 2,
      orientations: 2,
      mints: 1,
    })
  })

  it("keeps stable zero-valued rows when a maintained record type is empty", async () => {
    await expect(getDatabaseGeneralSummaryCounts()).resolves.toStrictEqual({
      coins: 0,
      catalogues: 0,
      compositions: 0,
      currencies: 0,
      distributions: 0,
      edges: 0,
      rims: 0,
      shapes: 0,
      mintingTechniques: 0,
      engravers: 0,
      themes: 0,
      issuers: 0,
      rulers: 0,
      rulerGroups: 0,
      orientations: 0,
      mints: 0,
    })
  })
})
