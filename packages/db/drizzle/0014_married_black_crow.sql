CREATE TABLE "distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distributions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "distributions_slug_min_length" CHECK (length("distributions"."slug") >= 3),
	CONSTRAINT "distributions_slug_format" CHECK ("distributions"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "distributions_name_not_empty" CHECK (length("distributions"."name") >= 1),
	CONSTRAINT "distributions_name_trimmed" CHECK ("distributions"."name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "distributions_name_case_insensitive_unique" ON "distributions" USING btree (lower("name"));
--> statement-breakpoint
INSERT INTO "distributions" ("slug", "name") VALUES
  ('standard-circulation', 'Standard circulation'),
  ('circulating-commemorative', 'Circulating commemorative'),
  ('non-circulating', 'Non-circulating');
