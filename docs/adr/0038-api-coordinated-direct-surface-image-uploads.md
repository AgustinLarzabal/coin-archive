# API-Coordinated Direct Surface Image Uploads

Web and mobile clients will request Editor-protected, short-lived Surface Image upload authorization from the shared API and upload image binaries directly to R2 rather than through either Worker. Coin creation or replacement consumes the opaque upload reference only after the API verifies the object, while cancelled uploads are deleted explicitly and an automated R2 lifecycle policy expires abandoned temporary objects; published objects must be moved or marked outside that expiry policy.

This decision retains ADR 0008's direct-upload and atomic-publication protocol but reverses its deferral of automated abandoned-upload cleanup now that intermittent mobile clients increase the likelihood of orphaned temporary objects.
