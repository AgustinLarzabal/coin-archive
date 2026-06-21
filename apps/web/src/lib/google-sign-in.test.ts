import { beforeEach, describe, expect, it, vi } from "vitest"

const { signInSocial } = vi.hoisted(() => ({
  signInSocial: vi.fn(),
}))

vi.mock("@workspace/auth/client", () => ({
  authClient: {
    signIn: {
      social: signInSocial,
    },
  },
}))

describe("startGoogleSignIn", () => {
  beforeEach(() => {
    signInSocial.mockClear()
  })

  it("delegates sign-in to Better Auth's Google flow", async () => {
    const { startGoogleSignIn } = await import("./google-sign-in")

    await startGoogleSignIn("/coins/coin-1")

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/coins/coin-1",
    })
  })

  it("falls back to the catalogue root for unsafe callback targets", async () => {
    const { startGoogleSignIn } = await import("./google-sign-in")

    await startGoogleSignIn("https://example.com")

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    })
  })

  it("falls back to the catalogue root for blocked in-app callback targets", async () => {
    const { startGoogleSignIn } = await import("./google-sign-in")

    await startGoogleSignIn("/login")

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    })
  })
})
