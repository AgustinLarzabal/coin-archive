import { createServerFn } from "@tanstack/react-start"
import type { EdgeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createEdgeAuthorizationError, hasEdgeMaintenanceAccess } from "./actions"
import { EdgesTable } from "./table-workflow/edges-table"

type LoadResult =
  | ReturnType<typeof createEdgeAuthorizationError>
  | {
      status: "success"
      edges: EdgeOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      edges: EdgeOption[]
    }

type ReadDependencies = {
  getEdges: () => Promise<EdgeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getEdges } = await import("@workspace/db")

  return {
    getEdges,
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
    edges: result.edges,
  }
}

export async function loadEdgeMaintenanceEdges(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasEdgeMaintenanceAccess(collector)) {
    return createEdgeAuthorizationError()
  }

  const { getEdges } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    edges: await getEdges(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadEdgeMaintenanceEdges(session?.user ?? null)

  return toLoaderData(result)
})

export function loadEdgeMaintenanceRouteData() {
  return getLoaderData()
}

type EdgeMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function EdgeMaintenanceRouteComponent({
  loaderData,
}: EdgeMaintenanceRouteComponentProps) {
  return renderEdgeMaintenancePage(loaderData)
}

export function renderEdgeMaintenancePage(loaderData: LoaderData) {
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
