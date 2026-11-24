# ADR 0012: Promote tested staging releases to production

- Status: Accepted; implementation planned
- Date: 2026-11-24

## Context

Deploying the API and web Workers and applying database migrations currently
requires manual commands. Automatically deploying every merge to production
would remove that work, but could publish an untested version or run a schema
change against the wrong database. Keeping every step manual delays releases
and makes it easy to omit a check.

## Decision

Use GitHub Actions to deploy each merge to `main` to staging. Before deployment,
run the repository's build and tests, verify the staging database host and name
against environment-specific expected values, and apply checked-in migrations.
Deploy the private API Worker before the web Worker. The staging release succeeds
only after deployed API privacy and Archive browser checks pass. The browser
check must select suitable live catalogue records and fail if the required
records or behavior are absent. Do not reset or seed the database during a
release.

Production deployment is a manually started promotion of the exact commit that
passed staging, with approval required before production credentials are used.
Immediately before deployment, verify that the selected commit is still the
current `main` commit and has a successful staging release. Verify the
production database host and name, apply its checked-in migrations, then deploy
the API and web Workers in that order. Run the deployed privacy and Archive
browser checks before marking production successful. Serialize deployments
within each environment.

Migrations must remain compatible with the currently deployed Workers until the
new Workers are live. A human reviews that compatibility before a migration is
merged to `main`. If a migration, deployment, or check fails, stop and report
the failed stage. Do not automatically reverse database changes; recovery is a
separate, explicit decision.

## Consequences

An approved promotion can become ineligible if `main` advances while it waits;
start a new promotion after the newer commit passes staging. A deployment can
leave the database migrated when a later step fails, so migrations must be safe
for the old Workers and operators must decide how to recover. This ADR records
the target process; the current manual deployment commands remain in effect
until the workflows are implemented.
