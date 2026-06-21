# Better Auth for Collector Sign-In

Coin Archive will use Better Auth as the authentication foundation for Collector sign-in. The Better Auth configuration and client/server API wrappers will live in a dedicated `@workspace/auth` package, while auth database tables and migrations remain owned by the existing PostgreSQL/Drizzle `@workspace/db` package. Better Auth was chosen over a hosted provider or hand-rolled auth because it keeps Collector identity and sessions in Coin Archive's database while providing typed integration points for the TanStack Start web app.
