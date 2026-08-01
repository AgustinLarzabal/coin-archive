# Narrow Shared Lookup Maintenance Infrastructure

## Context

ADR 0006 assigns each database maintenance page a feature-owned slice and
keeps only cross-feature infrastructure above those slices. Catalogue,
Orientation, Mint, Edge, and Ruler Maintenance all expose create, update, and
delete submissions with the same broad sequence: authorize the Collector,
validate input, resolve database dependencies, persist, translate the result,
and map known PostgreSQL failures. Similar control flow alone does not show
that the whole workflow belongs behind a shared interface.

The post-refactor Catalogue slice also demonstrates that responsibility-oriented
modules can make validation, mutation-error interpretation, form drafts, and
orchestration local without introducing a cross-feature seam.

### Workflow comparison

All five features use the same authorization rule: a signed-in Collector must
have Editor access, which also admits Admins. Their authorization messages are
entity-specific. Each action interface accepts optional create, update, and
delete database dependencies for tests; the default implementation dynamically
imports the corresponding `@coin-archive/db` functions. Create dependencies
return an unknown persisted value, while update and delete dependencies return
an unknown value or `null` for a missing row.

| Feature     | Editable fields and validation                                                                                                                                                                                                                   | Persistence mappings and relationships                                                                                                                                                                                                                                                      | Form shape and pipeline deviations                                                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalogue   | `code` and `title`; both are trimmed, required strings of at most 255 characters. Update adds a UUID `id`; delete accepts only that `id`. There is no schema slug refinement.                                                                    | Duplicate `catalogue_code_lower_unique_idx` (`23505`) maps to `code`. `coin_reference_catalogue_id_catalogue_id_fk` (`23001`) maps to an in-use form error. Catalogue References are the relevant dependent relationship.                                                                   | Two text fields use extracted validation, mutation-error, draft, and field-rendering modules. Create is enabled when either trimmed field has input, and edit compares raw draft values. The three actions retain explicit orchestration rather than an intra-file generic runner.                                                                           |
| Orientation | `code` and `name`; both are trimmed, required strings of at most 255 characters, and `code` has a lowercase slug refinement. Update and delete use a UUID `id`.                                                                                  | Duplicate `orientation_code_lower_unique_idx` (`23505`) and `orientation_code_slug_check` (`23514`) map to `code`. `coin_orientation_id_orientation_id_fk` (`23001`) maps to an in-use form error. Coins are the dependent relationship.                                                    | Two shared text fields and a two-string draft. Create requires both fields. Edit compares normalized values. Client validation and feedback remain in the forms, while actions use an intra-feature generic mutation runner.                                                                                                                                 |
| Mint        | `code` and `name`; both are trimmed, required strings of at most 255 characters, and `code` has a lowercase slug refinement. Update and delete use a UUID `id`.                                                                                  | Duplicate `mint_code_lower_unique_idx` (`23505`) and `mint_code_slug_check` (`23514`) map to `code`. `coin_mint_mint_id_mint_id_fk` (`23001`) maps to attribution-specific deletion guidance. Coin Mint Attributions are the dependent relationship.                                        | Two shared text fields and a two-string draft. Create requires both fields. Edit compares normalized values. Client validation remains in the forms, while actions use an intra-feature generic mutation runner.                                                                                                                                             |
| Edge        | `code` and `name`; both are trimmed, required strings of at most 255 characters, and `code` has a lowercase slug refinement. Update and delete use a UUID `id`.                                                                                  | Duplicate `edge_code_lower_unique_idx` (`23505`) and `edge_code_slug_check` (`23514`) map to `code`. `coin_edge_id_edge_id_fk` (`23001`) maps to Edge-specific deletion guidance. Coins are the dependent relationship.                                                                     | A two-string draft is shared, but the two text-field renderings and client validation are duplicated between forms. Create requires both fields and edit compares normalized values. Its intra-feature mutation runner only treats `null` as missing when a caller supplies an explicit null-result function.                                                |
| Ruler       | `code`, `name`, and nullable `rulerGroupId`; text fields are trimmed and required with a 255-character maximum, `code` has a lowercase slug refinement, and the group identifier must be a UUID when present. Update and delete use a UUID `id`. | Duplicate `ruler_code_unique_idx` (`23505`) and `ruler_code_slug_check` (`23514`) map to `code`. A missing `ruler_ruler_group_id_ruler_group_id_fk` reference (`23503`) maps to `rulerGroupId`; `coin_ruler_ruler_id_ruler_id_fk` (`23001`) maps to attribution-specific deletion guidance. | The draft stores a Ruler Group display label, obtains Ruler Group options as a lookup dependency, resolves an exact label to an identifier, and reports invalid selections before submission. The fields include a datalist rather than only text inputs. Edit compares three normalized draft values. Actions use an intra-feature generic mutation runner. |

Every feature returns entity-specific create and delete success messages and
`Saved.` for update. Update and delete return an entity-specific form error for
a missing row. Validation failures return typed field errors, known constraints
return either field or form errors, and unknown persistence failures return an
entity-specific generic form error. Existing action tests exercise these
results through each feature's submission interface.

The genuinely invariant persistence behavior is smaller: a thrown value may
be the PostgreSQL error itself or an object whose `cause` is that error, and a
known failure is identified by its PostgreSQL code and constraint name. The
constraint table and the user-facing result remain entity-owned knowledge.

## Decision

Keep authorization, schemas, database dependency types, mutation orchestration,
result messages, constraint-to-result mappings, form drafts, lookup resolution,
and interface-level tests inside each maintenance feature.

Extract only the proven PostgreSQL constraint matcher as shared database-area
infrastructure in a later implementation. Its exact proposed location is
`apps/web/src/features/database/postgres-constraint-error.ts`, with this small
interface:

```ts
export type PostgresConstraint = {
  code: string
  constraintName: string
}

export function matchesPostgresConstraint(
  error: unknown,
  expected: PostgresConstraint
): boolean
```

The module will hide object checking and the direct-error-versus-`cause`
unwrapping rule. It will not accept result constructors or entity mappings.
Each feature will continue to decide which constraints it recognizes and how
those failures become field or form errors. This is a modest but real deep
module: deleting it would restore the same defensive error inspection in
several feature callers, while its interface requires callers to know only the
two database facts they already own.

Coin Maintenance is explicitly excluded. It saves a whole Coin aggregate and
has transaction, owned-record, attribution, and upload behavior that does not
belong in lookup CRUD infrastructure.

## Alternatives considered

### 1. Keep every responsibility-oriented module feature-owned

A feature would expose only its entity submissions and keep all helpers local:

```ts
export function submitCreateCatalogue(
  collector: CollectorWithRole | null,
  input: CreateCatalogueInput,
  dependencies?: CatalogueMutationDependencies
): Promise<CatalogueMutationResult>
```

This preserves maximum locality. Authorization, validation, persistence
mapping, and tests do not cross a new seam; each feature can evolve its own
relationships, form behavior, and error guidance. It adds no configuration and
has essentially no migration or regression risk, but repeated defensive
PostgreSQL error inspection remains in every feature.

The deletion test is mixed. Deleting any feature-local responsibility module
would return meaningful validation or error behavior to that feature's action
file, so those modules earn their keep. However, deleting each private
PostgreSQL matcher does not reveal distinct feature behavior; it recreates the
same low-level inspection repeatedly. This option loses to the decision because
it gives up a small, proven locality improvement.

### 2. Extract only proven cross-feature helpers

The proposed interface is the `matchesPostgresConstraint` function in the
Decision section. Feature code would retain its mapping:

```ts
if (
  matchesPostgresConstraint(error, {
    code: "23505",
    constraintName: "catalogue_code_lower_unique_idx",
  })
) {
  return createCatalogueFieldErrorResult({
    code: CATALOGUE_DUPLICATE_CODE_ERROR,
  })
}
```

Only error shape checking and cause unwrapping disappear from features. The
added interface consists of an unknown error and one code/name pair; it does
not reproduce schemas, dependencies, operations, or mutation results.
Authorization, validation, result mapping, and interface-level action tests
remain feature-owned. The helper can have focused tests for direct, wrapped,
and malformed errors, while feature tests continue to prove their own
constraint-to-message choices.

Migration risk is low because the helper is pure and each feature can move
independently without changing its submission interface. The deletion test is
positive but deliberately narrow: removing the module restores non-trivial
defensive unwrapping and matching logic in multiple callers. This option is
chosen because it improves locality without weakening the feature seams from
ADR 0006.

### 3. Introduce a shared lookup-mutation factory

A factory capable of representing the current behavior would need an interface
similar to:

```ts
createLookupMutations({
  authorize,
  schemas: { create, update, delete: deleteSchema },
  dependencies: { load, create, update, delete: deleteRecord },
  mapValidationIssues,
  mapPersistenceError,
  results: { unauthorized, missing, created, updated, deleted },
  nullSemantics: { create: "success", update: "missing", delete: "missing" },
})
```

It would remove repeated control-flow lines from action files, but callers
would still configure the authorization result, three schemas, three database
operations, field-error mapping, constraint mapping, generic failure result,
success results, missing-row behavior, and dependency loading. Ruler would
still own its Ruler Group lookup and form conversion, while Catalogue's
responsibility-oriented modules and form semantics would require different
adapters. Tests would cross both the factory seam and the feature adapters,
increasing the risk of testing configuration wiring rather than behavior.

Migration and regression risk are higher because subtle null, validation,
error, and type-inference differences would move simultaneously. The deletion
test is negative: deleting this factory would mostly turn its configuration
callbacks back into the current local control flow, rather than return hidden
domain complexity to several callers. Its interface mirrors almost the full
implementation, so it is a shallow module with worse locality and is rejected.

## Consequences

- Feature slices retain repeated mutation orchestration when that repetition
  keeps entity rules, relationships, results, and tests local.
- A future narrow helper can centralize robust PostgreSQL error inspection and
  make fixes to wrapper handling apply to every migrated lookup feature.
- PostgreSQL codes, constraint names, and user-facing error mappings remain
  visible where the entity behavior is maintained.
- No generic CRUD factory, generic lookup form, or shared mutation result is
  approved.
- The chosen seam extends rather than changes ADR 0006: shared infrastructure
  sits directly under `features/database`, above entity feature slices.

## Follow-up

This ADR records a decision only. It does not authorize TypeScript changes.
Implementing `postgres-constraint-error.ts` requires a new, separately reviewed
plan.

That plan must migrate one feature at a time and keep every feature's existing
interface-level action tests green. It should migrate Catalogue plus one
genuinely different feature first so that at least two real callers prove the
seam before expanding the migration. The helper itself should be tested through
its small interface; feature tests must continue to cover authorization,
validation, success, missing-row, and entity-specific persistence results.

Revisit this decision if mutation semantics diverge substantially or repeated
fixes require synchronized changes across three or more lookup features. Any
future proposal for a wider shared module must again show that its interface
hides meaningful behavior instead of translating implementation into
configuration.
