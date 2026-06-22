import { SiteHeader } from "@/components/site-header"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(public)")({
  component: PublicRouteComponent,
})

function PublicRouteComponent() {
  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  )
}
