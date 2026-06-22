import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { getAuthSession } from "../../lib/auth-session"
import { getCollectorRouteRedirect } from "../../lib/private-route"
import { AuthedHeader } from "@/components/authed-header"

function getRouteRedirectTarget(location: {
  hash: string
  pathname: string
  searchStr: string
}) {
  return `${location.pathname}${location.searchStr}${location.hash}`
}

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession()
    if (session === null) {
      const loginRedirect = getCollectorRouteRedirect(
        false,
        getRouteRedirectTarget(location)
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
    <div className="flex min-h-svh flex-col">
      <div className="flex h-screen flex-col md:ml-[70px]">
        <AuthedHeader />
        <div className="grow p-4 md:px-8 md:py-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
