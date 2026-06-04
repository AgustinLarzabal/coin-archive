import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import type { IssuerOption } from "@workspace/db"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

const optionalIssuerCodeSchema = z.string().optional()
const issuerSearchSchema = z.object({
  issuer: optionalIssuerCodeSchema,
})
const coinListInputSchema = z.object({
  issuerCode: optionalIssuerCodeSchema,
})

const getCoinListData = createServerFn({ method: "GET" })
  .inputValidator(coinListInputSchema)
  .handler(async ({ data }) => {
    const { getCoins, getIssuers } = await import("@workspace/db")

    const [coins, issuers] = await Promise.all([
      getCoins({ issuerCode: data.issuerCode }),
      getIssuers(),
    ])

    return { coins, issuers }
  })

export const Route = createFileRoute("/")({
  validateSearch: issuerSearchSchema,
  loaderDeps: ({ search }) => ({
    issuerCode: search.issuer,
  }),
  loader: ({ deps }) => getCoinListData({ data: deps }),
  component: App,
})

function App() {
  const { coins, issuers } = Route.useLoaderData()
  const { issuer: selectedIssuerCode } = Route.useSearch()
  const navigate = Route.useNavigate()

  const selectedIssuer =
    issuers.find((issuer) => issuer.code === selectedIssuerCode) ?? null

  async function selectIssuer(issuer: IssuerOption | null) {
    await navigate({
      search: (currentSearch) => ({
        ...currentSearch,
        issuer: issuer?.code,
      }),
    })
  }

  return (
    <div>
      <div className="w-full max-w-md">
        <Combobox<IssuerOption>
          items={issuers}
          value={selectedIssuer}
          itemToStringLabel={(issuer) => issuer.name}
          isItemEqualToValue={(issuer, value) => issuer.code === value.code}
          onValueChange={selectIssuer}
        >
          <ComboboxInput placeholder="Filter by issuer" showClear />
          <ComboboxContent>
            <ComboboxEmpty>No issuers found.</ComboboxEmpty>
            <ComboboxList>
              {(issuer: IssuerOption) => (
                <ComboboxItem key={issuer.code} value={issuer}>
                  <span>{issuer.name}</span>
                  <span className="text-muted-foreground">{issuer.code}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <pre className="text-xs">{JSON.stringify(coins, null, 2)}</pre>
    </div>
  )
}
