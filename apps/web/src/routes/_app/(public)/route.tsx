import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/(public)")({
  component: PublicRouteComponent,
})

function PublicRouteComponent() {
  return (
    <div className="grow p-4 md:px-8 md:py-6">
      <Outlet />
    </div>
  )
}
