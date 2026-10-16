import { resolveApiBaseUrl } from "./resolve-api-base-url"

export { resolveApiBaseUrl } from "./resolve-api-base-url"

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  { production: import.meta.env.PROD }
)
