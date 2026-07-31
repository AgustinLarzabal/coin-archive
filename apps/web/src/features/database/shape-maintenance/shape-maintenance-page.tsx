import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./shape-maintenance-route-data"
import { ShapesTable } from "./table-workflow/shapes-table"

type ShapeMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function ShapeMaintenanceRouteComponent({
  loaderData,
}: ShapeMaintenanceRouteComponentProps) {
  return renderShapeMaintenancePage(loaderData)
}

export function renderShapeMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ shapes }) => (
    <main className="mt-8">
      <ShapesTable shapes={shapes} />
    </main>
  ))
}
