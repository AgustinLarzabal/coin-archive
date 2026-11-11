ALTER TABLE "ruling_authorities" ADD COLUMN "role" varchar(100);--> statement-breakpoint
ALTER TABLE "ruling_authorities" ADD COLUMN "tenure" varchar(200);--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM coin_ruling_authorities
    GROUP BY ruling_authority_id
    HAVING count(DISTINCT (role, tenure)) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot move conflicting Ruling Authority roles or tenures';
  END IF;
  IF EXISTS (
    SELECT 1 FROM ruling_authorities r
    WHERE NOT EXISTS (
      SELECT 1 FROM coin_ruling_authorities c
      WHERE c.ruling_authority_id = r.id
    )
  ) THEN
    RAISE EXCEPTION 'Cannot infer role for an unattributed Ruling Authority';
  END IF;
  IF EXISTS (
    SELECT 1 FROM coin_ruling_authorities
    GROUP BY coin_id, ruling_authority_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot merge duplicate Ruling Authority attributions for one Coin';
  END IF;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
UPDATE ruling_authorities r
SET role = c.role, tenure = c.tenure
FROM coin_ruling_authorities c
WHERE c.ruling_authority_id = r.id;--> statement-breakpoint
ALTER TABLE "ruling_authorities" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP CONSTRAINT "coin_ruling_authorities_context_unique";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP CONSTRAINT "coin_ruling_authorities_role_not_empty";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP CONSTRAINT "coin_ruling_authorities_role_trimmed";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP CONSTRAINT "coin_ruling_authorities_tenure_not_empty";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP CONSTRAINT "coin_ruling_authorities_tenure_trimmed";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" DROP COLUMN "tenure";--> statement-breakpoint
ALTER TABLE "coin_ruling_authorities" ADD CONSTRAINT "coin_ruling_authorities_context_unique" UNIQUE("coin_id","ruling_authority_id");--> statement-breakpoint
ALTER TABLE "ruling_authorities" ADD CONSTRAINT "ruling_authorities_role_not_empty" CHECK (length("ruling_authorities"."role") >= 1);--> statement-breakpoint
ALTER TABLE "ruling_authorities" ADD CONSTRAINT "ruling_authorities_role_trimmed" CHECK ("ruling_authorities"."role" !~ '^[[:space:]]|[[:space:]]$');--> statement-breakpoint
ALTER TABLE "ruling_authorities" ADD CONSTRAINT "ruling_authorities_tenure_not_empty" CHECK ("ruling_authorities"."tenure" is null or length("ruling_authorities"."tenure") >= 1);--> statement-breakpoint
ALTER TABLE "ruling_authorities" ADD CONSTRAINT "ruling_authorities_tenure_trimmed" CHECK ("ruling_authorities"."tenure" is null or "ruling_authorities"."tenure" !~ '^[[:space:]]|[[:space:]]$');
