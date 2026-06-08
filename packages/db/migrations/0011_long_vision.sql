CREATE TABLE "coin_theme" (
	"coin_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "coin_theme_coin_id_theme_id_pk" PRIMARY KEY("coin_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "theme" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theme_code_slug_check" CHECK ("theme"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin_theme" ADD CONSTRAINT "coin_theme_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_theme" ADD CONSTRAINT "coin_theme_theme_id_theme_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_theme_coin_id_idx" ON "coin_theme" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_theme_theme_id_idx" ON "coin_theme" USING btree ("theme_id");--> statement-breakpoint
CREATE UNIQUE INDEX "theme_code_lower_unique_idx" ON "theme" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "theme_code_lookup_idx" ON "theme" USING btree (lower("code"));