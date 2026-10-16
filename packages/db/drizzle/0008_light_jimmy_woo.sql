CREATE TABLE "ruling_authorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ruling_authorities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ruling_authorities_slug_min_length" CHECK (length("ruling_authorities"."slug") >= 3),
	CONSTRAINT "ruling_authorities_slug_format" CHECK ("ruling_authorities"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "ruling_authorities_name_not_empty" CHECK (length("ruling_authorities"."name") >= 1),
	CONSTRAINT "ruling_authorities_name_trimmed" CHECK ("ruling_authorities"."name" !~ '^[[:space:]]|[[:space:]]$')
);
