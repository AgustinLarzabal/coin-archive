CREATE TABLE "issuer" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"code" varchar(64) NOT NULL,
	"parent_issuer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issuer_parent_issuer_id_self_check" CHECK ("issuer"."parent_issuer_id" is null or "issuer"."parent_issuer_id" <> "issuer"."id"),
	CONSTRAINT "issuer_code_slug_check" CHECK ("issuer"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "issuer_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "issuer" ADD CONSTRAINT "issuer_parent_issuer_id_issuer_id_fk" FOREIGN KEY ("parent_issuer_id") REFERENCES "public"."issuer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "issuer_code_unique_idx" ON "issuer" USING btree ("code");--> statement-breakpoint
CREATE INDEX "issuer_parent_issuer_id_idx" ON "issuer" USING btree ("parent_issuer_id");--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_issuer_id_issuer_id_fk" FOREIGN KEY ("issuer_id") REFERENCES "public"."issuer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_issuer_id_idx" ON "coin" USING btree ("issuer_id");