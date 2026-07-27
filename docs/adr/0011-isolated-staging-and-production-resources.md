# Isolated Staging and Production Resources

Coin Archive will isolate staging and production with separate Cloudflare Worker deployments, Neon projects and databases, R2 buckets, OAuth credentials, and secrets. Staging must not be able to alter, expose, or share production catalogue data, Collector identities or sessions, or Surface Images. This creates additional configuration work but makes staging a safe production-like verification environment.
