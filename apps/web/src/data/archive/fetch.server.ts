import { env } from "cloudflare:workers"

export function fetchArchive(path: string) {
  if (import.meta.env.DEV) return fetch(`http://localhost:3001${path}`)
  return env.API.fetch(new Request(`https://api.internal${path}`))
}
