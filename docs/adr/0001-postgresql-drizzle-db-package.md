# PostgreSQL and Drizzle in a Database Package

Coin Archive will use PostgreSQL as its source-of-truth database and Drizzle as its TypeScript schema and query layer. Database schema, migrations, seed logic, connection setup, and shared query functions will live in `packages/db`, with migrations stored in a `migration` folder, so applications consume database behavior through a single workspace package instead of owning schema details themselves.

PostgreSQL 18 was chosen for filter-heavy catalogue data because it provides mature indexing, query planning, full-text search options, and room for later read-model optimizations, while also giving Coin Archive access to native UUIDv7 generation for the first Coin schema. Drizzle was chosen because it keeps SQL-shaped database access explicit while still giving the TypeScript codebase typed schema definitions and query results.

Coins will use database-generated UUID primary keys, with PostgreSQL generating UUIDv7 values for the initial Coin table. Public or human-readable identifiers, such as slugs or catalogue references, will be modeled separately so coin identity remains stable when titles or attributions change.
