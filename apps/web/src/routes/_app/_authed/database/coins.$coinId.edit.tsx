import { createFileRoute } from "@tanstack/react-router"

import {
  CoinEditRouteComponent,
  loadCoinEditRouteData,
} from "@/features/database/coin-maintenance"

export const Route = createFileRoute(
  "/_app/_authed/database/coins/$coinId/edit"
)({
  loader: loadCoinEditRouteData,
  component: DatabaseCoinEditRouteComponent,
})

function DatabaseCoinEditRouteComponent() {
  return <CoinEditRouteComponent loaderData={Route.useLoaderData()} />
}
