import { createFileRoute, redirect } from "@tanstack/react-router"

import { PrivatePage } from "../components/private-page"
import { getAuthSession } from "../lib/auth-session"
import { getCollectorRouteRedirect } from "../lib/private-route"

const SETTINGS_ROUTE_PATH = "/settings"

export const Route = createFileRoute("/settings")({
  beforeLoad: async () => {
    const session = await getAuthSession()
    const isSignedIn = session !== null
    const loginRedirect = getCollectorRouteRedirect(
      isSignedIn,
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
