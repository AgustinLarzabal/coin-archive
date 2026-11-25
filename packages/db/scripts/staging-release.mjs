import { spawnSync } from "node:child_process"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url))

function run(stage, args, environment = process.env) {
  console.log(`Starting ${stage}`)
  const result = spawnSync("pnpm", args, {
    cwd: repositoryRoot,
    env: environment,
    stdio: "inherit",
  })
  if (result.error) throw new Error(`${stage} failed: ${result.error.message}`)
  if (result.status !== 0)
    throw new Error(`${stage} failed (exit ${result.status})`)
}

try {
  const checkEnvironment = { ...process.env }
  delete checkEnvironment.STAGING_DATABASE_URL
  run("build", ["build"], checkEnvironment)
  run("deterministic tests", ["test"], checkEnvironment)

  const { STAGING_DATABASE_URL, STAGING_DATABASE_HOST, STAGING_DATABASE_NAME } =
    process.env
  if (
    !STAGING_DATABASE_URL ||
    !STAGING_DATABASE_HOST ||
    !STAGING_DATABASE_NAME
  ) {
    throw new Error(
      "staging target check failed: URL, expected host, and expected database are required"
    )
  }

  let target
  try {
    target = new URL(STAGING_DATABASE_URL)
  } catch {
    throw new Error("staging target check failed: invalid database URL")
  }
  let databaseName
  try {
    databaseName = decodeURIComponent(target.pathname.slice(1))
  } catch {
    throw new Error("staging target check failed: invalid database name")
  }
  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !target.username ||
    !target.password ||
    !/^ep-[a-z0-9-]+(?:\.[a-z0-9-]+)+\.neon\.tech$/.test(target.hostname) ||
    target.hostname.split(".")[0].endsWith("-pooler") ||
    target.hostname !== STAGING_DATABASE_HOST ||
    !databaseName ||
    databaseName.includes("/") ||
    databaseName !== STAGING_DATABASE_NAME ||
    [...target.searchParams].some(
      ([key]) => !["sslmode", "channel_binding"].includes(key)
    )
  ) {
    throw new Error(
      "staging target check failed: direct Neon host or database does not match expectations"
    )
  }

  console.log(`Verified staging target ${target.hostname}/${databaseName}`)
  const webOrigin = process.env.STAGING_WEB_ORIGIN
  assert.match(
    webOrigin ?? "",
    /^https:\/\/coin-archive-web-staging\.[a-z0-9-]+\.workers\.dev$/,
    "deployment configuration failed: STAGING_WEB_ORIGIN must be the staging Worker URL"
  )
  const api = JSON.parse(
    readFileSync(new URL("../../../apps/api/wrangler.jsonc", import.meta.url))
  )
  const web = JSON.parse(
    // shortcut: the checked-in web config uses trailing commas only; use a JSONC parser if comments are added.
    readFileSync(new URL("../../../apps/web/wrangler.jsonc", import.meta.url), "utf8").replace(/,(\s*[}\]])/g, "$1")
  )
  assert.notEqual(
    api.env?.staging?.hyperdrive?.[0]?.id,
    api.hyperdrive?.[0]?.id,
    "deployment configuration failed: staging API must use a separate Hyperdrive binding"
  )
  assert.deepEqual(
    web.env?.staging?.services,
    [{ binding: "API", service: "coin-archive-api-staging" }],
    "deployment configuration failed: staging web must bind to the staging API"
  )
  run(
    "API deployment configuration",
    [
      "--filter",
      "api",
      "exec",
      "node",
      "scripts/check-private-worker.mjs",
      "--deploy",
      "--staging",
    ],
    checkEnvironment
  )
  run(
    "Cloudflare credentials",
    [
      "--filter",
      "api",
      "exec",
      "node",
      "scripts/check-deployed-private-worker.mjs",
      "--preflight",
    ],
    checkEnvironment
  )
  run("staging web build", ["--filter", "web", "build"], {
    ...checkEnvironment,
    CLOUDFLARE_ENV: "staging",
  })
  run(
    "API deployment dry run",
    [
      "--filter",
      "api",
      "exec",
      "wrangler",
      "deploy",
      "--env",
      "staging",
      "--dry-run",
    ],
    checkEnvironment
  )
  run(
    "web deployment dry run",
    [
      "--filter",
      "web",
      "exec",
      "wrangler",
      "deploy",
      "--env",
      "staging",
      "--dry-run",
    ],
    checkEnvironment
  )
  run("staging migrations", ["db:migrate"], {
    ...process.env,
    DATABASE_URL: STAGING_DATABASE_URL,
  })
  run(
    "staging API deployment",
    ["--filter", "api", "exec", "wrangler", "deploy", "--env", "staging"],
    checkEnvironment
  )
  run(
    "deployed API privacy",
    [
      "--filter",
      "api",
      "exec",
      "node",
      "scripts/check-deployed-private-worker.mjs",
      "--staging",
    ],
    checkEnvironment
  )
  run(
    "staging web deployment",
    ["--filter", "web", "exec", "wrangler", "deploy", "--env", "staging"],
    checkEnvironment
  )
  run(
    "deployed Archive browser",
    ["--filter", "web", "check:deployed-archive", webOrigin, "--staging"],
    checkEnvironment
  )
  console.log(
    `Staging release verified for commit ${process.env.GITHUB_SHA ?? "local"}`
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
