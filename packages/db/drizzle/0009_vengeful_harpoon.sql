CREATE TABLE "coin_ruling_authorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coin_id" uuid NOT NULL,
	"ruling_authority_id" uuid NOT NULL,
	"role" varchar(100) NOT NULL,
	"tenure" varchar(200),
	"position" integer NOT NULL,
	CONSTRAINT "coin_ruling_authorities_coin_position_unique" UNIQUE("coin_id","position"),
	CONSTRAINT "coin_ruling_authorities_role_not_empty" CHECK (length("coin_ruling_authorities"."role") >= 1),
	CONSTRAINT "coin_ruling_authorities_role_trimmed" CHECK ("coin_ruling_authorities"."role" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "coin_ruling_authorities_tenure_not_empty" CHECK ("coin_ruling_authorities"."tenure" is null or length("coin_ruling_authorities"."tenure") >= 1),
	CONSTRAINT "coin_ruling_authorities_tenure_trimmed" CHECK ("coin_ruling_authorities"."tenure" is null or "coin_ruling_authorities"."tenure" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "coin_ruling_authorities_position_positive" CHECK ("coin_ruling_authorities"."position" > 0)
);
--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" ADD CONSTRAINT "coin_ruling_authorities_coin_id_coins_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" ADD CONSTRAINT "coin_ruling_authorities_ruling_authority_id_ruling_authorities_id_fk" FOREIGN KEY ("ruling_authority_id") REFERENCES "public"."ruling_authorities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_ruling_authorities_authority_coin_index" ON "coin_ruling_authorities" USING btree ("ruling_authority_id","coin_id");