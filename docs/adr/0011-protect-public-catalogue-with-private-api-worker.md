# ADR 0011: Protect public catalogue access with a private API Worker

- Status: Accepted
- Date: 2026-11-20

## Context

The Archive must remain readable without an account, but direct, unbounded
requests must not be able to exhaust the API or PostgreSQL database. The web
app currently calls the standalone API directly from browsers. A future mobile
app will also need anonymous catalogue access. A secret shipped in a mobile app
cannot establish that a request came only from that app.

## Decision

Deploy the catalogue API as a private Cloudflare Worker without a public route.
The web Worker calls it through a service binding, including for requests made
after browser navigation. A future mobile app uses a public, traffic-limited
entry point rather than calling the private API directly. Keep PostgreSQL and
allow public catalogue responses to be cached for up to one minute.
Apply traffic controls to every public route that can trigger catalogue work,
including initial page loads and server functions called after navigation.
Return HTTP 429 when a caller exceeds a limit. Start with a measured threshold,
log rejected requests, and tune the limit against production traffic and
database load.
For the first release, use per-caller limits, caching, Cloudflare's automatic
DDoS protection, and query timeouts. Add stronger global load controls if
production measurements show they are needed. Collecting public catalogue
data over time is acceptable when it stays within traffic limits.

This revises ADR 0001's public API boundary while preserving its separation
between the API and client applications. Anonymous catalogue access remains
public; the internal API service does not.

## Consequences

The Node API entry point and database connection need a Workers-compatible
deployment path. Public web and mobile entry points still need abuse controls;
private service bindings alone do not limit anonymous callers.
Per-caller limits do not guarantee a global cap against distributed traffic,
and shared networks may occasionally cause legitimate visitors to receive 429.
