import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { OrientationOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { OrientationsTable } from "@/components/tables/orientations/orientations-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

type LoadOrientationMaintenanceOrientationsResult =
  | {
      status: "error"
    }
  | {
      status: "success"
      orientations: OrientationOption[]
    }

type OrientationMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      orientations: OrientationOption[]
    }

type OrientationReadDependencies = {
  getOrientations: () => Promise<OrientationOption[]>
}

async function getDefaultOrientationReadDependencies(): Promise<OrientationReadDependencies> {
  const { getOrientations } = await import("@workspace/db")

  return {
    getOrientations,
  }
}

async function resolveOrientationReadDependencies(
  dependencies?: OrientationReadDependencies
): Promise<OrientationReadDependencies> {
  return dependencies ?? getDefaultOrientationReadDependencies()
}

export async function loadOrientationMaintenanceOrientations(
  collector: CollectorWithRole | null,
  dependencies?: OrientationReadDependencies
): Promise<LoadOrientationMaintenanceOrientationsResult> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      status: "error",
    }
  }

  const { getOrientations } =
    await resolveOrientationReadDependencies(dependencies)

  return {
    status: "success",
    orientations: await getOrientations(),
  }
}

const getOrientationMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadOrientationMaintenanceOrientations(
    session?.user ?? null
  )

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies OrientationMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    orientations: result.orientations,
  } satisfies OrientationMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/orientations")({
  loader: () => getOrientationMaintenanceLoaderData(),
  component: DatabaseOrientationsComponent,
})

function DatabaseOrientationsComponent() {
  return renderDatabaseOrientationsPage(Route.useLoaderData())
}

export function renderDatabaseOrientationsPage(
  loaderData: OrientationMaintenanceLoaderData
) {
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
