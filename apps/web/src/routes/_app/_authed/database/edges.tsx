import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { EdgeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { EdgesTable } from "@/components/tables/edges/edges-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type EdgeAuthorizationErrorResult,
  createEdgeAuthorizationError,
  hasEdgeMaintenanceAccess,
} from "@/lib/edge-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadEdgeMaintenanceEdgesResult =
  | EdgeAuthorizationErrorResult
  | {
      status: "success"
      edges: EdgeOption[]
    }

type EdgeMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      edges: EdgeOption[]
    }

type EdgeReadDependencies = {
  getEdges: () => Promise<EdgeOption[]>
}

async function getDefaultEdgeReadDependencies(): Promise<EdgeReadDependencies> {
  const { getEdges } = await import("@workspace/db")

  return {
    getEdges,
  }
}

export async function loadEdgeMaintenanceEdges(
  collector: CollectorWithRole | null,
  dependencies?: EdgeReadDependencies
): Promise<LoadEdgeMaintenanceEdgesResult> {
  if (!hasEdgeMaintenanceAccess(collector)) {
    return createEdgeAuthorizationError()
  }

  const { getEdges } = dependencies ?? (await getDefaultEdgeReadDependencies())

  return {
    status: "success",
    edges: await getEdges(),
  }
}

const getEdgeMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadEdgeMaintenanceEdges(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies EdgeMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    edges: result.edges,
  } satisfies EdgeMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/edges")({
  loader: () => getEdgeMaintenanceLoaderData(),
  component: DatabaseEdgesComponent,
})

function DatabaseEdgesComponent() {
  const loaderData = Route.useLoaderData()

  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <EdgesTable edges={loaderData.edges} />
    </main>
  )
}
