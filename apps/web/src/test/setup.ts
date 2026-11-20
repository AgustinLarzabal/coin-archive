import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"
import type * as ReactStart from "@tanstack/react-start"

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}))

vi.mock("@tanstack/react-start", async (importOriginal) => ({
  ...(await importOriginal<typeof ReactStart>()),
  createServerFn: () => ({
    handler: (handle: () => unknown) => handle,
    validator: (validate: (input: unknown) => unknown) => ({
      handler:
        (handle: ({ data }: { data: unknown }) => unknown) =>
        async ({ data }: { data: unknown }) =>
          handle({ data: validate(data) }),
    }),
  }),
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
