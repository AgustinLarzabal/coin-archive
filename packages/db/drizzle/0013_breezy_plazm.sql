CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"period_label" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "currencies_slug_min_length" CHECK (length("currencies"."slug") >= 3),
	CONSTRAINT "currencies_slug_format" CHECK ("currencies"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "currencies_name_not_empty" CHECK (length("currencies"."name") >= 1),
	CONSTRAINT "currencies_name_trimmed" CHECK ("currencies"."name" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "currencies_period_label_not_empty" CHECK (length("currencies"."period_label") >= 1),
	CONSTRAINT "currencies_period_label_trimmed" CHECK ("currencies"."period_label" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
CREATE TABLE "denominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency_id" uuid NOT NULL,
	"label" varchar(200) NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "denominations_label_not_empty" CHECK (length("denominations"."label") >= 1),
	CONSTRAINT "denominations_label_trimmed" CHECK ("denominations"."label" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "denominations_amount_positive" CHECK ("denominations"."amount" > 0),
	CONSTRAINT "denominations_amount_integer_digits" CHECK ("denominations"."amount" < 1000000000000000000),
	CONSTRAINT "denominations_amount_fractional_digits" CHECK (scale("denominations"."amount") <= 12)
);
--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "denomination_id" uuid;--> statement-breakpoint
ALTER TABLE "denominations" ADD CONSTRAINT "denominations_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "denominations_currency_label_unique" ON "denominations" USING btree ("currency_id",lower("label"));--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_denomination_id_denominations_id_fk" FOREIGN KEY ("denomination_id") REFERENCES "public"."denominations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE FUNCTION set_currency_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER currencies_set_updated_at
BEFORE UPDATE ON currencies
FOR EACH ROW EXECUTE FUNCTION set_currency_updated_at();
--> statement-breakpoint
CREATE FUNCTION reject_currency_slug_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Currency Slug is immutable';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER currencies_reject_slug_update
BEFORE UPDATE OF slug ON currencies
FOR EACH ROW
WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
EXECUTE FUNCTION reject_currency_slug_update();
--> statement-breakpoint
CREATE FUNCTION set_denomination_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER denominations_set_updated_at
BEFORE UPDATE ON denominations
FOR EACH ROW EXECUTE FUNCTION set_denomination_updated_at();
