import { getMaintenanceApiClient } from "@/lib/maintenance-api.server"

export async function getCoinFormOptionsDependencies() {
  const client = await getMaintenanceApiClient()
  return {
    getCoinMaintenanceOptions: async () => (await client.coins.options({})).data,
  }
}

export async function getCoinCreateDependencies() {
  return getCoinFormOptionsDependencies()
}

export async function getCoinMaintenanceReadDependencies() {
  const client = await getMaintenanceApiClient()
  return {
    listCoins: client.coins.list,
    getOptions: () => client.coins.options({}),
  }
}

export async function getCoinEditDependencies() {
  const [client, formOptionsDependencies] = await Promise.all([
    getMaintenanceApiClient(),
    getCoinFormOptionsDependencies(),
  ])
  return {
    getCoinMaintenanceDeleteSummary: async (coinId: string) => {
      try {
        return (await client.coins.deleteSummary({ uuid: coinId })).data
      } catch (error) {
        if (isCoinNotFoundProblem(error)) return null
        throw error
      }
    },
    getCoinMaintenanceRecord: async (coinId: string) => {
      try {
        return (await client.coins.detail({ uuid: coinId })).data
      } catch (error) {
        if (isCoinNotFoundProblem(error)) return null
        throw error
      }
    },
    ...formOptionsDependencies,
  }
}

function isCoinNotFoundProblem(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  if ("code" in error && error.code === "NOT_FOUND") return true
  if (!("data" in error) || typeof error.data !== "object" || error.data === null)
    return false
  const data = error.data
  if ("code" in data && data.code === "coin_not_found") return true
  return (
    "body" in data &&
    typeof data.body === "object" &&
    data.body !== null &&
    "code" in data.body &&
    data.body.code === "coin_not_found"
  )
}
