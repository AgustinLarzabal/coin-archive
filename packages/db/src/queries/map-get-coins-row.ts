import type { CoinListIssuer } from "./coin-issuer-record"
import type {
  CoinFaceEngraverRecord,
  CoinFaceSurfaceRecord,
  CoinSurfaceSetRecord,
} from "./coin-surface-record"

export type GetCoinsRow = {
  id: string
  title: string
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
  createdAt?: Date
  surfaceKind: "obverse" | "reverse" | "edge-surface" | null
  surfaceDescription: string | null
  surfaceLettering: string | null
  surfaceImageUrl: string | null
  engraverId: string | null
  engraverCode: string | null
  engraverName: string | null
}

export type CoinListRecord = {
  id: string
  title: string
  issuer: CoinListIssuer
  surfaces: CoinSurfaceSetRecord
  createdAt?: Date
}

export function mapGetCoinsRowsToCoinRecords(
  rows: GetCoinsRow[]
): CoinListRecord[] {
  const coins = new Map<string, CoinListRecord>()

  for (const row of rows) {
    const existingCoin = coins.get(row.id)
    const coin =
      existingCoin ??
      {
        id: row.id,
        title: row.title,
        issuer: {
          code: row.issuerCode,
          isoCode: row.issuerIsoCode,
          name: row.issuerName,
        },
        ...(row.createdAt === undefined ? {} : { createdAt: row.createdAt }),
        surfaces: {
          obverse: null,
          reverse: null,
          edge: null,
        },
      }

    mapSurfaceRow(coin.surfaces, row)
    coins.set(row.id, coin)
  }

  return [...coins.values()]
}

function mapSurfaceRow(surfaces: CoinSurfaceSetRecord, row: GetCoinsRow) {
  if (row.surfaceKind === null) {
    return
  }

  const surface = {
    description: row.surfaceDescription,
    lettering: row.surfaceLettering,
    imageUrl: row.surfaceImageUrl,
  }

  if (row.surfaceKind === "edge-surface") {
    surfaces.edge = surface
    return
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
    !nextSurface.engravers.some((engraver) => engraver.code === mappedEngraver.code)
  ) {
    nextSurface.engravers.push(mappedEngraver)
  }

  surfaces[row.surfaceKind] = nextSurface
}

function mapEngraver(row: GetCoinsRow): CoinFaceEngraverRecord | null {
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
