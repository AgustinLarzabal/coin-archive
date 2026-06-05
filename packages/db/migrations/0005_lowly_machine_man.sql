CREATE TABLE "distribution" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distribution_code_slug_check" CHECK ("distribution"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "distribution_code_lower_unique_idx" ON "distribution" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "distribution_code_lookup_idx" ON "distribution" USING btree (lower("code"));--> statement-breakpoint
INSERT INTO "distribution" ("code", "name")
VALUES
	('standard-circulation', 'Standard circulation'),
	('circulating-commemorative', 'Circulating commemorative')
ON CONFLICT ((lower("code"))) DO UPDATE
SET
	"name" = excluded."name",
	"updated_at" = now();--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "distribution_id" uuid;--> statement-breakpoint
UPDATE "coin"
SET "distribution_id" = (
	SELECT "distribution"."id"
	FROM "distribution"
	WHERE lower("distribution"."code") = 'standard-circulation'
)
WHERE "coin"."distribution_id" IS NULL;--> statement-breakpoint
ALTER TABLE "coin" ALTER COLUMN "distribution_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_distribution_id_distribution_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."distribution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_distribution_id_idx" ON "coin" USING btree ("distribution_id");
