ALTER TABLE "coins" ADD COLUMN "first_issue_year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "last_issue_year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_first_issue_year_not_zero" CHECK ("coins"."first_issue_year" <> 0);--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_last_issue_year_not_zero" CHECK ("coins"."last_issue_year" <> 0);--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_issue_period_ordered" CHECK ("coins"."first_issue_year" <= "coins"."last_issue_year");