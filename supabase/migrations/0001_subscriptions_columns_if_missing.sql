-- Eski/el ile oluşturulmuş `subscriptions` tablosunda şemaya uygun eksik kolonları ekler.
-- Tekrar çalıştırılabilir.

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" timestamp with time zone;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
