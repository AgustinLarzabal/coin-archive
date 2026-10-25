ALTER TABLE "coins" DROP CONSTRAINT "coins_size_valid";--> statement-breakpoint
ALTER TABLE "coins" DROP CONSTRAINT "coins_thickness_valid";--> statement-breakpoint
ALTER TABLE "coins" DROP CONSTRAINT "coins_weight_valid";--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_size_valid" CHECK ("coins"."size" > 0 and "coins"."size" < 'Infinity'::numeric and scale("coins"."size") <= 2);--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_thickness_valid" CHECK ("coins"."thickness" > 0 and "coins"."thickness" < 'Infinity'::numeric and scale("coins"."thickness") <= 2);--> statement-breakpoint
ALTER TABLE "coins" ADD CONSTRAINT "coins_weight_valid" CHECK ("coins"."weight" > 0 and "coins"."weight" < 'Infinity'::numeric and scale("coins"."weight") <= 3);
