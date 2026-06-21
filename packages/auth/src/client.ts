import { createAuthClient } from "better-auth/client"
import { inferAdditionalFields } from "better-auth/client/plugins"

import type { auth } from "./server"
import {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
} from "./roles"

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})

export {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
}

export type { CollectorRole } from "./roles"
