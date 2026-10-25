ALTER TABLE "coins" ADD COLUMN "size" numeric;--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "thickness" numeric;--> statement-breakpoint
ALTER TABLE "coins" ADD COLUMN "weight" numeric;--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_size_valid" CHECK ("coins"."size" > 0 and "coins"."size" = round("coins"."size", 2));--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_thickness_valid" CHECK ("coins"."thickness" > 0 and "coins"."thickness" = round("coins"."thickness", 2));--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_weight_valid" CHECK ("coins"."weight" > 0 and "coins"."weight" = round("coins"."weight", 3));