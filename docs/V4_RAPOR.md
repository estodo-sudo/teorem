# V4 raporu — Hikâyeler, kamp ana sayfaları, kriz anı araçları, sekme düzeni

Kaynak şartname: `SPEC_V4_HIKAYE_KAMP_GUNUM.md`. Adımlar V4-0 … V4-5 sırayla yapıldı ve her adımda onay alındı.

- **Ekran görüntüleri:** yerelde `screenshots/v4/` (INDEX.md ile), boyutları nedeniyle depoda değil.
- **İçerik doğrulama raporu:** `docs/V4_ICERIK_RAPORU.md`.

## Ne değişti

**0 — Bulunan sorunlar**
- **Hikâyede ikon adı yazı olarak çıkıyordu.** Ortak hikâye oynatıcısı düzeltildi; kurslar ve kamp dersleri de bu oynatıcıyı kullandığı için hepsinde düzeldi.
- **Uygulama adı:** `[UYGULAMA_ADI]` yerine geçici olarak "Uygulama" (`src/config/app.ts`).
- **Diğer sorunlar** (ibre, tetikleyici haritası, kamp ana sayfaları) aşağıdaki bölümlerde.

**A — Sekmeler**
- Dört sekme: Günüm · İlerleme · Keşfet · Profil. `/training` Günüm'e yönleniyor.
- **Günüm:**
  - Günün antrenmanı (Mikro set ve Nefes düğmeleri ikonlu).
  - Bu hafta: Pazartesi–Pazar şeridi ve "Tüm planı gör".
  - İşlevsel görevler.
  - Bugün listesi.
  - Kasık Fitness: rozet ismin yanında.
  - Rahatla: Nefes · Zihin boşaltma · Beden taraması.
  - Senin için.
- **Profil → Antrenman:**
  - Aktif iz kartı.
  - "Kas yapını öğrenelim": "Daha sonra" yok.
  - Egzersiz rehberi: 8 hareket.
  - Eğitimi tekrar izle · Kupalarım · Antrenman ayarları.

**B — Bilgi Hikâyeleri v2**
- **Görüntüleyici:** 8 slayt tipi var: kapak, bilgi, mit kartı, biliyor muydun, quiz, bugün dene, doktor, özet.
  - Dokunarak ileri ve geri gidiliyor, basılı tutunca duruyor, aşağı kaydırınca kapanıyor, son slaytta sola kaydırınca sıradaki hikâye açılıyor.
  - Otomatik ilerleme okuma süresine göre. "Hareketi azalt" ya da ekran okuyucu açıkken kapalı.
  - Kaldığı slayt hatırlanıyor.
- **İçerik:** 20 hikâyenin hepsi 7–8 slayt.
  - Bilgi slaytları en fazla 34 kelime.
  - Her hikâyede en az 2 doğrulanmış kaynak var; hepsi `reviewed: false`.
  - Doktor slaytı zorunlu 7 hikâyenin hepsinde var.
  - 10 hikâyede "Bugün dene" düğmesi uygulamadaki bir ekrana gidiyor, 10 hikâyede yalnızca metin var.
- **Keşfet:**
  - Kartlarda okundu (✓), yarım kaldı (ince ilerleme çizgisi) ve kaydedildi (yer imi) durumları görünüyor.
  - Sıra: yarım kalanlar → okunmamışlar → okunanlar.
  - Günün hikâyesi: yarım kalan bir hikâye varsa önce o, "Kaldığın yerden: 4/7" ve "3 dk · 8 slayt" bilgisiyle.

**C — Sigarasız Kamp**
- **İbre (`UrgeGauge`):** yarım daire, 10 parça, ibre, büyük rakam ve sözle karşılığı. Seçmek için:
  - yay üzerinde sürüklemek ya da dokunmak;
  - 10 numaralı yuvarlaktan birine basmak;
  - ekran okuyucuyla yukarı / aşağı kaydırmak.

  Sonda ilk değerle karşılaştırılıyor. Değer seçmeden de başlanabiliyor.
- **Tetikleyiciler:**
  - "Canım çekiyor" ekranında katalogdaki tetikleyicilerin hepsi görünüyor; en sık yaşananlar önde, birden fazlası seçilebiliyor, "Diğer" seçeneği var.
  - Tetikleyici haritası 3 bölümden oluşuyor; "Kendi durumunu ekle" yalnızca katalog dışındaki durumlar için.
- **Araç seti:**
  - Kaldırılanlar: dalga sörfü, eşleştirme oyunu, 4E ve koç (ekranı, içeriği ve motoru dahil).
  - Yeni sıra: Nefes · Blok Bulmaca · 10 dakika ertele (başka araç açıkken üstte çip olarak sürüyor) · Nedenlerim.
- **Nefes modülü** (`src/features/breath/`):
  - Hızlı sakinleş, Yavaş nefes ve Kutu nefesi modları.
  - Küre ve aşama halkası.
  - Titreşimle takip, "Ekranı karart".
  - Son seçimin hatırlanması, güvenlik notu ve kaynaklar.
- **Blok Bulmaca** (`src/features/games/BlockPuzzle/`):
  - 8×8 tahta; sürükle-bırak ya da "parçaya, sonra hücreye dokun".
  - 3 dakikalık halka sayaç.
  - Hamle kalmayınca tahtanın yarısı temizleniyor; "kaybettin" ekranı yok.
- **Ana sayfa:** 5 katman, ekranda tek dolu düğme. 13 düğmelik liste kalktı.
  - Faz çizelgesi İstatistik'e taşındı.
  - "Kayma oldu" Günlük'e taşındı.
  - "Bırakma planım" Ayarlar'a taşındı.

**D — Odak Kampı**
- **Ana sayfa:** aynı 5 katman, Odak tonunda; sağ üstteki kilit ikonu kilidin durumunu gösteriyor.
- **Dürtü anı:**
  - DAYY satırları bütünüyle seçilebiliyor.
  - Yoğunluk ibreyle soruluyor.
  - Nefes (varsayılan) ve Blok Bulmaca eklendi; sörf ve koç çıktı.
  - Sonda karşılaştırmalı ibre geliyor.
- **Dürtü kaydı:** ibre; bütün durum seçenekleri; "Birini seç" ipucu.
- **Koç:** Odak koçu ve iki koçun ortak motoru silindi.

## Veri ve uyumluluk

- **Eski kayıtlar:** Kaldırılan araçlar eski kayıtlarda silinmedi; istatistiklerde "Diğer araçlar" olarak görünüyor.
- **Yeni veri tabanı sürümü (v4):** `camp_cravings` tablosuna isteğe bağlı `extra` sütunu eklendi. Birden fazla tetikleyici ve "Diğer" metni burada tutuluyor. İlk tetikleyici eskisi gibi `trig` sütununda.
- **Atlanan yoğunluk:** 0 olarak kaydediliyor ve ortalamalara katılmıyor. Bu kural iki kampta da aynı.
- **Hikâyede kalınan yer:** `storyPositions` alanı isteğe bağlı; eski kayıtlar ve yedekler bozulmuyor.
- **Özel durum planları:** Sigara planlarına `trigger: 'custom'` türü eklendi.

## Açık kararlar

1. **Planların yeri.** Odak'ın "Eğer–o zaman" planları ana sayfadan kalktı ve şu an onları gösteren bir ekran yok. Öneri: Sınırlarım ekranına bir bölüm eklemek.
2. **"Ekranı karart".** Ekran parlaklığını gerçekten düşürmek için `expo-brightness` paketi gerekiyor. Şimdilik siyah zemin ve soluk küre kullanılıyor.
3. **Hatırlatıcılar.** Su, yürüyüş, yatış saati ya da akşam sıvısı hatırlatıcısı yok. Bu yüzden 10 hikâyenin "Bugün dene" adımı düğmesiz.
4. **Uygulama adı.** "Uygulama" telefonun ana ekranında da görünecek; gerçek ad gelince yalnızca `APP_NAME` değişecek.
5. **Kas profili özeti.** Kas profilinde güç ve gevşeme ölçümü yok. "Kas yapını öğrenelim" özeti şu an iz ve gevşeme önceliğinden kuruluyor.
6. **Hekim incelemesi.** Bütün hikâye içeriği `reviewed: false`. İçerik raporunda işaretli 5 cümle var.

## Doğrulanmayanlar

- **Telefonda denenmedi.** Yeni bir geliştirme sürümü gerekiyor (`expo-image` yerel modülü V3'te eklendi).
- **Web'de görülemeyenler.** Titreşim, ekran kararması ve keep-awake davranışı web önizlemesinde görülemiyor.
- **"Büyük yazı" ayarı.** Ekranlar bu ayarla ayrıca denenmedi. Metinler `numberOfLines` ile kesilmiyor, ama düzen telefonda kontrol edilmeli.

## Kontroller

- `tsc --noEmit`: temiz.
- ESLint: 0 hata.
- jest: 597/597 (51 dosya). Şartnamenin "Yeni testler" listesindeki maddelerin hepsi var:
  - `__tests__/storiesV2.test.ts`
  - `__tests__/urgeGauge.test.tsx`
  - `__tests__/v4sos.test.ts`
  - `__tests__/v4odak.test.ts`
  - `__tests__/v4tabs.test.ts`
