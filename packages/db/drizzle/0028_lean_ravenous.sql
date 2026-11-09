CREATE TABLE "coin_orientations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "coin_orientations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "coin_orientations_slug_min_length" CHECK (length("coin_orientations"."slug") >= 3),
	CONSTRAINT "coin_orientations_slug_format" CHECK ("coin_orientations"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "coin_orientations_name_not_empty" CHECK (length("coin_orientations"."name") >= 1),
	CONSTRAINT "coin_orientations_name_trimmed" CHECK ("coin_orientations"."name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "orientation_id" uuid;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_orientation_id_coin_orientations_id_fk" FOREIGN KEY ("orientation_id") REFERENCES "public"."coin_orientations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "coin_orientations" ("slug", "name") VALUES ('medal', 'Medal'), ('coin', 'Coin');
