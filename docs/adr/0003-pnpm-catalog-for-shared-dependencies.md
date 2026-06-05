# pnpm Catalog for Shared Dependency Versions

Coin Archive will use the default pnpm catalog in `pnpm-workspace.yaml` for external dependencies that appear by exact package name in more than one workspace manifest. Single-owner dependencies keep direct version ranges, named catalogs are deferred until version families diverge, and `"latest"` should not be used so dependency policy remains explicit and reproducible.
