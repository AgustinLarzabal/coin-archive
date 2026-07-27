# Private Staging Surface Images

Staging Surface Images will remain private behind the staging access policy, including the separate staging R2 bucket and image hostname. Production Surface Images remain publicly readable as ADR-0008 specifies. This prevents staging assets from becoming a public side channel around the private staging application.
