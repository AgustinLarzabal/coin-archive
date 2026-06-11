ALTER TABLE "issuer" ADD COLUMN "iso_code" varchar(2);--> statement-breakpoint
UPDATE "issuer"
SET "iso_code" = CASE
  WHEN "code" = 'argentina' THEN 'AR'
  WHEN "code" = 'buenos-aires' THEN 'AR'
  WHEN "code" = 'united-states' THEN 'US'
  WHEN "code" = 'spain' THEN 'ES'
  ELSE 'ZZ'
END
WHERE "iso_code" IS NULL;--> statement-breakpoint
ALTER TABLE "issuer" ALTER COLUMN "iso_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "issuer" ADD CONSTRAINT "issuer_iso_code_format_check" CHECK ("issuer"."iso_code" ~ '^[A-Z]{2}$');
