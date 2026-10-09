ALTER TABLE "coin_surfaces" DROP CONSTRAINT "coin_surfaces_has_catalogue_data";
--> statement-breakpoint
CREATE FUNCTION coin_surface_lacks_catalogue_data(target_surface_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM coin_surfaces
    WHERE id = target_surface_id
      AND description IS NULL
      AND image_key IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM coin_surface_engravers
        WHERE coin_surface_id = target_surface_id
      )
  );
$$ LANGUAGE sql STABLE;
--> statement-breakpoint
CREATE FUNCTION assert_coin_surface_has_catalogue_data() RETURNS trigger AS $$
BEGIN
  IF coin_surface_lacks_catalogue_data(NEW.id) THEN
    RAISE EXCEPTION 'Coin Surface must contain catalogue data';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER coin_surfaces_require_catalogue_data
AFTER INSERT OR UPDATE OF description, image_key ON "coin_surfaces"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_coin_surface_has_catalogue_data();
--> statement-breakpoint
CREATE FUNCTION assert_surface_retains_catalogue_data_after_credit_removal() RETURNS trigger AS $$
BEGIN
  IF coin_surface_lacks_catalogue_data(OLD.coin_surface_id) THEN
    RAISE EXCEPTION 'Coin Surface must contain catalogue data';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER coin_surface_engravers_retain_catalogue_data
AFTER DELETE OR UPDATE OF coin_surface_id ON "coin_surface_engravers"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_surface_retains_catalogue_data_after_credit_removal();
