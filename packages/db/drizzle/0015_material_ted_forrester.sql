ALTER TABLE "coins" ALTER COLUMN "distribution" SET DATA TYPE varchar(64) USING "distribution"::text;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_distribution_distributions_slug_fk" FOREIGN KEY ("distribution") REFERENCES "public"."distributions"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."coin_distribution";
