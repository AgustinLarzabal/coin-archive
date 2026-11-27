import assert from "node:assert/strict"

export async function checkPrivateApiResponse(response) {
  assert.equal(response.status, 404, "Private API did not return a blocked route")
  assert.equal(
    (await response.text()).trim(),
    "error code: 1042",
    "Private API did not return Cloudflare's blocked-route response"
  )
}
