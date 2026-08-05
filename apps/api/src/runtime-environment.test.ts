import { describe, expect, it } from "vitest"

import { parseRuntimeEnvironment } from "./runtime-environment"

const completeEnvironment = {
  API_ENVIRONMENT: "staging",
  BETTER_AUTH_SECRET: "better-auth-secret",
  BETTER_AUTH_TRUSTED_ORIGINS: "https://staging.coinarchive.app",
  BETTER_AUTH_URL: "https://api.staging.coinarchive.app",
  DATABASE_URL: "postgresql://archive.example.test/coin_archive",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  R2_ACCESS_KEY_ID: "r2-access-key-id",
  R2_BUCKET: "coin-archive-staging-surface-images",
  R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  R2_SECRET_ACCESS_KEY: "r2-secret-access-key",
  SURFACE_IMAGE_ORIGIN: "https://images.staging.coinarchive.app",
}

describe("parseRuntimeEnvironment", () => {
  it("returns every runtime setting consumed by the API Worker", () => {
    expect(parseRuntimeEnvironment(completeEnvironment)).toEqual({
      apiEnvironment: "staging",
      betterAuthSecret: "better-auth-secret",
      betterAuthTrustedOrigins: "https://staging.coinarchive.app",
      betterAuthUrl: "https://api.staging.coinarchive.app",
      databaseUrl: "postgresql://archive.example.test/coin_archive",
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      r2AccessKeyId: "r2-access-key-id",
      r2Bucket: "coin-archive-staging-surface-images",
      r2Endpoint: "https://account.r2.cloudflarestorage.com",
      r2SecretAccessKey: "r2-secret-access-key",
      surfaceImageOrigin: "https://images.staging.coinarchive.app",
    })
  })

  it("preserves nonblank opaque values exactly as supplied", () => {
    const opaqueSecret = " secret-with-significant-whitespace "

    expect(
      parseRuntimeEnvironment({
        ...completeEnvironment,
        BETTER_AUTH_SECRET: opaqueSecret,
      }).betterAuthSecret
    ).toBe(opaqueSecret)
  })

  it("lists every missing or blank runtime setting in one error", () => {
    expect(() =>
      parseRuntimeEnvironment({
        ...completeEnvironment,
        BETTER_AUTH_SECRET: " ",
        DATABASE_URL: undefined,
        GOOGLE_CLIENT_SECRET: "\t",
      })
    ).toThrow(
      "Missing required runtime configuration: BETTER_AUTH_SECRET, DATABASE_URL, GOOGLE_CLIENT_SECRET."
    )
  })

  it("rejects an unknown named deployment environment", () => {
    expect(() =>
      parseRuntimeEnvironment({
        ...completeEnvironment,
        API_ENVIRONMENT: "preview",
      })
    ).toThrow(
      'Invalid API_ENVIRONMENT: expected "staging" or "production".'
    )
  })

  it("never includes supplied secret values in validation errors", () => {
    const suppliedSecret = "do-not-print-this-secret"

    expect(() =>
      parseRuntimeEnvironment({
        ...completeEnvironment,
        BETTER_AUTH_SECRET: suppliedSecret,
        DATABASE_URL: " ",
        GOOGLE_CLIENT_SECRET: suppliedSecret,
        R2_SECRET_ACCESS_KEY: suppliedSecret,
      })
    ).not.toThrow(suppliedSecret)
  })
})
