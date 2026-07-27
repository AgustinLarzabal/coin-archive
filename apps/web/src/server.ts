import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

import { getRuntimeEnvironment } from "./lib/runtime-environment.server"

export default createServerEntry({
  async fetch(request) {
    getRuntimeEnvironment()

    return handler.fetch(request)
  },
})
