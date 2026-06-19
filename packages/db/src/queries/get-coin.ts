import { and, eq } from "drizzle-orm"
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
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { ruler } from "../schema/ruler"
import { shape } from "../schema/shape"
import { technique } from "../schema/technique"
import type { CoinDistributionRecord } from "./coin-distribution-record"
import type { CoinIssuer } from "./coin-issuer-record"
import type { CoinOrientationRecord } from "./coin-orientation-record"
import type { CoinReferenceRecord } from "./coin-reference-record"
import type { CoinRulerRecord } from "./coin-ruler-record"
import type {
  CoinFaceEngraverRecord,
  CoinFaceSurfaceRecord,
  CoinSurfaceSetRecord,
} from "./coin-surface-record"
import { distribution } from "../schema/distribution"
import type { CoinShapeRecord } from "./coin-shape-record"
import type { CoinTechniqueRecord } from "./coin-technique-record"
import { edge } from "../schema/edge"
import { rim } from "../schema/rim"
import { coinTheme } from "../schema/coin-theme"
import { theme } from "../schema/theme"
import type { CoinEdgeRecord } from "./coin-edge-record"
import type { CoinRimRecord } from "./coin-rim-record"
import type { CoinThemeRecord } from "./coin-theme-record"
import type { CoinCompositionRecord } from "./coin-composition-record"
import type { CoinMintRecord } from "./coin-mint-record"

export type CoinDetailRecord = {
  id: string
  title: string
  comments: string | null
  composition: CoinCompositionRecord
  diameter: number | null
  distribution: CoinDistributionRecord
  edge: CoinEdgeRecord | null
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

type GetCoinRow = {
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
  engraverId: string | null
  engraverCode: string | null
  engraverName: string | null
  isDemonetized: boolean | null
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
  maxYear: number | null
  mintage: number | null
  mintId: string | null
  mintCode: string | null
  mintName: string | null
  minYear: number | null
  orientationCode: string | null
  orientationName: string | null
  referenceId: string | null
  referenceNumber: string | null
  referenceCatalogueCode: string | null
  referenceCatalogueTitle: string | null
  rimCode: string | null
  rimName: string | null
  rulerId: string | null
  rulerCode: string | null
  rulerName: string | null
  rulerOrder: number | null
  shapeCode: string | null
  shapeName: string | null
  surfaceKind: CoinSurfaceKind | null
  surfaceDescription: string | null
  surfaceLettering: string | null
  surfaceThumbnailUrl: string | null
  surfaceImageUrl: string | null
  techniqueCode: string | null
  techniqueName: string | null
  themeId: string | null
  themeCode: string | null
  themeName: string | null
  thickness: number | null
  weight: number | null
}

function mapDistribution(row: GetCoinRow): CoinDistributionRecord {
  return {
    code: row.distributionCode,
    name: row.distributionName,
  }
}

function mapComposition(row: GetCoinRow): CoinCompositionRecord {
  return {
    code: row.compositionCode,
    name: row.compositionName,
    description: row.compositionDescription,
  }
}

function mapEngraver(row: GetCoinRow): CoinFaceEngraverRecord | null {
  if (
    row.engraverId === null ||
    row.engraverCode === null ||
    row.engraverName === null
  ) {
    return null
  }

  return {
    code: row.engraverCode,
    name: row.engraverName,
  }
}

function mapEdge(row: GetCoinRow): CoinEdgeRecord | null {
  if (row.edgeCode === null || row.edgeName === null) {
    return null
  }

  return {
    code: row.edgeCode,
    name: row.edgeName,
  }
}

function mapIssuer(row: GetCoinRow): CoinIssuer {
  return {
    code: row.issuerCode,
    isoCode: row.issuerIsoCode,
    name: row.issuerName,
    parent: null,
  }
}

function mapMints(rows: GetCoinRow[]): CoinMintRecord[] {
  const mints = new Map<
    string,
    CoinMintRecord & {
      id: string
    }
  >()

  for (const row of rows) {
    if (row.mintId === null || row.mintCode === null || row.mintName === null) {
      continue
    }

    mints.set(row.mintId, {
      id: row.mintId,
      code: row.mintCode,
      name: row.mintName,
    })
  }

  return [...mints.values()]
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

function mapOrientation(row: GetCoinRow): CoinOrientationRecord | null {
  if (row.orientationCode === null || row.orientationName === null) {
    return null
  }

  return {
    code: row.orientationCode,
    name: row.orientationName,
  }
}

function mapReferences(rows: GetCoinRow[]): CoinReferenceRecord[] {
  const references = new Map<string, CoinReferenceRecord>()

  for (const row of rows) {
    if (
      row.referenceId === null ||
      row.referenceNumber === null ||
      row.referenceCatalogueCode === null ||
      row.referenceCatalogueTitle === null
    ) {
      continue
    }

    references.set(row.referenceId, {
      catalogue: {
        code: row.referenceCatalogueCode,
        title: row.referenceCatalogueTitle,
      },
      number: row.referenceNumber,
    })
  }

  return [...references.values()].sort((left, right) => {
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

function mapRim(row: GetCoinRow): CoinRimRecord | null {
  if (row.rimCode === null || row.rimName === null) {
    return null
  }

  return {
    code: row.rimCode,
    name: row.rimName,
  }
}

function mapRulers(rows: GetCoinRow[]): CoinRulerRecord[] {
  const rulers = new Map<
    string,
    CoinRulerRecord & {
      order: number
    }
  >()

  for (const row of rows) {
    if (
      row.rulerId === null ||
      row.rulerCode === null ||
      row.rulerName === null ||
      row.rulerOrder === null
    ) {
      continue
    }

    rulers.set(row.rulerId, {
      code: row.rulerCode,
      name: row.rulerName,
      order: row.rulerOrder,
    })
  }

  return [...rulers.values()]
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

function mapShape(row: GetCoinRow): CoinShapeRecord | null {
  if (row.shapeCode === null || row.shapeName === null) {
    return null
  }

  return {
    code: row.shapeCode,
    name: row.shapeName,
  }
}

function mapSurfaces(rows: GetCoinRow[]): CoinSurfaceSetRecord {
  const surfaces: CoinSurfaceSetRecord = {
    obverse: null,
    reverse: null,
    edge: null,
  }

  for (const row of rows) {
    if (row.surfaceKind === null) {
      continue
    }

    const surface = {
      description: row.surfaceDescription,
      lettering: row.surfaceLettering,
      thumbnailUrl: row.surfaceThumbnailUrl,
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

function mapTechnique(row: GetCoinRow): CoinTechniqueRecord | null {
  if (row.techniqueCode === null || row.techniqueName === null) {
    return null
  }

  return {
    code: row.techniqueCode,
    name: row.techniqueName,
  }
}

function mapThemes(rows: GetCoinRow[]): CoinThemeRecord[] {
  const themes = new Map<
    string,
    CoinThemeRecord & {
      id: string
    }
  >()

  for (const row of rows) {
    if (
      row.themeId === null ||
      row.themeCode === null ||
      row.themeName === null
    ) {
      continue
    }

    themes.set(row.themeId, {
      id: row.themeId,
      code: row.themeCode,
      name: row.themeName,
    })
  }

  return [...themes.values()]
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

function mapCoinDetail(rows: GetCoinRow[]): CoinDetailRecord | null {
  const firstRow = rows.at(0)

  if (!firstRow) {
    return null
  }

  const detail: CoinDetailRecord = {
    id: firstRow.id,
    title: firstRow.title,
    comments: firstRow.comments,
    composition: mapComposition(firstRow),
    diameter: firstRow.diameter,
    distribution: mapDistribution(firstRow),
    edge: mapEdge(firstRow),
    isDemonetized: firstRow.isDemonetized,
    issuer: mapIssuer(firstRow),
    maxYear: firstRow.maxYear,
    mintage: firstRow.mintage,
    mints: mapMints(rows),
    minYear: firstRow.minYear,
    orientation: mapOrientation(firstRow),
    references: mapReferences(rows),
    rim: mapRim(firstRow),
    rulers: mapRulers(rows),
    shape: mapShape(firstRow),
    surfaces: mapSurfaces(rows),
    technique: mapTechnique(firstRow),
    themes: mapThemes(rows),
    thickness: firstRow.thickness,
    weight: firstRow.weight,
  }

  return detail
}

export function buildGetCoinQuery(database: typeof db, coinId: string) {
  return database
    .select({
      id: coin.id,
      title: coin.title,
      comments: coin.comments,
      compositionCode: composition.code,
      compositionDescription: composition.description,
      compositionName: composition.name,
      diameter: coin.diameter,
      distributionCode: distribution.code,
      distributionName: distribution.name,
      edgeCode: edge.code,
      edgeName: edge.name,
      engraverId: engraver.id,
      engraverCode: engraver.code,
      engraverName: engraver.name,
      isDemonetized: coin.isDemonetized,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
      maxYear: coin.maxYear,
      mintage: coin.mintage,
      mintId: mint.id,
      mintCode: mint.code,
      mintName: mint.name,
      minYear: coin.minYear,
      orientationCode: orientation.code,
      orientationName: orientation.name,
      referenceId: coinReference.id,
      referenceNumber: coinReference.number,
      referenceCatalogueCode: catalogue.code,
      referenceCatalogueTitle: catalogue.title,
      rimCode: rim.code,
      rimName: rim.name,
      rulerId: ruler.id,
      rulerCode: ruler.code,
      rulerName: ruler.name,
      rulerOrder: coinRuler.rulerOrder,
      shapeCode: shape.code,
      shapeName: shape.name,
      surfaceKind: coinSurface.kind,
      surfaceDescription: coinSurface.description,
      surfaceLettering: coinSurface.lettering,
      surfaceThumbnailUrl: coinSurface.thumbnailUrl,
      surfaceImageUrl: coinSurface.imageUrl,
      techniqueCode: technique.code,
      techniqueName: technique.name,
      themeId: theme.id,
      themeCode: theme.code,
      themeName: theme.name,
      thickness: coin.thickness,
      weight: coin.weight,
    })
    .from(coin)
    .innerJoin(composition, eq(coin.compositionId, composition.id))
    .innerJoin(distribution, eq(coin.distributionId, distribution.id))
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(edge, eq(coin.edgeId, edge.id))
    .leftJoin(orientation, eq(coin.orientationId, orientation.id))
    .leftJoin(rim, eq(coin.rimId, rim.id))
    .leftJoin(coinRuler, eq(coinRuler.coinId, coin.id))
    .leftJoin(ruler, eq(coinRuler.rulerId, ruler.id))
    .leftJoin(coinReference, eq(coinReference.coinId, coin.id))
    .leftJoin(catalogue, eq(coinReference.catalogueId, catalogue.id))
    .leftJoin(coinMint, eq(coinMint.coinId, coin.id))
    .leftJoin(mint, eq(coinMint.mintId, mint.id))
    .leftJoin(coinTheme, eq(coinTheme.coinId, coin.id))
    .leftJoin(theme, eq(coinTheme.themeId, theme.id))
    .leftJoin(shape, eq(coin.shapeId, shape.id))
    .leftJoin(coinSurface, eq(coinSurface.coinId, coin.id))
    .leftJoin(
      coinSurfaceEngraver,
      and(
        eq(coinSurfaceEngraver.coinSurfaceId, coinSurface.id),
        eq(coinSurfaceEngraver.coinSurfaceKind, coinSurface.kind)
      )
    )
    .leftJoin(engraver, eq(coinSurfaceEngraver.engraverId, engraver.id))
    .leftJoin(technique, eq(coin.techniqueId, technique.id))
    .where(eq(coin.id, coinId))
}

export async function getCoin(
  coinId: string
): Promise<CoinDetailRecord | null> {
  const rows = await buildGetCoinQuery(db, coinId)

  return mapCoinDetail(rows)
}
