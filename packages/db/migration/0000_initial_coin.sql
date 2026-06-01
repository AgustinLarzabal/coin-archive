CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "coin" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "title" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "coin_recent_created_at_id_idx" ON "coin" ("created_at" DESC, "id" DESC);
