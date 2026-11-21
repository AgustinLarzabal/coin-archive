import assert from "node:assert/strict"

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: token } =
  process.env
assert.ok(accountId, "CLOUDFLARE_ACCOUNT_ID is required")
assert.ok(token, "CLOUDFLARE_API_TOKEN is required")

if (process.argv.includes("--preflight")) process.exit(0)

const worker = process.argv.includes("--staging")
  ? "coin-archive-api-staging"
  : "coin-archive-api"

async function get(path) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  assert.ok(response.ok, `Cloudflare request failed: ${path}`)
  const body = await response.json()
  assert.equal(body.success, true, `Cloudflare request failed: ${path}`)
  return body
}

async function list(path, perPage = 50) {
  const items = []
  for (let page = 1; ; page++) {
    const separator = path.includes("?") ? "&" : "?"
    const body = await get(
      `${path}${separator}page=${page}&per_page=${perPage}`
    )
    assert.ok(Array.isArray(body.result), `Invalid Cloudflare list: ${path}`)
    items.push(...body.result)
    if (body.result_info?.total_pages === undefined) {
      assert.ok(
        body.result.length < perPage,
        `Cannot verify complete list: ${path}`
      )
      return items
    }
    if (page >= body.result_info.total_pages) return items
  }
}

const subdomain = await get(
  `/accounts/${accountId}/workers/scripts/${worker}/subdomain`
)
assert.equal(
  subdomain.result?.enabled,
  false,
  "workers.dev is publicly reachable"
)
assert.equal(
  subdomain.result?.previews_enabled,
  false,
  "preview URLs are publicly reachable"
)

const domains = await list(
  `/accounts/${accountId}/workers/domains?service=${worker}`
)
assert.equal(domains.length, 0, "API Worker has a custom domain")

const zones = await list("/zones")
assert.ok(
  zones.some((zone) => zone.account?.id === accountId),
  "No account zones are visible to the privacy check"
)
for (const zone of zones.filter((zone) => zone.account?.id === accountId)) {
  const routes = await list(`/zones/${zone.id}/workers/routes`)
  assert.equal(
    routes.some((route) => route.script === worker),
    false,
    `API Worker has a public route in zone ${zone.id}`
  )
}

console.log("Deployed API Worker has no public endpoint")
