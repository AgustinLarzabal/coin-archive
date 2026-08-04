import { maintenanceApiContract } from "./maintenance-contract"
import { publicApiContract } from "./public-contract"

export const apiContract = {
  ...publicApiContract,
  maintenance: maintenanceApiContract,
}
