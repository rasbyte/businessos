-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RENTAL', 'AGRICULTURE', 'PHARMACY', 'SOFTWARE_SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('FLAT', 'SHOP');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('VACANT', 'OCCUPIED');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED_BY_RENTER', 'ACTIVE', 'ENDED');

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "business_id" UUID;

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" "BusinessType" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "type" "UnitType" NOT NULL,
    "number" TEXT NOT NULL,
    "floor" TEXT,
    "area_sqft" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "shop_category" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'VACANT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renters" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "nid_number" TEXT,
    "business_name" TEXT,
    "emergency_contact" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "renters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "renter_id" UUID NOT NULL,
    "status" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "monthly_rent" INTEGER NOT NULL,
    "salami" INTEGER NOT NULL DEFAULT 0,
    "advance_deposit" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "due_day" INTEGER NOT NULL DEFAULT 10,
    "renter_signed_at" TIMESTAMPTZ(3),
    "owner_signed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "businesses_organization_id_idx" ON "businesses"("organization_id");

-- CreateIndex
CREATE INDEX "properties_business_id_idx" ON "properties"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_property_id_number_key" ON "units"("property_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "renters_user_id_key" ON "renters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "renters_organization_id_phone_key" ON "renters"("organization_id", "phone");

-- CreateIndex
CREATE INDEX "leases_unit_id_idx" ON "leases"("unit_id");

-- CreateIndex
CREATE INDEX "leases_renter_id_idx" ON "leases"("renter_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renters" ADD CONSTRAINT "renters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renters" ADD CONSTRAINT "renters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "renters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A unit can have only one lease that is not finished yet; ended leases stay as history
CREATE UNIQUE INDEX "leases_one_open_per_unit" ON "leases" ("unit_id")
  WHERE "status" IN ('DRAFT', 'SENT', 'SIGNED_BY_RENTER', 'ACTIVE');

ALTER TABLE "leases" ADD CONSTRAINT "leases_amounts_valid"
  CHECK ("monthly_rent" > 0 AND "salami" >= 0 AND "advance_deposit" >= 0);
ALTER TABLE "leases" ADD CONSTRAINT "leases_due_day_valid"
  CHECK ("due_day" BETWEEN 1 AND 28);
ALTER TABLE "leases" ADD CONSTRAINT "leases_dates_valid"
  CHECK ("end_date" IS NULL OR "end_date" > "start_date");

-- Phone numbers are stored in international format, for example +8801XXXXXXXXX
ALTER TABLE "renters" ADD CONSTRAINT "renters_phone_e164"
  CHECK ("phone" ~ '^\+[1-9][0-9]{7,14}$');

-- Only flats have bedrooms and bathrooms
ALTER TABLE "units" ADD CONSTRAINT "units_only_flats_have_rooms"
  CHECK ("type" = 'FLAT' OR ("bedrooms" IS NULL AND "bathrooms" IS NULL));
