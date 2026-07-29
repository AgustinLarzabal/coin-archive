import { fileURLToPath, URL } from "node:url"
import { cloudflare } from "@cloudflare/vite-plugin"
import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  envDir: fileURLToPath(new URL("../../", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@coin-archive/auth/client": fileURLToPath(
        new URL("../../packages/auth/src/client.ts", import.meta.url)
      ),
      "@coin-archive/auth/server": fileURLToPath(
        new URL("../../packages/auth/src/server.ts", import.meta.url)
      ),
      "@coin-archive/feature-flags": fileURLToPath(
        new URL("../../packages/feature-flags/src/index.ts", import.meta.url)
      ),
    },
    tsconfigPaths: true,
  },
  plugins: [
    ...(process.env.VITEST
      ? []
      : [cloudflare({ viteEnvironment: { name: "ssr" } })]),
    devtools(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
})

export default config
