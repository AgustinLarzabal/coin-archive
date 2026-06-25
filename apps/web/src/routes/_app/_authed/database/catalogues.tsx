import { createFileRoute } from "@tanstack/react-router"
import type { CatalogueOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { CataloguesTable } from "@/components/tables/catalogues/catalogues-table"
import {
  type CatalogueAuthorizationErrorResult,
  createCatalogueAuthorizationError,
  hasCatalogueMaintenanceAccess,
} from "@/lib/catalogue-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadCatalogueMaintenanceCataloguesResult =
  | CatalogueAuthorizationErrorResult
  | {
      status: "success"
      catalogues: CatalogueOption[]
    }

type CatalogueMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      catalogues: CatalogueOption[]
    }

type CatalogueReadDependencies = {
  getCatalogues: () => Promise<CatalogueOption[]>
}

async function getDefaultCatalogueReadDependencies(): Promise<CatalogueReadDependencies> {
  const { getCatalogues } = await import("@workspace/db")

  return {
    getCatalogues,
  }
}

export async function loadCatalogueMaintenanceCatalogues(
  collector: CollectorWithRole | null,
  dependencies?: CatalogueReadDependencies
): Promise<LoadCatalogueMaintenanceCataloguesResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createCatalogueAuthorizationError()
  }

  const { getCatalogues } =
    dependencies ?? (await getDefaultCatalogueReadDependencies())

  return {
    status: "success",
    catalogues: await getCatalogues(),
  }
}

export const Route = createFileRoute("/_app/_authed/database/catalogues")({
  loader: async ({ context }) => {
    const result = await loadCatalogueMaintenanceCatalogues(context.session.user)

    if (result.status === "error") {
      return {
        isAllowed: false,
      } satisfies CatalogueMaintenanceLoaderData
    }

    return {
      isAllowed: true,
      catalogues: result.catalogues,
    } satisfies CatalogueMaintenanceLoaderData
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
