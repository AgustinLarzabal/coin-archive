CREATE TABLE "catalogue" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

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
	"shape_id" uuid,
	"rim_id" uuid,
	"technique_id" uuid,
	"comments" text,
	"is_demonetized" boolean,
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

CREATE TABLE "coin_surface" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"coin_id" uuid NOT NULL,
	"kind" varchar(16) NOT NULL,
	"description" varchar(2000),
	"lettering" varchar(4000),
	"thumbnail_url" varchar(2048),
	"image_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_surface_kind_check" CHECK ("coin_surface"."kind" in ('obverse', 'reverse', 'edge-surface')),
	CONSTRAINT "coin_surface_thumbnail_url_web_url_check" CHECK ("coin_surface"."thumbnail_url" is null or "coin_surface"."thumbnail_url" ~* '^https?://\S+$'),
	CONSTRAINT "coin_surface_image_url_web_url_check" CHECK ("coin_surface"."image_url" is null or "coin_surface"."image_url" ~* '^https?://\S+$')
);

CREATE TABLE "coin_face_engraver" (
	"coin_face_id" uuid NOT NULL,
	"coin_face_kind" varchar(16) NOT NULL,
	"engraver_id" uuid NOT NULL,
	CONSTRAINT "coin_face_engraver_coin_face_id_coin_face_kind_engraver_id_pk" PRIMARY KEY("coin_face_id","coin_face_kind","engraver_id"),
	CONSTRAINT "coin_face_engraver_coin_face_kind_check" CHECK ("coin_face_engraver"."coin_face_kind" in ('obverse', 'reverse'))
);

CREATE TABLE "coin_mint" (
	"coin_id" uuid NOT NULL,
	"mint_id" uuid NOT NULL,
	CONSTRAINT "coin_mint_coin_id_mint_id_pk" PRIMARY KEY("coin_id","mint_id")
);

CREATE TABLE "coin_theme" (
	"coin_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "coin_theme_coin_id_theme_id_pk" PRIMARY KEY("coin_id","theme_id")
);

CREATE TABLE "coin_reference" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"coin_id" uuid NOT NULL,
	"catalogue_id" uuid NOT NULL,
	"number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "composition" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "composition_code_slug_check" CHECK ("composition"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "currency" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currency_code_slug_check" CHECK ("currency"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "distribution" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distribution_code_slug_check" CHECK ("distribution"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "edge" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_code_slug_check" CHECK ("edge"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "engraver" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engraver_code_slug_check" CHECK ("engraver"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "issuer" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"iso_code" varchar(2) NOT NULL,
	"parent_issuer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issuer_parent_issuer_id_self_check" CHECK ("issuer"."parent_issuer_id" is null or "issuer"."parent_issuer_id" <> "issuer"."id"),
	CONSTRAINT "issuer_code_slug_check" CHECK ("issuer"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "issuer_iso_code_format_check" CHECK ("issuer"."iso_code" ~ '^[A-Z]{2}$')
);

CREATE TABLE "mint" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mint_code_slug_check" CHECK ("mint"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "orientation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orientation_code_slug_check" CHECK ("orientation"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "rim" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rim_code_slug_check" CHECK ("rim"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "ruler_group" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ruler_group_code_slug_check" CHECK ("ruler_group"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "ruler" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"ruler_group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ruler_code_slug_check" CHECK ("ruler"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "shape" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shape_code_slug_check" CHECK ("shape"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "technique" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technique_code_slug_check" CHECK ("technique"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE "coin_ruler" (
	"coin_id" uuid NOT NULL,
	"ruler_id" uuid NOT NULL,
	"ruler_order" integer NOT NULL,
	CONSTRAINT "coin_ruler_coin_id_ruler_id_pk" PRIMARY KEY("coin_id","ruler_id"),
	CONSTRAINT "coin_ruler_ruler_order_positive_check" CHECK ("coin_ruler"."ruler_order" > 0)
);

CREATE TABLE "theme" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theme_code_slug_check" CHECK ("theme"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

ALTER TABLE "coin" ADD CONSTRAINT "coin_issuer_id_issuer_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuer"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_distribution_id_distribution_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."distribution"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_composition_id_composition_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."composition"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_orientation_id_orientation_id_fk" FOREIGN KEY ("orientation_id") REFERENCES "public"."orientation"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_edge_id_edge_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_shape_id_shape_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shape"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_rim_id_rim_id_fk" FOREIGN KEY ("rim_id") REFERENCES "public"."rim"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin" ADD CONSTRAINT "coin_technique_id_technique_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."technique"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin_surface" ADD CONSTRAINT "coin_surface_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_engraver_id_engraver_id_fk" FOREIGN KEY ("engraver_id") REFERENCES "public"."engraver"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_id_kind_fk" FOREIGN KEY ("coin_face_id","coin_face_kind") REFERENCES "public"."coin_surface"("id","kind") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coin_mint" ADD CONSTRAINT "coin_mint_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coin_mint" ADD CONSTRAINT "coin_mint_mint_id_mint_id_fk" FOREIGN KEY ("mint_id") REFERENCES "public"."mint"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin_theme" ADD CONSTRAINT "coin_theme_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coin_theme" ADD CONSTRAINT "coin_theme_theme_id_theme_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin_reference" ADD CONSTRAINT "coin_reference_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coin_reference" ADD CONSTRAINT "coin_reference_catalogue_id_catalogue_id_fk" FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogue"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "issuer" ADD CONSTRAINT "issuer_parent_issuer_id_issuer_id_fk" FOREIGN KEY ("parent_issuer_id") REFERENCES "public"."issuer"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "ruler" ADD CONSTRAINT "ruler_ruler_group_id_ruler_group_id_fk" FOREIGN KEY ("ruler_group_id") REFERENCES "public"."ruler_group"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "coin_ruler" ADD CONSTRAINT "coin_ruler_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "coin_ruler" ADD CONSTRAINT "coin_ruler_ruler_id_ruler_id_fk" FOREIGN KEY ("ruler_id") REFERENCES "public"."ruler"("id") ON DELETE restrict ON UPDATE no action;
CREATE UNIQUE INDEX "catalogue_code_lower_unique_idx" ON "catalogue" USING btree (lower("code"));
CREATE INDEX "catalogue_code_lookup_idx" ON "catalogue" USING btree (lower("code"));
CREATE INDEX "catalogue_title_code_sort_idx" ON "catalogue" USING btree ("title","code");
CREATE INDEX "coin_recent_created_at_id_idx" ON "coin" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);
CREATE INDEX "coin_issuer_id_idx" ON "coin" USING btree ("issuer_id");
CREATE INDEX "coin_distribution_id_idx" ON "coin" USING btree ("distribution_id");
CREATE INDEX "coin_composition_id_idx" ON "coin" USING btree ("composition_id");
CREATE INDEX "coin_currency_id_idx" ON "coin" USING btree ("currency_id");
CREATE INDEX "coin_orientation_id_idx" ON "coin" USING btree ("orientation_id");
CREATE INDEX "coin_edge_id_idx" ON "coin" USING btree ("edge_id");
CREATE INDEX "coin_shape_id_idx" ON "coin" USING btree ("shape_id");
CREATE INDEX "coin_rim_id_idx" ON "coin" USING btree ("rim_id");
CREATE INDEX "coin_technique_id_idx" ON "coin" USING btree ("technique_id");
CREATE INDEX "coin_issue_year_range_idx" ON "coin" USING btree ("min_year","max_year");
CREATE INDEX "coin_weight_idx" ON "coin" USING btree ("weight");
CREATE INDEX "coin_diameter_idx" ON "coin" USING btree ("diameter");
CREATE INDEX "coin_thickness_idx" ON "coin" USING btree ("thickness");
CREATE UNIQUE INDEX "coin_surface_coin_id_kind_unique_idx" ON "coin_surface" USING btree ("coin_id","kind");
CREATE UNIQUE INDEX "coin_surface_id_kind_unique_idx" ON "coin_surface" USING btree ("id","kind");
CREATE INDEX "coin_surface_coin_id_idx" ON "coin_surface" USING btree ("coin_id");
CREATE INDEX "coin_face_engraver_coin_face_id_idx" ON "coin_face_engraver" USING btree ("coin_face_id");
CREATE INDEX "coin_face_engraver_coin_face_kind_idx" ON "coin_face_engraver" USING btree ("coin_face_kind");
CREATE INDEX "coin_face_engraver_engraver_id_idx" ON "coin_face_engraver" USING btree ("engraver_id");
CREATE INDEX "coin_mint_coin_id_idx" ON "coin_mint" USING btree ("coin_id");
CREATE INDEX "coin_mint_mint_id_idx" ON "coin_mint" USING btree ("mint_id");
CREATE INDEX "coin_theme_coin_id_idx" ON "coin_theme" USING btree ("coin_id");
CREATE INDEX "coin_theme_theme_id_idx" ON "coin_theme" USING btree ("theme_id");
CREATE INDEX "coin_reference_coin_id_idx" ON "coin_reference" USING btree ("coin_id");
CREATE INDEX "coin_reference_catalogue_id_idx" ON "coin_reference" USING btree ("catalogue_id");
CREATE UNIQUE INDEX "coin_reference_coin_id_catalogue_id_normalized_number_unique_idx" ON "coin_reference" USING btree ("coin_id","catalogue_id",lower(regexp_replace(btrim("number"), '\s+', ' ', 'g')));
CREATE UNIQUE INDEX "composition_code_lower_unique_idx" ON "composition" USING btree (lower("code"));
CREATE INDEX "composition_code_lookup_idx" ON "composition" USING btree (lower("code"));
CREATE UNIQUE INDEX "currency_code_lower_unique_idx" ON "currency" USING btree (lower("code"));
CREATE INDEX "currency_code_lookup_idx" ON "currency" USING btree (lower("code"));
CREATE UNIQUE INDEX "distribution_code_lower_unique_idx" ON "distribution" USING btree (lower("code"));
CREATE INDEX "distribution_code_lookup_idx" ON "distribution" USING btree (lower("code"));
CREATE UNIQUE INDEX "edge_code_lower_unique_idx" ON "edge" USING btree (lower("code"));
CREATE INDEX "edge_code_lookup_idx" ON "edge" USING btree (lower("code"));
CREATE UNIQUE INDEX "engraver_code_lower_unique_idx" ON "engraver" USING btree (lower("code"));
CREATE INDEX "engraver_code_lookup_idx" ON "engraver" USING btree (lower("code"));
CREATE UNIQUE INDEX "issuer_code_unique_idx" ON "issuer" USING btree ("code");
CREATE INDEX "issuer_parent_issuer_id_idx" ON "issuer" USING btree ("parent_issuer_id");
CREATE UNIQUE INDEX "mint_code_lower_unique_idx" ON "mint" USING btree (lower("code"));
CREATE INDEX "mint_code_lookup_idx" ON "mint" USING btree (lower("code"));
CREATE UNIQUE INDEX "orientation_code_lower_unique_idx" ON "orientation" USING btree (lower("code"));
CREATE INDEX "orientation_code_lookup_idx" ON "orientation" USING btree (lower("code"));
CREATE UNIQUE INDEX "rim_code_lower_unique_idx" ON "rim" USING btree (lower("code"));
CREATE INDEX "rim_code_lookup_idx" ON "rim" USING btree (lower("code"));
CREATE UNIQUE INDEX "ruler_group_code_unique_idx" ON "ruler_group" USING btree ("code");
CREATE UNIQUE INDEX "ruler_code_unique_idx" ON "ruler" USING btree ("code");
CREATE INDEX "ruler_ruler_group_id_idx" ON "ruler" USING btree ("ruler_group_id");
CREATE UNIQUE INDEX "shape_code_lower_unique_idx" ON "shape" USING btree (lower("code"));
CREATE INDEX "shape_code_lookup_idx" ON "shape" USING btree (lower("code"));
CREATE UNIQUE INDEX "technique_code_lower_unique_idx" ON "technique" USING btree (lower("code"));
CREATE INDEX "technique_code_lookup_idx" ON "technique" USING btree (lower("code"));
CREATE UNIQUE INDEX "coin_ruler_coin_id_ruler_order_unique_idx" ON "coin_ruler" USING btree ("coin_id","ruler_order");
CREATE INDEX "coin_ruler_coin_id_ruler_order_idx" ON "coin_ruler" USING btree ("coin_id","ruler_order");
CREATE INDEX "coin_ruler_ruler_id_idx" ON "coin_ruler" USING btree ("ruler_id");
CREATE UNIQUE INDEX "theme_code_lower_unique_idx" ON "theme" USING btree (lower("code"));
CREATE INDEX "theme_code_lookup_idx" ON "theme" USING btree (lower("code"));
