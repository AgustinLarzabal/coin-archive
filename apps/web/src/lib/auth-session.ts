import { createServerFn } from "@tanstack/react-start"

export const getAuthSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const [{ auth }, { getRequestHeaders }] = await Promise.all([
      import("@workspace/auth/server"),
      import("@tanstack/react-start/server"),
    ])

    return auth.api.getSession({
      headers: getRequestHeaders(),
    })
  }
)
