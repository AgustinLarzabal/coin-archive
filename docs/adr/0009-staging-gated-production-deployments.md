# Staging-Gated Production Deployments

Coin Archive will retain local development environments and use a shared staging environment for production-like verification. Changes deploy to staging first; production deployment requires an explicit human promotion after staging verification, rather than deploying automatically on every merge. This trades a small release delay for a deliberate safeguard against publishing an unverified change to the public archive.
