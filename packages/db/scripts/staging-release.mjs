import { spawnSync } from "node:child_process"
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
  run("staging migrations", ["db:migrate"], {
    ...process.env,
    DATABASE_URL: STAGING_DATABASE_URL,
  })
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
