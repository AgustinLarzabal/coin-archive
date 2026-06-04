CREATE TABLE "catalogue" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_reference" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"coin_id" uuid NOT NULL,
	"catalogue_id" uuid NOT NULL,
	"number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coin_reference" ADD CONSTRAINT "coin_reference_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_reference" ADD CONSTRAINT "coin_reference_catalogue_id_catalogue_id_fk" FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogue"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalogue_code_lower_unique_idx" ON "catalogue" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "catalogue_code_lookup_idx" ON "catalogue" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "coin_reference_coin_id_idx" ON "coin_reference" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_reference_catalogue_id_idx" ON "coin_reference" USING btree ("catalogue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coin_reference_coin_id_catalogue_id_normalized_number_unique_idx" ON "coin_reference" USING btree ("coin_id","catalogue_id",lower(regexp_replace(btrim("number"), '\s+', ' ', 'g')));