import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { ShapeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { ShapesTable } from "@/components/tables/shapes/shapes-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

type LoadShapeRecordsResult =
  | {
      status: "error"
    }
  | {
      status: "success"
      shapes: ShapeOption[]
    }

type ShapesLoaderData =
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

async function resolveShapeReadDependencies(
  dependencies?: ShapeReadDependencies
): Promise<ShapeReadDependencies> {
  return dependencies ?? getDefaultShapeReadDependencies()
}

export async function loadShapeRecords(
  collector: CollectorWithRole | null,
  dependencies?: ShapeReadDependencies
): Promise<LoadShapeRecordsResult> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      status: "error",
    }
  }

  const { getShapes } = await resolveShapeReadDependencies(dependencies)

  return {
    status: "success",
    shapes: await getShapes(),
  }
}

const getShapesLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadShapeRecords(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies ShapesLoaderData
  }

  return {
    isAllowed: true,
    shapes: result.shapes,
  } satisfies ShapesLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/shapes")({
  loader: () => getShapesLoaderData(),
  component: DatabaseShapesComponent,
})

function DatabaseShapesComponent() {
  return renderDatabaseShapesPage(Route.useLoaderData())
}

export function renderDatabaseShapesPage(loaderData: ShapesLoaderData) {
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
