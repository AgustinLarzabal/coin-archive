import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { account, db, session, user, verification } from "@workspace/db"

import { getAuthEnvironment } from "./env"
import {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
} from "./roles"

function createAuth() {
  const authEnvironment = getAuthEnvironment()

  return betterAuth({
    secret: authEnvironment.betterAuthSecret,
    baseURL: authEnvironment.betterAuthUrl,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        account,
        session,
        user,
        verification,
      },
    }),
    plugins: [tanstackStartCookies()],
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
}

let configuredAuth: ReturnType<typeof createAuth> | undefined

function getAuth() {
  configuredAuth ??= createAuth()

  return configuredAuth
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, property, receiver) {
    const value = Reflect.get(getAuth(), property, receiver)

    return typeof value === "function" ? value.bind(getAuth()) : value
  },
})

export { collectorRoleValues, hasAdminAccess, hasEditorAccess, isCollectorRole }

export type { CollectorRole } from "./roles"
