import { createFileRoute } from "@tanstack/react-router"

import { CataloguesTable } from "@/components/tables/catalogues/catalogues-table"
import { createServerFn } from "@tanstack/react-start"

export const getCatalogueMaintenanceCatalogues = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getCatalogues } = await import("@workspace/db")

  return getCatalogues()
})

export const Route = createFileRoute("/_app/_authed/database/catalogues")({
  loader: async () => {
    const catalogues = await getCatalogueMaintenanceCatalogues()

    return { catalogues }
  },
  component: DatabaseCataloguesComponent,
})

function DatabaseCataloguesComponent() {
  const { catalogues } = Route.useLoaderData()

  return (
    <main className="mt-8">
      <CataloguesTable catalogues={catalogues} />
    </main>
  )
}
