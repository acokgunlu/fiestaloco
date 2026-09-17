-- =============================================================================
-- app_settings — yönetim paneli ayarları (anahtar-değer)
-- =============================================================================
-- İlk kullanıcı: key = 'hidden_games', value = ["quiplash", ...]
--
-- RLS AÇIK ve HİÇ politika yok: anon/authenticated rolleri ne okuyabilir ne
-- yazabilir. Ön yüz bu tabloyu Supabase'den doğrudan okumuyor, sunucunun
-- /api/games/visibility ucundan alıyor; yazma yalnızca service_role (sunucu).
-- =============================================================================
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;
