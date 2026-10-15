CREATE INDEX "coins_created_at_id_index" ON "coins" USING btree ("created_at" DESC NULLS FIRST,"id");--> statement-breakpoint
CREATE INDEX "coins_issuer_id_created_at_id_index" ON "coins" USING btree ("issuer_id","created_at" DESC NULLS FIRST,"id");
