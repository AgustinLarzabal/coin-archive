export function setAuthTestEnvironment() {
  process.env.DATABASE_URL =
    "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive"
  process.env.BETTER_AUTH_SECRET = "test-secret"
  process.env.BETTER_AUTH_URL = "http://127.0.0.1:8787"
  process.env.BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:3000"
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"
}
