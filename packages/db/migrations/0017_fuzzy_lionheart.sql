CREATE TABLE "coin_face_engraver" (
	"coin_face_id" uuid NOT NULL,
	"engraver_id" uuid NOT NULL,
	CONSTRAINT "coin_face_engraver_coin_face_id_engraver_id_pk" PRIMARY KEY("coin_face_id","engraver_id")
);
--> statement-breakpoint
CREATE TABLE "engraver" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "engraver_code_slug_check" CHECK ("engraver"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_id_coin_face_id_fk" FOREIGN KEY ("coin_face_id") REFERENCES "public"."coin_face"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_engraver_id_engraver_id_fk" FOREIGN KEY ("engraver_id") REFERENCES "public"."engraver"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_face_engraver_coin_face_id_idx" ON "coin_face_engraver" USING btree ("coin_face_id");--> statement-breakpoint
CREATE INDEX "coin_face_engraver_engraver_id_idx" ON "coin_face_engraver" USING btree ("engraver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "engraver_code_lower_unique_idx" ON "engraver" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "engraver_code_lookup_idx" ON "engraver" USING btree (lower("code"));
