CREATE TABLE "coin_mints" (
	"coin_id" uuid NOT NULL,
	"mint_id" uuid NOT NULL,
	CONSTRAINT "coin_mints_coin_id_mint_id_pk" PRIMARY KEY("coin_id","mint_id")
);
--> statement-breakpoint
CREATE TABLE "mints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"place" varchar(200) NOT NULL,
	"country_id" uuid NOT NULL,
	"start_year" integer,
	"end_year" integer,
	"operating" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mints_slug_unique" UNIQUE("slug"),
	CONSTRAINT "mints_slug_format" CHECK ("mints"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length("mints"."slug") >= 3),
	CONSTRAINT "mints_name_trimmed" CHECK (length("mints"."name") > 0 and "mints"."name" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "mints_place_trimmed" CHECK (length("mints"."place") > 0 and "mints"."place" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "mints_first_year_nonzero" CHECK ("mints"."start_year" is null or "mints"."start_year" <> 0),
	CONSTRAINT "mints_last_year_nonzero" CHECK ("mints"."end_year" is null or "mints"."end_year" <> 0),
	CONSTRAINT "mints_period_ordered" CHECK ("mints"."start_year" is null or "mints"."end_year" is null or "mints"."start_year" <= "mints"."end_year"),
	CONSTRAINT "mints_operating_matches_end" CHECK (("mints"."operating" is distinct from true or "mints"."end_year" is null) and ("mints"."end_year" is null or "mints"."operating" is false))
);
--> statement-breakpoint
ALTER TABLE "coin_mints" ADD CONSTRAINT "coin_mints_coin_id_coins_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_mints" ADD CONSTRAINT "coin_mints_mint_id_mints_id_fk" FOREIGN KEY ("mint_id") REFERENCES "public"."mints"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mints" ADD CONSTRAINT "mints_country_id_issuers_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."issuers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_mints_mint_id_index" ON "coin_mints" USING btree ("mint_id");
--> statement-breakpoint
CREATE FUNCTION check_coin_mint_period() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'coin_mints' THEN
    PERFORM 1 FROM coins WHERE id = NEW.coin_id FOR SHARE;
    PERFORM 1 FROM mints WHERE id = NEW.mint_id FOR SHARE;
    IF EXISTS (
      SELECT 1 FROM coins c JOIN mints m ON m.id = NEW.mint_id
      WHERE c.id = NEW.coin_id
        AND ((m.start_year IS NOT NULL AND m.start_year > c.last_issue_year)
          OR (m.end_year IS NOT NULL AND m.end_year < c.first_issue_year))
    ) THEN
      RAISE EXCEPTION 'Coin and Mint operation periods do not overlap';
    END IF;
  ELSIF TG_TABLE_NAME = 'coins' THEN
    PERFORM 1 FROM coin_mints cm JOIN mints m ON m.id = cm.mint_id
      WHERE cm.coin_id = NEW.id FOR SHARE OF m;
    IF EXISTS (
      SELECT 1 FROM coin_mints cm JOIN mints m ON m.id = cm.mint_id
      WHERE cm.coin_id = NEW.id
        AND ((m.start_year IS NOT NULL AND m.start_year > NEW.last_issue_year)
          OR (m.end_year IS NOT NULL AND m.end_year < NEW.first_issue_year))
    ) THEN
      RAISE EXCEPTION 'Coin and Mint operation periods do not overlap';
    END IF;
  ELSE
    PERFORM 1 FROM coin_mints cm JOIN coins c ON c.id = cm.coin_id
      WHERE cm.mint_id = NEW.id FOR SHARE OF c;
    IF EXISTS (
      SELECT 1 FROM coin_mints cm JOIN coins c ON c.id = cm.coin_id
      WHERE cm.mint_id = NEW.id
        AND ((NEW.start_year IS NOT NULL AND NEW.start_year > c.last_issue_year)
          OR (NEW.end_year IS NOT NULL AND NEW.end_year < c.first_issue_year))
    ) THEN
      RAISE EXCEPTION 'Coin and Mint operation periods do not overlap';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER coin_mints_period_check BEFORE INSERT OR UPDATE ON coin_mints FOR EACH ROW EXECUTE FUNCTION check_coin_mint_period();
--> statement-breakpoint
CREATE TRIGGER coins_mint_period_check BEFORE UPDATE OF first_issue_year, last_issue_year ON coins FOR EACH ROW EXECUTE FUNCTION check_coin_mint_period();
--> statement-breakpoint
CREATE TRIGGER mints_coin_period_check BEFORE UPDATE OF start_year, end_year ON mints FOR EACH ROW EXECUTE FUNCTION check_coin_mint_period();
--> statement-breakpoint
CREATE FUNCTION keep_mint_identity() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug OR NEW.country_id IS DISTINCT FROM OLD.country_id THEN
    RAISE EXCEPTION 'Mint Slug and country are immutable; create a distinct Mint';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER mints_identity_check BEFORE UPDATE OF slug, country_id ON mints FOR EACH ROW EXECUTE FUNCTION keep_mint_identity();
--> statement-breakpoint
CREATE FUNCTION set_mint_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER mints_set_updated_at BEFORE UPDATE ON mints FOR EACH ROW EXECUTE FUNCTION set_mint_updated_at();
