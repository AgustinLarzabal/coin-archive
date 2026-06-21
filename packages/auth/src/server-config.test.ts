import { describe, expect, it } from "vitest"

import { setAuthTestEnvironment } from "./test-environment"

describe("Better Auth server configuration", () => {
  it(
    "configures the TanStack Start cookie plugin required for auth cookie flows",
    async () => {
      setAuthTestEnvironment()

      const { auth } = await import("./server")

      expect(auth.options.plugins.map((plugin) => plugin.id)).toContain(
        "tanstack-start-cookies"
      )
    },
    10000
  )

  it("configures the collector role field with a default and disallows user input", async () => {
    setAuthTestEnvironment()

    const { auth, collectorRoleValues } = await import("./server")

    expect(auth.options.user.additionalFields.role).toMatchObject({
      type: collectorRoleValues,
      defaultValue: "collector",
      input: false,
    })
  })

  it("configures Google as the initial social sign-in provider", async () => {
    setAuthTestEnvironment()

    const { auth } = await import("./server")

    expect(auth.options.socialProviders).toMatchObject({
      google: {
        clientId: "test-google-client-id",
        clientSecret: "test-google-client-secret",
      },
    })
  })
})
