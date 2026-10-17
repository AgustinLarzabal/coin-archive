import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

import { applicationVersionDefine } from "./application-version"
import { resolveApiBaseUrl } from "./src/resolve-api-base-url"

const config = defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd())
  resolveApiBaseUrl(
    process.env.VITE_API_BASE_URL ?? environment.VITE_API_BASE_URL,
    { production: mode === "production" }
  )

  return {
    define: applicationVersionDefine,
    resolve: { tsconfigPaths: true },
    plugins: [
      ...(mode === "development" ? [devtools()] : []),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
