import assert from "node:assert/strict"

const [webOrigin, coinPath, coinTitle] = process.argv.slice(2)
assert.ok(
  webOrigin && coinPath && coinTitle,
  "Usage: node scripts/check-deployed-archive.mjs <web-origin> <coin-path> <coin-title> [--staging]"
)
assert.match(coinPath, /^\/coins\/[a-z0-9-]+\/[a-z0-9-]+$/)

for (const path of ["/", coinPath]) {
  const response = await fetch(new URL(path, webOrigin))
  assert.equal(response.status, 200, `${path}: web Worker request failed`)
  const html = await response.text()
  assert.ok(html.includes(coinTitle), `${path}: expected Coin was not rendered`)
  assert.ok(
    !html.includes("Unable to load coins"),
    `${path}: catalogue request failed`
  )
}

await import("../../api/scripts/check-deployed-private-worker.mjs")

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: token } =
  process.env
const subdomainResponse = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
)
assert.equal(subdomainResponse.status, 200, "Could not read Workers subdomain")
const subdomain = (await subdomainResponse.json()).result?.subdomain
assert.ok(subdomain, "Workers subdomain is missing")
const directResponse = await fetch(
  `https://coin-archive-api${process.argv.includes("--staging") ? "-staging" : ""}.${subdomain}.workers.dev/v1/coins`
)
assert.notEqual(directResponse.status, 200, "Private API is publicly reachable")

console.log("Web Worker reaches the catalogue; direct API request is blocked")
