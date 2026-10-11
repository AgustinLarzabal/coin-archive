# ADR 0002: Use Slugs for public Engraver identity

- Status: Accepted
- Date: 2026-10-11

## Decision

Engravers use an explicitly assigned, unique lowercase Slug in public API
responses, Explore URLs, and catalogue seed references. Database UUIDs remain
internal persistence keys. We chose Slugs over exposing UUIDs or introducing
uppercase Engraver Codes because Engraver identity appears in user-facing URLs;
the application stores editor-supplied Slugs without deriving them from, or
synchronizing them with, mutable and non-unique full names.

An Engraver Slug contains 3–64 lowercase ASCII letters or digits, optionally
separated by single hyphens. Leading, trailing, and consecutive hyphens are
invalid. Catalogue parsing and PostgreSQL constraints both enforce this
contract.
