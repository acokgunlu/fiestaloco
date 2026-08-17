# FiestaLoco — Deploy Rehberi

Frontend **Vercel**'de, gerçek zamanlı oyun sunucusu **Render**'da (Frankfurt, ücretsiz plan), kalıcı veri **Supabase**'de. Toplam maliyet: **0 ₺/ay**.

```
   📺 TV (PC'den yansıtılan sekme)     📱 Telefonlar
              │                              │
              └──────────────┬───────────────┘
                             │  HTTPS
                             ▼
                   ┌───────────────────┐
                   │      VERCEL       │  Vite build (dist/) — global CDN
                   │  fiestaloco.app   │  preview deploy'lar dahil
                   └───────────────────┘
                             │
                             │  WSS + /api   (VITE_SERVER_URL)
                             ▼
                   ┌───────────────────┐
                   │  RENDER (Frankfurt)│ server.cjs — kalıcı Node process
                   │  fiestaloco-server │ WebSocket odaları + oyun timer'ları
                   └───────────────────┘
                             │
                             │  service_role (yalnızca sunucudan)
                             ▼
                   ┌───────────────────┐
                   │ SUPABASE (Frankfurt)│ leaderboard · maç geçmişi · snapshot
                   └───────────────────┘
```

Her iki uzak katman da Frankfurt'ta — İstanbul'dan gidiş-dönüş ~80 ms, canlı çizimde fark edilmez.

---

## Neden Vercel'e tek başına deploy edilemiyor?

Vercel WebSocket destekliyor (public beta, Fluid compute ile) ama bu mimariye uymuyor:

| Kısıt | Etkisi |
|---|---|
| Fonksiyon max süresi: Hobby 300s, Pro 800s | WS bağlantısı 5–13 dakikada kopar; parti seansı 30–60 dakika sürer |
| "Yeni bağlantıların aynı instance'a düşeceği garanti edilmez" | TV ekranı ile telefonlar farklı instance'lara düşerse oyun bölünür |
| Tüm oda state'i RAM'de (7 mod, 27 timer) | Instance'lar arası paylaşılamaz |

Bu yüzden gerçek zamanlı katman kalıcı bir process'te koşuyor, Vercel yalnızca frontend'i servis ediyor.

---

## 1. Supabase (hazır)

Proje oluşturuldu, şema uygulandı:

- **Proje:** `fiestaloco` · ref `lqpbfvzkfgxwatboente` · bölge `eu-central-1` (Frankfurt)
- **URL:** `https://lqpbfvzkfgxwatboente.supabase.co`

| Tablo | İçerik |
|---|---|
| `player_stats` | Global oyuncu istatistikleri (isim bazlı, büyük/küçük harf duyarsız birleşir) |
| `match_history` | Oynanan her maçın kaydı |
| `room_snapshots` | Aktif odaların state'i — sunucu uyku/restart dayanıklılığı |

RLS açık: `player_stats` ve `match_history` herkese açık **okunur**, yazma yalnızca `service_role` ile. `room_snapshots` tamamen kapalı.

**Yapmanız gereken tek şey:** service_role anahtarını almak.

> Supabase paneli → Project Settings → API → Project API keys → **service_role** (secret)

Bu anahtar tüm RLS'i bypass eder. Asla frontend'e, git'e veya `VITE_` ile başlayan bir değişkene koymayın.

---

## 2. Projeyi git'e koyun

```bash
cd imposter-line
git init
git add -A
git commit -m "FiestaLoco: Vercel + Render split deploy"
gh repo create fiestaloco --private --source=. --push   # veya GitHub'da elle açıp push
```

`.gitignore` zaten `.env*`, `dist/`, `dist-server/` ve `node_modules/`'ü dışarıda bırakıyor.

---

## 3. Render — oyun sunucusu (ücretsiz)

### 3a. Blueprint ile oluşturun

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**
2. Repoyu seçin. Render `render.yaml`'ı otomatik okur:
   - isim `fiestaloco-server`, plan `free`, bölge `frankfurt`
   - build: `npm install && npm run build:server`
   - start: `node dist-server/server.cjs`
   - health check: `/api/health`
3. **Apply** deyin.

Servis adresiniz `https://fiestaloco-server.onrender.com` biçiminde olacak.

### 3b. Ortam değişkenleri

`render.yaml` bunları `sync: false` ile işaretledi — yani değerleri repoda değil, panelden giriyorsunuz.
**Environment** sekmesinde:

```
SUPABASE_URL=https://lqpbfvzkfgxwatboente.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<panelden aldığınız service_role anahtarı>
ALLOWED_ORIGINS=<şimdilik boş bırakın, 4. adımda dolduracağız>
GEMINI_API_KEY=<opsiyonel>
```

`PORT` ve `NODE_ENV`'e dokunmayın — ilkini Render atar, ikincisi `render.yaml`'da tanımlı.

### 3c. Doğrulayın

```bash
curl https://fiestaloco-server.onrender.com/api/health
```

`"persistence": { "enabled": true }` görüyorsanız Supabase bağlantısı çalışıyor.

> İlk istek ~1 dakika sürebilir — servis uyuyorsa uyanıyordur. Bir sonraki adımda bunu çözüyoruz.

---

## 4. Vercel — frontend

1. [vercel.com/new](https://vercel.com/new) → aynı repoyu import edin. `vercel.json` hazır:
   framework `vite`, build `npm run build`, output `dist`, SPA rewrite'ları ve cache header'ları dahil.
2. **Settings → Environment Variables** (Production + Preview + Development, üçüne de):

```
VITE_SERVER_URL=https://fiestaloco-server.onrender.com
```

`https://` ile başlasın, sonunda `/` olmasın. Kod bunu otomatik `wss://`'e çevirir.

> Bu değişken **build zamanında** gömülür. Değiştirirseniz yeniden deploy etmeniz gerekir.

3. Vercel domaininizi öğrendikten sonra Render'daki `ALLOWED_ORIGINS`'i doldurun:

```
ALLOWED_ORIGINS=https://fiestaloco.vercel.app,https://*.vercel.app
```

Joker, Vercel'in preview deploy'larının da çalışmasını sağlar. Render otomatik redeploy eder.

---

## 5. Uyumayı önleyin (ücretsiz)

Render'ın ücretsiz planı **15 dakika hiç trafik almazsa uyur**, uyanması ~1 dakika sürer. Oyun sırasında bu asla olmaz (TV ve telefonlar sürekli açık WebSocket tutar) — sadece akşamın ilk açılışında karşınıza çıkar.

Tamamen ortadan kaldırmak için ücretsiz bir uptime monitörü kurun:

1. [cron-job.org](https://cron-job.org) veya [UptimeRobot](https://uptimerobot.com) — ücretsiz hesap açın
2. Yeni bir kontrol ekleyin:
   - **URL:** `https://fiestaloco-server.onrender.com/api/health`
   - **Aralık:** 10 dakika
   - **Yöntem:** GET

**Kota hesabı:** Render ayda 750 instance-saat veriyor, bir ay ~730 saat. Yani tek bir servisi 7/24 ayakta tutmak kotaya sığar. İkinci bir ücretsiz servis açarsanız kota ikiye bölünür ve ay sonunda ikisi de askıya alınır — bu repo için tek servis yeterli.

> Uyku olsa bile felaket değil: sunucu kapanmadan önce tüm odaların snapshot'ını Supabase'e yazıyor, uyandığında geri yüklüyor ve istemciler otomatik yeniden bağlanıyor.

---

## 6. Doğrulama

```bash
# Sunucu ayakta ve Supabase bağlı mı?
curl https://fiestaloco-server.onrender.com/api/health

# 7 oyun modunun tamamı uçtan uca çalışıyor mu?
SMOKE_TARGET=https://fiestaloco-server.onrender.com npm run smoke

# Origin kısıtlaması doğru mu?
SMOKE_TARGET=https://fiestaloco-server.onrender.com node scripts/originTest.mjs

# Gerçek ağ üzerinde oda açma gecikmesi
SMOKE_TARGET=wss://fiestaloco-server.onrender.com node scripts/roomTiming.mjs

# Birim testler (serializer + oyun sonu tespiti)
npx tsx scripts/persistenceTest.ts
```

Ardından tarayıcıda: Vercel adresini açın → TV modunda oda açın → QR'ı telefonla okutun → katılın.

---

## Yerel geliştirme

Hiçbir şey değişmedi — tek komut, tek port:

```bash
npm install
npm run dev          # http://localhost:3000 (Vite middleware + WS aynı portta)
```

`VITE_SERVER_URL` boş olduğu sürece frontend same-origin'e bağlanır.

Supabase'i yerelde denemek için `.env.local`:

```
SUPABASE_URL=https://lqpbfvzkfgxwatboente.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Ortam değişkenleri özeti

| Değişken | Nerede | Zorunlu | Açıklama |
|---|---|---|---|
| `VITE_SERVER_URL` | Vercel | ✅ | Oyun sunucusunun public adresi |
| `NODE_ENV` | Render | ✅ | `render.yaml`'da tanımlı, dokunmayın |
| `SUPABASE_URL` | Render | ➖ | Yoksa salt bellek-içi çalışır |
| `SUPABASE_SERVICE_ROLE_KEY` | Render | ➖ | **Gizli.** Yalnızca sunucuda |
| `ALLOWED_ORIGINS` | Render | ➖ | Boş = herkese açık |
| `SERVE_STATIC` | Render | ➖ | `false` ile statik servisi tamamen kapatır |
| `SNAPSHOT_INTERVAL_MS` | Render | ➖ | Varsayılan `15000`, `0` = kapalı |
| `SNAPSHOT_MAX_AGE_MINUTES` | Render | ➖ | Varsayılan `180` |
| `GEMINI_API_KEY` | Render | ➖ | Yoksa yerel soru/kelime bankası kullanılır |

---

## Platform değiştirmek

Kodda hiçbir değişiklik gerekmez — sadece `VITE_SERVER_URL` ve `ALLOWED_ORIGINS` güncellenir.

| Platform | Aylık | Uyku | Hazır dosya |
|---|---|---|---|
| **Render Free** | 0 ₺ | 15 dk sonra (keep-alive ile çözülür) | `render.yaml` ✅ |
| Render Starter | $7 | Yok | `render.yaml`'da `plan: starter` |
| Railway Hobby | $5 | Yok | `railway.json` ✅ |
| Fly.io | ~$4.3 | Yok | `Dockerfile` ✅ |
| Kendi VPS'iniz | ~€4 | Yok | `Dockerfile` ✅ |

**Tek hostta çalıştırmak** (frontend + sunucu birlikte, Vercel'e gerek yok):

```bash
npm run build:all
npm start
```

`dist/` mevcut ve `NODE_ENV=production` ise sunucu frontend'i de servis eder. Vercel'in CDN'ini ve preview deploy'larını kaybedersiniz.

**Docker:**

```bash
docker build -t fiestaloco-server .
docker run -p 3000:3000 --env-file .env.local fiestaloco-server
```

**Ölçeklenme notu:** oda state'i RAM'de olduğu için sunucu **tek replica** çalışmalı. Bir instance binlerce eşzamanlı oyuncuyu rahat taşır. Bunun ötesine geçerseniz bir sonraki adım Cloudflare Durable Objects'tir (1 oda = 1 obje), ama `server.ts`'in yeniden yazılmasını gerektirir.

---

## Bilinen davranışlar

- **Oda açmak sunucu başlatmaz.** Tek process tüm odaları hafızasında tutar; oda açma ölçülen süre **0.3 ms**. Cold start process'e aittir, odaya değil.
- **Deploy veya uyku sırasında** sunucu tüm odaların snapshot'ını alır, istemcilere `server:restarting` gönderir ve kapanır. İstemciler 1.5 saniye içinde otomatik yeniden bağlanır. Devam eden geri sayımlar otomatik yeniden başlatılmaz — host bir sonraki aksiyonla devam ettirir.
- **Snapshot yaşı** 180 dakikayı geçen odalar açılışta geri yüklenmez; 12 saatten eski kayıtlar saatlik temizlenir.
- **Leaderboard** isim bazlıdır (auth yok): "Ada" ve "ada" aynı oyuncu sayılır.
- **Supabase kapalıyken** oyunlar tam çalışır; skorlar cihaz-yerel kalır ve restart aktif odaları düşürür. Skor tablosundaki rozet `📱 Bu cihaz` / `🌍 Global` olarak durumu gösterir.
