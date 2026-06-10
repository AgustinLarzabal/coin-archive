CREATE TABLE "technique" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technique_code_slug_check" CHECK ("technique"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "technique_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "technique_code_lower_unique_idx" ON "technique" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "technique_code_lookup_idx" ON "technique" USING btree (lower("code"));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_technique_id_technique_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."technique"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_technique_id_idx" ON "coin" USING btree ("technique_id");