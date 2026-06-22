import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export const Route = createFileRoute("/(public)")({
  component: PublicRouteComponent,
})

function PublicRouteComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <Sidebar />
      <div className="flex h-full flex-col md:ml-[70px]">
        <Header />
        <div className="grow p-4 md:px-8 md:py-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
