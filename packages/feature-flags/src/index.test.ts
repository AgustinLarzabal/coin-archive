import { describe, expect, it } from "vitest"

import { productFlags } from "./index"

describe("productFlags", () => {
  it("defines the enabled-by-default header sign-in flag", () => {
    expect(productFlags).toEqual({
      showSignInButton: {
        defaultValue: true,
        description:
          "Controls whether an unauthenticated person sees the header Sign in button.",
      },
    })
  })
})
