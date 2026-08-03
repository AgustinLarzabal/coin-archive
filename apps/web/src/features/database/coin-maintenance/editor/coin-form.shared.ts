import type {
  CatalogueOption,
  CompositionOption,
  CurrencyOption,
  DistributionOption,
  EdgeOption,
  EngraverOption,
  IssuerOption,
  MintingTechniqueOption,
  RimOption,
  ShapeOption,
  ThemeOption,
} from "@coin-archive/api"
import type {
  CoinMaintenanceFaceSurface,
  CoinMaintenanceRecord,
  CoinMaintenanceSurface,
  MintOption,
  OrientationOption,
  RulerOption,
} from "@coin-archive/db"

import { loadAllMaintenanceOptions } from "@/lib/maintenance-options.server"

import type { CoinDraft } from "../actions"

type AttributionDraftCollectionName = "rulers" | "mints" | "themes"

export type CoinFormOptions = {
  catalogues: CatalogueOption[]
  compositions: CompositionOption[]
  currencies: CurrencyOption[]
  distributions: DistributionOption[]
  edges: EdgeOption[]
  engravers: EngraverOption[]
  issuers: IssuerOption[]
  mints: MintOption[]
  orientations: OrientationOption[]
  rims: RimOption[]
  rulers: RulerOption[]
  shapes: ShapeOption[]
  techniques: MintingTechniqueOption[]
  themes: ThemeOption[]
}

export type CoinFormOptionsDependencies = {
  getCatalogues: () => Promise<CatalogueOption[]>
  getCompositions: () => Promise<CompositionOption[]>
  getCurrencies: () => Promise<CurrencyOption[]>
  getDistributions: () => Promise<DistributionOption[]>
  getEdges: () => Promise<EdgeOption[]>
  getEngravers: () => Promise<EngraverOption[]>
  getIssuers: () => Promise<IssuerOption[]>
  getMints: () => Promise<MintOption[]>
  getOrientations: () => Promise<OrientationOption[]>
  getRims: () => Promise<RimOption[]>
  getRulers: () => Promise<RulerOption[]>
  getShapes: () => Promise<ShapeOption[]>
  getTechniques: () => Promise<MintingTechniqueOption[]>
  getThemes: () => Promise<ThemeOption[]>
}

const REQUIRED_LOOKUP_OPTION_KEYS = [
  "issuers",
  "rulers",
  "distributions",
  "compositions",
  "currencies",
] as const

const EMPTY_FACE_SURFACE_DRAFT = {
  description: "",
  lettering: "",
  imageUrl: "",
  imageUploadReference: "",
  engraverIds: [],
}

const EMPTY_EDGE_SURFACE_DRAFT = {
  description: "",
  lettering: "",
  imageUrl: "",
  imageUploadReference: "",
}

export function createEmptyRulerAttribution(): CoinDraft["rulers"][number] {
  return {
    rulerId: "",
  }
}

export const EMPTY_COIN_DRAFT: CoinDraft = {
  title: "",
  issuerId: "",
  rulers: [createEmptyRulerAttribution()],
  distributionId: "",
  compositionId: "",
  compositionDescription: "",
  faceValueText: "",
  faceValueNumericValue: "",
  currencyId: "",
  mints: [],
  orientationId: "",
  shapeId: "",
  techniqueId: "",
  edgeId: "",
  rimId: "",
  themes: [],
  weight: "",
  diameter: "",
  thickness: "",
  mintage: "",
  comments: "",
  minYear: "",
  maxYear: "",
  demonetizationStatus: "unknown",
  references: [],
  surfaces: {
    obverse: { ...EMPTY_FACE_SURFACE_DRAFT },
    reverse: { ...EMPTY_FACE_SURFACE_DRAFT },
    edge: { ...EMPTY_EDGE_SURFACE_DRAFT },
  },
}

export async function getCoinFormOptionsDependencies(): Promise<CoinFormOptionsDependencies> {
  const [
    { getMints, getOrientations, getRulers },
    { getMaintenanceApiClient },
  ] = await Promise.all([
    import("@coin-archive/db"),
    import("@/lib/maintenance-api.server"),
  ])
  const maintenanceClient = await getMaintenanceApiClient()

  return {
    getCatalogues: () =>
      loadAllMaintenanceOptions(maintenanceClient.catalogues.options),
    getCompositions: () =>
      loadAllMaintenanceOptions(maintenanceClient.compositions.options),
    getCurrencies: () =>
      loadAllMaintenanceOptions(maintenanceClient.currencies.options),
    getDistributions: () =>
      loadAllMaintenanceOptions(maintenanceClient.distributions.options),
    getEdges: () => loadAllMaintenanceOptions(maintenanceClient.edges.options),
    getEngravers: () =>
      loadAllMaintenanceOptions(maintenanceClient.engravers.options),
    getIssuers: () =>
      loadAllMaintenanceOptions(maintenanceClient.issuers.options),
    getMints,
    getOrientations,
    getRims: () => loadAllMaintenanceOptions(maintenanceClient.rims.options),
    getRulers,
    getShapes: () =>
      loadAllMaintenanceOptions(maintenanceClient.shapes.options),
    getTechniques: () =>
      loadAllMaintenanceOptions(maintenanceClient.mintingTechniques.options),
    getThemes: () =>
      loadAllMaintenanceOptions(maintenanceClient.themes.options),
  }
}

export async function loadCoinFormOptions(
  dependencies: CoinFormOptionsDependencies
): Promise<CoinFormOptions> {
  const [
    issuers,
    rulers,
    distributions,
    compositions,
    currencies,
    catalogues,
    engravers,
    mints,
    orientations,
    shapes,
    techniques,
    edges,
    rims,
    themes,
  ] = await Promise.all([
    dependencies.getIssuers(),
    dependencies.getRulers(),
    dependencies.getDistributions(),
    dependencies.getCompositions(),
    dependencies.getCurrencies(),
    dependencies.getCatalogues(),
    dependencies.getEngravers(),
    dependencies.getMints(),
    dependencies.getOrientations(),
    dependencies.getShapes(),
    dependencies.getTechniques(),
    dependencies.getEdges(),
    dependencies.getRims(),
    dependencies.getThemes(),
  ])

  return {
    issuers,
    rulers,
    distributions,
    compositions,
    currencies,
    catalogues,
    engravers,
    mints,
    orientations,
    shapes,
    techniques,
    edges,
    rims,
    themes,
  }
}

function stringifyOptionalNumber(value: number | null) {
  return value === null ? "" : String(value)
}

function getDemonetizationStatus(
  isDemonetized: boolean | null
): CoinDraft["demonetizationStatus"] {
  if (isDemonetized === null) {
    return "unknown"
  }

  if (isDemonetized) {
    return "demonetized"
  }

  return "not-demonetized"
}

export function getNextEditSuccessMessage({
  currentSuccessMessage,
  nextCoinId,
  previousCoinId,
}: NextEditSuccessMessageInput): string | null {
  return previousCoinId === nextCoinId ? currentSuccessMessage : null
}

type NextEditSuccessMessageInput = {
  currentSuccessMessage: string | null
  nextCoinId: string
  previousCoinId: string | null
}

function mapIdsToDraftRows<
  TCollectionName extends AttributionDraftCollectionName,
  TFieldName extends keyof CoinDraft[TCollectionName][number],
>(ids: string[], fieldName: TFieldName): CoinDraft[TCollectionName] {
  return ids.map((id) => ({
    [fieldName]: id,
  })) as CoinDraft[TCollectionName]
}

function mapFaceSurfaceDraft(
  surface: CoinMaintenanceFaceSurface | null
): CoinDraft["surfaces"]["obverse"] {
  if (!surface) {
    return {
      ...EMPTY_FACE_SURFACE_DRAFT,
      engraverIds: [],
    }
  }

  return {
    description: surface.description ?? "",
    lettering: surface.lettering ?? "",
    imageUrl: surface.imageUrl ?? "",
    imageUploadReference: "",
    engraverIds: [...surface.engraverIds],
  }
}

function mapEdgeSurfaceDraft(
  surface: CoinMaintenanceSurface | null
): CoinDraft["surfaces"]["edge"] {
  if (!surface) {
    return { ...EMPTY_EDGE_SURFACE_DRAFT }
  }

  return {
    description: surface.description ?? "",
    lettering: surface.lettering ?? "",
    imageUrl: surface.imageUrl ?? "",
    imageUploadReference: "",
  }
}

export function createCoinDraft(coin: CoinMaintenanceRecord): CoinDraft {
  const rulers = mapIdsToDraftRows<"rulers", "rulerId">(
    coin.rulerIds,
    "rulerId"
  )

  return {
    title: coin.title,
    issuerId: coin.issuerId,
    rulers: rulers.length > 0 ? rulers : [createEmptyRulerAttribution()],
    distributionId: coin.distributionId,
    compositionId: coin.compositionId,
    compositionDescription: coin.compositionDescription ?? "",
    faceValueText: coin.faceValueText,
    faceValueNumericValue: String(coin.faceValueNumericValue),
    currencyId: coin.currencyId,
    mints: mapIdsToDraftRows<"mints", "mintId">(coin.mintIds, "mintId"),
    orientationId: coin.orientationId ?? "",
    shapeId: coin.shapeId ?? "",
    techniqueId: coin.techniqueId ?? "",
    edgeId: coin.edgeId ?? "",
    rimId: coin.rimId ?? "",
    themes: mapIdsToDraftRows<"themes", "themeId">(coin.themeIds, "themeId"),
    weight: stringifyOptionalNumber(coin.weight),
    diameter: stringifyOptionalNumber(coin.diameter),
    thickness: stringifyOptionalNumber(coin.thickness),
    mintage: stringifyOptionalNumber(coin.mintage),
    comments: coin.comments ?? "",
    minYear: stringifyOptionalNumber(coin.minYear),
    maxYear: stringifyOptionalNumber(coin.maxYear),
    demonetizationStatus: getDemonetizationStatus(coin.isDemonetized),
    references: coin.references.map((reference) => ({
      catalogueId: reference.catalogueId,
      number: reference.number,
    })),
    surfaces: {
      obverse: mapFaceSurfaceDraft(coin.surfaces.obverse),
      reverse: mapFaceSurfaceDraft(coin.surfaces.reverse),
      edge: mapEdgeSurfaceDraft(coin.surfaces.edge),
    },
  }
}

export function getInitialCoinDraft(
  props:
    | {
        mode: "create"
      }
    | {
        coin: CoinMaintenanceRecord
        mode: "edit"
      }
): CoinDraft {
  return props.mode === "edit" ? createCoinDraft(props.coin) : EMPTY_COIN_DRAFT
}

function normalizeDraftValue(value: string) {
  return value.trim()
}

function hasPopulatedAttributionRows<TFieldName extends string>(
  rows: Array<Record<TFieldName, string>>,
  fieldName: TFieldName
) {
  return (
    rows.length > 0 &&
    rows.every((row) => normalizeDraftValue(row[fieldName]) !== "")
  )
}

export function hasRequiredCoinDraftFields(draft: CoinDraft) {
  return (
    normalizeDraftValue(draft.title) !== "" &&
    normalizeDraftValue(draft.issuerId) !== "" &&
    hasPopulatedAttributionRows(draft.rulers, "rulerId") &&
    normalizeDraftValue(draft.distributionId) !== "" &&
    normalizeDraftValue(draft.compositionId) !== "" &&
    normalizeDraftValue(draft.faceValueText) !== "" &&
    normalizeDraftValue(String(draft.faceValueNumericValue)) !== "" &&
    normalizeDraftValue(draft.currencyId) !== ""
  )
}

export function hasRequiredCoinLookupOptions(options: CoinFormOptions) {
  return REQUIRED_LOOKUP_OPTION_KEYS.every((key) => options[key].length > 0)
}

export function areCoinDraftsEqual(left: CoinDraft, right: CoinDraft): boolean {
  return (
    left.title === right.title &&
    left.issuerId === right.issuerId &&
    areDraftRowsEqual(left.rulers, right.rulers, "rulerId") &&
    left.distributionId === right.distributionId &&
    left.compositionId === right.compositionId &&
    left.compositionDescription === right.compositionDescription &&
    left.faceValueText === right.faceValueText &&
    left.faceValueNumericValue === right.faceValueNumericValue &&
    left.currencyId === right.currencyId &&
    areDraftRowsEqual(left.mints, right.mints, "mintId") &&
    left.orientationId === right.orientationId &&
    left.shapeId === right.shapeId &&
    left.techniqueId === right.techniqueId &&
    left.edgeId === right.edgeId &&
    left.rimId === right.rimId &&
    areDraftRowsEqual(left.themes, right.themes, "themeId") &&
    left.weight === right.weight &&
    left.diameter === right.diameter &&
    left.thickness === right.thickness &&
    left.mintage === right.mintage &&
    left.comments === right.comments &&
    left.minYear === right.minYear &&
    left.maxYear === right.maxYear &&
    left.demonetizationStatus === right.demonetizationStatus &&
    areReferenceDraftsEqual(left.references, right.references) &&
    areSurfaceDraftsEqual(left.surfaces, right.surfaces)
  )
}

function areDraftRowsEqual<
  TFieldName extends string,
  TRow extends Record<TFieldName, string>,
>(left: TRow[], right: TRow[], fieldName: TFieldName) {
  return (
    left.length === right.length &&
    left.every((row, index) => row[fieldName] === right[index]?.[fieldName])
  )
}

function areReferenceDraftsEqual(
  left: CoinDraft["references"],
  right: CoinDraft["references"]
) {
  return (
    left.length === right.length &&
    left.every(
      (reference, index) =>
        reference.catalogueId === right[index]?.catalogueId &&
        reference.number === right[index]?.number
    )
  )
}

function areFaceSurfaceDraftsEqual(
  left: CoinDraft["surfaces"]["obverse"],
  right: CoinDraft["surfaces"]["obverse"]
) {
  return (
    left.description === right.description &&
    left.lettering === right.lettering &&
    left.imageUrl === right.imageUrl &&
    left.engraverIds.length === right.engraverIds.length &&
    left.engraverIds.every(
      (engraverId, index) => engraverId === right.engraverIds[index]
    )
  )
}

function areEdgeSurfaceDraftsEqual(
  left: CoinDraft["surfaces"]["edge"],
  right: CoinDraft["surfaces"]["edge"]
) {
  return (
    left.description === right.description &&
    left.lettering === right.lettering &&
    left.imageUrl === right.imageUrl
  )
}

function areSurfaceDraftsEqual(
  left: CoinDraft["surfaces"],
  right: CoinDraft["surfaces"]
) {
  return (
    areFaceSurfaceDraftsEqual(left.obverse, right.obverse) &&
    areFaceSurfaceDraftsEqual(left.reverse, right.reverse) &&
    areEdgeSurfaceDraftsEqual(left.edge, right.edge)
  )
}
