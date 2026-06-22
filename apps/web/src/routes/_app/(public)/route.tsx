import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Footer } from "@/components/footer"

export const Route = createFileRoute("/_app/(public)")({
  component: PublicRouteComponent,
})

function PublicRouteComponent() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 p-6">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
