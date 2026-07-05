import { createFileRoute } from "@tanstack/react-router"
import {
  CoinMaintenanceRouteComponent,
  coinMaintenanceSearchSchema,
  getCoinMaintenanceLoaderDeps,
  loadCoinMaintenanceRouteData,
} from "@/features/database/coin-maintenance"

export const Route = createFileRoute("/_app/_authed/database/coins")({
  validateSearch: coinMaintenanceSearchSchema,
  loaderDeps: ({ search }) => getCoinMaintenanceLoaderDeps(search),
  loader: loadCoinMaintenanceRouteData,
  component: DatabaseCoinsComponent,
})

function DatabaseCoinsComponent() {
  return <CoinMaintenanceRouteComponent loaderData={Route.useLoaderData()} />
}
