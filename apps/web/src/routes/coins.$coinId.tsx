import { getCoin } from "@workspace/db"
import type { CoinDetailRecord } from "@workspace/db"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

const coinParamsSchema = z.object({
  coinId: z.string(),
})

const coinIdSchema = z.uuid()

const getCoinData = createServerFn({ method: "GET" })
  .inputValidator(coinParamsSchema)
  .handler(async ({ data }) => {
    if (!coinIdSchema.safeParse(data.coinId).success) {
      throw notFound()
    }

    const coin = await getCoin(data.coinId)

    if (coin === null) {
      throw notFound()
    }

    return { coin }
  })

export const Route = createFileRoute("/coins/$coinId")({
  loader: ({ params }) => getCoinData({ data: params }),
  component: CoinRoute,
})

type CoinDetailPageProps = {
  coin: CoinDetailRecord
}

function CoinRoute() {
  const { coin } = Route.useLoaderData()

  return <CoinDetailPage coin={coin} />
}

export function CoinDetailPage({ coin }: CoinDetailPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6 pt-20">
      <h1 className="text-2xl">{coin.title}</h1>

      <section className="flex justify-between">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={`https://flagcdn.com/${coin.issuer.isoCode.toLowerCase()}.svg`}
              alt={coin.issuer.name}
              className="size-4 rounded-full object-cover"
            />
            <span className="text-sm">{coin.issuer.name}</span>
          </div>
        </div>
        <aside>
          <div className="flex gap-4">
            <img src="/finland-2-euro-2004-obverse.jpg" width="250" />
            <img src="/finland-2-euro-2004-reverse.jpg" width="250" />
          </div>
        </aside>
      </section>
    </main>
  )
}
