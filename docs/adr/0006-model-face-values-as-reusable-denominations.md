# ADR 0006: Model Face Values as reusable Denominations

- Status: Accepted
- Date: 2026-10-18

## Context

Coin Archive needs to catalogue a Coin's Face Value without confusing it with
collector price or intrinsic value. The same denomination appears on many Coins,
currencies may span multiple Issuers, and monetary reforms may create distinct
currencies that reuse an everyday name. Historical denominations can also have
amounts that do not terminate when expressed in a Currency's principal unit.

## Decision

Model Currency and Denomination as reusable canonical entities. A Currency is
independent of Issuers and has an immutable public Slug, a Name, and a required
curated Period Label; its Full Name is derived as `Name (Period Label)`. A
monetary reform that creates a distinct unit creates a distinct Currency.

A Denomination belongs to exactly one Currency and has a normalized label and a
positive fixed-precision decimal amount expressed in that Currency's principal
unit. Its label is unique within the Currency regardless of letter case.
Distinct labels may share an amount. Denominations have no public Slug.

A Coin may reference at most one Denomination. The public Coin list and detail
contracts expose that association as a required, nullable `faceValue` object
containing the Denomination label and numeric value plus the Currency's Slug,
Name, and derived Full Name. The v1 Coin list may be filtered by Currency Slug
and, only when a Currency is present, exact stored amount.

Use a database decimal with up to 18 integer and 12 fractional digits rather
than a numerator and denominator. Values that repeat in the principal Currency
are curated approximations. This deliberately favors a smaller persistence and
API model over mathematically exact rational representation.

## Consequences

Editors define a Currency and Denomination once and Coins reuse them, preventing
label drift and supporting consistent filtering. Referenced Currencies and
Denominations cannot be deleted. Existing Coins require no speculative backfill
because the association is nullable.

The API exposes a convenient JSON numeric value but cannot promise mathematical
exactness for repeating historical amounts. A future requirement for exact
arithmetic would require revisiting the amount representation and contract.
