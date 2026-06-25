import { createFileRoute } from "@tanstack/react-router"
import type { CompositionOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { CompositionsTable } from "@/components/tables/compositions/compositions-table"
import {
  type CatalogueAuthorizationErrorResult,
  createCatalogueAuthorizationError,
  hasCatalogueMaintenanceAccess,
} from "@/lib/catalogue-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadCompositionMaintenanceCompositionsResult =
  | CatalogueAuthorizationErrorResult
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
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createCatalogueAuthorizationError()
  }

  const { getCompositions } =
    dependencies ?? (await getDefaultCompositionReadDependencies())

  return {
    status: "success",
    compositions: await getCompositions(),
  }
}

export const Route = createFileRoute("/_app/_authed/database/compositions")({
  loader: async ({ context }) => {
    const result = await loadCompositionMaintenanceCompositions(
      context.session.user
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
  },
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
