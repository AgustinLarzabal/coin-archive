import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createIssuer as createIssuerFixture } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createIssuer } from "./issuer"

const DUPLICATE_ISSUER_CODE_CONSTRAINT = {
  code: "23505",
  constraint_name: "issuer_code_unique_idx",
} as const

const INVALID_ISSUER_CODE_CONSTRAINT = {
  code: "23514",
  constraint_name: "issuer_code_slug_check",
} as const

const INVALID_ISSUER_ISO_CODE_CONSTRAINT = {
  code: "23514",
  constraint_name: "issuer_iso_code_format_check",
} as const

const INVALID_PARENT_ISSUER_CONSTRAINT = {
  code: "23503",
  constraint_name: "issuer_parent_issuer_id_issuer_id_fk",
} as const

type IssuerConstraint =
  | typeof DUPLICATE_ISSUER_CODE_CONSTRAINT
  | typeof INVALID_ISSUER_CODE_CONSTRAINT
  | typeof INVALID_ISSUER_ISO_CODE_CONSTRAINT
  | typeof INVALID_PARENT_ISSUER_CONSTRAINT

async function expectConstraintViolation(
  mutation: Promise<unknown>,
  constraint: IssuerConstraint
) {
  await expect(mutation).rejects.toMatchObject({
    cause: expect.objectContaining(constraint),
  })
}

describe("issuer mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("trims fields, normalizes the Issuer ISO Code to uppercase, and keeps the selected Parent Issuer", async () => {
    const parentIssuer = await createIssuerFixture({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })

    await expect(
      createIssuer({
        code: " provincia-de-la-rioja ",
        name: " Provincia de La Rioja ",
        isoCode: " ar ",
        parentIssuerId: ` ${parentIssuer.id} `,
      })
    ).resolves.toMatchObject({
      code: "provincia-de-la-rioja",
      name: "Provincia de La Rioja",
      isoCode: "AR",
      parentIssuerId: parentIssuer.id,
    })
  })

  it("rejects duplicate Issuer Codes after normalization", async () => {
    await createIssuerFixture({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })

    await expectConstraintViolation(
      createIssuer({
        code: " argentine-republic ",
        isoCode: "AR",
        name: "Duplicate Argentine Republic",
      }),
      DUPLICATE_ISSUER_CODE_CONSTRAINT
    )
  })

  it("rejects invalid Issuer Codes instead of silently normalizing them", async () => {
    await expectConstraintViolation(
      createIssuer({
        code: "Argentine Republic",
        isoCode: "AR",
        name: "Argentine Republic",
      }),
      INVALID_ISSUER_CODE_CONSTRAINT
    )
  })

  it("rejects invalid Issuer ISO Codes instead of silently accepting malformed values", async () => {
    await expectConstraintViolation(
      createIssuer({
        code: "argentine-republic",
        isoCode: "A1",
        name: "Argentine Republic",
      }),
      INVALID_ISSUER_ISO_CODE_CONSTRAINT
    )
  })

  it("allows duplicate Issuer Names when Issuer Codes differ", async () => {
    const firstIssuer = await createIssuer({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Republic",
    })
    const secondIssuer = await createIssuer({
      code: "french-republic",
      isoCode: "FR",
      name: "Republic",
    })

    expect(firstIssuer.name).toBe(secondIssuer.name)
    expect(firstIssuer.id).not.toBe(secondIssuer.id)
  })

  it("rejects missing Parent Issuer references", async () => {
    await expectConstraintViolation(
      createIssuer({
        code: "provincia-de-la-rioja",
        isoCode: "AR",
        name: "Provincia de La Rioja",
        parentIssuerId: "39375b8d-3850-4447-b772-635478f4eead",
      }),
      INVALID_PARENT_ISSUER_CONSTRAINT
    )
  })
})
