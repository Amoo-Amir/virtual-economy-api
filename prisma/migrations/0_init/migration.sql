
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "asset_code" VARCHAR(20) NOT NULL DEFAULT 'USD',
    "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "card_number" VARCHAR(12) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_card_number_key" ON "wallets"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_asset_unique" ON "wallets"("user_id", "asset_code");

-- CreateIndex
CREATE INDEX "transactions_wallet_created_idx" ON "transactions"("wallet_id", "created_at");

-- AddForeignKey
ALTER TABLE "wallets"
ADD CONSTRAINT "wallets_user_fk"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_wallet_fk"
FOREIGN KEY ("wallet_id")
REFERENCES "wallets"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Wallet balance must never be negative
ALTER TABLE "wallets"
ADD CONSTRAINT "wallets_balance_non_negative"
CHECK ("balance" >= 0);

-- Transaction amount must be positive
ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_amount_positive"
CHECK ("amount" > 0);

-- Only allowed transaction types
ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_type_valid"
CHECK (
    "type" IN (
        'INITIAL_CREDIT',
        'DEPOSIT',
        'WITHDRAWAL',
        'TRANSFER_IN',
        'TRANSFER_OUT'
    )
);
