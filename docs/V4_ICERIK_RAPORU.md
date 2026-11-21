# V4-1 — İçerik doğrulama raporu (20 Bilgi Hikâyesi)

Kaynak şartname: `SPEC_V4_HIKAYE_KAMP_GUNUM.md` §B.3–B.4 ve §9 (V4-1). Hikâyelerin ekran görüntüleri yerelde `screenshots/v4/2-hikayeler/`.

## Özet

- **Yeni biçim:** 20 hikâyenin hepsi yeni slayt biçiminde. Bu adımda 18'i yazıldı; `pf-basics` ve `performance-anxiety` V4-0'da yazılmıştı.
- **Yapı:** her hikâyede 7–8 slayt var. Sıra:
  - kapak;
  - 2–3 bilgi slaytı;
  - mit ya da "biliyor muydun";
  - kısa soru;
  - bugün dene;
  - gerekiyorsa doktor slaytı;
  - özet.
- **Metin sınırları:**
  - Bilgi slaytları 20–34 kelime (sınır 45).
  - Okuma süresi 2–3 dakika; kartlarda "2 dk" ya da "3 dk".
- **Kaynaklar:** her hikâyede en az 2 kaynak var (çoğunda 3–4). Hepsi `reviewed: false`; hekim incelemesi bekliyor.
- **Doktor slaytı:** zorunlu 7 hikâyenin hepsinde var: 1, 3, 4, 6, 13, 19, 20.
- **Yasaklı sözler:** "garanti", "kesin çözüm" ve "mucize" hiçbir hikâyede geçmiyor; bunu test de denetliyor.
- **Görseller:** Alkol ve sigara hikâyelerinde şişe, kadeh, sigara ya da duman görseli yok. Kapaklar Keşfet v2 görselleri.
- **Başlık değişikliği:** yalnızca `bladder-control` hikâyesi "Mesane kontrolü üzerine" yerine **"Mesane kontrolü"** oldu (şartname tablosundaki başlık). Diğer 19 başlık aynı kaldı.

## Doğrulama yöntemi

- **Bilgiler:** Her hikâyenin ana bilgileri web aramasıyla, kaynağın kendi sayfası ya da özeti üzerinden kontrol edildi.
- **Bağlantılar:** Bağlantılar komut satırından açılmaya çalışıldı.
  - Yanıt 200 verenler: NHS, WHO, APA, AASM, NCCIH, ISSM, SMSNA, EAU, Oxford Health, Kent, North Bristol, Cambridge, UChicago, AUA kılavuz sayfası.
  - Otomatik istekleri engelleyenler: Mayo Clinic (403), PubMed (bot kontrolü), doi.org ve Gloucestershire NHS PDF (403). Bunların adresi ve künyesi arama sonuçlarıyla doğrulandı. Tarayıcıda açılmaları beklenir, ama tek tek açarak denemedim.
- **Kaldırılan arama bağlantıları:** Eski içerikteki "PubMed (search)" arama bağlantılarının hepsi, tekil makale ya da kılavuz bağlantılarıyla değiştirildi.

## Şartname tablosundan sapmalar ve düzeltmeler

1. **Damar dostu tabak — yanlış atıf.**
   - Şartname: "Akdeniz tipi beslenme … Esposito ve ark. 2004 (JAMA)".
   - Gerçekte bu JAMA çalışması Akdeniz diyetini değil, **kilo verme ve hareketi** inceliyor: 110 obez erkek; katılımcıların yaklaşık üçte birinde düzelme.
   - Akdeniz diyeti için doğru kaynak **Esposito ve ark. 2006, Int J Impot Res 18**: metabolik sendromlu 65 erkek, 2 yıl takip.
   - Hikâyede ikisi de doğru içerikle ve ayrı ayrı anlatıldı.
2. **Erkeklerde pelvik taban (V4-0) — atıf düzeltmesi.**
   - Şartname: "Dorey 2004/2005 (BJU Int)".
   - 2004 çalışması *Urologic Nursing* 24(6)'da yayımlandı; *BJU International* makalesi 2005 tarihli.
3. **Sertleşme ve damar sağlığı — süre ifadesi.**
   - AUA, sertleşme sorununun kalp-damar hastalığı için bir **risk işareti** olabileceğini belirtiyor.
   - "Kaç yıl önce" konusunda kaynaklar farklı rakamlar veriyor:
     - AUA basın bülteni: "5 yıla kadar".
     - AHA (basında aktarılan): 1–3 yıl.
     - UChicago: 3–5 yıl.
   - Bu yüzden metin "bazı araştırmalarda … birkaç yıl önce" diye yumuşatıldı.
   - AUA basın bülteninin bağlantısı artık çalışmıyor (404); yerine AUA'nın kılavuz sayfası kondu.
4. **Uyku ve hormonlar — çalışmanın boyutu.**
   - Leproult ve Van Cauter 2011 (JAMA): bir hafta gecede yaklaşık 5 saat uyku → gündüz testosteronu %10–15 düşüş.
   - Yazarlar bunu küçük bir örneklem diye tanımlıyor ve tekrarlanmış bir çalışma bulunamadı. Metinde "küçük bir çalışma" ve "tek ve küçük bir çalışma" diye açıkça belirtildi.
   - Basın bültenindeki "10–15 yıl yaşlanmaya eşdeğer" benzetmesi kullanılmadı.
5. **Gece tuvalete kalkmak — kaynak sınırı.**
   - Doğrulananlar:
     - ICS tanımı: ana uyku döneminde idrar için uyanmak.
     - Klinik eşik: "2 ve üzeri".
     - İlk adımın akşam sıvısını azaltmak olduğu (EAU ve Oxford Health NHS).
   - "Bacakları yükseltme" ve "uyku apnesiyle ilişki" bilgileri yalnızca ikincil kaynaklarda (uzman görüşü) bulundu. Metinde "işe yarayabilir" ve "ilişkili olabilir" diye yumuşak tutuldu; uyku apnesi doktor maddesi olarak da eklendi.
6. **Kalça ve gövde — kanıtın kapsamı.**
   - Pelvik taban ile derin karın kaslarının birlikte çalıştığını gösteren çalışmalar küçük, ve ağırlıklı olarak kadınlarla yapılmış:
     - Sapsford 2001;
     - Neumann ve Gill 2002 (4 kişi).
   - Metin "araştırmalar … gösteriyor" düzeyinde, genel tutuldu. Şartnamedeki "ACSM" kaynağı için uygun bir sayfa bulunamadı; yerine bir NHS hastanesinin erkekler için hazırladığı pelvik taban sayfası, Neumann ve Gill 2002 ve WHO kondu.
7. **Bisiklet — mit cevabı.**
   - Awad ve ark. 2018 (J Urol): bisiklet sürenlerin sertleşme işlevi sürmeyenlerden kötü değil.
   - Aynı çalışmada:
     - sürüşün %20'sinden fazlasında ayakta pedal çevirmek uyuşmayı azaltıyor;
     - gidonun seleden alçak olması uyuşmayı artırıyor.
   - Quiz bu bulgulara dayanıyor. "Uygun sele (ortası oyuk ya da geniş)" önerisi hasta bilgilendirme kaynağından (SMSNA) geliyor.
8. **Sigara — iyileşmenin ölçüsü.**
   - Pourmand 2004 (BJU Int): bırakanların yaklaşık dörtte birinde bir yıl sonra sertleşme en az bir derece iyileşti.
   - İyileşme ileri yaşta ve ağır sorunda daha az görülüyor. Bu bilgi mit kartına "gençken ve sorun hafifken daha çok fark yaratır" diye eklendi.
   - Şartnamedeki "CDC" kaynağına uygun bir CDC sayfası bulunamadı; WHO tütün sayfası, NHS ve Pourmand 2004 kullanıldı.
9. **Endişe zamanı — süre.**
   - NHS kaynakları 10 ile 30 dakika arasında farklı süreler veriyor; en sık geçen 15 dakika.
   - Hikâyede 15 dakika yazıldı. Şartnamedeki "Borkovec ve ark." bilgisi kaynak listesine eklenmedi; NHS sayfaları yeterli.
10. **Partnerinle konuşmak ve yakınlık — kaynak değişikliği.**
    - "NHS cinsel sağlık ve ilişki sayfaları" yerine konuyu doğrudan anlatan sayfalar kullanıldı:
      - ISSM'nin partnerlerle ilgili soru-cevap sayfası;
      - performans kaygısı sayfası;
      - SMSNA'nın duyulara odaklanma sayfası.
    - Duyulara odaklanma yönteminin bilgileri SMSNA ve ilgili kaynaklarla doğrulandı: Masters ve Johnson, beklenti kaygısını azaltmak için geliştirdi; ilk aşamalarda cinsel bölgelere dokunulmuyor.

## "Bugün dene" düğmeleri

Şartnameye göre düğme yalnızca uygulamada var olan bir ekrana gidiyor; ekran yoksa slaytta yalnızca metin kalıyor. Bütün rotalar testle denetleniyor.

| # | Hikâye | Düğme |
|---|---|---|
| 1 | Erkeklerde pelvik taban | Kası bul eğitimi → `/tutorial` |
| 2 | 5 Kegel hatası | Bugünkü antrenman → `/` (Günüm) |
| 6 | Performans kaygısı | Nefes egzersizi → `/mind/breathing` |
| 10 | Alkol ve performans | Alkolsüz Kamp → `/campus/alcohol` |
| 12 | Akşam rutini | Zihin boşaltma → `/mind/unload` |
| 14 | Stres bedende | Beden taraması → `/mind/body-scan` |
| 16 | Farkındalık | Nefes egzersizi → `/mind/breathing` |
| 17 | Daha çok hareket | Kasık Fitness Başlangıç → `/fitness/beginner` |
| 18 | Kalça ve gövde | Kasık Fitness → `/fitness/beginner` |
| 20 | Sigara | Sigarasız Kamp → `/camp` |

**Düğmesiz, yalnızca metin olanlar (10):** sertleşme (yürüyüş planı), mesane (ani istek tekniği), partner (açılış cümlesi), yakınlık (telefonsuz 20 dk), su (hatırlatıcı), tabak (bir öğün), uyku ve hormonlar (yatış saati), gece tuvalet (akşam sıvısı), endişe zamanı, bisiklet.

- **Neden düğme yok:** Uygulamada su, yürüyüş, yatış saati ya da akşam sıvısı hatırlatıcısı bulunmuyor; hatırlatıcılar yalnızca antrenman için. Not alanı da yok.
- **Karar senin:** Bu hatırlatıcılar ileride eklenirse ilgili hikâyelere düğme konabilir.
- **Ekranlar değişince:** "Bugünkü antrenman" düğmesi şimdilik Bugün ekranına (`/`) gidiyor; V4-4'te bu ekran Günüm olacak. Nefes düğmeleri de C.4'teki yeni nefes modülü gelince otomatik olarak onu açacak (`/mind/breathing` aynı kalıyor).

## Hikâye hikâye kaynaklar

| # | id · Başlık | Slayt | Kaynaklar |
|---|---|---|---|
| 1 | `pf-basics` · Erkeklerde pelvik taban | 8 | Mayo Clinic (Kegel, erkekler); Cambridge University Hospitals NHS (SSS); Dorey 2004 Urol Nurs; Dorey 2005 BJU Int |
| 2 | `kegel-mistakes` · En sık yapılan 5 Kegel hatası | 8 | Mayo Clinic; North Bristol NHS (erkekler için pelvik taban); Cambridge University Hospitals NHS |
| 3 | `erection-blood` · Sertleşme ve damar sağlığı | 8 | AUA ED kılavuzu; NHS (sertleşme sorunları); UChicago Medicine; Mayo Clinic (ED) |
| 4 | `bladder-control` · Mesane kontrolü | 8 | NHS (idrar kaçırma); Kent Community Health NHS (ani istek teknikleri); Cambridge University Hospitals NHS |
| 5 | `talk-partner` · Partnerinle konuşmak | 8 | ISSM (partnerler); ISSM (performans kaygısı); NHS (ED) |
| 6 | `performance-anxiety` · Performans kaygısı | 8 | NHS (ED); ISSM (performans kaygısı) |
| 7 | `intimacy-beyond` · Yakınlık sadece cinsellik değil | 8 | SMSNA (duyulara odaklanma); ISSM (partnerler); WHO (cinsel sağlık) |
| 8 | `water` · Su ve mesane | 8 | NHS (su ve içecekler); NHS (idrar kaçırma); Gloucestershire NHS (sıvı ve kafein) |
| 9 | `plate` · Damar dostu tabak | 7 | WHO (sağlıklı beslenme); Esposito 2006 Int J Impot Res; Esposito 2004 JAMA |
| 10 | `alcohol` · Alkol ve performans | 7 | NHS (ED); NHS (alkol önerileri); WHO (alkol) |
| 11 | `sleep-hormones` · Uyku ve hormonlar | 7 | Leproult ve Van Cauter 2011 JAMA; AASM/SRS 2015; NHS (uykuya dalmak) |
| 12 | `sleep-routine` · Daha iyi uyku için akşam rutini | 8 | NHS (uykuya dalmak); AASM/SRS 2015 |
| 13 | `night-bathroom` · Gece tuvalete kalkmak | 8 | EAU hasta bilgisi (noktüri); Oxford Health NHS (noktüri); NHS (idrar kaçırma) |
| 14 | `stress-body` · Stres bedende nasıl hissedilir? | 8 | APA (stresin bedene etkileri); NHS (stresi azaltma) |
| 15 | `worry-time` · Endişe zamanı tekniği | 8 | NHS Every Mind Matters; Oxford Health NHS (endişe zamanı); NHS (stres) |
| 16 | `mindfulness` · Farkındalık nedir? | 8 | NHS (farkındalık); NCCIH |
| 17 | `move-more` · Daha çok hareket | 8 | WHO 2020 kılavuzu; WHO (fiziksel aktivite); Esposito 2004 JAMA |
| 18 | `core-hips` · Kalça ve gövde neden önemli? | 8 | North Bristol NHS; Neumann ve Gill 2002 Int Urogynecol J; WHO |
| 19 | `cycling` · Bisiklet ve pelvik bölge | 8 | SMSNA (bisiklet ve ED); Awad 2018 J Urol |
| 20 | `smoking` · Sigara ve cinsel sağlık | 8 | WHO (tütün); NHS (sigarayı bırakma); Pourmand 2004 BJU Int; NHS (ED) |

## Hekim incelemesi için işaretlediğim yerler

- **`pf-basics`:** "Sertleşme sırasında penis köküne baskı yaparak sertliğin korunmasına … katkı verir." Bilerek yumuşak tutulmuş bir fizyoloji ifadesi.
- **`stress-body`:** "Sürekli gergin bir pelvik taban ağrıya, tuvalette ya da cinsel işlevde zorluklara katkıda bulunabilir." Genel bir klinik bilgi; tekil bir kaynağı yok.
- **`alcohol`:** "Hormon dengesini etkileyebilir." Genel ifade.
- **`kegel-mistakes`:** "Sıkarken nefes vermeye, gevşerken nefes almaya odaklan." Yaygın bir egzersiz yönergesi; kaynaklar bu konuda yalnızca "nefesini tutma" diyor.
- **`move-more`:** "Kasık Fitness başlangıç rutini yaklaşık 7 dakika sürer." Rutinin içeriğinden hesaplandı: 8 adım × 50 saniye.
