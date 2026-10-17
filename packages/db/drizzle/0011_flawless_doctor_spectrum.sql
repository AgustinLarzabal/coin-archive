CREATE TYPE "public"."coin_distribution" AS ENUM('standard-circulation', 'circulating-commemorative', 'non-circulating');--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "distribution" "coin_distribution";--> statement-breakpoint
UPDATE "coins" SET "distribution" = 'circulating-commemorative' WHERE "distribution" IS NULL;--> statement-breakpoint
ALTER TABLE "coins" ALTER COLUMN "distribution" SET NOT NULL;
