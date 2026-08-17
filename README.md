# 🎉 FiestaLoco

Jackbox tarzı çok oyunculu parti oyunları platformu. TV/laptop ekranı sunucu (host) olur, herkes telefonundan QR okutup katılır.

**7 oyun modu:** Imposter Line · Codenames · Quiplash · Yalan Ustası (Bluff Trivia) · Saatli Bomba · Grup Mahkemesi · Trivia Pursuit

Her mod üç şekilde oynanabilir: **Online TV Host + telefon kumandası**, **tek cihaz pass-and-play**, veya gözlemci ekranı.

---

## Hızlı başlangıç

```bash
npm install
npm run dev        # http://localhost:3000
```

Frontend ve WebSocket sunucusu aynı portta çalışır — ek yapılandırma gerekmez.

---

## Mimari

| Katman | Teknoloji | Nerede çalışır |
|---|---|---|
| Frontend | React 19 · Vite 6 · Tailwind 4 · Motion | Vercel (CDN) |
| Gerçek zamanlı sunucu | Express · `ws` · in-memory oda state'i | Render Free, Frankfurt |
| Kalıcı veri | Supabase Postgres | Frankfurt (eu-central-1) |
| AI (opsiyonel) | Gemini | Sunucu tarafı, yerel fallback'li |

Toplam maliyet 0 ₺/ay. Platform değiştirmek kod değişikliği gerektirmez — `railway.json`, `render.yaml` ve `Dockerfile` üçü de repoda hazır.

Oyun mantığının tamamı `server.ts` içinde: her oda RAM'de yaşar, sunucu TV ekranına genel state'i, her telefona ise yalnızca kendi gizli bilgisini gönderir.

```
src/
  components/          oyun ekranları (TV görünümü + telefon kumandası)
  data/                soru ve kelime bankaları
  types/               oyun state tipleri
  utils/
    use*Socket.ts      her oyun için WebSocket hook'u
    serverUrl.ts       WS/API adresi çözümlemesi (VITE_SERVER_URL)
    leaderboardStore.ts  yerel + global skor tablosu
server.ts              WebSocket oyun sunucusu (7 mod)
server/
  persistence.ts       Supabase katmanı (snapshot + leaderboard)
  matchResult.ts       oyun sonu tespiti ve kazanan hesabı
scripts/               duman testi, origin testi, birim testler
```

---

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme: Vite middleware + WS tek portta |
| `npm run build` | Frontend build → `dist/` (Vercel) |
| `npm run build:server` | Sunucu bundle → `dist-server/` (Railway) |
| `npm start` | Sunucuyu production modda çalıştırır |
| `npm run build:all` + `npm start` | Tek hostta frontend + sunucu birlikte |
| `npm run lint` | `tsc --noEmit` |
| `npm run smoke` | 7 oyun modunu uçtan uca test eder |

---

## Test

```bash
npm run build:server
npm start &                          # varsayılan port 3000

npm run smoke                        # TV oda açar → telefon katılır (7 mod)
node scripts/originTest.mjs          # ALLOWED_ORIGINS doğrulaması
npx tsx scripts/persistenceTest.ts   # serializer + oyun sonu tespiti
```

---

## Kalıcı veri

Supabase yapılandırılmışsa:

- **Leaderboard** ve **maç geçmişi** tüm cihazlarda ortaktır (skor tablosunda `🌍 Global` rozeti görünür)
- **Aktif odalar** 15 saniyede bir snapshot alınır; sunucu restart/deploy sonrası odalar geri yüklenir ve istemciler otomatik yeniden bağlanır

Supabase yapılandırılmamışsa oyunlar sorunsuz çalışır; skorlar yalnızca `localStorage`'da tutulur (`📱 Bu cihaz` rozeti) ve restart aktif odaları düşürür.

---

## Deploy

Ayrıntılı adımlar için **[DEPLOY.md](./DEPLOY.md)**. Özet:

1. Supabase `service_role` anahtarını alın
2. Repoyu Render'a Blueprint olarak bağlayın (`render.yaml` hazır), ortam değişkenlerini girin
3. Aynı repoyu Vercel'e bağlayın, `VITE_SERVER_URL`'i Render adresi yapın
4. Render'daki `ALLOWED_ORIGINS`'e Vercel domainini ekleyin
5. `/api/health` ucuna 10 dakikada bir ping atan ücretsiz bir uptime monitörü kurun (uyumayı önler)

Ortam değişkenlerinin tam listesi için [`.env.example`](./.env.example).
