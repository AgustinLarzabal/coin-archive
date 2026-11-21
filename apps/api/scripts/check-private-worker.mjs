import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const config = JSON.parse(
  readFileSync(
    new URL(
      process.argv.slice(2).find((argument) => argument !== "--deploy") ??
        "../wrangler.jsonc",
      import.meta.url
    ),
    "utf8"
  )
)

for (const [name, deployment] of [
  ["default", config],
  ...Object.entries(config.env ?? {}),
]) {
  assert.equal(
    deployment.workers_dev,
    false,
    `${name}: workers.dev must be disabled`
  )
  assert.equal(
    deployment.preview_urls,
    false,
    `${name}: preview URLs must be disabled`
  )
  assert.equal(
    deployment.route,
    undefined,
    `${name}: public route is forbidden`
  )
  assert.deepEqual(
    deployment.routes ?? [],
    [],
    `${name}: public routes are forbidden`
  )
}

if (process.argv.includes("--deploy")) {
  assert.match(
    config.hyperdrive?.[0]?.id ?? "",
    /^(?:[0-9a-f]{32}|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i,
    "Set the Hyperdrive configuration ID before deployment"
  )
  assert.notEqual(
    config.vars?.IMAGE_BASE_URL,
    "https://images.example.com",
    "Set the real image origin before deployment"
  )
}

console.log("Private API routing configuration verified")
