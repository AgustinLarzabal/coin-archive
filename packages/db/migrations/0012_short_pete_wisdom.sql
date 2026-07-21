UPDATE "coin_surface" SET "image_url" = NULL;--> statement-breakpoint
ALTER TABLE "coin_surface" DROP CONSTRAINT "coin_surface_thumbnail_url_web_url_check";--> statement-breakpoint
ALTER TABLE "coin_surface" DROP COLUMN "thumbnail_url";
