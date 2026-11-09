CREATE TABLE "coin_techniques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "coin_techniques_slug_unique" UNIQUE("slug"),
	CONSTRAINT "coin_techniques_slug_min_length" CHECK (length("coin_techniques"."slug") >= 3),
	CONSTRAINT "coin_techniques_slug_format" CHECK ("coin_techniques"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "coin_techniques_name_not_empty" CHECK (length("coin_techniques"."name") >= 1),
	CONSTRAINT "coin_techniques_name_trimmed" CHECK ("coin_techniques"."name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "technique_id" uuid;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_technique_id_coin_techniques_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."coin_techniques"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "coin_techniques" ("slug", "name") VALUES ('milled', 'Milled');
