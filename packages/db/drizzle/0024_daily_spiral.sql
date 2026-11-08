CREATE TABLE "coin_shapes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "coin_shapes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "coin_shapes_slug_min_length" CHECK (length("coin_shapes"."slug") >= 3),
	CONSTRAINT "coin_shapes_slug_format" CHECK ("coin_shapes"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "coin_shapes_name_not_empty" CHECK (length("coin_shapes"."name") >= 1),
	CONSTRAINT "coin_shapes_name_trimmed" CHECK ("coin_shapes"."name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "shape_id" uuid;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_shape_id_coin_shapes_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."coin_shapes"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "coin_shapes" ("slug", "name") VALUES
  ('circular', 'Circular'),
  ('square', 'Square'),
  ('oval', 'Oval'),
  ('rectangular', 'Rectangular');
