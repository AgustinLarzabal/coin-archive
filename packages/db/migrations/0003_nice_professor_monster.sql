CREATE TABLE "ruler_group" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ruler_group_code_slug_check" CHECK ("ruler_group"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "ruler" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"ruler_group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ruler_code_slug_check" CHECK ("ruler"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "coin_ruler" (
	"coin_id" uuid NOT NULL,
	"ruler_id" uuid NOT NULL,
	"ruler_order" integer NOT NULL,
	CONSTRAINT "coin_ruler_coin_id_ruler_id_pk" PRIMARY KEY("coin_id","ruler_id"),
	CONSTRAINT "coin_ruler_ruler_order_positive_check" CHECK ("coin_ruler"."ruler_order" > 0)
);
--> statement-breakpoint
ALTER TABLE "ruler" ADD CONSTRAINT "ruler_ruler_group_id_ruler_group_id_fk" FOREIGN KEY ("ruler_group_id") REFERENCES "public"."ruler_group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ruler" ADD CONSTRAINT "coin_ruler_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ruler" ADD CONSTRAINT "coin_ruler_ruler_id_ruler_id_fk" FOREIGN KEY ("ruler_id") REFERENCES "public"."ruler"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ruler_group_code_unique_idx" ON "ruler_group" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ruler_code_unique_idx" ON "ruler" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ruler_ruler_group_id_idx" ON "ruler" USING btree ("ruler_group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coin_ruler_coin_id_ruler_order_unique_idx" ON "coin_ruler" USING btree ("coin_id","ruler_order");--> statement-breakpoint
CREATE INDEX "coin_ruler_coin_id_ruler_order_idx" ON "coin_ruler" USING btree ("coin_id","ruler_order");--> statement-breakpoint
CREATE INDEX "coin_ruler_ruler_id_idx" ON "coin_ruler" USING btree ("ruler_id");