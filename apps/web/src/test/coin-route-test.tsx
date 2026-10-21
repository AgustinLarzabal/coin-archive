import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render } from "@testing-library/react"
import { getRouter } from "@/router"
import { jsonResponse } from "@/test/archive-route-test"

export { jsonResponse }

export const coinId = "00000000-0000-4000-8000-000000000001"

export function renderCoinRoute(id = coinId) {
  const history = createMemoryHistory({ initialEntries: [`/coins/${id}`] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}
