import "@tanstack/react-start/server-only"

import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@coin-archive/auth/server"

export function getRequestAuthSession() {
  return auth.api.getSession({
    headers: getRequestHeaders(),
  })
}
