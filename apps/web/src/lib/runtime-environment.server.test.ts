import { describe, expect, it } from "vitest"

import { getRuntimeEnvironment } from "./runtime-environment.server"

const validEnvironment = {
  BETTER_AUTH_SECRET: "test-auth-secret",
  BETTER_AUTH_URL: "https://archive.example.test",
  DATABASE_URL: "postgresql://archive.example.test/coin_archive",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  R2_ACCESS_KEY_ID: "test-r2-access-key",
  R2_BUCKET: "coin-archive-surface-images",
  R2_ENDPOINT: "https://account-id.r2.cloudflarestorage.com",
  R2_PUBLIC_BASE_URL: "https://images.example.test",
  R2_SECRET_ACCESS_KEY: "test-r2-secret",
}

describe("getRuntimeEnvironment", () => {
  it("returns the Worker or local runtime settings needed by the server", () => {
    expect(getRuntimeEnvironment(validEnvironment)).toEqual({
      auth: {
        betterAuthSecret: "test-auth-secret",
        betterAuthUrl: "https://archive.example.test",
        googleClientId: "test-google-client-id",
        googleClientSecret: "test-google-client-secret",
      },
      databaseUrl: "postgresql://archive.example.test/coin_archive",
      r2: {
        accessKeyId: "test-r2-access-key",
        bucket: "coin-archive-surface-images",
        endpoint: "https://account-id.r2.cloudflarestorage.com",
        publicBaseUrl: "https://images.example.test",
        secretAccessKey: "test-r2-secret",
      },
    })
  })

  it("lists every missing required setting without exposing values", () => {
    expect(() => getRuntimeEnvironment({ DATABASE_URL: " " })).toThrow(
      "Missing required runtime configuration: BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, R2_ACCESS_KEY_ID, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL, R2_SECRET_ACCESS_KEY."
    )
  })
})
