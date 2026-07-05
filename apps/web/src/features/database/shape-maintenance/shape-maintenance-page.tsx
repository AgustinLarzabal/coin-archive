import { createServerFn } from "@tanstack/react-start"
import type { ShapeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createShapeAuthorizationError, hasShapeMaintenanceAccess } from "./actions"
import { ShapesTable } from "./table-workflow/shapes-table"

type LoadResult =
  | ReturnType<typeof createShapeAuthorizationError>
  | {
      status: "success"
      shapes: ShapeOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      shapes: ShapeOption[]
    }

type ReadDependencies = {
  getShapes: () => Promise<ShapeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getShapes } = await import("@workspace/db")

  return {
    getShapes,
  }
}

function toLoaderData(result: Awaited<LoadResult>): LoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    shapes: result.shapes,
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

  return toLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <ShapesTable shapes={loaderData.shapes} />
    </main>
  )
}
