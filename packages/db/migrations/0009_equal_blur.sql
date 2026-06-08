CREATE TABLE "currency" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currency_code_slug_check" CHECK ("currency"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "face_value_text" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "face_value_numeric_value" numeric(20, 6) NOT NULL;--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "currency_id" uuid NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "currency_code_lower_unique_idx" ON "currency" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "currency_code_lookup_idx" ON "currency" USING btree (lower("code"));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_currency_id_idx" ON "coin" USING btree ("currency_id");--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_face_value_numeric_value_positive_check" CHECK ("coin"."face_value_numeric_value" > 0);