import { createFileRoute } from "@tanstack/react-router"
import { getCoins } from "@workspace/db"

export const Route = createFileRoute("/")({
  loader: () => getCoins(),
  component: App,
})

function App() {
  const coins = Route.useLoaderData()

  return <pre>{JSON.stringify(coins, null, 2)}</pre>
}
