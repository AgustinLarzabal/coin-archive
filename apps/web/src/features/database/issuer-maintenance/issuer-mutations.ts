import { createServerFn } from "@tanstack/react-start"

import {
  submitCreateIssuer,
  submitDeleteIssuer,
  submitUpdateIssuer,
} from "./actions.server"
import type {
  CreateIssuerInput,
  DeleteIssuerInput,
  UpdateIssuerInput,
} from "./validation"

export const createIssuerMutation = createServerFn({ method: "POST" })
  .inputValidator((data: CreateIssuerInput & { idempotencyKey: string }) => data)
  .handler(({ data }) => submitCreateIssuer(data))

export const replaceIssuerMutation = createServerFn({ method: "POST" })
  .inputValidator((data: UpdateIssuerInput) => data)
  .handler(({ data }) => submitUpdateIssuer(data))

export const deleteIssuerMutation = createServerFn({ method: "POST" })
  .inputValidator((data: DeleteIssuerInput) => data)
  .handler(({ data }) => submitDeleteIssuer(data))
