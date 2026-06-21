import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const sourceDirectory = dirname(fileURLToPath(import.meta.url))

describe("auth package entrypoints", () => {
  it("does not expose an ambiguous default entrypoint", async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(sourceDirectory, "../package.json"), "utf8")
    ) as { exports: Record<string, string> }

    expect(Object.keys(packageJson.exports)).not.toContain(".")
  })

  it("keeps the client entrypoint browser-safe", async () => {
    const source = await import("./client")
    const clientFile = await readFile(resolve(sourceDirectory, "client.ts"), "utf8")

    expect(Object.keys(source)).toContain("authClient")
    expect(Object.keys(source)).not.toContain("auth")
    expect(clientFile).not.toContain("@workspace/db")
    expect(clientFile).not.toContain("better-auth/adapters/drizzle")
  })

  it("keeps the server entrypoint separate from the client entrypoint", async () => {
    process.env.DATABASE_URL = "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive"
    process.env.BETTER_AUTH_SECRET = "test-secret"
    process.env.BETTER_AUTH_URL = "http://localhost:3000"
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"

    const source = await import("./server")
    const serverFile = await readFile(resolve(sourceDirectory, "server.ts"), "utf8")

    expect(Object.keys(source)).toContain("auth")
    expect(serverFile).toContain("@workspace/db")
  })
})
