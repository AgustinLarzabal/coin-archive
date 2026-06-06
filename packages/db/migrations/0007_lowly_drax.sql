ALTER TABLE "coin" ADD COLUMN "weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "diameter" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coin" ADD COLUMN "thickness" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_weight_positive_check" CHECK ("coin"."weight" is null or "coin"."weight" > 0);--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_diameter_positive_check" CHECK ("coin"."diameter" is null or "coin"."diameter" > 0);--> statement-breakpoint
ALTER TABLE "coin" ADD CONSTRAINT "coin_thickness_positive_check" CHECK ("coin"."thickness" is null or "coin"."thickness" > 0);