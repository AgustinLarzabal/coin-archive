import { createServerFn } from "@tanstack/react-start"
import type { OrientationOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createOrientationAuthorizationError, hasOrientationMaintenanceAccess } from "./actions"
import { OrientationsTable } from "./table-workflow/orientations-table"

type LoadResult =
  | ReturnType<typeof createOrientationAuthorizationError>
  | {
      status: "success"
      orientations: OrientationOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      orientations: OrientationOption[]
    }

type ReadDependencies = {
  getOrientations: () => Promise<OrientationOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getOrientations } = await import("@workspace/db")

  return {
    getOrientations,
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
    orientations: result.orientations,
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
  const result = await loadOrientationMaintenanceOrientations(session?.user ?? null)

  return toLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <OrientationsTable orientations={loaderData.orientations} />
    </main>
  )
}
