import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

import { PrivatePage } from "../components/private-page"
import { getCollectorRouteRedirect } from "../lib/private-route"

const SETTINGS_ROUTE_PATH = "/settings"

const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const [{ auth }, { getRequestHeaders }] = await Promise.all([
    import("@workspace/auth/server"),
    import("@tanstack/react-start/server"),
  ])

  return auth.api.getSession({
    headers: getRequestHeaders(),
  })
})

export const Route = createFileRoute("/settings")({
  beforeLoad: async () => {
    const session = await getAuthSession()
    const loginRedirect = getCollectorRouteRedirect(
      session !== null,
      SETTINGS_ROUTE_PATH
    )

    if (loginRedirect !== null) {
      throw redirect(loginRedirect)
    }
  },
  component: SettingsPage,
})

export function SettingsPage() {
  return (
    <PrivatePage
      title="Settings"
      description="Manage Collector-specific settings and preferences here as the private app grows."
    >
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Collector settings will appear here later.
        </p>
      </section>
    </PrivatePage>
  )
}
