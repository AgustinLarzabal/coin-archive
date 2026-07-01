import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { ShapeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { ShapesTable } from "@/components/tables/shapes/shapes-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import {
  type ShapeAuthorizationErrorResult,
  createShapeAuthorizationError,
  hasShapeMaintenanceAccess,
} from "@/lib/shape-maintenance"

type LoadShapeMaintenanceShapesResult =
  | ShapeAuthorizationErrorResult
  | {
      status: "success"
      shapes: ShapeOption[]
    }

type ShapeMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      shapes: ShapeOption[]
    }

type ShapeReadDependencies = {
  getShapes: () => Promise<ShapeOption[]>
}

async function getDefaultShapeReadDependencies(): Promise<ShapeReadDependencies> {
  const { getShapes } = await import("@workspace/db")

  return {
    getShapes,
  }
}

export async function loadShapeMaintenanceShapes(
  collector: CollectorWithRole | null,
  dependencies?: ShapeReadDependencies
): Promise<LoadShapeMaintenanceShapesResult> {
  if (!hasShapeMaintenanceAccess(collector)) {
    return createShapeAuthorizationError()
  }

  const { getShapes } = dependencies ?? (await getDefaultShapeReadDependencies())

  return {
    status: "success",
    shapes: await getShapes(),
  }
}

const getShapeMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadShapeMaintenanceShapes(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies ShapeMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    shapes: result.shapes,
  } satisfies ShapeMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/shapes")({
  loader: () => getShapeMaintenanceLoaderData(),
  component: DatabaseShapesComponent,
})

function DatabaseShapesComponent() {
  return renderDatabaseShapesPage(Route.useLoaderData())
}

export function renderDatabaseShapesPage(loaderData: ShapeMaintenanceLoaderData) {
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
