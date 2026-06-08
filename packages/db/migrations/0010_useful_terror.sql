CREATE TABLE "coin_mint" (
	"coin_id" uuid NOT NULL,
	"mint_id" uuid NOT NULL,
	CONSTRAINT "coin_mint_coin_id_mint_id_pk" PRIMARY KEY("coin_id","mint_id")
);
--> statement-breakpoint
CREATE TABLE "mint" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mint_code_slug_check" CHECK ("mint"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin_mint" ADD CONSTRAINT "coin_mint_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_mint" ADD CONSTRAINT "coin_mint_mint_id_mint_id_fk" FOREIGN KEY ("mint_id") REFERENCES "public"."mint"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_mint_coin_id_idx" ON "coin_mint" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_mint_mint_id_idx" ON "coin_mint" USING btree ("mint_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mint_code_lower_unique_idx" ON "mint" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "mint_code_lookup_idx" ON "mint" USING btree (lower("code"));