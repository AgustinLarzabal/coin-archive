import { and, asc, eq, sql } from "drizzle-orm"
import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { composition } from "../schema/composition"
import { coinReference } from "../schema/coin-reference"
import { coinMint } from "../schema/coin-mint"
import { coinRuler } from "../schema/coin-ruler"
import { coinSurface } from "../schema/coin-surface"
import type { CoinSurfaceKind } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { coinTheme } from "../schema/coin-theme"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"
import { ruler } from "../schema/ruler"
import { shape } from "../schema/shape"
import { technique } from "../schema/technique"
import { theme } from "../schema/theme"
import type { CoinCompositionRecord } from "./coin-composition-record"
import type { CoinDistributionRecord } from "./coin-distribution-record"
import type { CoinEdgeRecord } from "./coin-edge-record"
import type { CoinFaceValueRecord } from "./coin-face-value-record"
import type { CoinIssuer } from "./coin-issuer-record"
import type { CoinMintRecord } from "./coin-mint-record"
import type { CoinOrientationRecord } from "./coin-orientation-record"
import type { CoinReferenceRecord } from "./coin-reference-record"
import type { CoinRimRecord } from "./coin-rim-record"
import type { CoinRulerRecord } from "./coin-ruler-record"
import type { CoinShapeRecord } from "./coin-shape-record"
import type {
  CoinFaceEngraverRecord,
  CoinFaceSurfaceRecord,
  CoinSurfaceSetRecord,
} from "./coin-surface-record"
import type { CoinTechniqueRecord } from "./coin-technique-record"
import type { CoinThemeRecord } from "./coin-theme-record"

export type CoinDetailRecord = {
  id: string
  title: string
  comments: string | null
  composition: CoinCompositionRecord
  compositionDescription: string | null
  diameter: number | null
  distribution: CoinDistributionRecord
  edge: CoinEdgeRecord | null
  faceValue: CoinFaceValueRecord
  isDemonetized: boolean | null
  issuer: CoinIssuer
  maxYear: number | null
  mintage: number | null
  mints: CoinMintRecord[]
  minYear: number | null
  orientation: CoinOrientationRecord | null
  references: CoinReferenceRecord[]
  rim: CoinRimRecord | null
  rulers: CoinRulerRecord[]
  shape: CoinShapeRecord | null
  surfaces: CoinSurfaceSetRecord
  technique: CoinTechniqueRecord | null
  themes: CoinThemeRecord[]
  thickness: number | null
  weight: number | null
}

export type PublicCoinDetailRecord = Omit<
  CoinDetailRecord,
  "diameter" | "faceValue" | "mintage" | "thickness" | "weight"
> & {
  diameter: string | null
  faceValue: Omit<CoinDetailRecord["faceValue"], "numericValue"> & {
    numericValue: string
  }
  mintage: string | null
  thickness: string | null
  weight: string | null
}

type GetCoinBaseRow = {
  id: string
  title: string
  comments: string | null
  compositionCode: string
  compositionDescription: string | null
  compositionName: string
  diameter: number | null
  distributionCode: string
  distributionName: string
  edgeCode: string | null
  edgeName: string | null
  faceValueCurrencyCode: string
  faceValueCurrencyFullName: string
  faceValueCurrencyName: string
  faceValueNumericValue: number
  faceValueText: string
  isDemonetized: boolean | null
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
  maxYear: number | null
  mintage: number | null
  minYear: number | null
  orientationCode: string | null
  orientationName: string | null
  rimCode: string | null
  rimName: string | null
  shapeCode: string | null
  shapeName: string | null
  techniqueCode: string | null
  techniqueName: string | null
  thickness: number | null
  weight: number | null
}

type GetCoinMintRow = {
  mintId: string
  mintCode: string
  mintName: string
}

type GetCoinReferenceRow = {
  referenceId: string
  referenceNumber: string
  referenceCatalogueCode: string
  referenceCatalogueTitle: string
}

type GetCoinRulerRow = {
  rulerId: string
  rulerCode: string
  rulerName: string
  rulerOrder: number
}

type GetCoinSurfaceRow = {
  surfaceKind: CoinSurfaceKind
  surfaceDescription: string | null
  surfaceLettering: string | null
  surfaceImageUrl: string | null
  engraverCode: string | null
  engraverName: string | null
}

type GetCoinThemeRow = {
  themeId: string
  themeCode: string
  themeName: string
}

function mapDistribution(row: GetCoinBaseRow): CoinDistributionRecord {
  return {
    code: row.distributionCode,
    name: row.distributionName,
  }
}

function mapComposition(row: GetCoinBaseRow): CoinCompositionRecord {
  return {
    code: row.compositionCode,
    name: row.compositionName,
  }
}

function mapFaceValue(row: GetCoinBaseRow): CoinFaceValueRecord {
  return {
    text: row.faceValueText,
    numericValue: row.faceValueNumericValue,
    currency: {
      code: row.faceValueCurrencyCode,
      name: row.faceValueCurrencyName,
      fullName: row.faceValueCurrencyFullName,
    },
  }
}

function mapEdge(row: GetCoinBaseRow): CoinEdgeRecord | null {
  if (row.edgeCode === null || row.edgeName === null) {
    return null
  }

  return {
    code: row.edgeCode,
    name: row.edgeName,
  }
}

function mapIssuer(row: GetCoinBaseRow): CoinIssuer {
  return {
    code: row.issuerCode,
    isoCode: row.issuerIsoCode,
    name: row.issuerName,
    parent: null,
  }
}

function mapOrientation(row: GetCoinBaseRow): CoinOrientationRecord | null {
  if (row.orientationCode === null || row.orientationName === null) {
    return null
  }

  return {
    code: row.orientationCode,
    name: row.orientationName,
  }
}

function mapRim(row: GetCoinBaseRow): CoinRimRecord | null {
  if (row.rimCode === null || row.rimName === null) {
    return null
  }

  return {
    code: row.rimCode,
    name: row.rimName,
  }
}

function mapShape(row: GetCoinBaseRow): CoinShapeRecord | null {
  if (row.shapeCode === null || row.shapeName === null) {
    return null
  }

  return {
    code: row.shapeCode,
    name: row.shapeName,
  }
}

function mapTechnique(row: GetCoinBaseRow): CoinTechniqueRecord | null {
  if (row.techniqueCode === null || row.techniqueName === null) {
    return null
  }

  return {
    code: row.techniqueCode,
    name: row.techniqueName,
  }
}

function mapMints(rows: GetCoinMintRow[]): CoinMintRecord[] {
  return rows
    .map(({ mintId, mintCode, mintName }) => ({
      id: mintId,
      code: mintCode,
      name: mintName,
    }))
    .sort((left, right) => {
      const nameComparison = left.name.localeCompare(right.name)

      if (nameComparison !== 0) {
        return nameComparison
      }

      const codeComparison = left.code.localeCompare(right.code)

      if (codeComparison !== 0) {
        return codeComparison
      }

      return left.id.localeCompare(right.id)
    })
    .map(({ code, name }) => ({ code, name }))
}

function mapReferences(rows: GetCoinReferenceRow[]): CoinReferenceRecord[] {
  return rows
    .map((row) => ({
      catalogue: {
        code: row.referenceCatalogueCode,
        title: row.referenceCatalogueTitle,
      },
      number: row.referenceNumber,
    }))
    .sort((left, right) => {
      const titleComparison = left.catalogue.title.localeCompare(
        right.catalogue.title
      )

      if (titleComparison !== 0) {
        return titleComparison
      }

      const codeComparison = left.catalogue.code.localeCompare(
        right.catalogue.code
      )

      if (codeComparison !== 0) {
        return codeComparison
      }

      return left.number.localeCompare(right.number)
    })
}

function mapRulers(rows: GetCoinRulerRow[]): CoinRulerRecord[] {
  return rows
    .map((row) => ({
      code: row.rulerCode,
      name: row.rulerName,
      order: row.rulerOrder,
    }))
    .sort((left, right) => {
      const orderComparison = left.order - right.order

      if (orderComparison !== 0) {
        return orderComparison
      }

      const nameComparison = left.name.localeCompare(right.name)

      if (nameComparison !== 0) {
        return nameComparison
      }

      return left.code.localeCompare(right.code)
    })
    .map(({ code, name }) => ({ code, name }))
}

function mapEngraver(row: GetCoinSurfaceRow): CoinFaceEngraverRecord | null {
  if (row.engraverCode === null || row.engraverName === null) {
    return null
  }

  return {
    code: row.engraverCode,
    name: row.engraverName,
  }
}

function mapSurfaces(rows: GetCoinSurfaceRow[]): CoinSurfaceSetRecord {
  const surfaces: CoinSurfaceSetRecord = {
    obverse: null,
    reverse: null,
    edge: null,
  }

  for (const row of rows) {
    const surface = {
      description: row.surfaceDescription,
      lettering: row.surfaceLettering,
      imageUrl: row.surfaceImageUrl,
    }

    if (row.surfaceKind === "edge-surface") {
      surfaces.edge = surface
      continue
    }

    const existingSurface = surfaces[row.surfaceKind]
    const nextSurface =
      existingSurface ??
      ({
        ...surface,
        engravers: [],
      } satisfies CoinFaceSurfaceRecord)

    const mappedEngraver = mapEngraver(row)

    if (
      mappedEngraver !== null &&
      !nextSurface.engravers.some(
        (engraver) => engraver.code === mappedEngraver.code
      )
    ) {
      nextSurface.engravers.push(mappedEngraver)
    }

    surfaces[row.surfaceKind] = nextSurface
  }

  for (const key of ["obverse", "reverse"] as const) {
    const surface = surfaces[key]

    if (surface !== null) {
      surface.engravers.sort((left, right) => {
        const nameComparison = left.name.localeCompare(right.name)

        if (nameComparison !== 0) {
          return nameComparison
        }

        return left.code.localeCompare(right.code)
      })
    }
  }

  return surfaces
}

function mapThemes(rows: GetCoinThemeRow[]): CoinThemeRecord[] {
  return rows
    .map((row) => ({
      id: row.themeId,
      code: row.themeCode,
      name: row.themeName,
    }))
    .sort((left, right) => {
      const nameComparison = left.name.localeCompare(right.name)

      if (nameComparison !== 0) {
        return nameComparison
      }

      const codeComparison = left.code.localeCompare(right.code)

      if (codeComparison !== 0) {
        return codeComparison
      }

      return left.id.localeCompare(right.id)
    })
    .map(({ code, name }) => ({ code, name }))
}

function mapCoinDetail(
  row: GetCoinBaseRow,
  detailRows: {
    mints: GetCoinMintRow[]
    references: GetCoinReferenceRow[]
    rulers: GetCoinRulerRow[]
    surfaces: GetCoinSurfaceRow[]
    themes: GetCoinThemeRow[]
  }
): CoinDetailRecord {
  return {
    id: row.id,
    title: row.title,
    comments: row.comments,
    composition: mapComposition(row),
    compositionDescription: row.compositionDescription,
    diameter: row.diameter,
    distribution: mapDistribution(row),
    edge: mapEdge(row),
    faceValue: mapFaceValue(row),
    isDemonetized: row.isDemonetized,
    issuer: mapIssuer(row),
    maxYear: row.maxYear,
    mintage: row.mintage,
    mints: mapMints(detailRows.mints),
    minYear: row.minYear,
    orientation: mapOrientation(row),
    references: mapReferences(detailRows.references),
    rim: mapRim(row),
    rulers: mapRulers(detailRows.rulers),
    shape: mapShape(row),
    surfaces: mapSurfaces(detailRows.surfaces),
    technique: mapTechnique(row),
    themes: mapThemes(detailRows.themes),
    thickness: row.thickness,
    weight: row.weight,
  }
}

export function buildGetCoinQuery(database: typeof db, coinId: string) {
  return database
    .select({
      id: coin.id,
      title: coin.title,
      comments: coin.comments,
      compositionCode: composition.code,
      compositionDescription: coin.compositionDescription,
      compositionName: composition.name,
      diameter: sql<number | null>`${coin.diameter}::double precision`,
      distributionCode: distribution.code,
      distributionName: distribution.name,
      edgeCode: edge.code,
      edgeName: edge.name,
      faceValueCurrencyCode: currency.code,
      faceValueCurrencyFullName: currency.fullName,
      faceValueCurrencyName: currency.name,
      faceValueNumericValue: sql<number>`${coin.faceValueNumericValue}::double precision`,
      faceValueText: coin.faceValueText,
      isDemonetized: coin.isDemonetized,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
      maxYear: coin.maxYear,
      mintage: coin.mintage,
      minYear: coin.minYear,
      orientationCode: orientation.code,
      orientationName: orientation.name,
      rimCode: rim.code,
      rimName: rim.name,
      shapeCode: shape.code,
      shapeName: shape.name,
      techniqueCode: technique.code,
      techniqueName: technique.name,
      thickness: sql<number | null>`${coin.thickness}::double precision`,
      weight: sql<number | null>`${coin.weight}::double precision`,
    })
    .from(coin)
    .innerJoin(composition, eq(coin.compositionId, composition.id))
    .innerJoin(currency, eq(coin.currencyId, currency.id))
    .innerJoin(distribution, eq(coin.distributionId, distribution.id))
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(edge, eq(coin.edgeId, edge.id))
    .leftJoin(orientation, eq(coin.orientationId, orientation.id))
    .leftJoin(rim, eq(coin.rimId, rim.id))
    .leftJoin(shape, eq(coin.shapeId, shape.id))
    .leftJoin(technique, eq(coin.techniqueId, technique.id))
    .where(eq(coin.id, coinId))
}

function buildGetCoinMintsQuery(database: typeof db, coinId: string) {
  return database
    .select({
      mintId: mint.id,
      mintCode: mint.code,
      mintName: mint.name,
    })
    .from(coinMint)
    .innerJoin(mint, eq(coinMint.mintId, mint.id))
    .where(eq(coinMint.coinId, coinId))
}

function buildGetCoinReferencesQuery(database: typeof db, coinId: string) {
  return database
    .select({
      referenceId: coinReference.id,
      referenceNumber: coinReference.number,
      referenceCatalogueCode: catalogue.code,
      referenceCatalogueTitle: catalogue.title,
    })
    .from(coinReference)
    .innerJoin(catalogue, eq(coinReference.catalogueId, catalogue.id))
    .where(eq(coinReference.coinId, coinId))
}

function buildGetCoinRulersQuery(database: typeof db, coinId: string) {
  return database
    .select({
      rulerId: ruler.id,
      rulerCode: ruler.code,
      rulerName: ruler.name,
      rulerOrder: coinRuler.rulerOrder,
    })
    .from(coinRuler)
    .innerJoin(ruler, eq(coinRuler.rulerId, ruler.id))
    .where(eq(coinRuler.coinId, coinId))
}

function buildGetCoinThemesQuery(database: typeof db, coinId: string) {
  return database
    .select({
      themeId: theme.id,
      themeCode: theme.code,
      themeName: theme.name,
    })
    .from(coinTheme)
    .innerJoin(theme, eq(coinTheme.themeId, theme.id))
    .where(eq(coinTheme.coinId, coinId))
}

function buildGetCoinSurfacesQuery(database: typeof db, coinId: string) {
  return database
    .select({
      surfaceKind: coinSurface.kind,
      surfaceDescription: coinSurface.description,
      surfaceLettering: coinSurface.lettering,
      surfaceImageUrl: coinSurface.imageUrl,
      engraverCode: engraver.code,
      engraverName: engraver.name,
    })
    .from(coinSurface)
    .leftJoin(
      coinSurfaceEngraver,
      and(
        eq(coinSurfaceEngraver.coinSurfaceId, coinSurface.id),
        eq(coinSurfaceEngraver.coinSurfaceKind, coinSurface.kind)
      )
    )
    .leftJoin(engraver, eq(coinSurfaceEngraver.engraverId, engraver.id))
    .where(eq(coinSurface.coinId, coinId))
    .orderBy(asc(coinSurface.kind), asc(engraver.name), asc(engraver.code))
}

export async function getCoin(
  coinId: string
): Promise<CoinDetailRecord | null> {
  return getCoinWithDatabase(db, coinId)
}

export async function getCoinWithDatabase(
  database: typeof db,
  coinId: string
): Promise<CoinDetailRecord | null> {
  const rows = await buildGetCoinQuery(database, coinId)
  const row = rows.at(0)

  if (!row) {
    return null
  }

  const [mints, references, rulers, surfaces, themes] = await Promise.all([
    buildGetCoinMintsQuery(database, coinId),
    buildGetCoinReferencesQuery(database, coinId),
    buildGetCoinRulersQuery(database, coinId),
    buildGetCoinSurfacesQuery(database, coinId),
    buildGetCoinThemesQuery(database, coinId),
  ])

  return mapCoinDetail(row, {
    mints,
    references,
    rulers,
    surfaces,
    themes,
  })
}

export async function getPublicCoinWithDatabase(
  database: typeof db,
  coinId: string
): Promise<PublicCoinDetailRecord | null> {
  const detail = await getCoinWithDatabase(database, coinId)
  if (detail === null) return null

  const values = await database
    .select({
      diameter: sql<string | null>`${coin.diameter}::text`,
      faceValueNumericValue: sql<string>`${coin.faceValueNumericValue}::text`,
      mintage: sql<string | null>`${coin.mintage}::text`,
      thickness: sql<string | null>`${coin.thickness}::text`,
      weight: sql<string | null>`${coin.weight}::text`,
    })
    .from(coin)
    .where(eq(coin.id, coinId))
  const decimals = values.at(0)
  if (decimals === undefined) return null

  return {
    ...detail,
    diameter: decimals.diameter,
    faceValue: {
      ...detail.faceValue,
      numericValue: decimals.faceValueNumericValue,
    },
    mintage: decimals.mintage,
    thickness: decimals.thickness,
    weight: decimals.weight,
  }
}
