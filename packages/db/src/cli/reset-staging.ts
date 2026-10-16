import { parseArgs } from "node:util"

import { resolveDatabaseUrl } from "../database-url.js"
import { resetStagingDatabase } from "../reset.js"

const { values } = parseArgs({
  options: {
    confirm: { type: "string" },
  },
  strict: true,
})

await resetStagingDatabase(resolveDatabaseUrl(process.env), values.confirm)
