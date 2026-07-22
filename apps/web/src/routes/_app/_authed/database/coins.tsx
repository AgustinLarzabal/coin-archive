import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router"
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
  const loaderData = Route.useLoaderData()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (pathname === "/database/coins") {
    return <CoinMaintenanceRouteComponent loaderData={loaderData} />
  }

  return <Outlet />
}
