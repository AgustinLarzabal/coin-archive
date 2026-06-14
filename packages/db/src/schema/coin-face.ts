// Compatibility re-exports for code that still imports Coin Face names.
export {
  coinSurface as coinFace,
  coinSurfaceKinds as coinFaceSides,
  coinSurfaceSchemaNames as coinFaceSchemaNames,
} from "./coin-surface"
export type {
  CoinSurface as CoinFace,
  CoinSurfaceKind as CoinFaceSide,
} from "./coin-surface"
