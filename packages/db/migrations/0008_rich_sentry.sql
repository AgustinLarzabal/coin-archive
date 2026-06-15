ALTER TABLE "coin_surface" ADD COLUMN "thumbnail_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "coin_surface" ADD COLUMN "image_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "coin_surface" ADD CONSTRAINT "coin_surface_thumbnail_url_web_url_check" CHECK ("coin_surface"."thumbnail_url" is null or "coin_surface"."thumbnail_url" ~* '^https?://\S+$');--> statement-breakpoint
ALTER TABLE "coin_surface" ADD CONSTRAINT "coin_surface_image_url_web_url_check" CHECK ("coin_surface"."image_url" is null or "coin_surface"."image_url" ~* '^https?://\S+$');