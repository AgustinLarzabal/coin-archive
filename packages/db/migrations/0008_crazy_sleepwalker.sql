CREATE TABLE "composition" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "composition_code_slug_check" CHECK ("composition"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
INSERT INTO "composition" ("code", "name", "description")
VALUES (
	'unspecified',
	'Unspecified',
	'Fallback composition assigned during migration for pre-existing coin rows.'
);--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "composition_id" uuid;--> statement-breakpoint
UPDATE "coin"
SET "composition_id" = (
	SELECT "id"
	FROM "composition"
	WHERE "code" = 'unspecified'
);--> statement-breakpoint
ALTER TABLE "coin" ALTER COLUMN "composition_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "composition_code_lower_unique_idx" ON "composition" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "composition_code_lookup_idx" ON "composition" USING btree (lower("code"));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_composition_id_composition_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."composition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_composition_id_idx" ON "coin" USING btree ("composition_id");
