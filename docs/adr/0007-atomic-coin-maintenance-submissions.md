# Atomic Coin Maintenance Submissions

Coin Maintenance will treat each create, edit, and delete submission as one aggregate-level transaction. The persistence seam lives in dedicated Coin Maintenance mutations that write the parent Coin row together with its owned child collections, replace owned child collections from submitted form state on update, and touch the parent Coin's `updatedAt` whenever any aggregate edit succeeds.

This keeps the first Coin Maintenance workflow predictable for editors working on a large catalogue aggregate. Update submissions follow last-write-wins semantics for v1 rather than optimistic locking, so the saved form state becomes the authoritative aggregate view at commit time. Replacing owned child collections from submitted state ensures removals, reordering, and emptying a collection behave the same way as additions, instead of leaving stale child rows behind.

Atomic aggregate submissions were chosen over per-section saves or piecemeal child mutations because mixed partial Coin state would make catalogue maintenance harder to reason about and harder to test. Touching the parent Coin `updatedAt` on child-only edits keeps the maintenance list's recent-activity ordering aligned with real aggregate work, while leaving shared lookup records outside the Coin deletion and update transaction scope.
