import assert from "node:assert/strict"
import { chromium } from "playwright"

const [webOrigin, coinPath, coinTitle, issuerCode, issuerName] =
  process.argv.slice(2)
assert.ok(
  webOrigin && coinPath && coinTitle && issuerCode && issuerName,
  "Usage: node scripts/check-deployed-archive.mjs <web-origin> <coin-path> <coin-title> <issuer-code> <issuer-name> [--staging]"
)
assert.match(coinPath, /^\/coins\/[a-z0-9-]+\/[a-z0-9-]+$/)
assert.match(issuerCode, /^[A-Z]{2}$/)
const origin = new URL(webOrigin).origin
const staging = process.argv.includes("--staging")
if (staging) {
  assert.match(
    origin,
    /^https:\/\/coin-archive-web-staging\.[a-z0-9-]+\.workers\.dev$/,
    "Traffic checks must target the staging Worker"
  )
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
})
let serverFunctionUrl
const externalApiRequests = []
try {
  const page = await browser.newPage()
  page.on("request", (request) => {
    if (!["fetch", "xhr"].includes(request.resourceType())) return
    const url = new URL(request.url())
    if (url.origin !== origin) externalApiRequests.push(url.origin)
    if (url.pathname.includes("_serverFn")) serverFunctionUrl = url.href
  })

  async function open(path) {
    const response = await page.goto(new URL(path, origin).href)
    assert.equal(response?.status(), 200, `${path}: web Worker request failed`)
    await page.getByRole("button", { name: "Add filter" }).waitFor()
    assert.equal(await page.getByText("Unable to load coins").count(), 0)
  }

  await open("/")
  await page.getByRole("link", { name: coinTitle }).first().click()
  await page.getByRole("heading", { name: coinTitle }).waitFor()
  assert.equal(new URL(page.url()).pathname, coinPath)
  const detailResponse = await page.goto(new URL(coinPath, origin).href)
  assert.equal(detailResponse?.status(), 200, "Coin detail initial load failed")
  await page.getByRole("heading", { name: coinTitle }).waitFor()
  await page.getByRole("link", { name: "Archive" }).click()
  await page.getByRole("button", { name: "Add filter" }).waitFor()

  await page.getByRole("button", { name: "Add filter" }).click()
  await page.getByRole("option", { name: "Issuer" }).click()
  await page.getByRole("option", { name: issuerName, exact: true }).click()
  await page.waitForURL((url) => url.searchParams.get("issuer") === issuerCode)
  const firstPageCoin = await page
    .locator('a[href^="/coins/"]')
    .first()
    .getAttribute("href")
  await page.getByRole("button", { name: "Go to next page" }).click()
  await page.getByRole("button", { name: "Page 2" }).waitFor()
  assert.equal(new URL(page.url()).searchParams.get("page"), "2")
  await page.waitForFunction(
    (first) =>
      document.querySelector('a[href^="/coins/"]')?.getAttribute("href") !==
      first,
    firstPageCoin
  )
  assert.notEqual(
    await page.locator('a[href^="/coins/"]').first().getAttribute("href"),
    firstPageCoin,
    "Pagination did not load a different Coin"
  )
  assert.equal(await page.getByText("Unable to load coins").count(), 0)
  await open(`/?issuer=${issuerCode}`)
  await page.getByText(issuerName, { exact: true }).first().waitFor()
  assert.ok(
    serverFunctionUrl,
    "No server-function request observed during navigation"
  )
  assert.deepEqual(
    externalApiRequests,
    [],
    "Browser fetched a separate API origin"
  )
} finally {
  await browser.close()
}

await import("../../api/scripts/check-deployed-private-worker.mjs")

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: token } =
  process.env
const subdomainResponse = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`,
  { headers: { Authorization: `Bearer ${token}` } }
)
assert.equal(subdomainResponse.status, 200, "Could not read Workers subdomain")
const subdomain = (await subdomainResponse.json()).result?.subdomain
assert.ok(subdomain, "Workers subdomain is missing")
const directResponse = await fetch(
  `https://coin-archive-api${staging ? "-staging" : ""}.${subdomain}.workers.dev/v1/coins`
)
assert.notEqual(directResponse.status, 200, "Private API is publicly reachable")

if (staging) {
  let limited = false
  for (let attempt = 0; attempt < 170; attempt++) {
    const response = await fetch(new URL(coinPath, origin))
    if (response.status === 429) {
      limited = true
      assert.equal(response.headers.get("Retry-After"), "60")
      assert.equal(response.headers.get("Cache-Control"), "no-store")
      break
    }
    assert.equal(response.status, 200, "Unexpected status during traffic check")
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(limited, "HTML traffic did not reach the configured limit")
  let serverFunctionLimited = false
  for (let attempt = 0; attempt < 50; attempt++) {
    const response = await fetch(serverFunctionUrl, {
      headers: { Origin: origin },
    })
    if (response.status === 429) {
      assert.equal(response.headers.get("Retry-After"), "60")
      serverFunctionLimited = true
      break
    }
    assert.ok(
      response.status === 200 || response.status === 403,
      `Unexpected server-function status: ${response.status}`
    )
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(serverFunctionLimited, "Server function bypassed the limit")
  console.log(
    "Staging limit: one HTML and one server-function request rejected"
  )
}

console.log(
  `Deployed Archive flow, same-origin requests, and private API verified${staging ? "; staging traffic limit verified" : ""}`
)
