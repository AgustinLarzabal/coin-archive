import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { account, db, session, user, verification } from "@coin-archive/db"

import { getAuthEnvironment, parseTrustedOrigins } from "./env"
import {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
} from "./roles"

type AuthDatabase = typeof db

export function createAuth({
  database = db,
  environment = getAuthEnvironment(),
}: {
  database?: AuthDatabase
  environment?: ReturnType<typeof getAuthEnvironment>
} = {}) {
  const trustedOrigins = [
    ...new Set([environment.betterAuthUrl, ...environment.trustedOrigins]),
  ]

  return betterAuth({
    secret: environment.betterAuthSecret,
    baseURL: {
      allowedHosts: trustedOrigins.map((origin) => new URL(origin).host),
      fallback: environment.betterAuthUrl,
      protocol: "auto",
    },
    trustedOrigins,
    advanced: {
      disableOriginCheck: false,
      trustedProxyHeaders: true,
      useSecureCookies:
        new URL(environment.betterAuthUrl).protocol === "https:",
    },
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: {
        account,
        session,
        user,
        verification,
      },
    }),
    socialProviders: {
      google: {
        clientId: environment.googleClientId,
        clientSecret: environment.googleClientSecret,
      },
    },
    session: {
      cookieCache: { enabled: false },
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

export type Auth = ReturnType<typeof createAuth>

export {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
  parseTrustedOrigins,
}

export type { CollectorRole } from "./roles"
