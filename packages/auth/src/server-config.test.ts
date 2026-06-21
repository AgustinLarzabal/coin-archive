import { describe, expect, it } from "vitest"

describe("Better Auth server configuration", () => {
  it("configures the collector role field with a default and disallows user input", async () => {
    process.env.DATABASE_URL = "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive"
    process.env.BETTER_AUTH_SECRET = "test-secret"
    process.env.BETTER_AUTH_URL = "http://localhost:3000"
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"

    const { auth, collectorRoleValues } = await import("./server")

    expect(auth.options.user.additionalFields.role).toMatchObject({
      type: collectorRoleValues,
      defaultValue: "collector",
      input: false,
    })
  })

  it("configures Google as the initial social sign-in provider", async () => {
    process.env.DATABASE_URL = "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive"
    process.env.BETTER_AUTH_SECRET = "test-secret"
    process.env.BETTER_AUTH_URL = "http://localhost:3000"
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"

    const { auth } = await import("./server")

    expect(auth.options.socialProviders).toMatchObject({
      google: {
        clientId: "test-google-client-id",
        clientSecret: "test-google-client-secret",
      },
    })
  })
})
