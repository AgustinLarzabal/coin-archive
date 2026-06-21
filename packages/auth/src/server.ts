import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@workspace/db"

import { getAuthEnvironment } from "./env"
import {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
} from "./roles"

const authEnvironment = getAuthEnvironment()

export const auth = betterAuth({
  secret: authEnvironment.betterAuthSecret,
  baseURL: authEnvironment.betterAuthUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: authEnvironment.googleClientId,
      clientSecret: authEnvironment.googleClientSecret,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: [...collectorRoleValues],
        required: false,
        defaultValue: "collector",
        input: false,
      },
    },
  },
})

export {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
}

export type { CollectorRole } from "./roles"
