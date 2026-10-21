# ADR 0008: Reference Coin Distributions by internal identity

- Status: Accepted
- Date: 2026-10-21

## Context

ADR 0007 used the stable public Slug as the Coin foreign key when replacing the
fixed Coin Distribution enum. Issue #75 calls for a catalogue record with an
internal identity and for trusted Coin writes to resolve Slugs to that identity.

## Decision

Store a required `distribution_id` on each Coin, referencing the Distribution's
UUID. Backfill it by matching each existing Coin's Slug to the seeded catalogue
before dropping the Slug column. Resolve public Slugs to UUIDs at trusted write
and filter boundaries. Read the Slug through the catalogue for public Coin
responses. Restrict deletion of a referenced Distribution.

## Consequences

Public URLs and response fields remain stable while Coins reference a catalogue
record independently of its editable name and public Slug. A Slug lookup is
required for Coin writes and filtered list requests, and Coin reads join the
catalogue to return the public Slug. The smaller UUID key replaces the Slug in
the Coin filter index. The migration must backfill every Coin before making the
new reference required.
