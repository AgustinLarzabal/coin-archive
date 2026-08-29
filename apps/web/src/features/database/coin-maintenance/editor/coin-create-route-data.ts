import type { CoinFormOptions } from "./coin-form.shared"
import type { MaintenancePageLoaderData } from "../../maintenance-page"

export type CreateCoinPageData = {
  options: CoinFormOptions
}

export type CreateCoinLoaderData = MaintenancePageLoaderData<CreateCoinPageData>
