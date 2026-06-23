import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/(public)")({
  component: PublicRouteComponent,
})

function PublicRouteComponent() {
  return <Outlet />
}
