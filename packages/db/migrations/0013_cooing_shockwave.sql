CREATE TABLE "surface_image_cleanup_failure" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"deleted_coin_id" uuid NOT NULL,
	"image_url" varchar(2048) NOT NULL,
	"error_message" varchar(2000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "surface_image_cleanup_failure_created_at_idx" ON "surface_image_cleanup_failure" USING btree ("created_at");