import { describe, expect, it, vi } from "vitest"

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
  it("delegates sign-in to Better Auth's Google flow", async () => {
    const { startGoogleSignIn } = await import("./google-sign-in")

    await startGoogleSignIn("/coins/coin-1")

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/coins/coin-1",
    })
  })
})
