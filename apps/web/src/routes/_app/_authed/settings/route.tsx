import { Outlet, createFileRoute } from "@tanstack/react-router"
import { SecondaryMenu } from "@/components/secondary-menu"

export const Route = createFileRoute("/_app/_authed/settings")({
  component: SettingsRouteComponent,
})

function SettingsRouteComponent() {
  return (
    <div className="max-w-3xl">
      <SecondaryMenu items={[{ to: "/settings", label: "General" }]} />

      <Outlet />
    </div>
  )
}
