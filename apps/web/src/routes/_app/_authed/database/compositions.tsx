import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { CompositionOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { CompositionsTable } from "@/components/tables/compositions/compositions-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type CompositionAuthorizationErrorResult,
  createCompositionAuthorizationError,
  hasCompositionMaintenanceAccess,
} from "@/lib/composition-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadCompositionMaintenanceCompositionsResult =
  | CompositionAuthorizationErrorResult
  | {
      status: "success"
      compositions: CompositionOption[]
    }

type CompositionMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      compositions: CompositionOption[]
    }

type CompositionReadDependencies = {
  getCompositions: () => Promise<CompositionOption[]>
}

async function getDefaultCompositionReadDependencies(): Promise<CompositionReadDependencies> {
  const { getCompositions } = await import("@workspace/db")

  return {
    getCompositions,
  }
}

export async function loadCompositionMaintenanceCompositions(
  collector: CollectorWithRole | null,
  dependencies?: CompositionReadDependencies
): Promise<LoadCompositionMaintenanceCompositionsResult> {
  if (!hasCompositionMaintenanceAccess(collector)) {
    return createCompositionAuthorizationError()
  }

  const { getCompositions } =
    dependencies ?? (await getDefaultCompositionReadDependencies())

  return {
    status: "success",
    compositions: await getCompositions(),
  }
}

const getCompositionMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCompositionMaintenanceCompositions(
    session?.user ?? null
  )

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies CompositionMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    compositions: result.compositions,
  } satisfies CompositionMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/compositions")({
  loader: () => getCompositionMaintenanceLoaderData(),
  component: DatabaseCompositionsComponent,
})

function DatabaseCompositionsComponent() {
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
      <CompositionsTable compositions={loaderData.compositions} />
    </main>
  )
}
