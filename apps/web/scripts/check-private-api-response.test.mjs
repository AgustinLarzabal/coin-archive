import assert from "node:assert/strict"
import { test } from "node:test"

import { checkPrivateApiResponse } from "./check-private-api-response.mjs"

test("accepts Cloudflare's disabled-route response", async () => {
  await checkPrivateApiResponse(new Response("error code: 1042\n", { status: 404 }))
})

test("rejects a public catalogue response", async () => {
  await assert.rejects(
    checkPrivateApiResponse(new Response('{"coins":[]}', { status: 200 })),
    /blocked route/
  )
})

test("rejects an application 404", async () => {
  await assert.rejects(
    checkPrivateApiResponse(new Response('{"error":"Not found"}', { status: 404 })),
    /blocked-route response/
  )
})

test("rejects a server error with a 1042 body", async () => {
  await assert.rejects(
    checkPrivateApiResponse(new Response("error code: 1042", { status: 500 })),
    /blocked route/
  )
})
