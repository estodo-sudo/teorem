"""Generates src/content/camp/missions.tr.json — Sigarasız Kamp daily missions (K7).

Original Turkish text, reviewed=false. Each mission is tagged with Behaviour Change Technique
Taxonomy v1 codes (Michie et al., 2013) so the content can be audited.

`day` meaning per phase:
- preparation: days BEFORE the quit day (1 = the eve). Preparation lasts 3–14 days (cut-down: up to
  28), so the essential missions sit closest to the quit day and longer preparations start earlier.
- quit_day: 0 · critical_week: 1–7 · strengthening: 8–30 · maintenance: 31–90 (2–3 a week)
- freedom: monthly after day 90.
BCT codes used: 1.1 goal setting (behaviour) · 1.2 problem solving · 1.4 action planning · 1.9 commitment ·
2.3 self-monitoring of behaviour · 2.4 self-monitoring of outcome · 3.1 social support (unspecified) ·
3.2 social support (practical) · 3.3 social support (emotional) · 4.1 instruction on how to perform ·
4.2 information about antecedents · 5.1 information about health consequences · 5.6 information about
emotional consequences · 7.1 prompts/cues · 8.2 behaviour substitution · 8.7 graded tasks ·
9.2 pros and cons · 10.3 non-specific reward · 10.9 self-reward · 11.2 reduce negative emotions ·
12.1 restructuring the physical environment · 12.3 avoidance/reducing exposure to cues ·
13.2 framing/reframing · 13.5 identity associated with changed behaviour · 15.1 verbal persuasion
about capability · 15.3 focus on past success.
"""
import json, os

A, R, L, S = 'action', 'reflection', 'learning', 'social'

PREP = [
 # day before quit, type, minutes, bct, title, body
 (1, A, 10, ['1.4', '12.1', '7.1'], "Bırakma günü öncesi son kontrol", "Yarın bırakma günün. Evde, arabada ve çantanda kalan sigara, çakmak ve küllükleri topla ve at. Acil durum kutun hazır mı, kontrol et. Bu gece erken yat; yarın dinç başlamak işini kolaylaştırır."),
 (2, A, 10, ['12.1', '8.2'], "Acil durum kutunu hazırla", "Zor anlar için küçük bir kutu hazırla: şekersiz sakız, su şişesi, stres topu ya da kalem, sevdiğin bir atıştırmalık (meyve, kuruyemiş). Kutuyu en çok sigara içtiğin yere koy."),
 (3, A, 15, ['12.1', '12.3'], "Sigara izlerini temizle", "Arabanı, montunu ve sigara içtiğin köşeyi temizle; kokuyu ve hatırlatıcıları azalt. Küllükleri şimdiden kaldırabilirsin; son günlerde sigarayı sadece dışarıda iç."),
 (4, S, 5, ['3.1', '1.9'], "Bırakacağını birine söyle", "Güvendiğin bir kişiye bırakma gününü söyle ve zor anlarda ona yazabileceğini belirt. İstersen uygulamadaki hazır mesajı kullan. Söylemek, kararını güçlendirir."),
 (5, A, 10, ['1.4', '4.2'], "En riskli 3 anın için plan yap", "Tetikleyici haritana git ve en sık sigara içtiğin üç durum için Eğer–O zaman planın olduğundan emin ol. Planı yüksek sesle bir kez oku."),
 (6, S, 5, ['3.2'], "Profesyonel destek seçeneğini öğren", "ALO 171'i arayarak sigara bırakma polikliniği randevusu ve ücretsiz destek seçeneklerini öğrenebilirsin. Aramasan bile numarayı rehberine kaydet."),
 (7, A, 2, ['2.3'], "Her sigarayı kaydet", "Bugün içtiğin her sigarayı günlüğe kaydet ve yanına neden içtiğini seç. Bu kayıtlar sana en zor saatlerini ve durumlarını gösterecek."),
 (8, R, 5, ['9.2', '1.1'], "Nedenlerini yeniden yaz", "Bırakmak istemenin en önemli üç nedenini kendi cümlelerinle yaz. Zor anlarda bu cümleleri sana hatırlatacağız."),
 (9, A, 5, ['8.7', '2.3'], "İlk sigarayı 15 dakika ertele", "Bugün sabahki ilk sigaranı 15 dakika geciktir. Bu sürede su iç ya da duş al. Erteleyebildiğini görmek, bırakma günü için güven verir."),
 (10, L, 3, ['4.1', '11.2'], "Dalga sörfünü dene", "Bir sonraki sigara isteğinde \"Canım çekiyor\" aracını aç ve dalga sörfünü dene. İsteği yok etmeye çalışma; yükselip alçalmasını izle."),
 (11, A, 5, ['12.3', '12.1'], "Dumansız alanlar belirle", "Evini ve arabanı bugünden itibaren dumansız alan ilan et. Sigara içmek istediğinde dışarı çıkman gerekecek; bu küçük zorluk otomatik sigaraları azaltır."),
 (12, R, 5, ['2.3', '4.2'], "Otomatik pilot sigaralarını bul", "Günlüğüne bak: \"pek ihtiyaç duymadan\" içtiğin sigaralar hangileri? Bugün bunlardan birini içmeden geçirmeyi dene."),
 (13, A, 5, ['10.9', '1.1'], "Kendine bir ödül hedefi koy", "Biriktireceğin parayla almak istediğin bir şey seç. Tasarruf sayacın bırakma gününden itibaren onu biriktirmeye başlayacak."),
 (14, L, 3, ['5.6', '4.2'], "Yoksunluğu tanı", "İlk günlerde huzursuzluk, sinirlilik ya da uykusuzluk olabilir. Bunlar geçicidir ve vücudunun iyileştiğinin işaretidir. Ne bekleyeceğini bilmek seni hazırlıklı kılar."),
 (15, A, 5, ['8.7', '2.3'], "Bugün bir sigara eksik iç", "Azaltma planındaysan günlük hedefinin bir altında kal. Hangi sigarayı bırakacağını sabahtan seç; tercihen bir otomatik pilot sigarası olsun."),
 (16, A, 5, ['8.2'], "Kahve rutinini değiştir", "Kahve ya da çayını her zamankinden farklı bir yerde, farklı bir bardakla iç. Sigara ile kurulan bağı gevşetmek için küçük bir değişiklik bile işe yarar."),
 (17, R, 5, ['9.2'], "Sigaranın sana maliyetini hesapla", "Bir haftalık, bir aylık ve bir yıllık harcamanı düşün. Bu parayla neler yapabileceğini bir kenara yaz."),
 (18, A, 5, ['8.7'], "İki sigara arasını uzat", "Bugün iki sigara arasındaki süreyi 30 dakika uzatmayı dene. Beklerken bir bardak su iç ya da kısa bir yürüyüş yap."),
 (19, S, 5, ['3.1'], "Bir destekçi daha bul", "Sigarayı bırakmış bir tanıdığın var mı? Ona en çok neyin işine yaradığını sor."),
 (20, A, 5, ['12.3'], "Sigara satın alma alışkanlığını değiştir", "Karton ya da çift paket almayı bırak; her seferinde tek paket al. Sigaraya ulaşmak zorlaştıkça otomatik içmek azalır."),
 (21, L, 3, ['5.1'], "Bıraktıktan sonra neler olur?", "Sağlık iyileşme zaman çizelgesine göz at: bıraktıktan 20 dakika sonra bile vücudunda olumlu değişiklikler başlar."),
 (22, A, 5, ['8.2', '12.3'], "Yemekten sonra masadan kalk", "Bugün her yemekten sonra hemen masadan kalk ve dişlerini fırçala ya da beş dakika yürü. Yemek sonrası sigara bağını zayıflat."),
 (23, R, 5, ['15.3'], "Daha önce başardıklarını hatırla", "Hayatında zor bir alışkanlığı değiştirdiğin bir zamanı düşün. Bunu nasıl başardın? Aynı gücü şimdi de kullanabilirsin."),
 (24, A, 5, ['8.7', '2.3'], "Günlük hedefini kontrol et", "Azaltma planındaki bu haftanın hedefine bak. Bugün hedefinin altında kalabildin mi? Kalabildiysen bunu kendine söyle."),
 (25, A, 3, ['7.1'], "Hatırlatıcı koy", "Telefonunun kilit ekranına ya da cüzdanına bırakma nedenini hatırlatan küçük bir not koy."),
 (26, L, 3, ['13.2'], "\"Bir tane bir şey olmaz\" düşüncesini tanı", "Bu düşünce çoğu kişiyi yeniden başlatan cümledir. Duyduğunda onu sadece bir düşünce olarak fark et; ona uymak zorunda değilsin."),
 (27, A, 5, ['1.1', '1.9'], "Bırakma gününü işaretle", "Takviminde bırakma gününü işaretle ve o güne kadar kalan günleri say. Tarihi değiştirmek gerekirse kamp ayarlarından yapabilirsin."),
 (28, R, 5, ['9.2'], "Bırakmanın artıları ve zorlukları", "Bir kâğıda iki sütun aç: bırakmanın sana kazandıracakları ve seni zorlayacak şeyler. Zorlukların her biri için küçük bir çözüm yaz."),
]

QUIT = [
 (0, A, 5, ['1.9', '1.4', '12.1'], "Bugün bırakma günün", "Bugün tek nefes bile yok kuralı başlıyor. Bırakma Günü ekranındaki kontrol listesini tamamla, acil durum kutunu yanında tut ve zorlandığında \"Canım çekiyor\" butonunu kullan."),
]

CRITICAL = [
 (1, A, 5, ['8.2', '12.3'], "Sabah rutinini değiştir", "Uyanınca ilk iş bir bardak su iç ve duş al. Sabah sigarasının yerini yeni bir alışkanlık alsın."),
 (2, L, 3, ['5.6', '11.2'], "Zirve günlerini tanı", "Yoksunluk belirtileri genellikle ilk üç günde en yoğundur. Bugün zor geçebilir; bu, vücudunun nikotinsiz yaşamaya alıştığının işaretidir."),
 (3, A, 5, ['8.2'], "Kahveni farklı bir yerde iç", "Bugün kahve ya da çayını her zaman sigara içtiğin yerden uzakta iç. Küçük bir yer değişikliği güçlü bir tetikleyiciyi zayıflatır."),
 (4, A, 5, ['8.2', '12.3'], "Yemekten sonra 5 dakika yürü", "Yemek biter bitmez masadan kalk ve beş dakika yürü ya da dişlerini fırçala."),
 (5, A, 3, ['10.9'], "Tasarrufunla kendine küçük bir ödül seç", "Şimdiye kadar biriktirdiğin parayla kendine küçük bir şey al ya da bir ödül planla. Emeğini fark etmek önemli."),
 (6, S, 5, ['3.3'], "Destekçine haber ver", "Destekçine kaç gündür dumansız olduğunu yaz. Paylaşmak hem seni hem onu motive eder."),
 (7, R, 5, ['2.4', '15.3'], "İlk haftanı değerlendir", "İlk haftayı tamamladın. En zor an neydi, seni ne geçirdi? Bunu bir cümleyle yaz; bir sonraki zor anda bu cümle işine yarayacak."),
]

STRENGTH = [
 (8, L, 3, ['13.5'], "Kendini nasıl tanımlıyorsun?", "\"Sigarayı bırakmaya çalışıyorum\" yerine \"Ben sigara içmeyen biriyim\" demeyi dene. Kimliğin değiştikçe istek de zayıflar."),
 (9, A, 5, ['1.4', '4.2'], "Yeni bir risk anına plan yap", "Bu hafta karşılaşacağın yeni bir zor durumu düşün (bir davet, yoğun bir iş günü) ve onun için Eğer–O zaman planı ekle."),
 (10, A, 10, ['8.2'], "Hareket et", "Bugün en az 10 dakika tempolu yürü. Hareket, isteği ve gerginliği azaltır; nefesinin ne kadar rahatladığını da fark edebilirsin."),
 (11, R, 5, ['2.4'], "Değişimleri fark et", "Bıraktığından beri koku, tat alma ya da nefes alışında bir fark var mı? Fark ettiklerini bir yere not et."),
 (12, A, 3, ['11.2', '4.1'], "Nefes egzersizi yap", "Stresli bir anda kutu nefesi dene: 4 saniye al, 4 tut, 4 ver, 4 bekle. Günde bir kez pratik yapmak zor anda işini kolaylaştırır."),
 (13, S, 5, ['3.1'], "Sigara içen arkadaşlarına sınırını söyle", "Yakınında sigara içilmemesini rica etmekten çekinme. Kısa ve net bir cümle yeterli: \"Bıraktım, yanımda içmesen sevinirim.\""),
 (14, R, 5, ['15.3', '2.4'], "İki haftanı kutla", "İki hafta dumansızsın. Bu sürede atlattığın krizleri say ve kendine bunu söyle: \"Başarabiliyorum.\""),
 (15, L, 3, ['5.1'], "Kilo endişesiyle barış", "Bıraktıktan sonra iştah artabilir. Bu normaldir. Öğün atlamamak, su içmek ve hareket etmek yardımcı olur; şimdilik önceliğin dumansız kalmak."),
 (16, A, 5, ['8.2'], "Elini meşgul eden bir şey bul", "Sigara tutma alışkanlığının yerine elini meşgul edecek bir şey seç: bir kalem, bir halka, bir stres topu. Bugün onu yanında taşı."),
 (17, R, 5, ['13.2'], "Düşüncelerinle mesafe al", "Bugün aklına sigara düşüncesi geldiğinde \"Şu an sigara içmeyi düşündüğümü fark ediyorum\" de. Düşünceyi fark etmek ona uymak zorunda olmadığını hatırlatır."),
 (18, A, 5, ['12.3', '1.4'], "Alkollü ortamlara hazırlan", "Alkol, en güçlü tetikleyicilerden biridir. Bu hafta alkol olan bir ortama gireceksen planını önceden yap ya da ilk haftalarda bu ortamlardan kaçınmayı düşün."),
 (19, A, 3, ['10.3'], "Tasarruf hedefini güncelle", "Ödül kumbarana bak; hedefine ne kadar yaklaştın? Yeni bir hedef eklemek motivasyonunu taze tutar."),
 (20, L, 3, ['5.6'], "Ruh halindeki değişiklikler", "Bazı günler kendini daha gergin ya da üzgün hissedebilirsin. Bu genellikle geçicidir. Uzun süren ya da ağırlaşan bir durum olursa bir hekime danış."),
 (21, R, 5, ['2.4'], "Üç haftanın özeti", "Kontrol kayıtlarına bak: istek sayın ilk haftaya göre azaldı mı? Azaldıysa bu, beyninin yeniden öğrendiğinin işareti."),
 (22, A, 5, ['8.2', '11.2'], "Stres için yeni bir yol dene", "Sigara yerine stresle başa çıkmanın yeni bir yolunu dene: kısa bir yürüyüş, sevdiğin bir müzik, biriyle konuşmak."),
 (23, S, 5, ['3.3'], "Birine teşekkür et", "Bu süreçte sana destek olan birine teşekkür et. Destek almak da vermek de yolunu kolaylaştırır."),
 (24, A, 3, ['7.1'], "Hatırlatıcını yenile", "Kilit ekranındaki ya da cüzdanındaki hatırlatıcı notunu yenile. Yeni nedenlerin olabilir."),
 (25, L, 3, ['13.2'], "Kayma çöküş değildir", "Bir sigara içsen bile bu her şeyin bittiği anlamına gelmez. Kayma olursa ne yapacağını şimdiden bil: kaydet, ne olduğunu incele ve devam et."),
 (26, A, 10, ['8.2'], "Yeni bir hobiye vakit ayır", "Sigaraya ayırdığın zamanları yeni bir şeyle doldur: yürüyüş, el işi, kitap, müzik. Bugün buna 10 dakika ayır."),
 (27, R, 5, ['9.2'], "Kazandıklarını listele", "Bıraktığından beri kazandıklarını yaz: para, zaman, sağlık, özgürlük. Liste uzadıkça kararın güçlenir."),
 (28, A, 5, ['1.4'], "Bir sonraki ay için plan yap", "Önümüzdeki ay seni zorlayabilecek olayları düşün (tatil, bayram, sınav, düğün) ve her biri için bir plan yaz."),
 (29, S, 5, ['3.1'], "İlerlemeni paylaş", "Destekçine ya da ailene bir ayına yaklaştığını söyle. Kutlamayı birlikte planlayabilirsiniz."),
 (30, R, 5, ['15.3', '10.9'], "Bir ayını kutla", "Bir ay dumansızsın. Kendine biriktirdiğin parayla bir ödül ver ve bu ay seni en çok neyin taşıdığını düşün."),
]

MAINT = [
 (31, L, 3, ['13.5'], "Yeni kimliğin", "Artık sigara içmeyen birisin. Bu yeni kimliği güçlendirmek için bugün kendine böyle hitap et."),
 (33, A, 5, ['1.4', '12.3'], "Sigara içen biriyle buluşmadan önce", "Sigara içen bir arkadaşınla buluşacaksan planını önceden gözden geçir: ne içeceksin, nerede oturacaksın, teklif ederse ne diyeceksin?"),
 (35, A, 10, ['8.2'], "Nefesinin farkına var", "Bugün merdiven çık ya da tempolu yürü ve nefesini dinle. Bıraktığından beri farkı hissediyor musun?"),
 (38, L, 3, ['4.2'], "Gizli tetikleyiciler", "Haftalar geçtikçe istekler seyrekleşir ama beklenmedik anlarda gelebilir: bir koku, bir şarkı, eski bir mekân. Bunlar normaldir ve geçer."),
 (40, A, 5, ['1.4', '12.3'], "Alkol ortamında nasıl davranacaksın?", "Alkol olan bir ortamda nasıl davranacağını planla: içkini hangi elinde tutacaksın, sigara içilen yerden nasıl uzak duracaksın?"),
 (42, R, 5, ['2.4'], "Altı haftanın değerlendirmesi", "Altı hafta oldu. İstatistiklerine bak: hangi araçlar en çok işine yaradı? Onları kullanmaya devam et."),
 (45, A, 3, ['10.3'], "Tasarruf kumbaranı kontrol et", "Ödül hedeflerinden birine ulaştın mı? Ulaştıysan kutla; ulaşmadıysan ne kadar kaldığına bak."),
 (47, S, 5, ['3.1'], "Başkasına destek ol", "Bırakmayı düşünen birini tanıyor musun? Deneyimini paylaş; başkasına destek olmak senin kararını da güçlendirir."),
 (49, L, 3, ['13.2'], "Özlem düşüncesiyle başa çık", "\"Keşke bir tane içebilsem\" düşüncesi gelebilir. Bu bir özlemdir, bir talimat değil. Fark et, nedenlerini hatırla ve devam et."),
 (52, A, 5, ['11.2'], "Stres planını gözden geçir", "Son haftalarda seni en çok strese sokan şey neydi? Bu durumlar için en az bir başa çıkma yolun hazır mı?"),
 (54, R, 5, ['15.3'], "Atlattığın krizleri say", "Bugüne kadar kaç krizi sigara içmeden atlattın? Her biri, bir sonrakini kolaylaştıran bir deneyim."),
 (56, A, 5, ['1.4'], "Tatil ve özel günler için plan", "Yaklaşan bir tatil, bayram ya da kutlama var mı? Rutinin değiştiğinde eski alışkanlıklar uyanabilir; önceden plan yap."),
 (59, L, 3, ['5.1'], "Uzun vadeli kazanımlar", "Sağlık zaman çizelgende bir sonraki kazanıma ne kadar kaldığına bak. Her ay vücudun biraz daha iyileşiyor."),
 (61, A, 10, ['8.2'], "Yeni alışkanlığını güçlendir", "Sigaranın yerine koyduğun yeni alışkanlığa (yürüyüş, su, nefes) bugün de 10 dakika ayır."),
 (63, R, 5, ['9.2'], "İki ayın bilançosu", "İki ay dumansızsın. Kazandığın parayı, atlattığın krizleri ve sağlığındaki değişiklikleri düşün."),
 (66, S, 5, ['3.3'], "Destekçinle konuş", "Destekçine bu sürecin nasıl geçtiğini anlat ve hâlâ zorlandığın anlar varsa söyle."),
 (68, A, 5, ['12.3'], "Eski alışkanlık mekânlarını fark et", "Eskiden sigara içtiğin bir yere gittiğinde isteğin artabilir. Bu mekânlarda ne yapacağını önceden planla."),
 (70, L, 3, ['13.2'], "Kendine şefkat göster", "Zorlandığın günlerde kendine bir arkadaşına davranır gibi davran. Mükemmel olmak zorunda değilsin; devam etmek yeterli."),
 (73, A, 5, ['1.4'], "Yeniden başlamayı önleme planı", "Eğer bir gün bir sigara içersen ne yapacaksın? Planını şimdi yaz: kaydet, nedenini incele, programa devam et."),
 (75, R, 5, ['2.4'], "Değişimini fotoğrafla", "Bugün kendinle ilgili bir şeyi not et ya da fotoğrafla: daha rahat nefes, daha iyi uyku, daha fazla para. Bu, gelecekteki sana bir hatırlatma olsun."),
 (77, A, 3, ['10.9'], "Kendine teşekkür et", "Bugün kendine bir teşekkür et. Bu yolu yürüyen sensin."),
 (80, L, 3, ['13.5'], "Sigarasız bir gelecek", "Bir yıl sonra kendini nerede görüyorsun? Sigarasız bir gelecekte yapmak istediğin bir şeyi hayal et."),
 (82, S, 5, ['3.1'], "Deneyimini paylaş", "Bıraktığını öğrenen birine kısa bir tavsiye ver. En çok neyin işine yaradığını söyle."),
 (84, A, 5, ['1.4'], "Mezuniyete hazırlık", "Kampın sonuna bir hafta kaldı. 90. günden sonra da kullanacağın üç aracı seç."),
 (87, R, 5, ['15.3'], "Yolculuğunu hatırla", "Kampın ilk gününü düşün. O günden bugüne neler değişti?"),
 (89, A, 5, ['1.1', '1.9'], "Kendine yeni bir söz ver", "Kamp bitiyor, ama dumansız hayatın devam ediyor. Kendine önümüzdeki ay için küçük bir söz ver."),
]

FREEDOM = [
 (91, R, 5, ['15.3', '10.3'], "Mezun oldun", "90 günü tamamladın. Bu büyük bir kazanım. Mezuniyet ekranında yolculuğunu gör ve kendini kutla."),
 (120, R, 5, ['2.4'], "Aylık kontrol: dört ay", "Dört aydır dumansızsın. Hâlâ zorlandığın anlar var mı? Planlarını gerekirse güncelle."),
 (150, A, 5, ['1.4'], "Aylık kontrol: beş ay", "Yaklaşan özel günler ya da değişiklikler için planlarını gözden geçir."),
 (180, R, 5, ['15.3'], "Altı ay", "Altı ay dumansızsın. Biriktirdiğin parayı ve sağlığındaki değişiklikleri düşün; bu yarım yılı kutla."),
 (270, R, 5, ['13.5'], "Dokuz ay", "Dokuz ay oldu. Sigara artık hayatının bir parçası değil; bunu fark etmek bile bir kazanım."),
 (365, R, 5, ['15.3', '10.9'], "Bir yıl", "Bir yıl dumansızsın. Sağlık zaman çizelgende önemli bir eşiğe ulaştın. Kendini kutla."),
]


def build(phase, items, prefix):
    return [{"id": f"{prefix}-{d}", "phase": phase, "day": d, "title": ti, "body": bo, "durationMin": m, "bctCodes": b, "type": ty, "reviewed": False} for d, ty, m, b, ti, bo in items]


MISSIONS = (build('preparation', PREP, 'prep') + build('quit_day', QUIT, 'quit') + build('critical_week', CRITICAL, 'crit') + build('strengthening', STRENGTH, 'str') + build('maintenance', MAINT, 'mnt') + build('freedom', FREEDOM, 'free'))

QUIT_DAY = {
 "title": "Bugün bırakma günün",
 "intro": "Bu günü özel kılan senin kararın. Bugünden itibaren tek bir kural var.",
 "rule": "Tek nefes bile yok",
 "ruleText": "Bugünden itibaren tek bir nefes bile yok. Bir nefesin \"bir şey olmaz\" gibi görünmesi, isteği yeniden canlandırır. Zorlandığında \"Canım çekiyor\" butonunu kullan.",
 "checklist": [
  {"id": "remove", "text": "Evdeki, arabadaki ve çantadaki tüm sigara, çakmak ve küllükleri attım"},
  {"id": "kit", "text": "Acil durum kutum (sakız, su, stres topu) yanımda"},
  {"id": "plans", "text": "En riskli üç anım için Eğer–O zaman planlarımı okudum"},
  {"id": "supporter", "text": "Destekçime bugün bıraktığımı söyledim"},
  {"id": "alo", "text": "ALO 171 numarası rehberimde kayıtlı"},
  {"id": "day", "text": "Bugün için sigarasız bir plan yaptım (yürüyüş, sevdiğim bir aktivite)"},
 ],
 "after": "Bugün zorlanırsan bu normaldir. İstekler dalga gibidir; gelir, zirve yapar ve geçer.",
}

DATA = {"reviewed": False, "sourceIds": ["michie2013", "crane2018", "black2020", "nci-withdrawal"], "missions": MISSIONS, "quitDay": QUIT_DAY}
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'camp', 'missions.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(DATA, f, ensure_ascii=False, indent=2)
from collections import Counter
print('missions:', len(MISSIONS), dict(Counter(m['phase'] for m in MISSIONS)))
