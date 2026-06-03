ALTER TABLE "issuer" RENAME COLUMN "display_name" TO "name";--> statement-breakpoint
ALTER TABLE "issuer" ALTER COLUMN "code" SET DATA TYPE varchar(255);