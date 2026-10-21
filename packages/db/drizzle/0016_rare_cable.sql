ALTER TABLE "coins" DROP CONSTRAINT "coins_distribution_distributions_slug_fk";
--> statement-breakpoint
DROP INDEX "coins_distribution_created_at_id_index";--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "distribution_id" uuid;--> statement-breakpoint
UPDATE "coins" SET "distribution_id" = "distributions"."id"
FROM "distributions"
WHERE "coins"."distribution" = "distributions"."slug";--> statement-breakpoint
ALTER TABLE "coins" ALTER COLUMN "distribution_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_distribution_id_distributions_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coins_distribution_created_at_id_index" ON "coins" USING btree ("distribution_id","created_at" DESC NULLS FIRST,"id");--> statement-breakpoint
ALTER TABLE "coins" DROP COLUMN "distribution";
