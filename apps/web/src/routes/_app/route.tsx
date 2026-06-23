import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export const Route = createFileRoute("/_app")({
  component: SharedShellRouteComponent,
})

function SharedShellRouteComponent() {
  return (
    <div className="min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col md:ml-[70px]">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}
