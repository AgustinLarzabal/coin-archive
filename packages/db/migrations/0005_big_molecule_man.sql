ALTER TABLE "coin_face" RENAME TO "coin_surface";--> statement-breakpoint
ALTER TABLE "coin_surface" RENAME COLUMN "side" TO "kind";--> statement-breakpoint
ALTER TABLE "coin_surface" DROP CONSTRAINT "coin_face_side_check";--> statement-breakpoint
ALTER TABLE "coin_surface" DROP CONSTRAINT "coin_face_coin_id_coin_id_fk";
--> statement-breakpoint
ALTER TABLE "coin_face_engraver" DROP CONSTRAINT "coin_face_engraver_coin_face_id_coin_face_id_fk";
--> statement-breakpoint
DROP INDEX "coin_face_coin_id_side_unique_idx";--> statement-breakpoint
DROP INDEX "coin_face_coin_id_idx";--> statement-breakpoint
ALTER TABLE "coin_surface" ADD CONSTRAINT "coin_surface_coin_id_coin_id_fk" FOREIGN KEY ("coin_id") REFERENCES "public"."coin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_face_engraver" ADD CONSTRAINT "coin_face_engraver_coin_face_id_coin_surface_id_fk" FOREIGN KEY ("coin_face_id") REFERENCES "public"."coin_surface"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coin_surface_coin_id_kind_unique_idx" ON "coin_surface" USING btree ("coin_id","kind");--> statement-breakpoint
CREATE INDEX "coin_surface_coin_id_idx" ON "coin_surface" USING btree ("coin_id");--> statement-breakpoint
ALTER TABLE "coin_surface" ADD CONSTRAINT "coin_surface_kind_check" CHECK ("coin_surface"."kind" in ('obverse', 'reverse'));