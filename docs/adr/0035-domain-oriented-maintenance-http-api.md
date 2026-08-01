# Domain-Oriented Maintenance HTTP API

The protected maintenance API will expose versioned, domain-oriented HTTP resources with OpenAPI contracts rather than database tables or one-for-one wrappers around existing web server functions. Resources use conventional read, create, replace, and delete operations; in particular, Coin updates use whole-resource replacement semantics so the Coin aggregate remains atomic as required by ADR 0007, while transport contracts remain independent of Drizzle types and client UI action names.

The checked-in oRPC/Zod `maintenanceApiContract` in `@coin-archive/api` will be the contract source of truth alongside the separate `publicApiContract`. It will generate the portable OpenAPI description and typed TypeScript client, allowing clients to share transport semantics without sharing database models or web form types.

The public and maintenance contracts remain separate internal modules but are combined into one publicly readable Coin Archive OpenAPI document, organized by tags and per-operation security requirements. A future Scalar reference renders that single document; separate security and cache policies do not require separate documentation sites.

Maintenance failures will use RFC 9457 `application/problem+json` with stable problem type URIs and standard HTTP status semantics. Validation problems may extend the format with JSON Pointer-addressed errors that each client maps to its own controls; responses must not expose web-component names, redirects, toast messages, database constraint names, or unexpected internal error details.

Problem details and validation entries include stable machine-readable codes alongside display-safe English fallback text. Clients branch only on the problem type, JSON Pointer, and code—not on English wording—so copy changes and future localization do not break released clients.

Protected maintenance responses will use `Cache-Control: private, no-store`; clients may retain explicit in-memory state, but browsers, proxies, and shared caches must not reuse protected representations. Resource reads still return `ETag` values for optimistic-concurrency preconditions, while the separate public API retains its existing shared-cache policy.

Non-idempotent maintenance operations, including resource creation and Surface Image upload authorization, require an `Idempotency-Key`. The API scopes a key to the Collector and operation, retains the completed result for a bounded period, replays that result for an identical retry, and rejects reuse with a different payload; whole-resource `PUT` requests remain guarded by `If-Match` instead.

Before a mobile client ships, web and API releases may evolve the contract together. After any mobile release consumes `/api/v1`, that version becomes backward-compatible: additions must remain optional or have server defaults, while removed fields, newly required inputs, or changed meanings require a new major API version; a concrete support and sunset window will be chosen when mobile distribution is defined.

Every maintenance collection contract is cursor-paginated from v1 with an opaque API-owned cursor, stable default and maximum limits, and explicitly supported filters and sort keys. Compact searchable option queries serve form selectors so clients do not depend on unrestricted full maintenance collections remaining small.

The API may expose coarse-grained domain read projections when a shared maintenance use case would otherwise require many client round trips. In particular, Coin Maintenance receives a combined compact options projection for its reference selections, while individual paginated option endpoints remain available for searching collections that outgrow the combined response; this projection is shared by clients and must not encode a web component or screen layout.

Successful creates return `201 Created` with the created representation, `Location`, and `ETag`; whole-resource replacements return `200 OK` with the current representation and new `ETag`; successful deletes return `204 No Content`; and mutable resource reads return their current representation and `ETag`. The API never returns toast copy, client redirect paths, or navigation instructions, which remain presentation concerns in web and mobile.

The request schemas checked in with `maintenanceApiContract` are the authoritative transport validation schemas and the API validates every request with them. Clients may reuse or derive those schemas for immediate feedback, but cross-record rules and authorization remain API-only and PostgreSQL constraints remain the final integrity backstop; client validation never makes a request trusted.

Maintenance representations serialize UUIDs as strings, decimal catalogue measurements and Face Value numeric amounts as decimal strings, Issue Years as astronomical integers, and timestamps as UTC RFC 3339 strings. A known field with an unknown optional catalogue value is explicitly `null`, while fields absent because a projection did not request them are omitted.
