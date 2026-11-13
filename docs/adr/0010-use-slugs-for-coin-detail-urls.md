# ADR 0010: Use slugs for Coin detail URLs

- Status: Accepted
- Date: 2026-11-13

## Context

Coin detail pages currently use database UUIDs in their URLs. Titles cannot
identify Coins: the catalogue already has Coins with the same title and Issuer,
including Germany's 2008 and 2023 "Hamburg" issues. Deriving an address from a
title would also change shared links when editors correct catalogue text.

## Decision

Website detail URLs use `/coins/{issuer-slug}/{coin-slug}`. Add a unique,
editor-assigned Slug to each Issuer and a globally unique, editor-assigned Slug
to each Coin. Store both separately from names and titles, and treat published
Slugs as normally permanent. Editors may use names, titles, and Issue Years to
choose readable Slugs, but no naming formula determines identity. Generate
initial suggestions for existing records and have editors review collisions
before saving them.

Keep UUIDs as database keys and keep the API's UUID detail lookup. Add an API
lookup by Coin Slug for the website. The website checks that the URL's Issuer
Slug matches the returned Coin's Issuer; a mismatch returns 404. No redirect or
alias is required for an Issuer reassignment or for the preproduction UUID
website URLs.

## Consequences

Changing a Coin's title or an Issuer's name leaves its Slug unchanged. Moving a
Coin to another Issuer changes its canonical website URL; old links may fail.
The globally unique Coin Slug makes lookup unambiguous even though the website
URL has two descriptive segments. Coin list and detail data must expose the
Slugs so the website can build and validate those URLs.
