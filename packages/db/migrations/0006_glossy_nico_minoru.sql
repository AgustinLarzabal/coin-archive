ALTER TABLE "coin_surface" DROP CONSTRAINT "coin_surface_kind_check";--> statement-breakpoint
ALTER TABLE "coin_face_engraver" DROP CONSTRAINT "coin_face_engraver_coin_face_id_coin_surface_id_fk";--> statement-breakpoint
ALTER TABLE "coin_face_engraver" DROP CONSTRAINT "coin_face_engraver_coin_face_id_engraver_id_pk";--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD COLUMN "coin_face_kind" varchar(16);--> statement-breakpoint
UPDATE "coin_face_engraver"
SET "coin_face_kind" = "coin_surface"."kind"
FROM "coin_surface"
WHERE "coin_face_engraver"."coin_face_id" = "coin_surface"."id";--> statement-breakpoint
INSERT INTO "coin_surface" (
  "coin_id",
  "kind",
  "description",
  "lettering",
  "created_at",
  "updated_at"
)
SELECT
  "coin"."id",
  'edge-surface',
  "coin"."edge_description",
  "coin"."edge_lettering",
  "coin"."created_at",
  "coin"."updated_at"
FROM "coin"
WHERE
  nullif(btrim(coalesce("coin"."edge_description", '')), '') IS NOT NULL
  OR nullif(btrim(coalesce("coin"."edge_lettering", '')), '') IS NOT NULL;--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ALTER COLUMN "coin_face_kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_id_coin_face_kind_engraver_id_pk" PRIMARY KEY("coin_face_id","coin_face_kind","engraver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coin_surface_id_kind_unique_idx" ON "coin_surface" USING btree ("id","kind");--> statement-breakpoint
CREATE INDEX "coin_face_engraver_coin_face_kind_idx" ON "coin_face_engraver" USING btree ("coin_face_kind");--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_id_kind_fk" FOREIGN KEY ("coin_face_id","coin_face_kind") REFERENCES "public"."coin_surface"("id","kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_surface" ADD CONSTRAINT "coin_surface_kind_check" CHECK ("coin_surface"."kind" in ('obverse', 'reverse', 'edge-surface'));--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_kind_check" CHECK ("coin_face_engraver"."coin_face_kind" in ('obverse', 'reverse'));--> statement-breakpoint
ALTER TABLE "coin" DROP COLUMN "edge_description";--> statement-breakpoint
ALTER TABLE "coin" DROP COLUMN "edge_lettering";--> statement-breakpoint
