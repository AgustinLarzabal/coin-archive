import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { getAuthSession } from "../../lib/auth-session"
import { getCollectorRouteRedirect } from "../../lib/private-route"

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
    const loginRedirect = getCollectorRouteRedirect(
      session !== null,
      getRouteRedirectTarget(location)
    )

    if (loginRedirect !== null) {
      throw redirect(loginRedirect)
    }
  },
  component: AuthedRouteComponent,
})

function AuthedRouteComponent() {
  return (
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-3xl">
        <Outlet />
      </div>
    </main>
  )
}
