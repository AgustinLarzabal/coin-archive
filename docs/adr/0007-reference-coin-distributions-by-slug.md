# ADR 0007: Reference Coin Distributions by slug

- Status: Accepted
- Date: 2026-10-21

## Context

Coin Distribution was a fixed PostgreSQL enum with three values. Editors need to
curate additional values and change their display names without deploying the
API or web app. Existing Coins must retain their classification.

## Decision

Store each Coin's required Distribution as a foreign key to the catalogue's
unique, stable Slug. Migrate existing enum values to the same Slug strings before
dropping the enum. Restrict deletion of a Distribution referenced by any Coin.
The public Coin contract and exact filter accept syntactically valid Slugs; an
unknown valid filter returns an empty page. Seed writes validate Slugs against the
catalogue before inserting Coins.

## Consequences

Editors can add and rename Distributions without deploying code. Existing public
Coin responses keep their Slug strings, and Coin detail reads the current
catalogue name. A new value requires a catalogue insert before Coins can use it.
The foreign key adds a catalogue lookup to writes and keeps the Slug stable while
referenced. Storing the Slug directly avoids an ID lookup on every Coin list
filter, at the cost of a wider indexed value and more expensive Slug changes.
