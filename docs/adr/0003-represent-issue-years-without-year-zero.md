# ADR 0003: Represent Issue Years without year zero

- Status: Accepted
- Date: 2026-10-14

## Context

Coin Archive needs a stable representation for a Coin's First Issue Year and
Last Issue Year in persistence and its public API. The Archive may include BCE
Coins, while collectors and catalogue sources conventionally use BCE/CE years
without a year zero. Using astronomical year numbering would make `0` mean
1 BCE, which would be surprising at the catalogue boundary; storing a separate
era for each endpoint would make a two-value range harder to order and consume.

## Decision

Represent each Issue Year as a signed integer using historical BCE/CE numbering:
positive values are CE, negative values are BCE, and zero is invalid. For
example, `2026` means 2026 CE, `-44` means 44 BCE, and the range from 1 BCE to
1 CE is stored as `-1` through `1`.

Every Coin has required `firstIssueYear` and `lastIssueYear` values in the public
contract, backed by `first_issue_year` and `last_issue_year` columns. The first
value must not exceed the last. These values record asserted conventional
catalogue years only; approximate or disputed dating requires a separate future
model rather than silently treating an estimate as exact.

## Consequences

Numeric ordering works across BCE and CE, and clients do not need separate era
fields. User interfaces must format negative values as BCE and must never expose
the storage sign directly. Calculations spanning BCE and CE must account for the
absence of year zero instead of subtracting the endpoints naively.
