import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateTheme,
  submitDeleteTheme,
  submitUpdateTheme,
} from "./actions.server"
import type { ThemeDraft } from "./form-workflow/theme-form.shared"

export const createThemeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: ThemeDraft & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateTheme(data))

export const replaceThemeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: ThemeDraft & { id: string; etag: string }) => data)
  .handler(({ data }) => submitUpdateTheme(data))

export const deleteThemeMutation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(({ data }) => submitDeleteTheme(data))
