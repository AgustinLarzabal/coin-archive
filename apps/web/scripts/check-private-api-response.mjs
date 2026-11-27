import assert from "node:assert/strict"

export async function checkPrivateApiResponse(response) {
  assert.equal(
    response.status,
    404,
    "Private API did not return a blocked route"
  )
  const body = (await response.text()).trim()
  assert.ok(
    body === "error code: 1042" ||
      (response.headers.get("content-type")?.startsWith("text/html") &&
        body.includes("<title>Page not found</title>") &&
        body.includes("https://workers.cloudflare.com/favicon.ico") &&
        body.includes("There is nothing here yet")),
    "Private API did not return Cloudflare's blocked-route response"
  )
}
