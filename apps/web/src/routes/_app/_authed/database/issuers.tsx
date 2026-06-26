import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

type LoadIssuerMaintenanceAccessResult =
  | {
      status: "error"
    }
  | {
      status: "success"
    }

type IssuerMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
    }

export async function loadIssuerMaintenanceAccess(
  collector: CollectorWithRole | null
): Promise<LoadIssuerMaintenanceAccessResult> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      status: "error",
    }
  }

  return {
    status: "success",
  }
}

const getIssuerMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadIssuerMaintenanceAccess(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies IssuerMaintenanceLoaderData
  }

  return {
    isAllowed: true,
  } satisfies IssuerMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/issuers")({
  loader: () => getIssuerMaintenanceLoaderData(),
  component: DatabaseIssuersComponent,
})

function DatabaseIssuersComponent() {
  const loaderData = Route.useLoaderData()

  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8 max-w-2xl space-y-3">
      <h1 className="text-xl font-semibold">Issuers</h1>
      <p className="text-sm text-muted-foreground">
        Issuer maintenance is being added in a follow-up slice. This entry is
        available now so the database navigation and summary stay aligned.
      </p>
    </main>
  )
}
