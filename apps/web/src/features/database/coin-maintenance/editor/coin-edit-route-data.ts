import type { CoinMaintenanceDeleteSummary } from "@coin-archive/api"
import { z } from "zod"

import type {
  CoinFormOptions,
  CoinFormOptionsDependencies,
  EditableCoinRecord,
} from "./coin-form.shared"
import type { MaintenancePageLoaderData } from "../../maintenance-page"

export type EditCoinPageData = {
  coin: EditableCoinRecord | null
  deleteSummary: CoinMaintenanceDeleteSummary | null
  options: CoinFormOptions
}

export type EditCoinLoaderData = MaintenancePageLoaderData<EditCoinPageData>

export const coinEditLoaderDepsSchema = z.object({ coinId: z.uuid() })
type CoinEditLoaderDeps = z.infer<typeof coinEditLoaderDepsSchema>

export type EditCoinReadDependencies = CoinFormOptionsDependencies & {
  getCoinMaintenanceDeleteSummary: (
    coinId: string
  ) => Promise<CoinMaintenanceDeleteSummary | null>
  getCoinMaintenanceRecord: (
    coinId: string
  ) => Promise<EditableCoinRecord | null>
}

export function getCoinEditLoaderDeps(params: {
  coinId: string
}): CoinEditLoaderDeps {
  return {
    coinId: params.coinId,
  }
}
