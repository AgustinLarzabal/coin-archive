CREATE TABLE "orientation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orientation_code_slug_check" CHECK ("orientation"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "orientation_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "orientation_code_lower_unique_idx" ON "orientation" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "orientation_code_lookup_idx" ON "orientation" USING btree (lower("code"));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_orientation_id_orientation_id_fk" FOREIGN KEY ("orientation_id") REFERENCES "public"."orientation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_orientation_id_idx" ON "coin" USING btree ("orientation_id");