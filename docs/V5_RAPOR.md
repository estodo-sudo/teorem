# V5 raporu — Gerçek fotoğraflar ve tam ekran hikâye görüntüleyici

Kaynak şartname: `SPEC_GORSELLER_V5.md`. Adımlar G0–G4 sırayla yapıldı ve her adımda onay alındı.

- **Ekran görüntüleri:** yerelde `screenshots/v5/` (INDEX.md ile), boyutları nedeniyle depoda değil.
- **Görsel kayıtları:** `assets/images/CREDITS.md` (kaynak ve lisans), `assets/images/REVIEW.md` (kabul ve ret nedenleri, okunabilirlik ölçümü).

## Ne değişti

**Fotoğraflar**
- 49 Keşfet kapağı: 20 hikâye, 3 kamp, 6 program, 20 sözlük.
- 20 hikâyenin özet dışındaki bütün slaytları: 117 slayt. Özet slaytı kapağı bulanık ve kararmış gösteriyor.
- Toplam 166 kaynak fotoğraf, 186 WebP dosyası, 6,26 MB.
- Hepsi Pexels'ten; Unsplash ve Openverse kullanılmadı. Pexels lisansı 2026-11-21'de okundu: atıf gerekmiyor, değiştirilebiliyor.
- Her aday indirilip gözle kontrol edildi. Ret nedenleri şunlardı:
  - siyah-beyaz fotoğraf;
  - okunur marka ya da yazı;
  - çıplak ya da yarı çıplak beden;
  - alkol çağrışımı, ilaç;
  - hassas konularda tanınabilir yüz.
- Eski deneme fotoğrafları (49 dosya, CC0) silindi.

**Görüntüleyici** (`src/features/content/story/StoryViewer.tsx`)
- Her slayt tam ekran fotoğraf.
- Altta 0 → 0,78 karartma (%40 yükseklikten başlıyor), üstte 0,35'lik ince karartma. Yazı beyaz ve altta.
- Mit, quiz, biliyor muydun ve doktor slaytlarında yazı buzlu koyu kartın üstünde: `veil.card` = `rgba(15,18,20,0.72)`, bulanıklık 20, köşe 20. Bulanıklık için `expo-blur` paketi eklendi.
- "Hareketi azalt" kapalıyken fotoğraf slayt süresince yavaşça büyüyor (1 → 1,06).
- İlk 3 slaytın fotoğrafı açılışta, sonraki 2 slaytınki okurken önden yükleniyor.
- Fotoğrafı olmayan bir slayt koyu renk geçişi ve ikonla gösteriliyor.
- Açık ve koyu temada aynı görünüyor.

**Veri ve araçlar**
- Tek görsel kaydı `src/content/images.ts`. Her kayıtta görsel, blurhash, Türkçe açıklama, kırpma odağı ve gereken karartma var. Eski `src/content/explore/images.ts` kaldırıldı.
- Slaytlarda `image` ve `imageAlt` alanları var. Ekran okuyucu fotoğrafın açıklamasını okuyor.
- `assets/images/manifest.json` görsellerin tek kaynağı.
- İşleme betiği `scripts/images/fetch.mjs`:
  - yalnızca eksik ya da değişen fotoğrafı indiriyor;
  - kırpıyor ve renk ayarı yapıyor (doygunluk −%8, kontrast −%5, hafif sıcaklık);
  - WebP yazıyor, blurhash çıkarıyor;
  - her slaytın okunabilirliğini ölçüyor;
  - kaydı `src/content/images.ts` ile `assets/images/fetch-lock.json` dosyalarına yazıyor.
- İndirilen asıl fotoğraflar `.cache/images/` klasöründe tutuluyor; bu klasör depoda değil.

## Şartnameden ayrılan noktalar

1. **Yatay fotoğraflar** `h=1440` ile indirildi. Şartnamedeki `w=1440` ile 9:16 kırpım 720 px'ten dar kalıyordu.
2. **Karartmanın biçimi:** 0 → 0,78 değeri aynı, ama geçiş düz değil; alt kısımda daha erken koyulaşıyor. Okunabilirlik ölçümü de ekrandaki bu eğriyle yapılıyor.
3. **Okunabilirlik ölçütü:** alt %45'teki pikselleri 95. yüzdelik parlaklıkla değerlendiriyor. Kartlı slaytlarda yazı kartın üstünde ölçülüyor.
4. **Yumuşatma:** çok ince dokulu 3 fotoğraf en düşük kalitede bile 110 KB'ın altına inmedi. Bunlarda çok hafif bir yumuşatma (0,5–0,9 px) uygulanıyor.

## Tarife tam uymayan görseller

- **`program/pf101`:** matta köprü hareketi yapan uygun bir erkek fotoğrafı bulunamadı. Yerine matını açan bir adam kullanıldı.
- **`story/core-hips/7`:** yine köprü hareketi bulunamadı. Matta yerde egzersiz yapan bir adam kullanıldı; dikey kırpımda yalnızca kalça ve bacaklar görünüyor.
- **`glossary/streak`:** takvimde çarpı işaretleri olan bir fotoğraf bulunamadı. Yazıları küçük kırpımda okunmayan bir planlayıcı kullanıldı.

## Doğrulanmayanlar

- **Telefonda denenmedi.** `expo-blur` ve `expo-image` yerel modülleri için yeni bir geliştirme sürümü gerekiyor.
- **Android bulanıklığı.** `BlurTargetView` ve `dimezisBlurViewSdk31Plus` ile kuruldu, ama cihazda görülmedi. Bulanıklık çalışmasa bile kart rengi okunabilirliği sağlıyor.
- **Yavaş yakınlaşma.** Ekran görüntüleri "hareketi azalt" açıkken çekildi; yakınlaşma görüntülerde yok.

## Kontroller

- `tsc --noEmit`: temiz.
- ESLint: 0 hata.
- jest: 633/633.
  - Yeni dosya `__tests__/imagesV5.test.ts`.
  - `__tests__/explore.test.ts` yeni kayda göre güncellendi.
  - Kontrol edilenler:
    - manifest alanları;
    - her fotoğrafın CREDITS ve REVIEW kaydı;
    - aynı kaynak fotoğrafın iki kez kullanılmaması;
    - boyut sınırları;
    - her slaytın okunabilirliği;
    - her slaytta geçerli görsel kimliği;
    - kullanılmayan ya da eksik dosya olmaması;
    - eski görsellerin silinmiş olması.
