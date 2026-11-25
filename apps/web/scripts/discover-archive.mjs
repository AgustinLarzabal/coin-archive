import assert from "node:assert/strict"

export async function discoverArchive(page, open) {
  await open("/")
  const coin = page.locator('a[href^="/coins/"]').first()
  await coin
    .or(page.getByText("No coins have been added to the archive yet"))
    .first()
    .waitFor()
  assert.ok(await coin.count(), "Archive has no Coin on Explore's first page")
  const coinPath = new URL(await coin.getAttribute("href"), page.url()).pathname
  const coinTitle = await coin.getAttribute("aria-label")
  assert.match(coinPath, /^\/coins\/[a-z0-9-]+\/[a-z0-9-]+$/)
  assert.ok(coinTitle, "Explore Coin has no accessible title")

  await page.getByRole("button", { name: "Add filter" }).click()
  await page.getByRole("option", { name: "Issuer" }).click()
  await page
    .getByRole("option")
    .first()
    .or(page.getByText("No results"))
    .first()
    .waitFor()
  const issuerNames = await page.getByRole("option").allTextContents()
  assert.ok(issuerNames.length, "Archive has no Issuer filter choices")

  for (const issuerName of issuerNames.map((name) => name.trim())) {
    await open("/")
    await page.getByRole("button", { name: "Add filter" }).click()
    await page.getByRole("option", { name: "Issuer" }).click()
    await page.getByRole("option", { name: issuerName, exact: true }).click()
    await page.waitForURL((url) => url.searchParams.has("issuer"))
    await page.waitForLoadState("networkidle")
    const issuerCode = new URL(page.url()).searchParams.get("issuer")
    assert.match(issuerCode, /^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/)
    const nextPage = page.getByRole("button", { name: "Go to next page" })
    if ((await nextPage.count()) && (await nextPage.isEnabled())) {
      return { coinPath, coinTitle, issuerCode, issuerName }
    }
  }

  assert.fail("Archive has no Issuer with at least two result pages")
}
