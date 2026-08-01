import { renderMaintenancePage } from "../maintenance-page"
import type { ShapeMaintenancePageLoaderData } from "./shape-maintenance-route-data"
import { ShapesTable } from "./table-workflow/shapes-table"

type ShapeMaintenanceRouteComponentProps = {
  loaderData: ShapeMaintenancePageLoaderData
}

export function ShapeMaintenanceRouteComponent({
  loaderData,
}: ShapeMaintenanceRouteComponentProps) {
  return renderMaintenancePage(loaderData, ({ shapes }) => (
    <main className="mt-8">
      <ShapesTable shapes={shapes} />
    </main>
  ))
}
