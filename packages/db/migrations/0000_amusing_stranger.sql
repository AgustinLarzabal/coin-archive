CREATE TABLE "catalogue" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"title" varchar(255) NOT NULL,
	"issuer_id" uuid NOT NULL,
	"distribution_id" uuid NOT NULL,
	"composition_id" uuid NOT NULL,
	"face_value_text" varchar(255) NOT NULL,
	"face_value_numeric_value" numeric(20, 6) NOT NULL,
	"currency_id" uuid NOT NULL,
	"orientation_id" uuid,
	"edge_id" uuid,
	"edge_description" varchar(4000),
	"edge_lettering" varchar(4000),
	"shape_id" uuid,
	"rim_id" uuid,
	"comments" text,
	"mintage" bigint,
	"min_year" integer,
	"max_year" integer,
	"weight" numeric(10, 2),
	"diameter" numeric(10, 2),
	"thickness" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_issue_year_range_closed_check" CHECK (("coin"."min_year" is null and "coin"."max_year" is null) or ("coin"."min_year" is not null and "coin"."max_year" is not null)),
	CONSTRAINT "coin_issue_year_range_order_check" CHECK ("coin"."min_year" is null or "coin"."max_year" is null or "coin"."min_year" <= "coin"."max_year"),
	CONSTRAINT "coin_weight_positive_check" CHECK ("coin"."weight" is null or "coin"."weight" > 0),
	CONSTRAINT "coin_diameter_positive_check" CHECK ("coin"."diameter" is null or "coin"."diameter" > 0),
	CONSTRAINT "coin_thickness_positive_check" CHECK ("coin"."thickness" is null or "coin"."thickness" > 0),
	CONSTRAINT "coin_face_value_numeric_value_positive_check" CHECK ("coin"."face_value_numeric_value" > 0),
	CONSTRAINT "coin_mintage_positive_check" CHECK ("coin"."mintage" is null or "coin"."mintage" > 0)
);
--> statement-breakpoint
CREATE TABLE "coin_face" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"coin_id" uuid NOT NULL,
	"side" varchar(16) NOT NULL,
	"description" varchar(2000),
	"lettering" varchar(4000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_face_side_check" CHECK ("coin_face"."side" in ('obverse', 'reverse'))
);
--> statement-breakpoint
CREATE TABLE "coin_face_engraver" (
	"coin_face_id" uuid NOT NULL,
	"engraver_id" uuid NOT NULL,
	CONSTRAINT "coin_face_engraver_coin_face_id_engraver_id_pk" PRIMARY KEY("coin_face_id","engraver_id")
);
--> statement-breakpoint
CREATE TABLE "coin_mint" (
	"coin_id" uuid NOT NULL,
	"mint_id" uuid NOT NULL,
	CONSTRAINT "coin_mint_coin_id_mint_id_pk" PRIMARY KEY("coin_id","mint_id")
);
--> statement-breakpoint
CREATE TABLE "coin_theme" (
	"coin_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "coin_theme_coin_id_theme_id_pk" PRIMARY KEY("coin_id","theme_id")
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
CREATE TABLE "composition" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "composition_code_slug_check" CHECK ("composition"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
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
CREATE TABLE "distribution" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distribution_code_slug_check" CHECK ("distribution"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "edge" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_code_slug_check" CHECK ("edge"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "engraver" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engraver_code_slug_check" CHECK ("engraver"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "issuer" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"parent_issuer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issuer_parent_issuer_id_self_check" CHECK ("issuer"."parent_issuer_id" is null or "issuer"."parent_issuer_id" <> "issuer"."id"),
	CONSTRAINT "issuer_code_slug_check" CHECK ("issuer"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
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
CREATE TABLE "orientation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orientation_code_slug_check" CHECK ("orientation"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "rim" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rim_code_slug_check" CHECK ("rim"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
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
CREATE TABLE "shape" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shape_code_slug_check" CHECK ("shape"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
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
CREATE TABLE "theme" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theme_code_slug_check" CHECK ("theme"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_issuer_id_issuer_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_distribution_id_distribution_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."distribution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_composition_id_composition_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."composition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_orientation_id_orientation_id_fk" FOREIGN KEY ("orientation_id") REFERENCES "public"."orientation"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_edge_id_edge_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_shape_id_shape_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shape"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_rim_id_rim_id_fk" FOREIGN KEY ("rim_id") REFERENCES "public"."rim"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_face" ADD CONSTRAINT "coin_face_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_id_coin_face_id_fk" FOREIGN KEY ("coin_face_id") REFERENCES "public"."coin_face"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_engraver_id_engraver_id_fk" FOREIGN KEY ("engraver_id") REFERENCES "public"."engraver"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_mint" ADD CONSTRAINT "coin_mint_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_mint" ADD CONSTRAINT "coin_mint_mint_id_mint_id_fk" FOREIGN KEY ("mint_id") REFERENCES "public"."mint"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_theme" ADD CONSTRAINT "coin_theme_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_theme" ADD CONSTRAINT "coin_theme_theme_id_theme_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_reference" ADD CONSTRAINT "coin_reference_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_reference" ADD CONSTRAINT "coin_reference_catalogue_id_catalogue_id_fk" FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogue"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuer" ADD CONSTRAINT "issuer_parent_issuer_id_issuer_id_fk" FOREIGN KEY ("parent_issuer_id") REFERENCES "public"."issuer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruler" ADD CONSTRAINT "ruler_ruler_group_id_ruler_group_id_fk" FOREIGN KEY ("ruler_group_id") REFERENCES "public"."ruler_group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ruler" ADD CONSTRAINT "coin_ruler_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ruler" ADD CONSTRAINT "coin_ruler_ruler_id_ruler_id_fk" FOREIGN KEY ("ruler_id") REFERENCES "public"."ruler"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalogue_code_lower_unique_idx" ON "catalogue" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "catalogue_code_lookup_idx" ON "catalogue" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "coin_recent_created_at_id_idx" ON "coin" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "coin_issuer_id_idx" ON "coin" USING btree ("issuer_id");--> statement-breakpoint
CREATE INDEX "coin_distribution_id_idx" ON "coin" USING btree ("distribution_id");--> statement-breakpoint
CREATE INDEX "coin_composition_id_idx" ON "coin" USING btree ("composition_id");--> statement-breakpoint
CREATE INDEX "coin_currency_id_idx" ON "coin" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "coin_orientation_id_idx" ON "coin" USING btree ("orientation_id");--> statement-breakpoint
CREATE INDEX "coin_edge_id_idx" ON "coin" USING btree ("edge_id");--> statement-breakpoint
CREATE INDEX "coin_shape_id_idx" ON "coin" USING btree ("shape_id");--> statement-breakpoint
CREATE INDEX "coin_rim_id_idx" ON "coin" USING btree ("rim_id");--> statement-breakpoint
CREATE INDEX "coin_issue_year_range_idx" ON "coin" USING btree ("min_year","max_year");--> statement-breakpoint
CREATE INDEX "coin_weight_idx" ON "coin" USING btree ("weight");--> statement-breakpoint
CREATE INDEX "coin_diameter_idx" ON "coin" USING btree ("diameter");--> statement-breakpoint
CREATE INDEX "coin_thickness_idx" ON "coin" USING btree ("thickness");--> statement-breakpoint
CREATE UNIQUE INDEX "coin_face_coin_id_side_unique_idx" ON "coin_face" USING btree ("coin_id","side");--> statement-breakpoint
CREATE INDEX "coin_face_coin_id_idx" ON "coin_face" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_face_engraver_coin_face_id_idx" ON "coin_face_engraver" USING btree ("coin_face_id");--> statement-breakpoint
CREATE INDEX "coin_face_engraver_engraver_id_idx" ON "coin_face_engraver" USING btree ("engraver_id");--> statement-breakpoint
CREATE INDEX "coin_mint_coin_id_idx" ON "coin_mint" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_mint_mint_id_idx" ON "coin_mint" USING btree ("mint_id");--> statement-breakpoint
CREATE INDEX "coin_theme_coin_id_idx" ON "coin_theme" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_theme_theme_id_idx" ON "coin_theme" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "coin_reference_coin_id_idx" ON "coin_reference" USING btree ("coin_id");--> statement-breakpoint
CREATE INDEX "coin_reference_catalogue_id_idx" ON "coin_reference" USING btree ("catalogue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coin_reference_coin_catalogue_number_unique_idx" ON "coin_reference" USING btree ("coin_id","catalogue_id",lower(regexp_replace(btrim("number"), '\s+', ' ', 'g')));--> statement-breakpoint
CREATE UNIQUE INDEX "composition_code_lower_unique_idx" ON "composition" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "composition_code_lookup_idx" ON "composition" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "currency_code_lower_unique_idx" ON "currency" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "currency_code_lookup_idx" ON "currency" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "distribution_code_lower_unique_idx" ON "distribution" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "distribution_code_lookup_idx" ON "distribution" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "edge_code_lower_unique_idx" ON "edge" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "edge_code_lookup_idx" ON "edge" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "engraver_code_lower_unique_idx" ON "engraver" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "engraver_code_lookup_idx" ON "engraver" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "issuer_code_unique_idx" ON "issuer" USING btree ("code");--> statement-breakpoint
CREATE INDEX "issuer_parent_issuer_id_idx" ON "issuer" USING btree ("parent_issuer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mint_code_lower_unique_idx" ON "mint" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "mint_code_lookup_idx" ON "mint" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "orientation_code_lower_unique_idx" ON "orientation" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "orientation_code_lookup_idx" ON "orientation" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "rim_code_lower_unique_idx" ON "rim" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "rim_code_lookup_idx" ON "rim" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "ruler_group_code_unique_idx" ON "ruler_group" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ruler_code_unique_idx" ON "ruler" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ruler_ruler_group_id_idx" ON "ruler" USING btree ("ruler_group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shape_code_lower_unique_idx" ON "shape" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "shape_code_lookup_idx" ON "shape" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "coin_ruler_coin_id_ruler_order_unique_idx" ON "coin_ruler" USING btree ("coin_id","ruler_order");--> statement-breakpoint
CREATE INDEX "coin_ruler_coin_id_ruler_order_idx" ON "coin_ruler" USING btree ("coin_id","ruler_order");--> statement-breakpoint
CREATE INDEX "coin_ruler_ruler_id_idx" ON "coin_ruler" USING btree ("ruler_id");--> statement-breakpoint
CREATE UNIQUE INDEX "theme_code_lower_unique_idx" ON "theme" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "theme_code_lookup_idx" ON "theme" USING btree (lower("code"));
