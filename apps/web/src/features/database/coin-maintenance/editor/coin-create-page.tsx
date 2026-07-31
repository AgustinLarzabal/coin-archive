import { renderMaintenancePage } from "../../maintenance-page"
import { hasRequiredCoinLookupOptions } from "./coin-form.shared"
import type { CreateCoinLoaderData } from "./coin-create-route-data"
import { CoinForm } from "./coin-form"

const REQUIRED_LOOKUP_LINKS = [
  ["/database/issuers", "Issuers"],
  ["/database/rulers", "Rulers"],
  ["/database/distributions", "Distributions"],
  ["/database/compositions", "Compositions"],
  ["/database/currencies", "Currencies"],
] as const

type CoinCreateRouteComponentProps = {
  loaderData: CreateCoinLoaderData
}

export function CoinCreateRouteComponent({
  loaderData,
}: CoinCreateRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ options }) => (
    <main className="mt-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Create Coin</h1>
        <p className="text-sm text-muted-foreground">
          Enter the required core fields and optional scalar details.
        </p>
      </header>

      {hasRequiredCoinLookupOptions(options) ? (
        <CoinForm mode="create" options={options} />
      ) : (
        <div className="space-y-3 rounded border p-4">
          <p className="text-sm">
            Coin creation is blocked until the required lookup records exist.
          </p>
          <ul className="list-disc pl-5 text-sm">
            {REQUIRED_LOOKUP_LINKS.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="underline underline-offset-4">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  ))
}
