# Expand–Migrate–Contract Schema Changes

Production schema changes must use an expand–migrate–contract sequence: introduce compatible schema, deploy code that supports both shapes, then remove obsolete structures only in a later release. Normal releases will not run destructive schema changes, preserving rollback options while application versions transition.
