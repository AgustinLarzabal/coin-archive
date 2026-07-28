import { createServerFn } from "@tanstack/react-start"
import type { EdgeOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createEdgeAuthorizationError,
  hasEdgeMaintenanceAccess,
} from "./actions"
import { EdgesTable } from "./table-workflow/edges-table"

type LoadResult = MaintenancePageLoadResult<
  {
    edges: EdgeOption[]
  },
  ReturnType<typeof createEdgeAuthorizationError>
>

type LoaderData = MaintenancePageLoaderData<{
  edges: EdgeOption[]
}>

type ReadDependencies = {
  getEdges: () => Promise<EdgeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getEdges } = await import("@workspace/db")

  return {
    getEdges,
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

  return toMaintenancePageLoaderData(result)
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
  return renderMaintenancePage(loaderData, ({ edges }) => (
    <main className="mt-8">
      <EdgesTable edges={edges} />
    </main>
  ))
}
