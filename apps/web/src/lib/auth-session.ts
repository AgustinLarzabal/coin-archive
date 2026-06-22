import { createServerFn } from "@tanstack/react-start"

async function getCurrentRequestAuthSession() {
  const [{ auth }, { getRequestHeaders }] = await Promise.all([
    import("@workspace/auth/server"),
    import("@tanstack/react-start/server"),
  ])

  return auth.api.getSession({
    headers: getRequestHeaders(),
  })
}

export async function getRequestAuthSession() {
  return getCurrentRequestAuthSession()
}

export const getAuthSession = createServerFn({ method: "GET" }).handler(
  async () => getCurrentRequestAuthSession()
)
