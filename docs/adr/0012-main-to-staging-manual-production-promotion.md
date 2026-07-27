# Main to Staging, Manual Production Promotion

Coin Archive will use `main` as its single integration branch. Every merge to `main` deploys to staging automatically; a tested commit is promoted manually to production. The project will not maintain a separate staging branch, avoiding branch drift while retaining an explicit production release gate.
