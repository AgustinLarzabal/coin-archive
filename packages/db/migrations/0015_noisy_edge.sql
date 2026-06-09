CREATE TABLE "edge" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_code_slug_check" CHECK ("edge"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "edge_id" uuid;--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "edge_description" varchar(4000);--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "edge_lettering" varchar(4000);--> statement-breakpoint
CREATE UNIQUE INDEX "edge_code_lower_unique_idx" ON "edge" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "edge_code_lookup_idx" ON "edge" USING btree (lower("code"));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_edge_id_edge_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_edge_id_idx" ON "coin" USING btree ("edge_id");
