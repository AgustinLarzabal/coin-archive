CREATE TABLE "maintenance_idempotency" (
	"collector_id" text NOT NULL,
	"operation" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "maintenance_idempotency_pkey" PRIMARY KEY("collector_id","operation","key")
);
