import { createServerFn } from "@tanstack/react-start"
import type { OrientationOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  type MaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import { createOrientationAuthorizationError, hasOrientationMaintenanceAccess } from "./actions"
import { OrientationsTable } from "./table-workflow/orientations-table"

type LoadResult = MaintenancePageLoadResult<{
  orientations: OrientationOption[]
}, ReturnType<typeof createOrientationAuthorizationError>>

type LoaderData = MaintenancePageLoaderData<{
  orientations: OrientationOption[]
}>

type ReadDependencies = {
  getOrientations: () => Promise<OrientationOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getOrientations } = await import("@workspace/db")

  return {
    getOrientations,
  }
}

export async function loadOrientationMaintenanceOrientations(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasOrientationMaintenanceAccess(collector)) {
    return createOrientationAuthorizationError()
  }

  const { getOrientations } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    orientations: await getOrientations(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadOrientationMaintenanceOrientations(
    session?.user ?? null
  )

  return toMaintenancePageLoaderData(result)
})

export function loadOrientationMaintenanceRouteData() {
  return getLoaderData()
}

type OrientationMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function OrientationMaintenanceRouteComponent({
  loaderData,
}: OrientationMaintenanceRouteComponentProps) {
  return renderOrientationMaintenancePage(loaderData)
}

export function renderOrientationMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ orientations }) => (
    <main className="mt-8">
      <OrientationsTable orientations={orientations} />
    </main>
  ))
}
