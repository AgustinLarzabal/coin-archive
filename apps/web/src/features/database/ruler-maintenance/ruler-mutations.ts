import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateRuler,
  submitDeleteRuler,
  submitUpdateRuler,
} from "./actions.server"
import type {
  CreateRulerInput,
  DeleteRulerInput,
  UpdateRulerInput,
} from "./ruler-validation"

export const createRulerMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CreateRulerInput & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateRuler(data))

export const replaceRulerMutation = createServerFn({ method: "POST" })
  .inputValidator((data: UpdateRulerInput) => data)
  .handler(({ data }) => submitUpdateRuler(data))

export const deleteRulerMutation = createServerFn({ method: "POST" })
  .inputValidator((data: DeleteRulerInput) => data)
  .handler(({ data }) => submitDeleteRuler(data))
