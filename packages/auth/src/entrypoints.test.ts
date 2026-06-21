import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { setAuthTestEnvironment } from "./test-environment"

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
    setAuthTestEnvironment()

    const source = await import("./server")
    const serverFile = await readFile(resolve(sourceDirectory, "server.ts"), "utf8")

    expect(Object.keys(source)).toContain("auth")
    expect(serverFile).toContain("@workspace/db")
  })
})
