# ADR 0009: Store role and tenure on Ruling Authorities

- Status: Accepted
- Date: 2026-11-11
- Supersedes: ADR 0005

## Context

ADR 0005 placed Role and Tenure Label on each Coin attribution to allow one
authority to have different values across issuing contexts. In the catalogue,
each authority has one curated role and tenure, and repeated attribution values
make it harder to keep that information consistent.

## Decision

Store the required Role and optional Tenure Label on the Ruling Authority beside
its Slug and name. Keep `coin_ruling_authorities` as an ordered association with
one link per Coin and Ruling Authority. Coin detail responses include the
authority's role and tenure through that association.

The migration copies existing values to each authority before removing them
from the associations. It rejects conflicting values, authorities with no
attribution from which to infer a role, and duplicate Coin-authority links so
that no catalogue data is silently lost.

## Consequences

Changing an authority's role or tenure updates every Coin that credits it. If a
person needs different roles or tenure labels in future catalogue entries,
those entries need distinct Ruling Authority identities or this decision must
be revisited.
