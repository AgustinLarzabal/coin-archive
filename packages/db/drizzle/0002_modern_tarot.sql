CREATE TYPE "public"."coin_surface_kind" AS ENUM('obverse', 'reverse', 'edge');--> statement-breakpoint
CREATE TABLE "coin_surfaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coin_id" uuid NOT NULL,
	"kind" "coin_surface_kind" NOT NULL,
	"description" text,
	"image_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_surfaces_coin_id_kind_unique" UNIQUE("coin_id","kind"),
	CONSTRAINT "coin_surfaces_description_length" CHECK ("coin_surfaces"."description" is null or length("coin_surfaces"."description") between 1 and 10000),
	CONSTRAINT "coin_surfaces_description_trimmed" CHECK ("coin_surfaces"."description" is null or "coin_surfaces"."description" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "coin_surfaces_image_key_length" CHECK ("coin_surfaces"."image_key" is null or octet_length("coin_surfaces"."image_key") between 1 and 1024),
	CONSTRAINT "coin_surfaces_image_key_trimmed" CHECK ("coin_surfaces"."image_key" is null or "coin_surfaces"."image_key" !~ '^[[:space:]]|[[:space:]]$'),
	CONSTRAINT "coin_surfaces_image_key_format" CHECK ("coin_surfaces"."image_key" is null or ("coin_surfaces"."image_key" !~ '^/' and "coin_surfaces"."image_key" !~* '^[a-z][a-z0-9+.-]*:' and "coin_surfaces"."image_key" !~ '(^|/)[.]{1,2}(/|$)')),
	CONSTRAINT "coin_surfaces_has_catalogue_data" CHECK ("coin_surfaces"."description" is not null or "coin_surfaces"."image_key" is not null)
);
--> statement-breakpoint
ALTER TABLE "coin_surfaces" ADD CONSTRAINT "coin_surfaces_coin_id_coins_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE FUNCTION set_coin_surface_updated_at() RETURNS trigger AS $$
BEGIN
	NEW.updated_at = clock_timestamp();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER coin_surfaces_set_updated_at
BEFORE UPDATE ON "coin_surfaces"
FOR EACH ROW
EXECUTE FUNCTION set_coin_surface_updated_at();
