import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

type IssuerMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
    }

const getIssuerMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()

  if (!getEditorRouteAuthorization(session?.user ?? null).isAllowed) {
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
