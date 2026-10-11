ALTER TABLE "engravers" ADD COLUMN "slug" varchar(64);--> statement-breakpoint
UPDATE "engravers" SET "slug" = 'first-archive-engraver'
WHERE "id" = '30000000-0000-4000-8000-000000000001';--> statement-breakpoint
UPDATE "engravers" SET "slug" = 'second-archive-engraver'
WHERE "id" = '30000000-0000-4000-8000-000000000002';--> statement-breakpoint
ALTER TABLE "engravers" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "engravers" ADD CONSTRAINT "engravers_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "engravers" ADD CONSTRAINT "engravers_slug_min_length" CHECK (length("engravers"."slug") >= 3);--> statement-breakpoint
ALTER TABLE "engravers" ADD CONSTRAINT "engravers_slug_format" CHECK ("engravers"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
