import { z } from "zod"

import {
  ISSUER_INVALID_CODE_ERROR,
  ISSUER_INVALID_ISO_CODE_ERROR,
} from "./messages"

const ISSUER_FIELD_NAMES = [
  "code",
  "isoCode",
  "name",
  "parentIssuerId",
] as const

const issuerCodeSchema = z
  .string()
  .trim()
  .min(1, "Issuer Code cannot be blank.")
  .max(255, "Issuer Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ISSUER_INVALID_CODE_ERROR)

const issuerIsoCodeSchema = z
  .string()
  .trim()
  .min(1, "Issuer ISO Code cannot be blank.")
  .max(2, ISSUER_INVALID_ISO_CODE_ERROR)
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z]{2}$/.test(value), ISSUER_INVALID_ISO_CODE_ERROR)

const issuerNameSchema = z
  .string()
  .trim()
  .min(1, "Issuer Name cannot be blank.")
  .max(255, "Issuer Name must be 255 characters or fewer.")

const issuerParentIssuerIdSchema = z
  .string()
  .uuid("Parent Issuer must be a valid record.")
  .nullable()

export const createIssuerInputSchema = z.object({
  code: issuerCodeSchema,
  isoCode: issuerIsoCodeSchema,
  name: issuerNameSchema,
  parentIssuerId: issuerParentIssuerIdSchema,
})

export const updateIssuerInputSchema = createIssuerInputSchema.extend({
  id: z.uuid(),
})

export const deleteIssuerInputSchema = z.object({
  id: z.uuid(),
})

type IssuerFieldName = (typeof ISSUER_FIELD_NAMES)[number]

export type IssuerFieldErrors = Partial<Record<IssuerFieldName, string>>

function isIssuerFieldName(field: unknown): field is IssuerFieldName {
  switch (field) {
    case "code":
    case "isoCode":
    case "name":
    case "parentIssuerId":
      return true
    default:
      return false
  }
}

export function getIssuerFieldErrors(issues: z.ZodIssue[]): IssuerFieldErrors {
  const fieldErrors: IssuerFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isIssuerFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}
