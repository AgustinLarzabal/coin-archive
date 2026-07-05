import { createFileRoute } from "@tanstack/react-router"

import {
  CoinEditRouteComponent,
  getCoinEditLoaderDeps,
  loadCoinEditRouteData,
} from "@/features/database/coin-maintenance"

export const Route = createFileRoute("/_app/_authed/database/coins/$coinId/edit")(
  {
    loaderDeps: ((context: { params: { coinId: string } }) =>
      getCoinEditLoaderDeps(context.params)) as any,
    loader: loadCoinEditRouteData,
    component: DatabaseCoinEditRouteComponent,
  }
)

function DatabaseCoinEditRouteComponent() {
  return <CoinEditRouteComponent loaderData={Route.useLoaderData()} />
}
