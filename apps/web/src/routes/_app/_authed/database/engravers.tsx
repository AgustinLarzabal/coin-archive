import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { EngraverOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { EngraversTable } from "@/components/tables/engravers/engravers-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type EngraverAuthorizationErrorResult,
  createEngraverAuthorizationError,
  hasEngraverMaintenanceAccess,
} from "@/lib/engraver-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadEngraverMaintenanceEngraversResult =
  | EngraverAuthorizationErrorResult
  | {
      status: "success"
      engravers: EngraverOption[]
    }

type EngraverMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      engravers: EngraverOption[]
    }

type EngraverReadDependencies = {
  getEngravers: () => Promise<EngraverOption[]>
}

async function getDefaultEngraverReadDependencies(): Promise<EngraverReadDependencies> {
  const { getEngravers } = await import("@workspace/db")

  return {
    getEngravers,
  }
}

async function resolveEngraverReadDependencies(
  dependencies?: EngraverReadDependencies
): Promise<EngraverReadDependencies> {
  return dependencies ?? getDefaultEngraverReadDependencies()
}

export async function loadEngraverMaintenanceEngravers(
  collector: CollectorWithRole | null,
  dependencies?: EngraverReadDependencies
): Promise<LoadEngraverMaintenanceEngraversResult> {
  if (!hasEngraverMaintenanceAccess(collector)) {
    return createEngraverAuthorizationError()
  }

  const { getEngravers } = await resolveEngraverReadDependencies(
    dependencies
  )

  return {
    status: "success",
    engravers: await getEngravers(),
  }
}

const getEngraverMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadEngraverMaintenanceEngravers(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies EngraverMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    engravers: result.engravers,
  } satisfies EngraverMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/engravers")({
  loader: () => getEngraverMaintenanceLoaderData(),
  component: DatabaseEngraversComponent,
})

function DatabaseEngraversComponent() {
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
      <EngraversTable engravers={loaderData.engravers} />
    </main>
  )
}
