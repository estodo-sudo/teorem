# Devir Notu — Yerel Oturum İçin

> Bu dosya bulut oturumunda yapılan işlerin özetidir. Yerelde açılan Claude oturumu önce bunu, sonra `README.md` ve `AGENTS.md`'yi okumalı.
> Son güncelleme: 16 Kasım 2026.

## 1. Proje nedir?

Türkçe-öncelikli, **tamamen offline ve sunucusuz** pelvik taban (Kegel) antrenman uygulaması. Pazar liderine işlevsel olarak eşdeğer ama özgün: isim, metin, görsel ve içerik bize ait. Kurallar:
- Sunucu yok, hesap yok. Analytics, reklam ve takip SDK'sı yok. Tek ağ kullanımı mağaza satın almaları.
- Tüm arayüz metinleri `src/i18n/tr.json`'dan gelir (i18n hazır, İngilizce iskeleti var).
- Uygulama adı yer tutucu: `src/config/app.ts` → `APP_NAME = '[UYGULAMA_ADI]'`.
- Tıbbi vaat yok. İçerikler `reviewed: false` işaretli. Paywall şeffaf: sahte sayaç ve sahte indirim yok.

**Teknoloji:** Expo SDK 58, React Native 0.88, TypeScript strict, expo-router (rotalar kök `app/` klasöründe), zustand + MMKV (Expo Go'da SQLite'a düşer), expo-sqlite (geçmiş), reanimated, react-native-svg, i18next, expo-iap, Jest.

## 2. Tamamlananlar (v1 — M1…M13 hepsi bitti)

| Modül | Durum |
|---|---|
| Yaş kapısı (16+), tıbbi uyarı, 7 adım onboarding, eğitim (deneme setiyle) | ✅ |
| Antrenman motoru: 30 seviye, deterministik günlük seans, uyarlanabilir zorluk, 30 günlük plan | ✅ |
| Oynatıcı: daire animasyonu, titreşim dili, ses, keep-awake, arka planda duraklatma, gizli mod | ✅ |
| Bugün ekranı, seri, 19 kupa, kutlama animasyonu | ✅ |
| İlerleme: güç testi, grafikler, ısı haritası, notlar | ✅ |
| Yerel hatırlatmalar (nötr metin, ertele butonları, haftalık test) | ✅ |
| Kasık fitness (12 egzersiz, 3 rutin) | ✅ |
| Zihin: nefes, zihin boşaltma, beden taraması | ✅ |
| İçerik: 20 hikâye, 3 kurs × 5 ders + quiz, 62 günlük görev | ✅ |
| Satın alma / paywall (`PAYWALL_MODE` hard/freemium), offline yetki önbelleği | ✅ (mağaza ürünleri henüz tanımlı değil) |
| Ayarlar, JSON dışa/içe aktarma, tüm verileri sil, yasal metinler | ✅ |

**Kalite:** `npx tsc --noEmit` temiz, `npx expo lint` temiz, `npm test` → 136 test geçiyor. Kabul kriterleri `__tests__/acceptance.test.ts` içinde test olarak kodlu: takip SDK'sı yok, ağ çağrısı allow-list'te, i18n anahtarları mevcut, rakip adı yok.

Ayrıntılı modül listesi ve klasör yapısı için `README.md`'ye bak.

## 3. Sonradan yapılan değişiklikler (v1 sonrası)

- **Keşfet:** 20 hikâye 6 kategori satırı yerine tek satırda, "Sağlıklı Yaşam" başlığı altında.
- **Expo Go uyumu:**
  - `src/stores/storage.ts` her depoyu yaz/oku denemesiyle seçer: MMKV → `expo-sqlite/kv-store` → bellek.
  - `historyStore` SQLite açılmazsa bellekte çalışır.
  - `expo-iap` çağrıları korumalı.
- **Hermes uyumu:** `structuredClone` kaldırıldı, yerine `src/lib/clone.ts` → `deepClone` kullanılıyor.
- **Hata ekranı:** Kök `ErrorBoundary` hata mesajını ekranda gösteriyor (`src/features/app/ErrorScreen.tsx`).
- **Web önizleme:** Sadece `WEB_PREVIEW=1` ile web platformu eklenir. `metro.config.js`'te `.wasm` desteği var.
- **Önizleme kilidi:** `EXPO_PUBLIC_PREVIEW_UNLOCK=1` paywall'ı yalnızca test önizlemelerinde açar. Mağaza derlemeleri bunu ayarlamaz.

## 4. Expo / EAS kurulumu

- **Expo hesabı:** `sfdfsdfd`. EAS proje ID'si `18811e36-1176-4e14-9bb8-2e59752cd211` (`src/config/app.ts` → `EAS_PROJECT_ID`).
- **expo-updates:** Kurulu. `checkAutomatically: 'NEVER'`, yani mağaza sürümü kendiliğinden güncelleme kontrol etmez; bunu bir test doğruluyor.
- **Kanal:** `preview` kanalı ve branch'i var. İki EAS Update yayını yapıldı (runtime `exposdk:58.0.0`).
- **`eas.json` → `preview` profili:** Android APK, `credentialsSource: local`, `channel: preview`.
  - İmza anahtarı (`credentials.json`, `credentials/preview.jks`) bulut oturumundaydı ve **zip'te yok** (gitignore'da). Yerelde APK derlenecekse yeniden oluşturulmalı ya da `credentialsSource` kaldırılıp EAS'ın anahtar üretmesine izin verilmeli.
- Bir APK derlemesi başlatıldı ama **kullanıcı isteğiyle iptal edildi**.

## 5. Çözülemeyen sorun: Expo Go + EAS Update QR'ı

- Telefonda (Android) hata: `java.io.IOException: Failed to download remote update`.
- **Teşhis:** Manifest doğru iniyor. 31 dosyanın 31'i de, manifest'in `extensions.assetRequestHeaders` alanındaki imzalı `authorization` başlığıyla iniyor. Başlık olmadan sunucu 403 veriyor.
- **Sonuç:** Telefondaki Expo Go bu imzalı başlığı göndermiyor. Expo Go sürümü kontrol edilmedi.
- **Önerilen çözüm:** Yerelde `npx expo start --go` ile geliştirme sunucusu kullanmak. Bu yöntemde EAS dosya sunucusu devreye girmez.

## 6. Yerelde çalıştırma

```bash
npm install
npx expo start --go          # Expo Go için QR (telefon aynı Wi-Fi'da)
npx expo start --go --tunnel # farklı ağdaysa
npx expo start --go --clear  # önbellek temizleyerek
```

Kontroller:

```bash
npx tsc --noEmit
npx expo lint
npm test
```

**Windows notu:** İlk açılışta Güvenlik Duvarı penceresinde Node.js'e "Özel ağlar" için izin verilmeli.

## 7. Bilinen eksikler ve sıradaki işler

1. **Gerçek cihaz testi:** Titreşim hissi, bildirim butonları, uçak modu (README'de kontrol listesi var).
2. **Görsel kimlik:** İsim, logo, ikon ve özgün illüstrasyon stili. Emojiler ve fitness çöp adamları yer tutucu.
3. **Bugün ekranı sadeleştirme:** Kartlar çok uzun; antrenman kartı daha baskın olmalı.
4. **Uzman içerik kontrolü:** `reviewed: false` içerikler ve kaynak linkleri (`scripts/content/sources.py`; PubMed linkleri arama sorgusu).
5. **Mağaza:** App Store Connect / Play Console ürünleri (`PRODUCT_IDS`), gerçek bundle ID'leri, herkese açık gizlilik/şartlar sayfası, hukuki kontrol.
6. **Faz 2 fırsatı:** Tatil modu + seri dondurma. Rakibin en çok şikâyet alan eksiği; ilk bunu önerdim.
7. **Rakiple karşılaştırma:** Kullanıcıdan rakibin ekran görüntüleri istenecek; bizim ekranlarla yan yana kıyaslanacak.

## 8. Notlar

- GitHub'a push bulut oturumundan yapılamadı (403, GitHub App yetkisi yok). Kod kullanıcıya zip olarak verildi. Yerelde git deposu zip'te gelmez; gerekirse `git init` ile yeniden başlatılabilir.
- İçerik JSON'ları `scripts/content/*.py` ile üretilir. Düzenlemeden sonra ilgili betiği çalıştır.
- Ses tonları `scripts/generate-tones.js` ile sentezlenir.
- Kullanıcı Türkçe konuşuyor ve hızlı test etmek istiyor. Uzun açıklama yerine doğrudan çözüm bekliyor.
