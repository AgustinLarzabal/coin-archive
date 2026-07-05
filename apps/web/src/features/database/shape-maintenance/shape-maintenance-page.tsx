import { createServerFn } from "@tanstack/react-start"
import type { ShapeOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  type MaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import { createShapeAuthorizationError, hasShapeMaintenanceAccess } from "./actions"
import { ShapesTable } from "./table-workflow/shapes-table"

type LoadResult = MaintenancePageLoadResult<{
  shapes: ShapeOption[]
}, ReturnType<typeof createShapeAuthorizationError>>

type LoaderData = MaintenancePageLoaderData<{
  shapes: ShapeOption[]
}>

type ReadDependencies = {
  getShapes: () => Promise<ShapeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getShapes } = await import("@workspace/db")

  return {
    getShapes,
  }
}

export async function loadShapeMaintenanceShapes(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasShapeMaintenanceAccess(collector)) {
    return createShapeAuthorizationError()
  }

  const { getShapes } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    shapes: await getShapes(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadShapeMaintenanceShapes(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadShapeMaintenanceRouteData() {
  return getLoaderData()
}

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
