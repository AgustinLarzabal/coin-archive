import { spawnSync } from "node:child_process"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url))
const production = process.argv.includes("--production")
const release = production ? "production" : "staging"
const prefix = production ? "PRODUCTION" : "STAGING"

function verifyPromotion() {
  if (!production) return
  assert.equal(
    process.env.GITHUB_ACTIONS,
    "true",
    "production promotion requires GitHub Actions"
  )
  assert.equal(
    process.env.GITHUB_EVENT_NAME,
    "workflow_dispatch",
    "production promotion requires a manual dispatch"
  )
  assert.equal(
    process.env.GITHUB_REF,
    "refs/heads/main",
    "production promotion must start from main"
  )
  const selected = process.env.GITHUB_SHA
  assert.match(
    selected ?? "",
    /^[0-9a-f]{40}$/,
    "production promotion requires a commit SHA"
  )
  const repository = process.env.GITHUB_REPOSITORY
  assert.match(
    repository ?? "",
    /^[\w.-]+\/[\w.-]+$/,
    "production promotion requires a repository"
  )
  const mainResult = spawnSync(
    "gh",
    ["api", `repos/${repository}/branches/main`],
    { encoding: "utf8" }
  )
  assert.equal(
    mainResult.status,
    0,
    "promotion eligibility failed: could not read main"
  )
  const main = JSON.parse(mainResult.stdout)
  assert.equal(
    main?.commit?.sha,
    selected,
    "promotion eligibility failed: selected commit is no longer current main"
  )
  const result = spawnSync(
    "gh",
    [
      "api",
      "--method",
      "GET",
      `repos/${repository}/actions/workflows/staging-migrations.yml/runs`,
      "-f",
      `head_sha=${selected}`,
      "-f",
      "branch=main",
      "-f",
      "event=push",
      "-f",
      "per_page=1",
    ],
    { encoding: "utf8" }
  )
  assert.equal(
    result.status,
    0,
    "promotion eligibility failed: could not read staging runs"
  )
  const runs = JSON.parse(result.stdout)
  const latest = runs.workflow_runs?.[0]
  assert.ok(
    latest?.head_sha === selected &&
      latest.head_branch === "main" &&
      latest.event === "push" &&
      latest.status === "completed" &&
      latest.conclusion === "success",
    "promotion eligibility failed: latest staging release for selected commit did not succeed"
  )
  console.log(`Verified promotion eligibility for ${selected}`)
}

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
  verifyPromotion()
  const checkEnvironment = { ...process.env }
  delete checkEnvironment.STAGING_DATABASE_URL
  delete checkEnvironment.PRODUCTION_DATABASE_URL
  run("build", ["build"], checkEnvironment)
  run("typecheck", ["typecheck"], checkEnvironment)
  run("lint", ["lint"], checkEnvironment)
  run("deterministic tests", ["test"], checkEnvironment)

  const databaseUrl = process.env[`${prefix}_DATABASE_URL`]
  const expectedHost = process.env[`${prefix}_DATABASE_HOST`]
  const expectedName = process.env[`${prefix}_DATABASE_NAME`]
  if (!databaseUrl || !expectedHost || !expectedName) {
    throw new Error(
      `${release} target check failed: URL, expected host, and expected database are required`
    )
  }

  let target
  try {
    target = new URL(databaseUrl)
  } catch {
    throw new Error(`${release} target check failed: invalid database URL`)
  }
  let databaseName
  try {
    databaseName = decodeURIComponent(target.pathname.slice(1))
  } catch {
    throw new Error(`${release} target check failed: invalid database name`)
  }
  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !target.username ||
    !target.password ||
    !/^ep-[a-z0-9-]+(?:\.[a-z0-9-]+)+\.neon\.tech$/.test(target.hostname) ||
    target.hostname.split(".")[0].endsWith("-pooler") ||
    target.hostname !== expectedHost ||
    !databaseName ||
    databaseName.includes("/") ||
    databaseName !== expectedName ||
    [...target.searchParams].some(
      ([key]) => !["sslmode", "channel_binding"].includes(key)
    )
  ) {
    throw new Error(
      `${release} target check failed: direct Neon host or database does not match expectations`
    )
  }

  console.log(`Verified ${release} target ${target.hostname}/${databaseName}`)
  const webOrigin = process.env[`${prefix}_WEB_ORIGIN`]
  assert.match(
    webOrigin ?? "",
    production
      ? /^https:\/\/coinarchive\.app$/
      : /^https:\/\/coin-archive-web-staging\.[a-z0-9-]+\.workers\.dev$/,
    `deployment configuration failed: ${prefix}_WEB_ORIGIN must be the ${release} Worker URL`
  )
  const api = JSON.parse(
    readFileSync(new URL("../../../apps/api/wrangler.jsonc", import.meta.url))
  )
  const web = JSON.parse(
    // shortcut: the checked-in web config uses trailing commas only; use a JSONC parser if comments are added.
    readFileSync(
      new URL("../../../apps/web/wrangler.jsonc", import.meta.url),
      "utf8"
    ).replace(/,(\s*[}\]])/g, "$1")
  )
  if (!production)
    assert.notEqual(
      api.env?.staging?.hyperdrive?.[0]?.id,
      api.hyperdrive?.[0]?.id,
      "deployment configuration failed: staging API must use a separate Hyperdrive binding"
    )
  assert.deepEqual(
    production ? web.services : web.env?.staging?.services,
    [
      {
        binding: "API",
        service: `coin-archive-api${production ? "" : "-staging"}`,
      },
    ],
    `deployment configuration failed: ${release} web must bind to the ${release} API`
  )
  if (production)
    assert.deepEqual(
      web.routes,
      [{ pattern: "coinarchive.app", custom_domain: true }],
      "deployment configuration failed: production web must use coinarchive.app"
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
      ...(production ? [] : ["--staging"]),
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
  run(`${release} web build`, ["--filter", "web", "build"], {
    ...checkEnvironment,
    ...(production ? {} : { CLOUDFLARE_ENV: "staging" }),
  })
  run(
    "API deployment dry run",
    [
      "--filter",
      "api",
      "exec",
      "wrangler",
      "deploy",
      ...(production ? [] : ["--env", "staging"]),
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
      ...(production ? [] : ["--env", "staging"]),
      "--dry-run",
    ],
    checkEnvironment
  )
  verifyPromotion()
  run(`${release} migrations`, ["db:migrate"], {
    ...process.env,
    DATABASE_URL: databaseUrl,
  })
  run(
    `${release} API deployment`,
    [
      "--filter",
      "api",
      "exec",
      "wrangler",
      "deploy",
      ...(production ? [] : ["--env", "staging"]),
    ],
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
      ...(production ? [] : ["--staging"]),
    ],
    checkEnvironment
  )
  run(
    `${release} web deployment`,
    [
      "--filter",
      "web",
      "exec",
      "wrangler",
      "deploy",
      ...(production ? [] : ["--env", "staging"]),
    ],
    checkEnvironment
  )
  run(
    "deployed Archive browser",
    [
      "--filter",
      "web",
      "check:deployed-archive",
      webOrigin,
      ...(production ? [] : ["--staging"]),
    ],
    checkEnvironment
  )
  console.log(
    `${production ? "Production" : "Staging"} release verified for commit ${process.env.GITHUB_SHA ?? "local"}`
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
