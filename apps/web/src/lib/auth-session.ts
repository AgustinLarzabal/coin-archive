import { createServerFn } from "@tanstack/react-start"

export const getAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getRequestAuthSession } = await import("./auth-session.server")

    return getRequestAuthSession()
  }
)
