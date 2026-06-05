ALTER TABLE "coin" ADD COLUMN "min_year" integer;--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "max_year" integer;--> statement-breakpoint
CREATE INDEX "coin_issue_year_range_idx" ON "coin" USING btree ("min_year","max_year");--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_issue_year_range_closed_check" CHECK (("coin"."min_year" is null and "coin"."max_year" is null) or ("coin"."min_year" is not null and "coin"."max_year" is not null));--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_issue_year_range_order_check" CHECK ("coin"."min_year" is null or "coin"."max_year" is null or "coin"."min_year" <= "coin"."max_year");