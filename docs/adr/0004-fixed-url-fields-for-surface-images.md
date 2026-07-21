---
status: superseded by ADR-0008
---

# Fixed URL Fields for Surface Images

Coin Archive stores surface imagery as two nullable web URL fields directly on each Coin Surface: a Surface Thumbnail URL for compact previews and a Surface Image URL for larger display. This keeps Obverse, Reverse, and Edge Surface imagery aligned with the existing one-row-per-surface model and avoids introducing a separate image table before the archive needs multiple images, credits, licenses, ordering, or variants.

Coin record APIs that expose surface data group it under `coin.surfaces.obverse`, `coin.surfaces.reverse`, and `coin.surfaces.edge`, while `coin.edge` remains reserved for the controlled Edge classification. This deliberately separates Edge Surface details from Edge classification data and accepts that supporting richer image metadata later will require a migration to a more normalized image model.
