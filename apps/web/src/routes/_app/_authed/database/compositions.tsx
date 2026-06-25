import { createFileRoute } from "@tanstack/react-router"
import type { CompositionOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { CompositionsTable } from "@/components/tables/compositions/compositions-table"
import {
  createCatalogueAuthorizationError,
  hasCatalogueMaintenanceAccess,
} from "@/lib/catalogue-maintenance"

type CompositionMaintenanceCompositionsResult =
  | {
      status: "error"
      formError: string
    }
  | {
      status: "success"
      compositions: CompositionOption[]
    }

type CompositionMaintenanceCompositionsLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      compositions: CompositionOption[]
    }

type CompositionMaintenanceReadDependencies = {
  getCompositions: () => Promise<CompositionOption[]>
}

async function getDefaultCompositionMaintenanceReadDependencies(): Promise<CompositionMaintenanceReadDependencies> {
  const { getCompositions } = await import("@workspace/db")

  return {
    getCompositions,
  }
}

export async function loadCompositionMaintenanceCompositions(
  collector: { role?: string | null } | null,
  dependencies?: CompositionMaintenanceReadDependencies
): Promise<CompositionMaintenanceCompositionsResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createCatalogueAuthorizationError()
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCompositionMaintenanceReadDependencies())

  return {
    status: "success",
    compositions: await resolvedDependencies.getCompositions(),
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
      } satisfies CompositionMaintenanceCompositionsLoaderData
    }

    return {
      isAllowed: true,
      compositions: result.compositions,
    } satisfies CompositionMaintenanceCompositionsLoaderData
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
