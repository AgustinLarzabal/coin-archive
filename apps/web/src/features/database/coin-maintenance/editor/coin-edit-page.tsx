import { renderMaintenancePage } from "../../maintenance-page"
import { DeleteCoin } from "../deletion/delete-coin"
import type { EditCoinLoaderData } from "./coin-edit-route-data"
import { CoinForm } from "./coin-form"

type CoinEditRouteComponentProps = {
  loaderData: EditCoinLoaderData
}

export function CoinEditRouteComponent({
  loaderData,
}: CoinEditRouteComponentProps) {
  return renderMaintenancePage(
    loaderData,
    ({ coin, deleteSummary, options }) => (
      <main className="mt-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Edit Coin</h1>
          {coin ? (
            <a
              href={`/coins/${coin.id}`}
              className="text-sm underline underline-offset-4"
            >
              View public Coin page
            </a>
          ) : null}
        </header>

        {coin ? (
          <>
            <CoinForm mode="edit" coin={coin} options={options} />
            {deleteSummary ? (
              <DeleteCoin
                coinId={coin.id}
                etag={coin.etag}
                deleteSummary={deleteSummary}
              />
            ) : null}
          </>
        ) : (
          <p className="text-sm text-destructive">Coin no longer exists.</p>
        )}
      </main>
    )
  )
}
