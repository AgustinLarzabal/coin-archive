CREATE TABLE "coin_surface_engravers" (
	"coin_surface_id" uuid NOT NULL,
	"engraver_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_surface_engravers_coin_surface_id_engraver_id_pk" PRIMARY KEY("coin_surface_id","engraver_id"),
	CONSTRAINT "coin_surface_engravers_surface_position_unique" UNIQUE("coin_surface_id","position"),
	CONSTRAINT "coin_surface_engravers_position_positive" CHECK ("coin_surface_engravers"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "engravers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engravers_full_name_not_empty" CHECK (length("engravers"."full_name") >= 1),
	CONSTRAINT "engravers_full_name_trimmed" CHECK ("engravers"."full_name" !~ '^[[:space:]]|[[:space:]]$')
);
--> statement-breakpoint
ALTER TABLE "coin_surface_engravers" ADD CONSTRAINT "coin_surface_engravers_coin_surface_id_coin_surfaces_id_fk" FOREIGN KEY ("coin_surface_id") REFERENCES "public"."coin_surfaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_surface_engravers" ADD CONSTRAINT "coin_surface_engravers_engraver_id_engravers_id_fk" FOREIGN KEY ("engraver_id") REFERENCES "public"."engravers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE FUNCTION reject_edge_engraver_credit() RETURNS trigger AS $$
DECLARE
  surface_kind coin_surface_kind;
BEGIN
  SELECT kind INTO surface_kind
  FROM coin_surfaces
  WHERE id = NEW.coin_surface_id
  FOR UPDATE;

  IF surface_kind = 'edge' THEN
    RAISE EXCEPTION 'Edge cannot have Engraver credits';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER coin_surface_engravers_reject_edge
BEFORE INSERT OR UPDATE ON "coin_surface_engravers"
FOR EACH ROW EXECUTE FUNCTION reject_edge_engraver_credit();
--> statement-breakpoint
CREATE FUNCTION reject_credited_surface_becoming_edge() RETURNS trigger AS $$
BEGIN
  IF NEW.kind = 'edge' AND OLD.kind <> 'edge' AND EXISTS (
    SELECT 1 FROM coin_surface_engravers
    WHERE coin_surface_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'A credited Coin Surface cannot become Edge';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER coin_surfaces_reject_credited_edge
BEFORE UPDATE OF kind ON "coin_surfaces"
FOR EACH ROW EXECUTE FUNCTION reject_credited_surface_becoming_edge();
--> statement-breakpoint
CREATE FUNCTION set_engraver_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER engravers_set_updated_at
BEFORE UPDATE ON "engravers"
FOR EACH ROW EXECUTE FUNCTION set_engraver_updated_at();
--> statement-breakpoint
CREATE FUNCTION set_coin_surface_engraver_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER coin_surface_engravers_set_updated_at
BEFORE UPDATE ON "coin_surface_engravers"
FOR EACH ROW EXECUTE FUNCTION set_coin_surface_engraver_updated_at();
