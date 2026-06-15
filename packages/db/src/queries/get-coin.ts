import { and, asc, eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "../client"
import { coin } from "../schema/coin"
import { coinSurface, coinSurfaceKinds } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import type { CoinEdge, CoinEngraver, CoinIssuer } from "./map-get-coins-row"

const [obverseSurfaceKind, reverseSurfaceKind, edgeSurfaceKind] =
  coinSurfaceKinds
const obverseSurface = alias(coinSurface, "obverse_surface")
const reverseSurface = alias(coinSurface, "reverse_surface")
const edgeSurface = alias(coinSurface, "edge_surface")
const obverseSurfaceEngraver = alias(
  coinSurfaceEngraver,
  "obverse_surface_engraver"
)
const reverseSurfaceEngraver = alias(
  coinSurfaceEngraver,
  "reverse_surface_engraver"
)
const obverseEngraver = alias(engraver, "obverse_engraver")
const reverseEngraver = alias(engraver, "reverse_engraver")

export type CoinDetailSurfaceDetails = {
  description: string | null
  lettering: string | null
  thumbnailUrl: string | null
  imageUrl: string | null
  engravers: CoinEngraver[]
}

export type CoinDetailEdgeSurface = {
  description: string | null
  lettering: string | null
  thumbnailUrl: string | null
  imageUrl: string | null
}

export type CoinDetailSurfaceSet = {
  obverse: CoinDetailSurfaceDetails | null
  reverse: CoinDetailSurfaceDetails | null
  edge: CoinDetailEdgeSurface | null
}

export type CoinDetailRecord = {
  id: string
  title: string
  issuer: CoinIssuer
  edge: CoinEdge | null
  surfaces: CoinDetailSurfaceSet
}

type GetCoinRow = {
  id: string
  title: string
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
  issuerCreatedAt: Date
  issuerUpdatedAt: Date
  edgeId: string | null
  edgeCode: string | null
  edgeName: string | null
  edgeCreatedAt: Date | null
  edgeUpdatedAt: Date | null
  obverseDescription: string | null
  obverseLettering: string | null
  obverseThumbnailUrl: string | null
  obverseImageUrl: string | null
  obverseEngraverId: string | null
  obverseEngraverCode: string | null
  obverseEngraverName: string | null
  obverseEngraverCreatedAt: Date | null
  obverseEngraverUpdatedAt: Date | null
  reverseDescription: string | null
  reverseLettering: string | null
  reverseThumbnailUrl: string | null
  reverseImageUrl: string | null
  reverseEngraverId: string | null
  reverseEngraverCode: string | null
  reverseEngraverName: string | null
  reverseEngraverCreatedAt: Date | null
  reverseEngraverUpdatedAt: Date | null
  edgeDescription: string | null
  edgeLettering: string | null
  edgeThumbnailUrl: string | null
  edgeImageUrl: string | null
}

const coinFaces = ["obverse", "reverse"] as const

type CoinFace = (typeof coinFaces)[number]

type CoinSurfaceRecord = {
  description: string | null
  lettering: string | null
  thumbnailUrl: string | null
  imageUrl: string | null
}

type CoinFaceEngraverRecord = {
  id: string | null
  code: string | null
  name: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

function mapIssuer(row: GetCoinRow): CoinIssuer {
  return {
    id: row.issuerId,
    code: row.issuerCode,
    isoCode: row.issuerIsoCode,
    name: row.issuerName,
    createdAt: row.issuerCreatedAt,
    updatedAt: row.issuerUpdatedAt,
    parent: null,
  }
}

function mapEdge(row: GetCoinRow): CoinEdge | null {
  if (
    row.edgeId === null ||
    row.edgeCode === null ||
    row.edgeName === null ||
    row.edgeCreatedAt === null ||
    row.edgeUpdatedAt === null
  ) {
    return null
  }

  return {
    id: row.edgeId,
    code: row.edgeCode,
    name: row.edgeName,
    createdAt: row.edgeCreatedAt,
    updatedAt: row.edgeUpdatedAt,
  }
}

function hasSurfaceDetails(surface: CoinSurfaceRecord): boolean {
  return (
    surface.description !== null ||
    surface.lettering !== null ||
    surface.thumbnailUrl !== null ||
    surface.imageUrl !== null
  )
}

function mapSurfaceRecord(
  surface: CoinSurfaceRecord
): CoinDetailEdgeSurface | null {
  if (!hasSurfaceDetails(surface)) {
    return null
  }

  return surface
}

function getFaceEngraverRecord(
  row: GetCoinRow,
  face: CoinFace
): CoinFaceEngraverRecord {
  switch (face) {
    case "obverse":
      return {
        id: row.obverseEngraverId,
        code: row.obverseEngraverCode,
        name: row.obverseEngraverName,
        createdAt: row.obverseEngraverCreatedAt,
        updatedAt: row.obverseEngraverUpdatedAt,
      }
    case "reverse":
      return {
        id: row.reverseEngraverId,
        code: row.reverseEngraverCode,
        name: row.reverseEngraverName,
        createdAt: row.reverseEngraverCreatedAt,
        updatedAt: row.reverseEngraverUpdatedAt,
      }
  }
}

function mapSurfaceEngraver(
  row: GetCoinRow,
  face: CoinFace
): CoinEngraver | null {
  const engraver = getFaceEngraverRecord(row, face)

  if (
    engraver.id === null ||
    engraver.code === null ||
    engraver.name === null ||
    engraver.createdAt === null ||
    engraver.updatedAt === null
  ) {
    return null
  }

  return {
    id: engraver.id,
    code: engraver.code,
    name: engraver.name,
    createdAt: engraver.createdAt,
    updatedAt: engraver.updatedAt,
  }
}

function getFaceSurfaceRecord(
  row: GetCoinRow,
  face: CoinFace
): CoinSurfaceRecord {
  switch (face) {
    case "obverse":
      return {
        description: row.obverseDescription,
        lettering: row.obverseLettering,
        thumbnailUrl: row.obverseThumbnailUrl,
        imageUrl: row.obverseImageUrl,
      }
    case "reverse":
      return {
        description: row.reverseDescription,
        lettering: row.reverseLettering,
        thumbnailUrl: row.reverseThumbnailUrl,
        imageUrl: row.reverseImageUrl,
      }
  }
}

function getEdgeSurfaceRecord(row: GetCoinRow): CoinSurfaceRecord {
  return {
    description: row.edgeDescription,
    lettering: row.edgeLettering,
    thumbnailUrl: row.edgeThumbnailUrl,
    imageUrl: row.edgeImageUrl,
  }
}

function createFaceSurfaceDetails(
  surface: CoinSurfaceRecord
): CoinDetailSurfaceDetails {
  return {
    ...surface,
    engravers: [],
  }
}

function mapFaceSurfaceDetails(
  row: GetCoinRow,
  face: CoinFace
): CoinDetailSurfaceDetails | null {
  const surface = mapSurfaceRecord(getFaceSurfaceRecord(row, face))

  if (surface === null) {
    return null
  }

  return createFaceSurfaceDetails(surface)
}

function compareEngravers(left: CoinEngraver, right: CoinEngraver): number {
  return (
    left.name.localeCompare(right.name) ||
    left.code.localeCompare(right.code) ||
    left.id.localeCompare(right.id)
  )
}

function ensureFaceSurfaceDetails(
  detail: CoinDetailRecord,
  row: GetCoinRow,
  face: CoinFace
): CoinDetailSurfaceDetails {
  const existingSurface = detail.surfaces[face]

  if (existingSurface !== null) {
    return existingSurface
  }

  const mappedSurface = mapFaceSurfaceDetails(row, face)

  if (mappedSurface !== null) {
    detail.surfaces[face] = mappedSurface

    return mappedSurface
  }

  detail.surfaces[face] = createFaceSurfaceDetails(
    getFaceSurfaceRecord(row, face)
  )

  return detail.surfaces[face]
}

function appendUniqueFaceEngraver(
  detail: CoinDetailRecord,
  row: GetCoinRow,
  face: CoinFace,
  seenEngraverIds: Set<string>
): void {
  const mappedEngraver = mapSurfaceEngraver(row, face)

  if (mappedEngraver === null || seenEngraverIds.has(mappedEngraver.id)) {
    return
  }

  seenEngraverIds.add(mappedEngraver.id)
  ensureFaceSurfaceDetails(detail, row, face).engravers.push(mappedEngraver)
}

function mapCoinDetail(rows: GetCoinRow[]): CoinDetailRecord | null {
  const [firstRow] = rows

  if (!firstRow) {
    return null
  }

  const detail: CoinDetailRecord = {
    id: firstRow.id,
    title: firstRow.title,
    issuer: mapIssuer(firstRow),
    edge: mapEdge(firstRow),
    surfaces: {
      obverse: mapFaceSurfaceDetails(firstRow, "obverse"),
      reverse: mapFaceSurfaceDetails(firstRow, "reverse"),
      edge: mapSurfaceRecord(getEdgeSurfaceRecord(firstRow)),
    },
  }
  const seenEngraverIdsByFace: Record<CoinFace, Set<string>> = {
    obverse: new Set<string>(),
    reverse: new Set<string>(),
  }

  for (const row of rows) {
    for (const face of coinFaces) {
      appendUniqueFaceEngraver(detail, row, face, seenEngraverIdsByFace[face])
    }
  }

  for (const face of coinFaces) {
    detail.surfaces[face]?.engravers.sort(compareEngravers)
  }

  return detail
}

export function buildGetCoinQuery(database: typeof db, coinId: string) {
  return database
    .select({
      id: coin.id,
      title: coin.title,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
      issuerCreatedAt: issuer.createdAt,
      issuerUpdatedAt: issuer.updatedAt,
      edgeId: edge.id,
      edgeCode: edge.code,
      edgeName: edge.name,
      edgeCreatedAt: edge.createdAt,
      edgeUpdatedAt: edge.updatedAt,
      obverseDescription: obverseSurface.description,
      obverseLettering: obverseSurface.lettering,
      obverseThumbnailUrl: obverseSurface.thumbnailUrl,
      obverseImageUrl: obverseSurface.imageUrl,
      obverseEngraverId: obverseEngraver.id,
      obverseEngraverCode: obverseEngraver.code,
      obverseEngraverName: obverseEngraver.name,
      obverseEngraverCreatedAt: obverseEngraver.createdAt,
      obverseEngraverUpdatedAt: obverseEngraver.updatedAt,
      reverseDescription: reverseSurface.description,
      reverseLettering: reverseSurface.lettering,
      reverseThumbnailUrl: reverseSurface.thumbnailUrl,
      reverseImageUrl: reverseSurface.imageUrl,
      reverseEngraverId: reverseEngraver.id,
      reverseEngraverCode: reverseEngraver.code,
      reverseEngraverName: reverseEngraver.name,
      reverseEngraverCreatedAt: reverseEngraver.createdAt,
      reverseEngraverUpdatedAt: reverseEngraver.updatedAt,
      edgeDescription: edgeSurface.description,
      edgeLettering: edgeSurface.lettering,
      edgeThumbnailUrl: edgeSurface.thumbnailUrl,
      edgeImageUrl: edgeSurface.imageUrl,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .leftJoin(edge, eq(coin.edgeId, edge.id))
    .leftJoin(
      obverseSurface,
      and(
        eq(obverseSurface.coinId, coin.id),
        eq(obverseSurface.kind, obverseSurfaceKind)
      )
    )
    .leftJoin(
      obverseSurfaceEngraver,
      and(
        eq(obverseSurface.id, obverseSurfaceEngraver.coinSurfaceId),
        eq(obverseSurface.kind, obverseSurfaceEngraver.coinSurfaceKind)
      )
    )
    .leftJoin(
      obverseEngraver,
      eq(obverseSurfaceEngraver.engraverId, obverseEngraver.id)
    )
    .leftJoin(
      reverseSurface,
      and(
        eq(reverseSurface.coinId, coin.id),
        eq(reverseSurface.kind, reverseSurfaceKind)
      )
    )
    .leftJoin(
      reverseSurfaceEngraver,
      and(
        eq(reverseSurface.id, reverseSurfaceEngraver.coinSurfaceId),
        eq(reverseSurface.kind, reverseSurfaceEngraver.coinSurfaceKind)
      )
    )
    .leftJoin(
      reverseEngraver,
      eq(reverseSurfaceEngraver.engraverId, reverseEngraver.id)
    )
    .leftJoin(
      edgeSurface,
      and(
        eq(edgeSurface.coinId, coin.id),
        eq(edgeSurface.kind, edgeSurfaceKind)
      )
    )
    .where(eq(coin.id, coinId))
    .orderBy(
      asc(obverseEngraver.name),
      asc(obverseEngraver.code),
      asc(obverseEngraver.id),
      asc(reverseEngraver.name),
      asc(reverseEngraver.code),
      asc(reverseEngraver.id)
    )
}

export async function getCoin(
  coinId: string
): Promise<CoinDetailRecord | null> {
  const rows = await buildGetCoinQuery(db, coinId)

  return mapCoinDetail(rows)
}
