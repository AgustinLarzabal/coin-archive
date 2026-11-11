DROP TRIGGER "coin_mints_period_check" ON "coin_mints";--> statement-breakpoint
DROP TRIGGER "coins_mint_period_check" ON "coins";--> statement-breakpoint
DROP TRIGGER "mints_coin_period_check" ON "mints";--> statement-breakpoint
DROP FUNCTION "check_coin_mint_period"();--> statement-breakpoint
ALTER TABLE "mints" DROP CONSTRAINT "mints_first_year_nonzero";--> statement-breakpoint
ALTER TABLE "mints" DROP CONSTRAINT "mints_last_year_nonzero";--> statement-breakpoint
ALTER TABLE "mints" DROP CONSTRAINT "mints_period_ordered";--> statement-breakpoint
ALTER TABLE "mints" DROP CONSTRAINT "mints_operating_matches_end";--> statement-breakpoint
ALTER TABLE "mints" DROP COLUMN "start_year";--> statement-breakpoint
ALTER TABLE "mints" DROP COLUMN "end_year";--> statement-breakpoint
ALTER TABLE "mints" DROP COLUMN "operating";
