import { createFileRoute } from "@tanstack/react-router"
import type { CatalogueOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { CataloguesTable } from "@/components/tables/catalogues/catalogues-table"
import {
  createCatalogueAuthorizationError,
  hasCatalogueMaintenanceAccess,
} from "@/lib/catalogue-maintenance"

type CatalogueMaintenanceCataloguesResult =
  | {
      status: "error"
      formError: string
    }
  | {
      status: "success"
      catalogues: CatalogueOption[]
    }

type CatalogueMaintenanceCataloguesLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      catalogues: CatalogueOption[]
    }

type CatalogueMaintenanceReadDependencies = {
  getCatalogues: () => Promise<CatalogueOption[]>
}

async function getDefaultCatalogueMaintenanceReadDependencies(): Promise<CatalogueMaintenanceReadDependencies> {
  const { getCatalogues } = await import("@workspace/db")

  return {
    getCatalogues,
  }
}

export async function loadCatalogueMaintenanceCatalogues(
  collector: { role?: string | null } | null,
  dependencies?: CatalogueMaintenanceReadDependencies
): Promise<CatalogueMaintenanceCataloguesResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createCatalogueAuthorizationError()
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCatalogueMaintenanceReadDependencies())

  return {
    status: "success",
    catalogues: await resolvedDependencies.getCatalogues(),
  }
}

export const Route = createFileRoute("/_app/_authed/database/catalogues")({
  loader: async ({ context }) => {
    const result = await loadCatalogueMaintenanceCatalogues(context.session.user)

    if (result.status === "error") {
      return {
        isAllowed: false,
      } satisfies CatalogueMaintenanceCataloguesLoaderData
    }

    return {
      isAllowed: true,
      catalogues: result.catalogues,
    } satisfies CatalogueMaintenanceCataloguesLoaderData
  },
  component: DatabaseCataloguesComponent,
})

function DatabaseCataloguesComponent() {
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
      <CataloguesTable catalogues={loaderData.catalogues} />
    </main>
  )
}
