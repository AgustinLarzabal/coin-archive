# Optimistic Concurrency for Maintenance

Protected maintenance reads will return a version token as an HTTP `ETag`, and updates and deletes must submit that token through `If-Match`. The API will reject a stale precondition with `412 Precondition Failed` so concurrent web and mobile edits cannot silently overwrite newer catalogue work; clients must reload the current resource and let the Collector reconcile the conflict.

Every mutable top-level maintenance resource has an integer version beginning at one. An update atomically matches the expected version and increments it, Coin-owned child changes increment the parent Coin version in the same transaction, and deletes atomically match the expected version; clients receive an opaque `ETag` derived from that version and must not depend on its representation. Timestamps remain catalogue metadata rather than concurrency locks.
