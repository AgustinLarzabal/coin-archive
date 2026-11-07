CREATE TABLE "compositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compositions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "compositions_slug_min_length" CHECK (length("compositions"."slug") >= 3),
	CONSTRAINT "compositions_slug_format" CHECK ("compositions"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "compositions_name_not_empty" CHECK (length("compositions"."name") >= 1),
	CONSTRAINT "compositions_name_trimmed" CHECK ("compositions"."name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "composition_id" uuid;--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "composition_detail" varchar(10000);--> statement-breakpoint
CREATE UNIQUE INDEX "compositions_name_case_insensitive_unique" ON "compositions" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_composition_id_compositions_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."compositions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_composition_detail_valid" CHECK ("coins"."composition_detail" is null or (length("coins"."composition_detail") >= 1 and "coins"."composition_detail" !~ '^[[:space:]]|[[:space:]]$'));
--> statement-breakpoint
INSERT INTO "compositions" ("slug", "name") VALUES ('bimetallic', 'Bimetallic');
