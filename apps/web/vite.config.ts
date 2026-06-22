import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  envDir: fileURLToPath(new URL("../../", import.meta.url)),
  resolve: {
    alias: {
      "@workspace/auth/client": fileURLToPath(
        new URL("../../packages/auth/src/client.ts", import.meta.url)
      ),
      "@workspace/auth/server": fileURLToPath(
        new URL("../../packages/auth/src/server.ts", import.meta.url)
      ),
    },
    tsconfigPaths: true,
  },
  plugins: [devtools(), tanstackStart(), viteReact(), tailwindcss()],
})

export default config
