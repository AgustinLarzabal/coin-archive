import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

import type { auth } from "./server"

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})

export {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
} from "./roles"

export type { CollectorRole } from "./roles"

export type OAuthProvider = "google"
