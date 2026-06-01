# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repo root.
- `docs/adr/` for architectural decisions that touch the area being changed.

If any of these files do not exist, proceed silently. Producer skills create them lazily when terms or decisions are resolved.

## Layout

This repo is a single-context repo:

```txt
/
├── CONTEXT.md
├── docs/adr/
└── apps/, packages/
```

## Use the glossary's vocabulary

When output names a domain concept, use the term as defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If a needed concept is not in the glossary, either reconsider whether the term belongs in this project or note the gap for `grill-with-docs`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than silently overriding it.
