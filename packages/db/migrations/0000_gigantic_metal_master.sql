CREATE TABLE "coin" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "coin_recent_created_at_id_idx" ON "coin" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);