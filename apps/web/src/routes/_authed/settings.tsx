import { createFileRoute } from "@tanstack/react-router"

import { SettingsPage } from "./-settings-page"

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsPage,
})
