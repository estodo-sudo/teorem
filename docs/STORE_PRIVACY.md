# Mağaza gizlilik formları ve yasal metinler (yayın öncesi kontrol listesi)

Hazırlanma: 22 Kasım 2026. Hukuki görüş değildir; yayından önce bir hukukçuya kontrol ettirilmesi önerilir.

## Uygulamanın gerçekte yaptığı (koddan doğrulandı)

- Sunucu, hesap, analiz, reklam, izleme, çökme raporu SDK'sı **yok**.
- Tek ağ bağlantısı: `expo-iap` ile App Store / Google Play (satın alma ve abonelik doğrulama).
- `expo-updates` mağaza sürümünde kendiliğinden güncelleme sormaz (`checkAutomatically: 'NEVER'`).
- Tüm kullanıcı verisi telefonda: MMKV/zustand depoları, SQLite (geçmiş, Odak kasası), Keychain/Keystore (Odak AES-256 anahtarı, PIN özeti), uygulama klasörü (Sigarasız Kamp fotoğrafı).
- Android otomatik yedekleme kapalı (`android.allowBackup: false`). iOS'ta iCloud cihaz yedeği uygulama verisini içerebilir (Apple hesabında, bize ulaşmaz); Odak anahtarı `THIS_DEVICE_ONLY`.
- İzinler: bildirim, galeri (isteğe bağlı), rehber (yalnızca sistem "kişi ekle" formu), Face ID / biyometri (isteğe bağlı kilit), titreşim, faturalama. Kamera, mikrofon, konum yok.
- "Verilerimi ve hesabımı sil" (Profil en alt): `src/features/data/deleteAll.ts` — tüm depolar, Odak kasası + anahtar + PIN, fotoğraflar, önbellekteki dışa aktarma dosyaları, planlanmış bildirimler.

## App Store Connect

- **App Privacy**: "Data Not Collected" (geliştirici hiçbir veriyi cihaz dışına almıyor; yalnızca cihazda işlenen veri "toplanan" sayılmaz).
- **Privacy Policy URL**: zorunlu, herkese açık bir web adresi olmalı. Uygulamadaki Gizlilik Politikası metnini bir web sayfasında yayınla.
- **Abonelikler (3.1.2)**: mağaza açıklamasına Kullanım Şartları (EULA) ve Gizlilik Politikası bağlantılarını ekle. Standart Apple EULA kullanılabilir.
- **DSA trader**: abonelik satıldığı için "trader" seç; adres, telefon, e-posta AB ürün sayfasında görünür.
- Hesap oluşturma olmadığı için hesap silme zorunluluğu (5.1.1(v)) doğrudan uygulanmaz; yine de silme düğmesi var.

## Google Play Console

- **Data safety**: "Kullanıcı verisi toplanmıyor veya paylaşılmıyor". Yalnızca cihazda işlenen veri beyan edilmez. Ödemeyi Google Play Billing yürütür.
- **Privacy policy**: herkese açık URL zorunlu (uygulama içindeki metin yetmez).
- **Health apps declaration** (Uygulama içeriği bölümü): sağlık/fitness uygulaması olarak doldur.
- Para kazanan hesapta yasal ad, adres ve iletişim bilgileri mağazada herkese açık görünür.

## Uygulamadaki yasal metinler (`src/i18n/tr.json` → `legal.*`, sayfa: `app/legal/<id>.tsx`)

| id | Başlık |
| --- | --- |
| `kvkk` | KVKK Aydınlatma Metni |
| `privacy` | Gizlilik Politikası |
| `terms` | Hizmet Şartları |
| `presale` | Abonelik Ön Bilgilendirme Formu |
| `renewal` | Yenileme Politikası |
| `refund` | İade Politikası |
| `cookies` | Çerez Politikası |
| `faq` | Sık Sorulan Sorular |
| `disclaimer` | Tıbbi Uyarı |

Satıcı bilgileri tek yerde: `src/config/app.ts` → `LEGAL_ENTITY`.

## Yayından önce yapılacaklar

- [ ] `LEGAL_ENTITY.email`: gerçek destek e-postası (şu an yer tutucu).
- [ ] Adrese kapı numarası / posta kodu eklemek gerekiyorsa `LEGAL_ENTITY.address`.
- [ ] Gizlilik Politikası ve Şartları bir web sayfasında yayınla, URL'leri iki mağazaya gir.
- [ ] App Store Connect ve Play Console'da haftalık / aylık / yıllık ürünleri `premium_weekly`, `premium_monthly`, `premium_yearly` kimlikleriyle oluştur; üç plana da 14 günlük ücretsiz deneme ekle. Fiyatlar: yıllık 669,90 / aylık 189,99 TL; haftalık `premium_weekly` 99,90 TL (üstü çizili gösterilir) ve indirimli haftalık `premium_weekly_promo` 89,90 TL (14 gün deneme). Fırsat ürünleri `premium_monthly_offer` (169,90 TL) ve `premium_weekly_offer` (39,90 TL) de aynı abonelik grubunda oluşturulmalı; bu iki fırsat ürününe de 14 günlük ücretsiz deneme (tanıtım teklifi) ekle.
- [ ] Metinleri bir hukukçuya kontrol ettir (özellikle cayma hakkı istisnası ve ön bilgilendirme).
