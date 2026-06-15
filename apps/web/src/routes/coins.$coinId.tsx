import type { CoinDetailRecord } from "@workspace/db"
import { Link, createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

const coinParamsSchema = z.object({
  coinId: z.string(),
})

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const getCoinData = createServerFn({ method: "GET" })
  .inputValidator(coinParamsSchema)
  .handler(async ({ data }) => {
    if (!uuidPattern.test(data.coinId)) {
      return { coin: null }
    }

    const { getCoin } = await import("@workspace/db")

    return { coin: await getCoin(data.coinId) }
  })

export const Route = createFileRoute("/coins/$coinId")({
  loader: ({ params }) => getCoinData({ data: params }),
  component: CoinRoute,
})

function CoinRoute() {
  const { coin } = Route.useLoaderData()

  return <CoinDetailPage coin={coin} />
}

export function CoinDetailPage({
  coin,
}: {
  coin: CoinDetailRecord | null
}) {
  if (coin === null) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 pt-16">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">
          Coin not found
        </p>
        <h1 className="text-3xl font-semibold">No coin matches this URL.</h1>
        <Link
          className="text-sm text-primary underline-offset-4 hover:underline"
          to="/"
        >
          Return to the catalogue
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 pt-16">
      <div className="space-y-2">
        <p className="text-sm tracking-wider text-muted-foreground uppercase">
          Coin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{coin.title}</h1>
      </div>

      <section className="rounded-none border border-border/60 p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Issuer</h2>
        <p className="mt-1 text-lg">{coin.issuer.name}</p>
      </section>
    </main>
  )
}
