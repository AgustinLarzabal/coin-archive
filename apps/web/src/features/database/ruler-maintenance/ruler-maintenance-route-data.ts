import type {
  MaintenanceApiClient,
  Ruler,
  RulerGroupOption,
} from "@coin-archive/api"

import type { MaintenancePageLoaderData } from "../maintenance-page"

export type RulerMaintenancePageLoaderData = MaintenancePageLoaderData<{
  rulers: Ruler[]
  rulerGroups: RulerGroupOption[]
}>

export type RulerMaintenanceReadDependencies = {
  listRulers: MaintenanceApiClient["rulers"]["list"]
  listRulerGroups: MaintenanceApiClient["rulerGroups"]["options"]
}
