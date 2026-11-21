import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import { env } from "cloudflare:workers"

export default createServerEntry({
  async fetch(request, opts) {
    const started = Date.now()
    const caller = request.headers.get("CF-Connecting-IP")
    if (!import.meta.env.DEV && !caller) {
      console.error("archive_request", { status: 503 })
      return new Response("Archive temporarily unavailable", { status: 503 })
    }
    if (!import.meta.env.DEV && caller) {
      const { success } = await env.ARCHIVE_RATE_LIMIT.limit({ key: caller })
      if (!success) {
        console.warn("archive_request", { status: 429 })
        return new Response("Too many requests. Please retry in one minute.", {
          status: 429,
          headers: { "Retry-After": "60", "Cache-Control": "no-store" },
        })
      }
    }
    const response = await handler.fetch(request, opts)
    console.info("archive_request", {
      status: response.status,
      durationMs: Date.now() - started,
    })
    return response
  },
})
