import assert from "node:assert/strict"
import { test } from "node:test"

import { discoverArchive } from "./discover-archive.mjs"

function archive(issuers, coin = { path: "/coins/italy/lira", title: "Lira" }) {
  let url = new URL("https://archive.example/")
  const page = {
    url: () => url.href,
    locator: () => ({
      first: () => ({
        or: () => ({ first: () => ({ waitFor: async () => {} }) }),
        count: async () => Number(Boolean(coin)),
        getAttribute: async (name) =>
          name === "href" ? coin?.path : coin?.title,
      }),
    }),
    getByText: () => ({}),
    getByRole: (role, { name } = {}) => ({
      first: () => ({
        or: () => ({ first: () => ({ waitFor: async () => {} }) }),
      }),
      allTextContents: async () => issuers.map((issuer) => issuer.name),
      click: async () => {
        if (role === "option" && name !== "Issuer") {
          url = new URL(
            `/?issuer=${issuers.find((issuer) => issuer.name === name).code}`,
            url
          )
        }
      },
      count: async () =>
        Number(
          issuers.some(
            (issuer) =>
              issuer.code === url.searchParams.get("issuer") && issuer.pages > 0
          )
        ),
      isEnabled: async () =>
        issuers.find((issuer) => issuer.code === url.searchParams.get("issuer"))
          ?.pages > 1,
    }),
    waitForURL: async (matches) => assert.ok(matches(url)),
    waitForLoadState: async () => {},
  }
  const open = async (path) => {
    url = new URL(path, url)
  }
  return { page, open }
}

test("discovers a live Coin and an Issuer with a second page", async () => {
  const { page, open } = archive([
    { name: "France", code: "FR", pages: 1 },
    { name: "Italy", code: "IT", pages: 2 },
  ])
  assert.deepEqual(await discoverArchive(page, open), {
    coinPath: "/coins/italy/lira",
    coinTitle: "Lira",
    issuerCode: "IT",
    issuerName: "Italy",
  })
})

test("fails clearly when no Coin or suitable Issuer exists", async () => {
  const empty = archive([], null)
  await assert.rejects(discoverArchive(empty.page, empty.open), /no Coin/)
  const onePage = archive([{ name: "France", code: "FR", pages: 1 }])
  await assert.rejects(
    discoverArchive(onePage.page, onePage.open),
    /no Issuer with at least two result pages/
  )
})
