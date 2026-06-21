import { createFileRoute } from "@tanstack/react-router"

import { auth } from "@workspace/auth/server"

export function handleAuthRequest({ request }: { request: Request }) {
  return auth.handler(request)
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuthRequest,
      POST: handleAuthRequest,
    },
  },
})
