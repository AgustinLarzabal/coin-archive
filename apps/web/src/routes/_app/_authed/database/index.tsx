import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/_authed/database/")({
  component: DatabaseIndexComponent,
})

function DatabaseIndexComponent() {
  return <main className="mt-8"></main>
}
