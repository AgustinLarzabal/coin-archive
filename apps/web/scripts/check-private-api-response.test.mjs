import assert from "node:assert/strict"
import { test } from "node:test"

import { checkPrivateApiResponse } from "./check-private-api-response.mjs"

test("accepts Cloudflare's disabled-route response", async () => {
  await checkPrivateApiResponse(
    new Response("error code: 1042\n", { status: 404 })
  )
})

test("accepts Cloudflare's workers.dev page for a disabled route", async () => {
  await checkPrivateApiResponse(
    new Response(
      '<!DOCTYPE html><title>Page not found</title><link rel="icon" href="https://workers.cloudflare.com/favicon.ico"><h1>There is nothing here yet</h1>',
      { status: 404, headers: { "Content-Type": "text/html; charset=UTF-8" } }
    )
  )
})

test("rejects a public catalogue response", async () => {
  await assert.rejects(
    checkPrivateApiResponse(new Response('{"coins":[]}', { status: 200 })),
    /blocked route/
  )
})

test("rejects an application 404", async () => {
  await assert.rejects(
    checkPrivateApiResponse(
      new Response('{"error":"Not found"}', { status: 404 })
    ),
    /blocked-route response/
  )
})

test("rejects an application page with a generic not-found title", async () => {
  await assert.rejects(
    checkPrivateApiResponse(
      new Response("<title>Page not found</title>", {
        status: 404,
        headers: { "Content-Type": "text/html" },
      })
    ),
    /blocked-route response/
  )
})

test("rejects a server error with a 1042 body", async () => {
  await assert.rejects(
    checkPrivateApiResponse(new Response("error code: 1042", { status: 500 })),
    /blocked route/
  )
})
