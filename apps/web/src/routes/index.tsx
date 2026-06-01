import { createFileRoute } from "@tanstack/react-router"
import { getCoins } from "@workspace/db"

const loadCoins = () => getCoins()

export const Route = createFileRoute("/")({
  loader: loadCoins,
  component: App,
})

function App() {
  const coins = Route.useLoaderData()
  const coinsJson = JSON.stringify(coins, null, 2)

  return (
    <pre>{coinsJson}</pre>
  )
}
