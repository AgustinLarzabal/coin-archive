CREATE TABLE "rim" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rim_code_slug_check" CHECK ("rim"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "shape" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shape_code_slug_check" CHECK ("shape"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "shape_id" uuid;--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "rim_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "rim_code_lower_unique_idx" ON "rim" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "rim_code_lookup_idx" ON "rim" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "shape_code_lower_unique_idx" ON "shape" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "shape_code_lookup_idx" ON "shape" USING btree (lower("code"));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_shape_id_shape_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shape"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_rim_id_rim_id_fk" FOREIGN KEY ("rim_id") REFERENCES "public"."rim"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_shape_id_idx" ON "coin" USING btree ("shape_id");--> statement-breakpoint
CREATE INDEX "coin_rim_id_idx" ON "coin" USING btree ("rim_id");