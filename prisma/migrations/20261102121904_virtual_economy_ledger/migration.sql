/*
  Warnings:

  - You are about to drop the column `amount` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_id` on the `transactions` table. All the data in the column will be lost.
  - Changed the type of `type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INITIAL_CREDIT', 'TRANSFER', 'MARKET_PURCHASE', 'ADMIN_CREDIT', 'SYSTEM_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_wallet_fk";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_fk";

-- DropIndex
DROP INDEX "transactions_wallet_created_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "amount",
DROP COLUMN "wallet_id",
ADD COLUMN     "initiated_by_user_id" UUID,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- CreateTable
CREATE TABLE "system_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "wallet_id" UUID,
    "system_account_id" UUID,
    "entry_type" "EntryType" NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(36,18) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(36,18) NOT NULL,
    "total_price" DECIMAL(36,18) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_accounts_code_key" ON "system_accounts"("code");

-- CreateIndex
CREATE INDEX "transaction_entries_transaction_id_idx" ON "transaction_entries"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_entries_wallet_id_created_at_idx" ON "transaction_entries"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "transaction_entries_system_account_id_idx" ON "transaction_entries"("system_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_user_id_item_id_key" ON "inventories"("user_id", "item_id");

-- CreateIndex
CREATE INDEX "market_listings_status_created_at_idx" ON "market_listings"("status", "created_at");

-- CreateIndex
CREATE INDEX "market_listings_seller_id_idx" ON "market_listings"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_orders_listing_id_key" ON "market_orders"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_orders_transaction_id_key" ON "market_orders"("transaction_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_system_account_id_fkey" FOREIGN KEY ("system_account_id") REFERENCES "system_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "market_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;




-- Ledger entry amount must be positive
ALTER TABLE "transaction_entries"
ADD CONSTRAINT "transaction_entries_amount_positive"
CHECK ("amount" > 0);

-- Exactly one account must be referenced by each entry
ALTER TABLE "transaction_entries"
ADD CONSTRAINT "transaction_entries_exactly_one_account"
CHECK (
    (
        "wallet_id" IS NOT NULL
        AND "system_account_id" IS NULL
    )
    OR
    (
        "wallet_id" IS NULL
        AND "system_account_id" IS NOT NULL
    )
);

-- Inventory quantity must not be negative
ALTER TABLE "inventories"
ADD CONSTRAINT "inventories_quantity_non_negative"
CHECK ("quantity" >= 0);

-- Listing constraints
ALTER TABLE "market_listings"
ADD CONSTRAINT "market_listings_quantity_positive"
CHECK ("quantity" > 0);

ALTER TABLE "market_listings"
ADD CONSTRAINT "market_listings_price_positive"
CHECK ("unit_price" > 0);

-- Order constraints
ALTER TABLE "market_orders"
ADD CONSTRAINT "market_orders_quantity_positive"
CHECK ("quantity" > 0);

ALTER TABLE "market_orders"
ADD CONSTRAINT "market_orders_price_positive"
CHECK ("unit_price" > 0);

ALTER TABLE "market_orders"
ADD CONSTRAINT "market_orders_total_positive"
CHECK ("total_price" > 0);

ALTER TABLE "market_orders"
ADD CONSTRAINT "market_orders_total_matches"
CHECK ("total_price" = "unit_price" * "quantity");