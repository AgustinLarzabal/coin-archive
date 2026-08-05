import { randomUUID } from "node:crypto"
import {
  createDatabase,
  getOrientationMaintenanceRecordWithDatabase,
  orientation,
  session,
  user,
} from "@coin-archive/db"
import { eq } from "drizzle-orm"

const STAGING_WEB_ORIGIN = "https://staging.coinarchive.app"
const STAGING_PROXY_ORIGIN = "http://127.0.0.1:8790"

const databaseUrl = requiredEnvironmentVariable("DATABASE_URL")
const authSecret = requiredEnvironmentVariable("BETTER_AUTH_SECRET")

const database = createDatabase(databaseUrl)
const suffix = randomUUID().replaceAll("-", "")
const collectorId = `staging-e2e-${suffix}`
const sessionToken = `staging-e2e-session-${suffix}`
const idempotencyKey = `staging-e2e-${suffix}`
const code = `staging-e2e-${suffix}`
const collectionUrl = `${STAGING_PROXY_ORIGIN}/api/v1/maintenance/orientations`
let createdOrientationId: string | undefined

try {
  const now = new Date()
  await database.db.insert(user).values({
    id: collectorId,
    name: "Staging maintenance E2E",
    email: `${collectorId}@example.test`,
    emailVerified: true,
    role: "collector",
    createdAt: now,
    updatedAt: now,
  })
  await database.db.insert(session).values({
    id: `session-${suffix}`,
    userId: collectorId,
    token: sessionToken,
    expiresAt: new Date(now.getTime() + 10 * 60_000),
    createdAt: now,
    updatedAt: now,
  })

  await expectStatus(
    fetchStaging(collectionUrl),
    401,
    "unauthenticated maintenance request"
  )

  const cookie = await signedSessionCookie(sessionToken, authSecret)
  await expectStatus(
    fetchStaging(collectionUrl, { headers: { Cookie: cookie } }),
    403,
    "Collector maintenance request"
  )

  await database.db
    .update(user)
    .set({ role: "editor", updatedAt: new Date() })
    .where(eq(user.id, collectorId))

  const created = await fetchStaging(collectionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      "Idempotency-Key": idempotencyKey,
      Origin: STAGING_WEB_ORIGIN,
    },
    body: JSON.stringify({ code, name: "Staging maintenance E2E" }),
  })
  await assertStatus(created, 201, "Editor Orientation creation")
  assert(created.headers.get("x-request-id"), "response has X-Request-ID")

  const createdBody = (await created.json()) as {
    data?: { id?: string; version?: number }
  }
  assert(createdBody.data?.id, "creation returns an Orientation ID")
  assert(createdBody.data.version === 1, "creation returns version 1")
  createdOrientationId = createdBody.data.id

  const stored = await getOrientationMaintenanceRecordWithDatabase(
    database.db,
    createdOrientationId
  )
  assert(stored?.code === code, "staging PostgreSQL contains the Orientation")

  const listed = await fetchStaging(`${collectionUrl}?q=${code}`, {
    headers: { Cookie: cookie },
  })
  await assertStatus(listed, 200, "Editor Orientation listing")
  const listedBody = (await listed.json()) as {
    data?: Array<{ id?: string; code?: string }>
  }
  assert(
    listedBody.data?.some(
      (record) => record.id === createdOrientationId && record.code === code
    ),
    "deployed maintenance listing returns the created Orientation"
  )

  console.log("Deployed staging Orientation maintenance path passed.")
} finally {
  if (createdOrientationId !== undefined) {
    await database.db
      .delete(orientation)
      .where(eq(orientation.id, createdOrientationId))
  }
  await database.client`
    delete from maintenance_idempotency
    where collector_id = ${collectorId} and key = ${idempotencyKey}
  `
  await database.db.delete(user).where(eq(user.id, collectorId))
  await database.client.end()
}

function fetchStaging(input: string, init?: RequestInit) {
  return fetch(input, { ...init, redirect: "manual" })
}

async function expectStatus(
  responsePromise: Promise<Response>,
  expected: number,
  description: string
) {
  await assertStatus(await responsePromise, expected, description)
}

async function assertStatus(
  response: Response,
  expected: number,
  description: string
) {
  if (response.status === expected) return

  const body = await response.text()
  throw new Error(
    `${description} returned ${response.status}; expected ${expected}. ${body}`
  )
}

function assert(condition: unknown, description: string): asserts condition {
  if (!condition) throw new Error(`Expected ${description}`)
}

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required for the deployed staging E2E check`)
  }
  return value
}

async function signedSessionCookie(token: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(token)
  )
  const encodedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )

  return `__Secure-better-auth.session_token=${token}.${encodedSignature}`
}
