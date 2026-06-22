import { createFileRoute } from "@tanstack/react-router"

import { PrivatePage } from "../../components/private-page"

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsPage,
})

function SettingsPage() {
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
