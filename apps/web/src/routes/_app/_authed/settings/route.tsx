import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/_authed/settings")({
  component: SettingsRouteComponent,
})

function SettingsRouteComponent() {
  return <Outlet />
}
