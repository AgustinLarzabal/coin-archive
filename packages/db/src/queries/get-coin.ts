import { and, eq } from "drizzle-orm"
import { db } from "../client"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinSurface } from "../schema/coin-surface"
import type { CoinSurfaceKind } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import type { CoinIssuer } from "./coin-issuer-record"
import type { CoinReferenceRecord } from "./coin-reference-record"
import type {
  CoinFaceEngraverRecord,
  CoinFaceSurfaceRecord,
  CoinSurfaceSetRecord,
} from "./coin-surface-record"

export type CoinDetailRecord = {
  id: string
  title: string
  comments: string | null
  diameter: number | null
  issuer: CoinIssuer
  references: CoinReferenceRecord[]
  surfaces: CoinSurfaceSetRecord
  thickness: number | null
  weight: number | null
}

type GetCoinRow = {
  id: string
  title: string
  comments: string | null
  diameter: number | null
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
  referenceId: string | null
  referenceNumber: string | null
  referenceCatalogueCode: string | null
  referenceCatalogueTitle: string | null
  surfaceKind: CoinSurfaceKind | null
  surfaceDescription: string | null
  surfaceLettering: string | null
  surfaceThumbnailUrl: string | null
  surfaceImageUrl: string | null
  engraverId: string | null
  engraverCode: string | null
  engraverName: string | null
  thickness: number | null
  weight: number | null
}

function mapIssuer(row: GetCoinRow): CoinIssuer {
  return {
    code: row.issuerCode,
    isoCode: row.issuerIsoCode,
    name: row.issuerName,
    parent: null,
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

  return surfaces
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

    const codeComparison = left.catalogue.code.localeCompare(right.catalogue.code)

    if (codeComparison !== 0) {
      return codeComparison
    }

    return left.number.localeCompare(right.number)
  })
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
    diameter: firstRow.diameter,
    issuer: mapIssuer(firstRow),
    references: mapReferences(rows),
    surfaces: mapSurfaces(rows),
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
      diameter: coin.diameter,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
      referenceId: coinReference.id,
      referenceNumber: coinReference.number,
      referenceCatalogueCode: catalogue.code,
      referenceCatalogueTitle: catalogue.title,
      surfaceKind: coinSurface.kind,
      surfaceDescription: coinSurface.description,
      surfaceLettering: coinSurface.lettering,
      surfaceThumbnailUrl: coinSurface.thumbnailUrl,
      surfaceImageUrl: coinSurface.imageUrl,
      engraverId: engraver.id,
      engraverCode: engraver.code,
      engraverName: engraver.name,
      thickness: coin.thickness,
      weight: coin.weight,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(coinReference, eq(coinReference.coinId, coin.id))
    .leftJoin(catalogue, eq(coinReference.catalogueId, catalogue.id))
    .leftJoin(coinSurface, eq(coinSurface.coinId, coin.id))
    .leftJoin(
      coinSurfaceEngraver,
      and(
        eq(coinSurfaceEngraver.coinSurfaceId, coinSurface.id),
        eq(coinSurfaceEngraver.coinSurfaceKind, coinSurface.kind)
      )
    )
    .leftJoin(engraver, eq(coinSurfaceEngraver.engraverId, engraver.id))
    .where(eq(coin.id, coinId))
}

export async function getCoin(
  coinId: string
): Promise<CoinDetailRecord | null> {
  const rows = await buildGetCoinQuery(db, coinId)

  return mapCoinDetail(rows)
}
