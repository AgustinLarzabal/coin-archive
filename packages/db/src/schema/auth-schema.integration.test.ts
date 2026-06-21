import { count, sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { db, user } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("Better Auth user role constraints", () => {
  useTestDatabaseIsolation(db)

  it("defaults new collectors to the collector role", async () => {
    await db.execute(sql`
      insert into "user" (
        "id",
        "name",
        "email",
        "email_verified"
      )
      values (
        'collector-default',
        'Collector Default',
        'collector-default@example.com',
        true
      )
    `)

    const createdUser = (
      await db.select().from(user).where(sql`${user.id} = 'collector-default'`)
    ).at(0)

    expect(createdUser?.role).toBe("collector")
  })

  it("accepts each supported collector role value", async () => {
    await db.insert(user).values([
      {
        id: "collector-role-collector",
        name: "Collector",
        email: "collector-role-collector@example.com",
        emailVerified: true,
        role: "collector",
      },
      {
        id: "collector-role-editor",
        name: "Editor",
        email: "collector-role-editor@example.com",
        emailVerified: true,
        role: "editor",
      },
      {
        id: "collector-role-admin",
        name: "Admin",
        email: "collector-role-admin@example.com",
        emailVerified: true,
        role: "admin",
      },
    ])

    const result = (await db.select({ count: count() }).from(user)).at(0)

    expect(result?.count).toBe(3)
  })

  it("rejects unsupported collector role values at the database layer", async () => {
    await expect(
      db.execute(sql`
        insert into "user" (
          "id",
          "name",
          "email",
          "email_verified",
          "role"
        )
        values (
          'collector-role-owner',
          'Owner',
          'collector-role-owner@example.com',
          true,
          'owner'
        )
      `)
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23514",
        constraint_name: "user_role_check",
      }),
    })
  })
})
