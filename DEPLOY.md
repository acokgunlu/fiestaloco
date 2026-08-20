# FiestaLoco — Deploy Rehberi

Frontend **Vercel**'de, gerçek zamanlı oyun sunucusu **AWS EC2**'de (Frankfurt), kalıcı veri
**Supabase**'de (Frankfurt). Üç katman da Frankfurt'ta — İstanbul'dan gidiş-dönüş ~80 ms.

```
   📺 TV (PC'den yansıtılan sekme)     📱 Telefonlar
              │                              │
              └──────────────┬───────────────┘
                             │  HTTPS
                             ▼
                   ┌────────────────────────┐
                   │        VERCEL          │  Vite build (dist/) — global CDN
                   │    fiestaloco.site     │  preview deploy'lar dahil
                   └────────────────────────┘
                             │
                             │  WSS + /api   (VITE_SERVER_URL)
                             ▼
                   ┌────────────────────────┐
                   │   AWS EC2 (eu-central-1)│
                   │  api.fiestaloco.site   │
                   │  ┌──────────────────┐  │
                   │  │ Caddy :443       │  │ otomatik Let's Encrypt
                   │  │   ↓ reverse proxy│  │
                   │  │ node :3000       │  │ systemd — Restart=always
                   │  └──────────────────┘  │ WebSocket odaları + timer'lar
                   └────────────────────────┘
                             │
                             │  service_role (yalnızca sunucudan)
                             ▼
                   ┌────────────────────────┐
                   │  SUPABASE (Frankfurt)  │ leaderboard · maç geçmişi · snapshot
                   └────────────────────────┘
```

**Neden EC2, neden Vercel'e tek başına konmuyor?** Vercel Functions bağlantı ömrünü 300 s
(Hobby) / 800 s (Pro) ile sınırlıyor ve TV ekranı ile telefonların aynı instance'a düşeceğini
garanti etmiyor. Oda state'i tamamen RAM'de (6 mod, 24 timer) olduğu için gerçek zamanlı katman
kalıcı bir process'te koşmak zorunda. Render'ın ücretsiz planı da 15 dakikada uyuyordu; EC2
hiç uyumaz.

---

## Canlı kaynaklar

| Katman | Kaynak | Adres / kimlik |
|---|---|---|
| Alan adı | Vercel (Name.com) | `fiestaloco.site` — ns1/ns2.vercel-dns.com |
| Frontend | Vercel | `https://fiestaloco.site` |
| Oyun sunucusu | EC2 `t3.micro` | `i-0642c3d0bb8fbf71e` · Elastic IP **63.186.47.36** |
| | | `https://api.fiestaloco.site` |
| Bölge | AWS | `eu-central-1` (Frankfurt) |
| Güvenlik grubu | AWS | `sg-0dcb73d7aa0476bf5` — 80/443 herkese, 22 sadece ev IP'sine |
| SSH anahtarı | — | `~/.ssh/fiestaloco-key.pem` (`fiestaloco-key`) |
| Veritabanı | Supabase | `fiestaloco` · ref `lqpbfvzkfgxwatboente` |

**Aylık maliyet:** EC2 t3.micro ~$8.5 + Elastic IP $0 (bağlıyken ücretsiz) + EBS 16 GB gp3 ~$1.4
≈ **$10/ay**. Vercel Hobby ve Supabase Free 0 ₺. Alan adı $9.99/yıl.

---

## Günlük kullanım

```bash
./scripts/deploy-ec2.sh        # kod değişti → derle, gönder, yeniden başlat, doğrula
./scripts/status-ec2.sh        # servis/bellek/disk/sertifika özeti + /api/health
./scripts/status-ec2.sh logs   # canlı log
./scripts/status-ec2.sh restart
./scripts/status-ec2.sh ssh
```

Deploy sırasında sunucu tüm odaların snapshot'ını Supabase'e yazar, istemcilere
`server:restarting` gönderir; telefonlar ~1.5 saniyede kendiliğinden geri bağlanır.

Sırlar değiştiyse (`.env.server` düzenlendiyse):

```bash
./scripts/set-secrets-ec2.sh
```

Alan adı değişirse:

```bash
./scripts/set-domain-ec2.sh            # target.env'deki FIESTA_DOMAIN
./scripts/set-domain-ec2.sh api.baska.com
```

---

## Sıfırdan kurulum

Aşağıdakiler **zaten yapıldı**; kutu silinip yeniden kurulursa bu sıra izlenir.

### 1. Supabase

Proje `fiestaloco` (ref `lqpbfvzkfgxwatboente`, eu-central-1) kurulu, şema uygulandı:

| Tablo | İçerik |
|---|---|
| `player_stats` | Global oyuncu istatistikleri (isim bazlı, büyük/küçük harf duyarsız) |
| `match_history` | Oynanan her maçın kaydı |
| `room_snapshots` | Aktif odaların state'i — restart dayanıklılığı |

RLS açık: `player_stats` ve `match_history` herkese **okunur**, yazma yalnızca `service_role`.
`room_snapshots` tamamen kapalı.

### 2. AWS altyapısı

```bash
# Anahtar çifti
aws ec2 create-key-pair --region eu-central-1 --key-name fiestaloco-key \
  --query KeyMaterial --output text > ~/.ssh/fiestaloco-key.pem
chmod 400 ~/.ssh/fiestaloco-key.pem

# Güvenlik grubu: 80/443 herkese (Caddy + ACME), 22 sadece kendi IP'nize
aws ec2 create-security-group --region eu-central-1 --group-name fiestaloco-sg \
  --description "FiestaLoco game server" --vpc-id <vpc-id>

# Instance — user-data olarak deploy/ec2/bootstrap.sh
aws ec2 run-instances --region eu-central-1 \
  --image-id <ubuntu-24.04-amd64> --instance-type t3.micro \
  --key-name fiestaloco-key --security-group-ids <sg-id> \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=16,VolumeType=gp3,Encrypted=true}' \
  --metadata-options 'HttpTokens=required' \
  --user-data file://deploy/ec2/bootstrap.sh

# Elastic IP — instance yeniden başlasa bile IP sabit kalsın
aws ec2 allocate-address --region eu-central-1 --domain vpc
aws ec2 associate-address --region eu-central-1 --instance-id <id> --allocation-id <alloc>
```

`bootstrap.sh` kutuda şunları kurar: 2 GB swap, Node.js 22, Caddy, `fiesta` servis kullanıcısı,
`/opt/fiestaloco` ağacı, günlük güvenlik yamaları.

Otomatik kurtarma alarmları (donanım arızasında `recover`, OS takılmasında `reboot`):

```bash
aws cloudwatch put-metric-alarm --alarm-name fiestaloco-system-recover \
  --namespace AWS/EC2 --metric-name StatusCheckFailed_System \
  --dimensions Name=InstanceId,Value=<id> --statistic Maximum \
  --period 60 --evaluation-periods 2 --threshold 0 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:automate:eu-central-1:ec2:recover
```

### 3. DNS

Vercel paneli → **Domains → fiestaloco.site → DNS Records → Add**:

| Type | Name | Value |
|---|---|---|
| A | `api` | `63.186.47.36` |

Kök alan adı (`fiestaloco.site` + `www`) Vercel projesine bağlanır; Vercel kayıtları kendi ekler.

### 4. Sırlar ve deploy

```bash
cp .env.server.example .env.server
#   SUPABASE_SERVICE_ROLE_KEY'i Supabase panelinden yapıştırın:
#   Project Settings → API → Project API keys → service_role (secret)

./scripts/set-secrets-ec2.sh   # /etc/fiestaloco.env yazılır (0640, root:fiesta)
./scripts/deploy-ec2.sh        # uygulama gider, systemd servisi ayağa kalkar
./scripts/set-domain-ec2.sh    # Caddy sertifikayı alır
```

### 5. Vercel frontend

1. [vercel.com/new](https://vercel.com/new) → `acokgunlu/fiestaloco` reposunu import edin.
   `vercel.json` hazır: framework `vite`, build `npm run build`, output `dist`.
2. **Settings → Environment Variables** (Production + Preview + Development):

   ```
   VITE_SERVER_URL=https://api.fiestaloco.site
   ```

   `https://` ile başlasın, sonunda `/` olmasın — kod bunu otomatik `wss://`'e çevirir.
   Bu değişken **build zamanında** gömülür; değiştirirseniz yeniden deploy şart.
3. **Settings → Domains** → `fiestaloco.site` ekleyin.

---

## Doğrulama

```bash
# Sunucu ayakta ve Supabase bağlı mı?
curl https://api.fiestaloco.site/api/health

# 6 oyun modunun tamamı uçtan uca çalışıyor mu?
SMOKE_TARGET=https://api.fiestaloco.site npm run smoke

# Origin kısıtlaması doğru mu?
SMOKE_TARGET=https://api.fiestaloco.site node scripts/originTest.mjs

# Gerçek ağ üzerinde oda açma gecikmesi
SMOKE_TARGET=wss://api.fiestaloco.site node scripts/roomTiming.mjs

# Birim testler (serializer + oyun sonu tespiti)
npx tsx scripts/persistenceTest.ts
```

Ardından tarayıcıda: `https://fiestaloco.site` → TV modunda oda açın → QR'ı telefonla okutun.

---

## Yerel geliştirme

Hiçbir şey değişmedi — tek komut, tek port:

```bash
npm install
npm run dev          # http://localhost:3000 (Vite middleware + WS aynı portta)
```

`VITE_SERVER_URL` boş olduğu sürece frontend same-origin'e bağlanır.
Supabase'i yerelde denemek için `.env.local` içine `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

---

## Ortam değişkenleri

| Değişken | Nerede | Zorunlu | Açıklama |
|---|---|---|---|
| `VITE_SERVER_URL` | Vercel | ✅ | Oyun sunucusunun public adresi |
| `NODE_ENV` | EC2 | ✅ | `production` — `/etc/fiestaloco.env` |
| `PORT` | EC2 | ✅ | `3000`, yalnızca localhost'ta dinlenir |
| `SERVE_STATIC` | EC2 | ✅ | `false` — statiği Vercel servis ediyor |
| `SUPABASE_URL` | EC2 | ➖ | Yoksa salt bellek-içi çalışır |
| `SUPABASE_SERVICE_ROLE_KEY` | EC2 | ➖ | **Gizli.** Yalnızca sunucuda, asla `VITE_` ile |
| `ALLOWED_ORIGINS` | EC2 | ➖ | Boş = herkese açık |
| `SNAPSHOT_INTERVAL_MS` | EC2 | ➖ | Varsayılan `15000`, `0` = kapalı |
| `SNAPSHOT_MAX_AGE_MINUTES` | EC2 | ➖ | Varsayılan `180` |
| `GEMINI_API_KEY` | EC2 | ➖ | Yoksa yerel soru/kelime bankası kullanılır |

Sunucu tarafındakilerin hepsi `/etc/fiestaloco.env` içinde (0640, `root:fiesta`).
`.env.server` → `scripts/set-secrets-ec2.sh` ile oraya yazılır; git'e girmez.

---

## Sorun giderme

| Belirti | Neden / çözüm |
|---|---|
| `https://api.fiestaloco.site` açılmıyor | DNS A kaydı eksik veya yayılmadı → `dig +short api.fiestaloco.site` |
| Sertifika alınamıyor | 80/tcp kapalıysa ACME HTTP-01 başarısız olur → güvenlik grubunu kontrol edin |
| Telefon bağlanmıyor, TV çalışıyor | `ALLOWED_ORIGINS` Vercel domainini içermiyor olabilir |
| `persistence.enabled: false` | `SUPABASE_SERVICE_ROLE_KEY` boş → `./scripts/set-secrets-ec2.sh` |
| SSH açılmıyor | Ev IP'niz değişti → güvenlik grubuna yeni IP'yi ekleyin: |

```bash
aws ec2 authorize-security-group-ingress --region eu-central-1 \
  --group-id sg-0dcb73d7aa0476bf5 --protocol tcp --port 22 \
  --cidr "$(curl -s https://checkip.amazonaws.com)/32"
```

---

## Bilinen davranışlar

- **Oda açmak sunucu başlatmaz.** Tek process tüm odaları hafızasında tutar; oda açma süresi
  0.3 ms. EC2 hiç uyumadığı için cold start yok.
- **Deploy sırasında** sunucu snapshot alır, `server:restarting` yollar ve kapanır. İstemciler
  1.5 saniyede geri bağlanır. Devam eden geri sayımlar otomatik yeniden başlatılmaz — host bir
  sonraki aksiyonla devam ettirir.
- **Snapshot yaşı** 180 dakikayı geçen odalar açılışta geri yüklenmez; 12 saatten eski kayıtlar
  saatlik temizlenir.
- **Leaderboard isim bazlıdır** (auth yok): "Ada" ve "ada" aynı oyuncu sayılır.
- **Supabase kapalıyken** oyunlar tam çalışır; skorlar cihaz-yerel kalır. Skor tablosundaki rozet
  `📱 Bu cihaz` / `🌍 Global` olarak durumu gösterir.
- **Tek replica zorunlu.** Oda state'i RAM'de. t3.micro binlerce eşzamanlı oyuncuyu taşır;
  ötesi için sonraki adım Cloudflare Durable Objects'tir (1 oda = 1 obje) ve `server.ts`'in
  yeniden yazılmasını gerektirir.

---

## Alternatif hostlar

Kodda değişiklik gerekmez — yalnızca `VITE_SERVER_URL` ve `ALLOWED_ORIGINS` güncellenir.
Repoda hazır dosyalar: `render.yaml` (Render), `railway.json` (Railway), `Dockerfile` (Fly.io /
kendi VPS'iniz / Docker).

**Tek hostta çalıştırmak** (frontend + sunucu birlikte, Vercel'e gerek yok):

```bash
npm run build:all && npm start
```

`dist/` mevcut, `NODE_ENV=production` ve `SERVE_STATIC` `false` değilse sunucu frontend'i de
servis eder.
