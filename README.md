# [UYGULAMA_ADI] — Offline Pelvik Taban (Kegel) Antrenmanı

Türkçe-öncelikli, **tamamen offline ve sunucusuz** pelvik taban antrenman uygulaması (Expo + React Native + TypeScript).
Veriler yalnızca cihazda; analytics/reklam/takip SDK'sı yok. Tek ağ kullanımı App Store / Google Play satın alma işlemleri.

> Uygulama adı yer tutucudur: `src/config/app.ts` → `APP_NAME`. Her yer (arayüz, bildirimler, `app.config.ts`, yedek dosya adı) buradan okur.

## Özellikler (v1)

| Modül | Nerede |
|---|---|
| Yaş kapısı (16+) + tıbbi uyarı → 7 adımlı onboarding → zorunlu eğitim → paywall | `app/consent.tsx`, `app/onboarding/`, `app/tutorial.tsx`, `src/features/app/gate.ts` |
| Kegel antrenman motoru: 30 seviye (saf veri), deterministik günlük seans, uyarlanabilir zorluk, 30 günlük plan | `src/features/training/` |
| Oynatıcı: büyüyen/küçülen daire, titreşim dili, opsiyonel ses, keep-awake, arka planda otomatik duraklatma, gizli mod | `src/features/training/player/` |
| Seri, 19 kupa, kutlama animasyonu | `src/features/gamification/` |
| İlerleme: güç testi (tutma + 10 sn dokunma), SVG grafikler, ısı haritası, özet kartlar, yerel notlar | `src/features/progress/`, `app/strength-test.tsx` |
| Yerel hatırlatmalar: günde 1–3 saat, nötr metin, Başla / 15 dk / 1 saat ertele, haftalık test | `src/features/reminders/` |
| Kasık Fitness: 12 egzersiz, 3 rutin (5/8/12 dk) | `src/content/fitness.tr.json`, `app/fitness/` |
| Zihin: kutu & 4-7-8 nefes, zihin boşaltma (varsayılan kayıt yok), beden taraması | `app/mind/` |
| İçerik: 20 hikâye, 3 kurs × 5 ders + quiz, 62 günlük görev (`reviewed: false`, kaynaklı) | `src/content/*.tr.json` (üreticiler: `scripts/content/`) |
| Satın alma: şeffaf paywall, gerçek fiyatlar, geri yükleme, offline yetki önbelleği, `PAYWALL_MODE` | `src/features/purchases/`, `app/paywall.tsx` |
| Ayarlar, JSON dışa/içe aktarma, çift onaylı silme, yasal metinler | `app/settings/`, `src/features/data/` |

## Teknoloji

Expo SDK 58 · React Native 0.88 · expo-router (dosya tabanlı, kök `app/`) · zustand + react-native-mmkv (küçük durum) · expo-sqlite (geçmiş, `PRAGMA user_version` migration'ları) · expo-haptics + RN `Vibration` · expo-audio · expo-keep-awake · expo-notifications (yalnızca yerel) · react-native-reanimated + react-native-svg · i18next · expo-iap (StoreKit 2 / Play Billing, **RevenueCat yok**) · Jest.

Grafikler `victory-native`/`gifted-charts` yerine `react-native-svg` ile yazılmış küçük bileşenlerdir (`src/features/progress/charts/`) — ek bağımlılık ve native modül gerektirmez.

## Kurulum

```bash
npm install
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npx expo lint
```

### Development build (zorunlu)

MMKV (Nitro), expo-iap ve bildirim aksiyonları native kod içerir; **Expo Go yetmez**.

Yerelde (Xcode / Android Studio kuruluysa):

```bash
npx expo run:ios
```

```bash
npx expo run:android
```

EAS ile bulutta:

```bash
npx eas-cli@latest build --profile development --platform ios
```

```bash
npx eas-cli@latest build --profile development --platform android
```

Sonra geliştirme sunucusu:

```bash
npx expo start --dev-client
```

`eas.json` profilleri: `development` (cihaz), `development-simulator`, `preview` (dahili dağıtım), `production`.
Yayın öncesi `src/config/app.ts` içindeki `IOS_BUNDLE_ID` / `ANDROID_PACKAGE` değerlerini gerçek kimliklerle değiştir.

### Web önizleme (yalnızca geliştirme)

`npx expo start --web` arayüzü tarayıcıda gösterir. Web'de geçmiş bellekte tutulur, titreşim/bildirim/satın alma devre dışıdır. Ürün hedefi iOS + Android'dir.

## Satın alma kurulumu

Ürün kimlikleri `src/config/monetization.ts` → `PRODUCT_IDS`:

| Anahtar | Ürün ID | Tür |
|---|---|---|
| weekly | `premium_weekly` | Otomatik yenilenen abonelik |
| monthly | `premium_monthly` | Otomatik yenilenen abonelik |
| yearly | `premium_yearly` | Otomatik yenilenen abonelik + **7 günlük ücretsiz deneme** (giriş teklifi) |
| lifetime | `premium_lifetime` | Tüketilmeyen tek seferlik (opsiyonel, `OFFER_LIFETIME`) |

- App Store Connect: üç aboneliği aynı abonelik grubuna koy; yıllığa "Free trial – 1 week" giriş teklifi ekle.
- Google Play Console: her abonelik için bir base plan; yıllığa ücretsiz deneme teklifi ekle (uygulama `offerToken`'ı mağazadan okur).
- **Kodda fiyat yoktur.** Paywall fiyatı, deneme süresini ve aylık eşdeğeri mağazadan gelen değerlerden hesaplar; fiyat alınamazsa dürüstçe "yüklenemedi" der.
- `PAYWALL_MODE`: `'hard'` (eğitim + ilk antrenman ücretsiz) veya `'freemium'` (Seviye ≤ 5, hikâyeler, zihin araçları ve güç testi ücretsiz; ileri seviyeler, kurslar, fitness premium).
- `DEV_BYPASS_PAYWALL` `__DEV__`'de otomatik açıktır.
- Yetki MMKV'de önbelleklenir, her açılışta / ön plana dönüşte sessizce doğrulanır; internet yoksa son durum `ENTITLEMENT_OFFLINE_GRACE_DAYS` (7 gün) toleransla geçerlidir.
- Not: Android istemci tarafında abonelik bitiş tarihi vermez; aktif abonelik 35 günlük pencereyle önbelleklenir ve her açılışta yeniden doğrulanır.

## Mağaza notları

- **Yaş derecelendirmesi 16+** (olgun/tıbbi tema). App Store: "Medical/Treatment Information: Infrequent/Mild" + "Mature/Suggestive Themes"; Google Play IARC anketini buna göre doldur.
- **App Privacy / Data safety:** "Data Not Collected" — uygulama hiçbir veri toplamaz veya paylaşmaz.
- **Gizlilik Politikası ve Kullanım Şartları** uygulama içinde statiktir (`src/i18n/tr.json` → `legal`), ancak mağazalar **herkese açık bir web URL'si** ister: aynı metinleri statik bir sayfada (ör. GitHub Pages) yayınla. Metinler taslaktır; yayın öncesi hukuki kontrol gerekir.
- Apple 3.1.2: paywall'da gerçek fiyat, yenileme dönemi, deneme bitiş tarihi, "Satın alımları geri yükle", şartlar/gizlilik linkleri ve görünür kapatma butonu var; sahte sayaç/indirim yok.
- "Tıbbi cihaz değildir" uyarısı ilk açılışta onaylatılır; açıklamalarda iyileşme vaadi kullanma.

## Uçak modu kontrol listesi (manuel, cihazda)

Uçak modunu aç, uygulamayı kapatıp yeniden başlat ve sırayla doğrula:

1. İlk açılış: onay → onboarding → eğitim (deneme seti titreşimle) → paywall "fiyatlar yüklenemedi" + kapat.
2. Bugün: antrenman başlat, ekrana bakmadan titreşimle tamamla, geri bildirim ver, seviye/seri güncellensin.
3. İlerleme: güç testi yap; grafik ve ısı haritası güncellensin; not ekle/sil.
4. Keşfet: hikâye oynat (dokun ileri/geri, basılı tut dur, aşağı kaydır kapat), kurs dersi + quiz.
5. Zihin: nefes, zihin boşaltma, beden taraması.
6. Bildirim: Ayarlar > Hatırlatıcılar'dan 2 dk sonrasına saat kur; bildirim gelsin, "15 dk ertele" çalışsın, kilit ekranında nötr metin görünsün.
7. Ayarlar > Verilerim: dışa aktar → tüm verileri sil → içe aktar; her şey geri gelsin.

Otomatik kapsam: `__tests__/acceptance.test.ts` takip SDK'sı olmadığını, ağ çağrısının yalnızca izinli modüllerde olduğunu, kullanılan tüm i18n anahtarlarının var olduğunu ve rakip adının geçmediğini doğrular; `exportImport.test.ts` dışa aktar → sil → içe aktar döngüsünün kayıpsız olduğunu kanıtlar.

## İçerik

- Hikâye/kurs/görev JSON'ları `scripts/content/*.py` ile üretilir (tek kaynak); düzenledikten sonra `python3 scripts/content/<dosya>.py` çalıştır.
- Tüm eğitim içeriği `reviewed: false` — uzman (ürolog / pelvik taban fizyoterapisti) kontrolü Faz 2'de. Kaynak linkleri (`scripts/content/sources.py`) inceleme sırasında doğrulanmalı; PubMed bağlantıları arama sorgusudur.
- Ses ipuçları `scripts/generate-tones.js` ile sentezlenmiş özgün tonlardır.
- İllüstrasyonlar ve uygulama ikonu yer tutucudur (`src/components/Illustrations.tsx`, `src/features/fitness/PostureArt.tsx`, `assets/`).

## Klasör yapısı

```
app/                 expo-router rotaları ((tabs), onboarding, workout, mind, story, course, settings, legal…)
src/config/          app.ts (APP_NAME), monetization.ts, theme.ts
src/features/        training, fitness, progress, mind, content, gamification, reminders, purchases, data, app
src/components/      ortak UI (Button, Card, ProgressRing, SegmentedBar, Dialog, TimeStepper…)
src/content/         *.tr.json içerik
src/i18n/            tr.json (tam), en.json (iskelet), index.ts
src/stores/          zustand store'ları (MMKV kalıcılık) + SQLite geçmiş store'u
__tests__/           birim + kabul testleri
scripts/             içerik ve ses üreticileri
```

## Faz 2 için açık noktalar

Seri dondurma / tatil modu, uygulama kilidi ve alternatif ikon, kadın modu, saat uygulamaları, widget'lar, İngilizce (`src/i18n/en.json` iskeleti hazır, eksik anahtarlar Türkçe'ye düşer), uzman onaylı içerik, Ramazan modu, Health entegrasyonu.
