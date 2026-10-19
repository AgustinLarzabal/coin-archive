# ReUI Filters integration research

Checked 2026-10-19 against ReUI's current public docs and registry.

## Finding

**TanStack Table is not required to use the current Filters primitive.** Its controlled API accepts `fields`, `query`, and `onQueryChange`; the primitive produces a plain JSON `FilterQuery` tree and leaves evaluation or translation to the consumer. The [current component docs](https://reui.io/docs/components/base/filters) explicitly show a standalone toolbar with `useState` and say that the primitive stops at the query tree. The [component gallery](https://reui.io/components/filters) says only **2 of 12 examples** use TanStack Table. The [example 7 manifest](https://reui.io/r/base-nova/c-filters-7.json) and [example 10 manifest](https://reui.io/r/base-nova/c-filters-10.json) are those two; the other ten manifests do not list it. The gallery's longer marketing and FAQ text still describes direct table binding, nuqs URL state, and Zod validation. Treat that text as stale or as describing optional integrations, since it conflicts with the current API and registry artifact.

## API and implications

- `FilterField[]` describes attributes, including nested attributes. Built-in value types are text, number, range, select, multiselect, and boolean. Options can be static or loaded asynchronously. Custom operators, editors, value rendering, and labels are supported. [API reference](https://reui.io/docs/components/base/filters)
- `FilterQuery` is a root group with `and` or `or` and rules or nested groups. Each rule stores a field `path`, operator, value, and optional negation. The basic chip row and advanced builder share this model. The callback fires while rules are incomplete, so the application must skip incomplete rules when applying filters. [Query model and helpers](https://reui.io/docs/components/base/filters)
- A flat conjunction can use `flattenFilterConditions`, which drops groups and therefore **loses boolean meaning** for nested `or` expressions. Supporting advanced mode correctly requires walking the tree and mapping each supported operator to the application's query language. [Query helper reference](https://reui.io/docs/components/base/filters)
- The primitive does not automatically add URL persistence, server filtering, Zod validation, or TanStack Table integration. Those are application choices built around `onQueryChange`. [Usage and integration section](https://reui.io/docs/components/base/filters)

## Install, dependencies, and license

- ReUI is a shadcn registry, not an npm `@reui` package. Configure `"@reui": "https://reui.io/r/{style}/{name}.json"` in `components.json` and install `@reui/filters`. Choose `base-*` or `radix-*` to match the project's shadcn primitives. [Registry guide](https://reui.io/docs/registry)
- The [live base-nova registry manifest](https://reui.io/r/base-nova/filters.json) lists 14 Filters source files, direct dependencies `class-variance-authority`, `cn`, and `date-fns`, and registry dependencies including `cascader` plus shadcn button, button-group, dropdown-menu, input, popover, and tooltip. Cascader adds `@base-ui/react` and `@tanstack/react-virtual` in the Base UI variant. **`@tanstack/react-virtual` is for option-list virtualization; it is not TanStack Table.** The manifest's Filters source imports none of `@tanstack/react-table`, `nuqs`, `zod`, or `react-day-picker`. [Component installation notes](https://reui.io/docs/components/base/filters)
- The 12 `c-filters-*` examples and the `filters` primitive are free items under MIT; the paid Pro blocks have separate license terms. Preserve the MIT notice when distributing copied source. [ReUI license](https://reui.io/legal/license), [registry guide](https://reui.io/docs/registry)

## Recommendation for an Explore page

The core component is feasible without a table, but integration is a **query adapter**, not a visual swap. This is an inference from the ReUI API and the project code below.

Coin Archive already has seven Explore controls in `apps/web/src/features/explore/filters/explore-filters.tsx`: distribution, issuer, currency, amount, ruling authority, engraver, and issue year. `apps/web/src/routes/_explore.tsx` owns validated URL state; `explore-search-navigation.ts` updates that state and resets pagination; `apps/web/src/routes/_explore.index.tsx` and `apps/web/src/data/archive/coins.ts` fetch paged server results through TanStack Query. No client-side table filtering is involved. The installed UI uses Base UI, and both `apps/web/components.json` and `packages/ui/components.json` use the supported `base-lyra` style. [ReUI style values](https://reui.io/docs/registry#style-values)

The current `/v1/coins` contract in `apps/api/src/routes/coins.ts` accepts one exact value for each categorical field, one exact positive face-value amount (only with currency), and one signed year or closed year range. It has no general `or`, negation, duplicate-field rules, or amount inequalities. The year input also has BCE/CE and no-year-zero behavior in `issue-year-filter-value.ts`. The initial ReUI field schema should therefore offer only supported operators and one rule per field, with amount dependent on currency; preserve the project's existing validation. An advanced builder would require extending the API and its query implementation first.

Start with the basic chip row. Convert URL search values into a flat `and` query for display, and convert complete rules back into the existing URL fields, keeping the URL authoritative for applied filters and preserving shareable links and pagination reset. Keep incomplete ReUI rules in local draft state until they can become valid URL parameters; a query derived only from the URL on every render would discard the component's unfinished chips. ReUI's accessible picker, field search, and removable chips are the main benefits. The added cascader and UI dependencies, query-to-URL adapter, and validation of field dependencies are the main costs.

## Trial integration

The first trial keeps all existing Explore controls and adds a labeled ReUI row below them. It supports one Coin Distribution rule with the `is` operator. The row and the old Distribution control both read the same URL value, so either control can update the result list. The trial blocks duplicate and negated rules because the current API cannot express them. This is a reversible UI experiment; it does not change the Archive domain model or the coin-list API.
