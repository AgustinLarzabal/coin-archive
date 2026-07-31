import { renderMaintenancePage } from "../maintenance-page"
import type { CompositionMaintenancePageLoaderData } from "./composition-maintenance-route-data"
import { CompositionsTable } from "./table-workflow/compositions-table"

type CompositionMaintenanceRouteComponentProps = {
  loaderData: CompositionMaintenancePageLoaderData
}

export function CompositionMaintenanceRouteComponent({
  loaderData,
}: CompositionMaintenanceRouteComponentProps) {
  return renderCompositionMaintenancePage(loaderData)
}

export function renderCompositionMaintenancePage(
  loaderData: CompositionMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ compositions }) => (
    <main className="mt-8">
      <CompositionsTable compositions={compositions} />
    </main>
  ))
}
