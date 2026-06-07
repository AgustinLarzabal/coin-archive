import { spawn } from "node:child_process"
import { getDatabaseTestUrl } from "../env"
import { prepareDatabaseIntegrationTests } from "./database-test-client"

await prepareDatabaseIntegrationTests()
await runVitest()

function runVitest() {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "./node_modules/vitest/vitest.mjs",
        "run",
        "--config",
        "vitest.integration.config.ts",
      ],
      {
        cwd: new URL("../../", import.meta.url),
        env: {
          ...process.env,
          DATABASE_URL: getDatabaseTestUrl(),
        },
        stdio: "inherit",
      }
    )

    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Vitest integration run failed with exit code ${code}`))
    })

    child.on("error", reject)
  })
}
