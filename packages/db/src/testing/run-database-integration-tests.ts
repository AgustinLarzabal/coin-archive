import { spawn } from "node:child_process"
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
        "src/**/*.integration.test.ts",
        "--no-file-parallelism",
        "--maxWorkers=1",
      ],
      {
        cwd: new URL("../../", import.meta.url),
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
