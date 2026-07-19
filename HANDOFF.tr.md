# $TBILL sitesi — geliştirici teslim (handoff) notu

Tek sayfalık memecoin sitesi: sahte bir Windows 98 masaüstü (98.css) — sürüklenebilir
pencereler, dönen 3D WordArt logosu, canlı işlem şeridi (ticker) ve bir mini oyun.
Tek route, tamamen client-side, backend yok.

## Teknoloji / gereksinimler

- **Next.js 16** (app router, Turbopack) · **React 19** · TypeScript
- **Node 18.18+** (Node 22 ile geliştirildi)
- Kütüphaneler: `98.css`, `react-draggable`, `canvas-confetti`
- Deploy hedefi: **Vercel** (statik — çalışması için sunucu/env gerekmez)

## Çalıştırma / build / deploy

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (deploy'dan önce çalıştır)
npm start        # production build'i lokal olarak sun
```

Deploy: bir Git reposuna push edip Vercel'e import et (framework otomatik algılanır)
veya `vercel` CLI kullan. Ekstra build ayarı gerekmez.

## Proje yapısı (önemli dosyalar)

| Dosya | Nedir |
|------|------------|
| `app/page.tsx` | Tüm sayfa. Pencere yöneticisi (aç/kapa/z-index/taskbar/ikonlar), tüm pencere içerikleri, WordArt logo, oyun; ticker'ı buraya bağlar. Client component. |
| `app/globals.css` | Tüm özel stiller (98.css layout içinde ayrıca import ediliyor). |
| `app/layout.tsx` | `98.css`'i import eder, `<title>`/description ayarlar. |
| `app/config.ts` | **Launch konfigürasyonu** — kontrat adresi + sosyal linkler (aşağıya bak). |
| `app/components/LiveTicker.tsx` | Üstteki canlı işlem şeridi (trade kaynağını tüketir). |
| `lib/tradeSource.ts` | **İşlem verisi kaynağı — canlıya geçmek için DEĞİŞTİRİLECEK TEK dosya** (aşağıya bak). |
| `app/icon.png`, `app/apple-icon.png` | Favicon / touch ikon (maskot). Değiştirmek için dosyaları değiştir. |
| `next.config.ts` | Turbopack workspace root'unu sabitler. |

## Launch konfigürasyonu — `app/config.ts`

CA ve linkler **varsayılan olarak boştur ve doldurulana kadar hiç görünmez** —
lansman öncesi sahte placeholder gösterilmez. Lansmanda iki yoldan biriyle ayarla:

- **Kod içinde:** gerçek değerleri `app/config.ts` içinde tırnakların arasına yapıştır, redeploy et.
- **Kod olmadan (Vercel):** env değişkenlerini ayarla, sonra redeploy et (build sırasında gömülürler):
  `NEXT_PUBLIC_CA`, `NEXT_PUBLIC_TWITTER`, `NEXT_PUBLIC_TELEGRAM`, `NEXT_PUBLIC_PONS`, `NEXT_PUBLIC_CHART`

Site CA'yı ve sosyal butonları buradan otomatik okur — başka bir düzenleme gerekmez.

## Canlı işlem şeridi — canlıya geçiş (en önemli kısım)

İşlem akışı, canlıya geçişin **tek bir dosyaya** dokunacak şekilde bölünmüştür:

- `lib/tradeSource.ts`, `subscribeToTrades(onTrade) => unsubscribe` fonksiyonunu ve `Trade` tipini dışa açar.
- **Faz 1 (mevcut):** fonksiyonun içi her 2–8 saniyede bir gerçekçi **mock** işlem üretir.
- `app/components/LiveTicker.tsx` yalnızca `subscribeToTrades`'i çağırır; işlemlerin nereden
  geldiğini bilmez. **Canlıya geçerken frontend değişmez.**

**Canlıya geçmek için yalnızca `lib/tradeSource.ts` içindeki `subscribeToTrades`'in gövdesini
değiştir** (o dosyanın başında bunu anlatan bir `// TODO: Phase 2` bloğu var):

1. Havuzun (pool) bulunduğu zincir için bir **WSS RPC**'ye WebSocket bağlantısı aç.
2. Havuz kontratının **`Swap`** event'lerine `eth_subscribe` yap (DEX temiz bir Swap yaymıyorsa
   havuz adresine giden/gelen **`Transfer`** event'leri).
3. Her event'te: miktarları decode et; **yön = token havuzdan çıkıyorsa `buy`, giriyorsa `sell`**;
   USD değerini tahmin et; `txHash` ve gönderen adresini (`wallet`) al.
4. Her birini mevcut `onTrade(trade)` callback'i ile yayınla — aynı `Trade` şekli.
5. **Yeniden bağlanma (reconnect) + backoff** ekle (WSS bağlantıları düşer).
6. Mock yardımcı fonksiyonları ve `MOCK_PRICE_USD` sabitini sil.

**Yapılabilirlik / önce doğrulanması gerekenler:** bu, **Robinhood Chain EVM-uyumluysa ve bir WSS
RPC endpoint'i sunuyorsa** ve havuz standart, decode edilebilir Swap/Transfer event'leri yayıyorsa
temiz çalışır — o zaman ethers/viem + bir websocket yeterlidir. Public WSS yoksa ya da zincir EVM
değilse, bunun yerine bir **indexer/API** kullan (bir DEX-veri API'si, launchpad'in API'si veya bir
subgraph; polling ya da stream ile) — aynı `subscribeToTrades` imzasına sar, ve yine frontend değişmez.
Yani: **evet, canlıya geçmeye hazır** — ama bu, o tek dosyada gerçek bir entegrasyon işi, bir config
anahtarı değil. Başlamadan önce deploy edilmiş **CA + havuz (pool) adresi** gerekir.

## Bilinen placeholder / mock (bilerek böyle)

- **Canlı ticker** = `tradeSource.ts` zincire bağlanana kadar mock veri (yukarıdaki adımlar).
- **VIBES widget'ı** (`portfolio_widget`) — bilerek fiyat/getiri DEĞİL; bir şaka
  ("VIBES: MAXIMUM", "not a price / not financial advice" etiketli). Öyle kalsın.
- **Brainrot sayacı**, **whack-a-jeet** oyunu — tamamen kozmetik/eğlence, veri yok.
- **"as seen on"** rozetleri — parodi metin, bilerek sahte.
- Her yerde **"not financial advice" (yatırım tavsiyesi değildir)** uyarıları var; "satın al" (buy)
  CTA'sı yok (büyük buton sadece konfeti atar). Uyumluluk (compliance) için lütfen böyle kalsın.

## Dikkat edilecekler (gotchas)

- **Klasörün adı birebir `$TBILL`**, npm bunu paket adı olarak kabul etmez —
  bu yüzden `package.json` adı `tbill-website`. Bu klasörde `create-next-app`'i tekrar çalıştırma;
  `$` yüzünden hata verir. (Deploy/build bundan etkilenmez.)
- Next dev sunucusu proje klasörü başına **tek instance**'a izin verir — `npm run dev` "zaten çalışıyor"
  derse önce onu kapat (`pkill -f "next dev"`).
- **Maskot/favicon** değiştirmek için `app/icon.png` (256×256) ve `app/apple-icon.png` (180×180)
  dosyalarını değiştir. Next otomatik algılar; kod değişikliği gerekmez.

---
> İngilizce sürüm: `HANDOFF.md`
