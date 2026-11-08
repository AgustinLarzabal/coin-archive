CREATE TABLE "coin_tags" (
	"coin_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "coin_tags_coin_id_tag_id_pk" PRIMARY KEY("coin_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tags_slug_format" CHECK (length("tags"."slug") >= 3 and "tags"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "tags_name_trimmed" CHECK (length("tags"."name") >= 1 and "tags"."name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
ALTER TABLE "coin_tags" ADD CONSTRAINT "coin_tags_coin_id_coins_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_tags" ADD CONSTRAINT "coin_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_tags_tag_id_index" ON "coin_tags" USING btree ("tag_id");