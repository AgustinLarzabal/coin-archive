import { env } from "cloudflare:workers"

export async function fetchArchive(path: string) {
  const started = Date.now()
  try {
    const response = import.meta.env.DEV
      ? await fetch(`http://localhost:3001${path}`)
      : await env.API.fetch(new Request(`https://api.internal${path}`))
    console.info("archive_backend", {
      status: response.status,
      durationMs: Date.now() - started,
    })
    return response
  } catch (error) {
    console.error("archive_backend", {
      status: "error",
      durationMs: Date.now() - started,
    })
    throw error
  }
}
