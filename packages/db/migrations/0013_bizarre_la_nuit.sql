ALTER TABLE "coin" ADD COLUMN "mintage" bigint;--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_mintage_positive_check" CHECK ("coin"."mintage" is null or "coin"."mintage" > 0);