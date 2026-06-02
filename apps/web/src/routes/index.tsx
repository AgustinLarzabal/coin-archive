import { createFileRoute } from "@tanstack/react-router"
import { getCoins } from "@workspace/db"
import { renderCoinJson } from "./render-coin-json"

const loadCoins = () => getCoins()

export const Route = createFileRoute("/")({
  loader: loadCoins,
  component: App,
})

function App() {
  const coins = Route.useLoaderData()

  return (
    <pre>{renderCoinJson(coins)}</pre>
  )
}
