CREATE TABLE "coin_face" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"coin_id" uuid NOT NULL,
	"side" varchar(16) NOT NULL,
	"description" varchar(2000),
	"lettering" varchar(4000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_face_side_check" CHECK ("coin_face"."side" in ('obverse', 'reverse'))
);
--> statement-breakpoint
ALTER TABLE "coin_face" ADD CONSTRAINT "coin_face_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coin_face_coin_id_side_unique_idx" ON "coin_face" USING btree ("coin_id","side");--> statement-breakpoint
CREATE INDEX "coin_face_coin_id_idx" ON "coin_face" USING btree ("coin_id");
