import { renderMaintenancePage } from "../maintenance-page"
import type { CatalogueMaintenancePageLoaderData } from "./catalogue-maintenance-route-data"
import { CataloguesTable } from "./table-workflow/catalogues-table"

type CatalogueMaintenanceRouteComponentProps = {
  loaderData: CatalogueMaintenancePageLoaderData
}

export function CatalogueMaintenanceRouteComponent({
  loaderData,
}: CatalogueMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ catalogues }) => (
    <main className="mt-8">
      <CataloguesTable catalogues={catalogues} />
    </main>
  ))
}
