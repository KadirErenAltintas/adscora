-- Security Advisor: "RLS Disabled in Public" giderilir.
-- RLS açık + politika yok → anon/authenticated PostgREST ile bu tablolara doğrudan erişim reddedilir.
-- Uygulama verisi sunucuda SUPABASE_SERVICE_ROLE_KEY ile gelir; service_role RLS kurallarını BYPASS eder (mevcut tRPC akışı çalışmaya devam eder).
-- İleride tarayıcıdan Supabase client ile tablo okumak istersen tablo bazında CREATE POLICY eklemen gerekir.

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."aiRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
