import { z } from "zod"

export const slugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const displayTextSchema = (maximumLength: number) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .regex(/^\S(?:[\s\S]*\S)?$/)

export const namedSlugResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export type NamedSlugResponse = z.infer<typeof namedSlugResponseSchema>

export const historicalYearSchema = z
  .int()
  .refine((year) => year !== 0, "Issue Year cannot be zero")

export function errorResponseSchema<
  const TCode extends string,
  const TMessage extends string,
>(code: TCode, message: TMessage) {
  return z.object({
    error: z.object({
      code: z.literal(code),
      message: z.literal(message),
    }),
  })
}
