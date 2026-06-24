import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { getAuthSession } from "../../../lib/auth-session"
import { getLocationRedirectTarget } from "../../../lib/auth-redirect"
import { getCollectorRouteRedirect } from "../../../lib/route-authorization"

export const Route = createFileRoute("/_app/_authed")({
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession()
    if (session === null) {
      const loginRedirect = getCollectorRouteRedirect(
        false,
        getLocationRedirectTarget(location)
      )

      if (loginRedirect === null) {
        throw new Error(
          "Missing login redirect for unauthenticated route access."
        )
      }

      throw redirect(loginRedirect)
    }

    return { session }
  },
  component: AuthedRouteComponent,
})

function AuthedRouteComponent() {
  return (
    <div className="grid grow p-4 md:px-8 md:py-6">
      <Outlet />
    </div>
  )
}
