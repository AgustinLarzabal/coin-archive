ALTER TABLE "coins" ADD COLUMN "slug" varchar(64);--> statement-breakpoint
ALTER TABLE "issuers" ADD COLUMN "slug" varchar(64);--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "issuers" ADD CONSTRAINT "issuers_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_slug_min_length" CHECK ("coins"."slug" is null or length("coins"."slug") >= 3);--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_slug_format" CHECK ("coins"."slug" is null or "coins"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');--> statement-breakpoint
ALTER TABLE "issuers" ADD CONSTRAINT "issuers_slug_min_length" CHECK ("issuers"."slug" is null or length("issuers"."slug") >= 3);--> statement-breakpoint
ALTER TABLE "issuers" ADD CONSTRAINT "issuers_slug_format" CHECK ("issuers"."slug" is null or "issuers"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');--> statement-breakpoint
UPDATE "issuers" SET "slug" = 'germany' WHERE "code" = 'DE';--> statement-breakpoint
UPDATE "coins" SET "slug" = 'hamburg-2008' WHERE "id" = '00000000-0000-4000-8000-000000000033';--> statement-breakpoint
UPDATE "coins" SET "slug" = 'hamburg-2023' WHERE "id" = '00000000-0000-4000-8000-000000000204';
