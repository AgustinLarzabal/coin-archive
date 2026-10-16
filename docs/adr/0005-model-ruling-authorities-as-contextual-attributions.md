# ADR 0005: Model Ruling Authorities as contextual attributions

- Status: Accepted
- Date: 2026-10-16

## Decision

Model each Ruling Authority as a globally reusable identity with a stable public
Slug and mutable display name. A Coin may attribute issuance to any number of
Ruling Authorities through ordered associations; each association owns the
required curated Role and optional free-form Tenure Label shown for that Coin.
The same authority may appear more than once on a Coin when those contextual
values differ.

We chose contextual associations over a single Ruling Authority foreign key or
an immutable authority type because Coins may have joint rulers, the same person
may hold different roles across issuing contexts, and historical tenure labels
may be approximate, open-ended, or discontinuous. Ruling Authority tenure remains
independent of the Coin's Issue Period.

The public Coin detail contract exposes these associations as an ordered
`rulers` array. Coin list responses omit them, while Explore filters Coins by one
exact Ruling Authority Slug at a time.
