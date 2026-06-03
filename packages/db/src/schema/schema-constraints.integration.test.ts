import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db, issuer } from "../index"
import { useTestDatabaseIsolation } from "../testing/test-database"

async function expectConstraintError(
  promise: Promise<unknown>,
  constraintName: string,
  code: string
) {
  await expect(promise).rejects.toMatchObject({
    cause: expect.objectContaining({
      code,
      constraint_name: constraintName,
    }),
  })
}

describe("issuer schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects issuer codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(issuer).values({
        code: "Roman Empire",
        name: "Roman Empire",
      }),
      "issuer_code_slug_check",
      "23514"
    )
  })

  it("rejects duplicate issuer codes", async () => {
    await db.insert(issuer).values({
      code: "roman-empire",
      name: "Roman Empire",
    })

    await expectConstraintError(
      db.insert(issuer).values({
        code: "roman-empire",
        name: "Duplicate Roman Empire",
      }),
      "issuer_code_unique_idx",
      "23505"
    )
  })

  it("rejects an issuer grouping where the issuer is its own parent", async () => {
    const issuerId = randomUUID()

    await expectConstraintError(
      testDb.insert(issuer).values({
        id: issuerId,
        code: "self-parented-issuer",
        name: "Self Parented Issuer",
        parentIssuerId: issuerId,
      }),
      "issuer_parent_issuer_id_self_check",
      "23514"
    )
  })
})

describe("coin schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("requires every coin to have exactly one direct issuer", async () => {
    await expect(
      db.execute(sql`
        insert into "coin" ("title", "issuer_id")
        values (${"Issuerless Test Coin"}, ${null})
      `)
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23502",
        column_name: "issuer_id",
      }),
    })
  })
})
