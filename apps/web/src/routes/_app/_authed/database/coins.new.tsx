import { createFileRoute } from "@tanstack/react-router"

import {
  CoinCreateRouteComponent,
  loadCoinCreateRouteData,
} from "@/features/database/coin-maintenance"

export const Route = createFileRoute("/_app/_authed/database/coins/new")({
  loader: loadCoinCreateRouteData,
  component: DatabaseCoinCreateRouteComponent,
})

function DatabaseCoinCreateRouteComponent() {
  return <CoinCreateRouteComponent loaderData={Route.useLoaderData()} />
}
