# ADR 0004: Use live numbered pagination for the Coin list

- Status: Accepted
- Date: 2026-10-14

## Context

The Archive is expected to grow beyond 100,000 Coins. Returning every matching
Coin from `GET /v1/coins` would make database work and response size unbounded.
Explore also needs direct navigation to arbitrary pages, which cursor pagination
does not support efficiently without additional cursor bookkeeping or snapshots.

## Decision

Paginate the Coin list with one-based `page` and `pageSize` query parameters,
using live offset-based pages ordered deterministically by creation time descending
and Coin ID ascending. The default page size is 24 and the hard maximum is 100.
The response includes exact `totalItems` and `totalPages` values, calculated from
the same database snapshot as the returned Coins.

Explore records non-initial page numbers in its URL and offers direct numbered-page
navigation. Page membership may shift between requests when the Archive changes;
we accept that trade-off instead of maintaining frozen browsing snapshots.

## Consequences

Callers can jump directly to any page and the API has bounded per-request result
sizes. Exact counts and deep offsets become more expensive as the Archive grows,
so the ordered and filtered query paths require suitable indexes and performance
measurement. A client traversing live pages may occasionally repeat or skip a Coin
when concurrent writes move page boundaries.
