-- CreateTable
CREATE TABLE "stock_items" (
    "sku" TEXT NOT NULL,
    "available" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("sku")
);

-- CreateTable
CREATE TABLE "reservations" (
    "order_id" UUID NOT NULL,
    "reserved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "reservation_lines" (
    "order_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "reservation_lines_pkey" PRIMARY KEY ("order_id","position")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "event_id" UUID NOT NULL,
    "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" UUID NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ,

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reservation_lines" ADD CONSTRAINT "reservation_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "reservations"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Safety nets Prisma cannot describe: added by hand.
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_available_check" CHECK ("available" >= 0);
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_reserved_check" CHECK ("reserved" >= 0);
ALTER TABLE "reservation_lines" ADD CONSTRAINT "reservation_lines_quantity_check" CHECK ("quantity" > 0);
CREATE INDEX "outbox_unpublished" ON "outbox" ("created_at") WHERE "published_at" IS NULL;