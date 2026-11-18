"""Generates src/content/courses.tr.json (original Turkish content, reviewed=false)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sources import S

def sl(emoji, title, text, dyk=None):
    d = {"emoji": emoji, "title": title, "text": text}
    if dyk: d["didYouKnow"] = dyk
    return d

def q(question, options, answer, explain):
    return {"q": question, "options": options, "answer": answer, "explain": explain}

def lesson(id, title, slides, quiz, srcs):
    return {"id": id, "title": title, "slides": slides, "quiz": quiz, "sources": [S[s] for s in srcs], "reviewed": False}

COURSES = [
 {"id": "pf101", "title": "Pelvik Taban Kampüsü", "emoji": "🎓", "reviewed": False,
  "description": "Anatomiden doğru tekniğe, pelvik taban hakkında bilmen gereken temel bilgiler.",
  "lessons": [
   lesson("pf101-1", "Anatomi: Nerede, ne yapar?", [
     sl("🦴", "Leğen kemiğinin tabanı", "Pelvik taban kasları, kuyruk sokumundan kasık kemiğine kadar uzanan kas ve bağ dokusundan oluşur."),
     sl("🛡️", "Destek görevi", "Mesane ve bağırsaklar gibi organları aşağıdan destekler."),
     sl("🚪", "Kapı görevi", "İdrar ve dışkı çıkışını kontrol eden sfinkterlerle birlikte çalışır."),
     sl("⚡", "Cinsel fonksiyon", "Sertleşme sırasında kan akışının korunmasına ve boşalma refleksine katkıda bulunan kaslar da bu gruptadır.")
   ], [
     q("Pelvik taban kasları nerede bulunur?", ["Göğüs kafesinde", "Leğen kemiğinin alt kısmında", "Sırtın üst kısmında"], 1, "Pelvik taban, leğen kemiğinin altında hamak gibi uzanır."),
     q("Aşağıdakilerden hangisi pelvik tabanın görevlerinden biridir?", ["Organlara destek olmak", "Nefes almayı sağlamak", "Kan pompalamak"], 0, "Mesane ve bağırsakları aşağıdan destekler.")
   ], ["mayo_kegel_men", "nhs_pelvic_men"]),
   lesson("pf101-2", "Neden önemli?", [
     sl("💧", "İdrar kontrolü", "Güçlü ve koordineli pelvik taban, ani basınç anlarında (öksürük, hapşırık, ağır kaldırma) idrar kontrolüne yardımcı olur."),
     sl("🏥", "Ameliyat sonrası", "Prostat ameliyatı sonrası dönemde pelvik taban egzersizleri sık önerilen destekleyici yaklaşımlardandır."),
     sl("🔬", "Cinsel sağlık", "Bazı çalışmalar düzenli pelvik taban egzersizinin sertleşme ve boşalma kontrolü üzerinde olumlu etkiler gösterebildiğini bildiriyor; sonuçlar kişiden kişiye değişir."),
     sl("🧍", "Gövde dengesi", "Pelvik taban, karın ve sırt kaslarıyla birlikte gövde stabilitesine katkı verir.")
   ], [
     q("Pelvik taban egzersizleri hangi durumda sıkça önerilir?", ["Prostat ameliyatı sonrası", "Kırık bir kolun iyileşmesinde", "Göz yorgunluğunda"], 0, "İdrar kontrolünü desteklemek için ameliyat sonrası sık önerilir."),
     q("Pelvik taban egzersizleri ile ilgili hangisi doğrudur?", ["Herkeste aynı sonucu garanti eder", "Sonuçlar kişiden kişiye değişebilir", "Tek seansta etkisini gösterir"], 1, "Etkiler bireysel farklılık gösterir ve düzenlilik gerektirir.")
   ], ["pubmed_pfmt_prost", "pubmed_pfmt_ed", "nhs_incont"]),
   lesson("pf101-3", "Doğru teknik", [
     sl("🎯", "İzole et", "Sadece pelvik taban kasını sık; karın, kalça ve uyluklar gevşek kalsın."),
     sl("⬆️", "İçeri ve yukarı", "Hareketi içeri ve yukarı doğru bir çekiş gibi düşün. Dışarıdan bakan biri fark etmemeli."),
     sl("🌬️", "Nefes", "Sıkarken nefesini tutma. Nefes verirken sıkmak bazı kişilere daha kolay gelir."),
     sl("🔓", "Tam gevşeme", "Her tekrardan sonra kası tamamen bırak. Gevşeme süresi en az sıkma süresi kadar olsun.")
   ], [
     q("Kegel sırasında hangisi YAPILMAMALI?", ["Nefesi tutmak", "Kası tamamen gevşetmek", "Karın kaslarını gevşek bırakmak"], 0, "Nefesi tutmak karın içi basıncı artırır."),
     q("Gevşeme süresi ne kadar olmalı?", ["Hiç gerek yok", "En az sıkma süresi kadar", "Sıkmanın yarısı kadar"], 1, "Kasın toparlanması için en az sıkma süresi kadar gevşe."),
     q("Doğru Kegel dışarıdan nasıl görünür?", ["Kalça belirgin şekilde sıkılır", "Karın içeri çekilir", "Dışarıdan neredeyse fark edilmez"], 2, "Hareket içeriden ve küçüktür.")
   ], ["mayo_kegel_men", "nhs_pelvic_men"]),
   lesson("pf101-4", "Sık yapılan hatalar", [
     sl("🏋️", "Fazlası iyi değil", "Çok uzun ve çok sık seanslar kası yorabilir. Önerilen programa sadık kalmak daha iyidir."),
     sl("🚽", "Tuvalet hatası", "İdrarı yarıda kesmeyi egzersiz olarak yapmak mesanenin tam boşalmamasına neden olabilir."),
     sl("😣", "Ağrıya rağmen devam", "Ağrı bir uyarı işaretidir. Ağrı varsa dur ve bir sağlık profesyoneline danış."),
     sl("🎲", "Düzensizlik", "Haftada bir uzun seans yerine her gün kısa seanslar daha etkilidir.")
   ], [
     q("Egzersiz sırasında ağrı hissedersen ne yapmalısın?", ["Daha güçlü sıkmalısın", "Durup bir sağlık profesyoneline danışmalısın", "Süreyi uzatmalısın"], 1, "Ağrı bir uyarı işaretidir."),
     q("Hangisi daha etkilidir?", ["Haftada bir uzun seans", "Her gün kısa seans", "Ayda bir yoğun seans"], 1, "Düzenlilik kilit faktördür.")
   ], ["mayo_kegel_men", "nhs_pelvic_men"]),
   lesson("pf101-5", "İlerleme beklentisi", [
     sl("📆", "Haftalar sürer", "Kas gücünde değişim genellikle birkaç hafta ile birkaç ay arasında fark edilir."),
     sl("📏", "Ölç ve gör", "Haftalık güç testi, küçük değişimleri görmene yardımcı olur."),
     sl("🔁", "Kalıcılık", "Kazanımları korumak için egzersize uzun vadede devam etmek gerekir."),
     sl("🩺", "Değişim yoksa", "Birkaç ay düzenli egzersize rağmen şikâyetlerin sürüyorsa bir uzmana (ürolog veya pelvik taban fizyoterapisti) başvur.")
   ], [
     q("Değişim genellikle ne zaman fark edilir?", ["Birkaç hafta - birkaç ay içinde", "İlk gün", "Hiçbir zaman"], 0, "Kas adaptasyonu zaman alır."),
     q("Kazanımları korumak için ne gerekir?", ["Egzersizi bırakmak", "Uzun vadede devam etmek", "Sadece güç testini yapmak"], 1, "Kas gücü, kullanılmadığında azalabilir.")
   ], ["mayo_kegel_men", "nhs_pelvic_men"]),
  ]},
 {"id": "sexual-health", "title": "Cinsel Sağlık Kampüsü", "emoji": "🩺", "reviewed": False,
  "description": "Genel, eğitici ve tıbbi dille cinsel sağlığın temel konuları.",
  "lessons": [
   lesson("sh-1", "Cinsel sağlık nedir?", [
     sl("🌐", "Geniş bir tanım", "Dünya Sağlık Örgütü cinsel sağlığı yalnızca hastalığın olmaması değil; fiziksel, duygusal, zihinsel ve sosyal iyilik hâli olarak tanımlar."),
     sl("🤝", "Saygı ve rıza", "Sağlıklı cinsellik karşılıklı saygı, güven ve rızaya dayanır."),
     sl("🧠", "Beden ve zihin", "Cinsel fonksiyon; hormonlar, damarlar, sinirler ve duygusal durumun birlikte çalışmasıyla oluşur."),
     sl("🩺", "Konuşulabilir", "Cinsel sağlık sorunları sağlık profesyonellerinin her gün karşılaştığı, konuşulabilir konulardır.")
   ], [
     q("WHO'ya göre cinsel sağlık neyi kapsar?", ["Sadece hastalığın olmamasını", "Fiziksel, duygusal, zihinsel ve sosyal iyilik hâlini", "Sadece üreme yeteneğini"], 1, "Tanım bütüncüldür."),
     q("Sağlıklı cinselliğin temeli nedir?", ["Performans", "Saygı, güven ve rıza", "Sıklık"], 1, "Karşılıklı saygı ve rıza temel unsurlardır.")
   ], ["who_sexual"]),
   lesson("sh-2", "Sertleşme nasıl oluşur?", [
     sl("🧠", "Başlangıç", "Uyarılma beyinde ve sinir sisteminde başlar, sinyaller pelvik bölgeye iletilir."),
     sl("🩸", "Kan akışı", "Penisteki süngerimsi dokulara kan akışı artar ve sertleşme oluşur."),
     sl("🔒", "Koruma", "Pelvik taban kasları dahil çeşitli mekanizmalar kanın bölgede kalmasına yardımcı olur."),
     sl("⚖️", "Dengeyi bozanlar", "Damar hastalıkları, bazı ilaçlar, hormon bozuklukları, stres ve yorgunluk bu süreci etkileyebilir.")
   ], [
     q("Sertleşmede temel rol oynayan nedir?", ["Bölgeye kan akışının artması", "Kemik yapısı", "Sindirim sistemi"], 0, "Sertleşme büyük ölçüde damar ve sinir sistemine bağlıdır."),
     q("Hangisi sertleşmeyi etkileyebilir?", ["Stres", "Göz rengi", "Ayakkabı numarası"], 0, "Psikolojik faktörler de önemli rol oynar.")
   ], ["nhs_ed", "mayo_ed"]),
   lesson("sh-3", "Sertleşme sorunları", [
     sl("📊", "Yaygın bir durum", "Ara sıra yaşanan sertleşme sorunları çok yaygındır ve genellikle endişe gerektirmez."),
     sl("🔁", "Sürekli ise", "Sorun sık tekrarlıyorsa veya yeni başladıysa bir doktora danışmak önemlidir; bazen başka sağlık sorunlarının işareti olabilir."),
     sl("🧰", "Seçenekler", "Yaşam tarzı değişiklikleri, psikolojik destek, ilaçlar ve diğer tıbbi tedaviler doktorla değerlendirilebilir."),
     sl("💊", "Kendi kendine ilaç yok", "Reçetesiz ve kaynağı belirsiz ürünler ciddi riskler taşıyabilir; ilaç kullanımı mutlaka doktor kontrolünde olmalı.")
   ], [
     q("Sık tekrarlayan sertleşme sorununda ne yapılmalı?", ["Görmezden gelmek", "Doktora danışmak", "İnternetten ilaç almak"], 1, "Altta yatan nedenler değerlendirilmelidir."),
     q("Kaynağı belirsiz 'güçlendirici' ürünler için hangisi doğru?", ["Tamamen güvenlidir", "Ciddi riskler taşıyabilir", "Doktor önerisinden daha iyidir"], 1, "Bu ürünler etiketlenmemiş etken maddeler içerebilir.")
   ], ["nhs_ed", "mayo_ed"]),
   lesson("sh-4", "Boşalma kontrolü", [
     sl("⏱️", "Kişiden kişiye", "Boşalma süresi kişiden kişiye ve durumdan duruma değişir; tek bir 'normal' süre yoktur."),
     sl("😟", "Ne zaman sorun?", "Kişi veya partneri için sürekli sıkıntı yaratıyorsa bir sağlık profesyoneliyle konuşmak faydalı olabilir."),
     sl("🧩", "Pelvik tabanın rolü", "Boşalma refleksinde pelvik taban kasları görev alır; bazı çalışmalar bu kasların eğitiminin kontrolü destekleyebileceğini gösteriyor."),
     sl("🧠", "Kaygı etkisi", "Performans kaygısı durumu zorlaştırabilir; gevşeme ve iletişim önemli parçalardır.")
   ], [
     q("Boşalma süresi için hangisi doğru?", ["Herkes için aynı normal süre vardır", "Kişiden kişiye değişir", "Hiç değişmez"], 1, "Bireysel farklılıklar büyüktür."),
     q("Hangisi boşalma kontrolünü zorlaştırabilir?", ["Performans kaygısı", "Su içmek", "Yürüyüş"], 0, "Kaygı, vücudun refleks yanıtlarını etkileyebilir.")
   ], ["nhs_ejac", "pubmed_pfmt_pe"]),
   lesson("sh-5", "Ne zaman doktora gitmeli?", [
     sl("🚩", "Uyarı işaretleri", "Ağrı, idrarda veya menide kan, testislerde şişlik ya da sertlik fark edersen beklemeden doktora başvur."),
     sl("🆕", "Yeni başlayan sorunlar", "Yeni ortaya çıkan sertleşme veya idrar sorunları değerlendirilmelidir."),
     sl("🗣️", "Hazırlık", "Belirtilerini, ne zaman başladığını ve kullandığın ilaçları önceden not almak görüşmeyi kolaylaştırır."),
     sl("🧑‍⚕️", "Kime?", "Aile hekimi iyi bir başlangıç noktasıdır; gerekirse üroloji veya diğer uzmanlıklara yönlendirir.")
   ], [
     q("Hangisi beklemeden doktora gitmeyi gerektirir?", ["İdrarda kan", "Hafif yorgunluk", "Bir gece kötü uyku"], 0, "Kanama bir uyarı işaretidir."),
     q("Doktor görüşmesine nasıl hazırlanabilirsin?", ["Belirtileri ve ilaçları not alarak", "Hiçbir şey söylemeyerek", "Sadece internetteki teşhisi göstererek"], 0, "Not almak, doktorun seni daha iyi değerlendirmesini sağlar.")
   ], ["nhs_ed", "nhs_incont", "mayo_ed"]),
  ]},
 {"id": "stress-sleep", "title": "Stres, Uyku ve Performans Kampüsü", "emoji": "🌙", "reviewed": False,
  "description": "Zihin, uyku ve beden arasındaki bağ ve günlük hayatta uygulanabilecek alışkanlıklar.",
  "lessons": [
   lesson("ss-1", "Stresin bedendeki izleri", [
     sl("🌪️", "Alarm sistemi", "Stres anında salgılanan hormonlar vücudu harekete hazırlar; kısa süreli stres normaldir."),
     sl("📆", "Uzun süreli stres", "Sürekli stres uyku, sindirim, bağışıklık ve cinsel istek üzerinde olumsuz etki yapabilir."),
     sl("🧱", "Kas gerginliği", "Omuzlar, çene ve pelvik bölge stresle birlikte istemsizce gerilebilir."),
     sl("🔍", "Fark etmek", "Gün içinde kendine 'Şu an nerem gergin?' diye sormak ilk adımdır.")
   ], [
     q("Uzun süreli stres neyi etkileyebilir?", ["Uyku ve cinsel istek", "Göz rengi", "Boy uzunluğu"], 0, "Kronik stres birçok sistemi etkiler."),
     q("Stresi yönetmede ilk adım nedir?", ["Fark etmek", "Görmezden gelmek", "Daha çok kahve içmek"], 0, "Bedensel gerginliği fark etmek yönetimin başlangıcıdır.")
   ], ["mayo_stress", "nhs_stress"]),
   lesson("ss-2", "Nefesin gücü", [
     sl("🌬️", "Yavaş nefes", "Nefes vermeyi uzatmak, vücudun sakinleşme yanıtını destekler."),
     sl("🔲", "Kutu nefesi", "4 sn al, 4 sn tut, 4 sn ver, 4 sn bekle. Odaklanmak için kullanılabilir."),
     sl("🌙", "4-7-8", "4 sn al, 7 sn tut, 8 sn ver. Uykuya geçişte bazı kişilere yardımcı olur."),
     sl("📲", "Uygula", "Uygulamadaki Nefes aracı, titreşimle ekrana bakmadan nefes almanı sağlar.")
   ], [
     q("Hangisi sakinleşmeyi destekler?", ["Nefes vermeyi uzatmak", "Hızlı ve sığ nefes", "Nefesi uzun süre tutup bırakmamak"], 0, "Uzun nefes verme sakinleşme sistemini destekler."),
     q("4-7-8 nefesinde nefes kaç saniyede verilir?", ["4", "7", "8"], 2, "Nefes verme 8 saniye sürer.")
   ], ["nhs_stress", "nhs_mindful"]),
   lesson("ss-3", "Uyku hijyeni", [
     sl("⏰", "Düzen", "Her gün aynı saatte yatıp kalkmak en etkili uyku alışkanlıklarından biridir."),
     sl("🌑", "Ortam", "Karanlık, sessiz ve serin bir yatak odası uykuyu kolaylaştırır."),
     sl("📵", "Ekranlar", "Yatmadan önce ekran süresini azaltmak zihnin yavaşlamasına yardımcı olur."),
     sl("🛏️", "Yatak sadece uyku için", "Uyuyamıyorsan yatakta kıvranmak yerine kalkıp sakin bir şeyle uğraşmak ve uykun gelince dönmek önerilir.")
   ], [
     q("Hangisi iyi bir uyku alışkanlığıdır?", ["Her gün aynı saatte yatmak", "Yatakta telefonla oyalanmak", "Gece geç kahve içmek"], 0, "Düzen iç saati destekler."),
     q("Uyuyamadığında ne önerilir?", ["Yatakta saatlerce beklemek", "Kalkıp sakin bir şey yapmak", "Ağır egzersiz yapmak"], 1, "Yatakla uyanıklık arasındaki bağı zayıflatmak için önerilir.")
   ], ["nhs_sleep", "mayo_sleep"]),
   lesson("ss-4", "Performans kaygısıyla başa çıkmak", [
     sl("🎭", "Normal bir deneyim", "Kaygı herkesin yaşayabileceği bir duygudur; varlığı bir sorun olduğun anlamına gelmez."),
     sl("🎯", "Sonuçtan sürece", "Dikkati 'başarmalıyım' düşüncesinden anlık duyulara ve paylaşıma kaydırmak baskıyı azaltabilir."),
     sl("💬", "Paylaşmak", "Partnerle açık iletişim, beklentileri hafifletir."),
     sl("🧑‍⚕️", "Profesyonel destek", "Kaygı sürekli hâle geldiyse cinsel sağlık konusunda deneyimli bir uzman yardımcı olabilir.")
   ], [
     q("Performans kaygısını azaltmaya ne yardımcı olabilir?", ["Dikkati sonuçtan sürece kaydırmak", "Daha çok baskı yapmak", "Hiç konuşmamak"], 0, "Odak değişimi baskıyı azaltabilir."),
     q("Kaygı sürekli hâle geldiyse ne yapılabilir?", ["Bir uzmandan destek almak", "Tamamen yalnız başa çıkmak zorundasın", "Hiçbir şey yapılamaz"], 0, "Profesyonel destek etkili bir seçenektir.")
   ], ["mayo_stress", "nhs_ed"]),
   lesson("ss-5", "Sürdürülebilir alışkanlıklar", [
     sl("🧱", "Küçük adımlar", "Büyük değişiklikler yerine küçük ve sürdürülebilir adımlar daha kalıcıdır."),
     sl("🔗", "Alışkanlık zinciri", "Yeni alışkanlığı mevcut bir rutine bağla: örneğin dişlerini fırçaladıktan sonra 5 dakikalık antrenman."),
     sl("🔥", "Seri ama esnek", "Seri motive eder; bir gün kaçırırsan kendini suçlamadan ertesi gün devam et."),
     sl("🎉", "Kutla", "Küçük ilerlemeleri fark etmek ve kutlamak motivasyonu canlı tutar.")
   ], [
     q("Hangisi daha kalıcı değişim sağlar?", ["Küçük ve sürdürülebilir adımlar", "Bir günde her şeyi değiştirmek", "Hiç plan yapmamak"], 0, "Küçük adımlar sürdürülebilirdir."),
     q("Bir gün antrenmanı kaçırırsan ne yapmalısın?", ["Tamamen bırakmalısın", "Ertesi gün kaldığın yerden devam etmelisin", "İki kat süre yapmalısın"], 1, "Esneklik uzun vadede devamlılığı korur.")
   ], ["nhs_wellbeing", "who_activity"]),
  ]},
 {"id": "lifestyle", "title": "Yaşam Tarzı Kampüsü", "emoji": "🥗", "reviewed": False,
  "description": "Hareket, beslenme, alkol, sigara ve düzenli kontrollerin pelvik taban ve cinsel sağlıkla bağlantısı.",
  "lessons": [
   lesson("ls-1", "Hareketin etkisi", [
     sl("🚶", "Az da olsa hareket", "Gün içinde oturma süresini bölmek ve kısa yürüyüşler yapmak genel sağlığı destekler."),
     sl("📅", "Haftalık hedef", "Yetişkinler için haftada en az 150 dakika orta yoğunlukta fiziksel aktivite önerilir."),
     sl("❤️", "Kalp ve damarlar", "Düzenli hareket kalp-damar sağlığını destekler; sağlıklı kan akışı cinsel sağlık için de önemlidir."),
     sl("🧩", "Kegel ile birlikte", "Kegel antrenmanı genel egzersizin yerini tutmaz; ikisi birbirini tamamlar.")
   ], [
     q("Yetişkinler için haftalık önerilen orta yoğunlukta aktivite süresi en az ne kadardır?", ["30 dakika", "150 dakika", "600 dakika"], 1, "Haftada en az 150 dakika orta yoğunlukta aktivite önerilir."),
     q("Kegel antrenmanı ile genel egzersiz arasındaki ilişki nedir?", ["Kegel genel egzersizin yerini tutar", "Birbirlerini tamamlarlar", "Birlikte yapılmamalıdır"], 1, "İkisi farklı ihtiyaçlara hitap eder ve birlikte yapılabilir.")
   ], ["who_activity", "nhs_ed"]),
   lesson("ls-2", "Beslenme", [
     sl("🥦", "Çeşitlilik", "Sebze, meyve, baklagil ve tam tahıllardan zengin bir beslenme genel sağlığı destekler."),
     sl("🧂", "Tuz ve şeker", "Fazla tuz, şeker ve işlenmiş gıdayı azaltmak kalp-damar sağlığı için önerilir."),
     sl("💧", "Su", "Yeterli sıvı almak önemlidir; idrar kaçırma kaygısıyla su içmeyi kısmak mesaneyi rahatsız edebilir."),
     sl("🌾", "Lif ve kabızlık", "Lifli beslenme kabızlığı azaltabilir; ıkınmak pelvik tabana ek yük bindirir.")
   ], [
     q("Kabızlık sırasında ıkınmak pelvik tabanı nasıl etkiler?", ["Ek yük bindirir", "Kasları dinlendirir", "Hiçbir etkisi yoktur"], 0, "Ikınmak karın içi basıncı artırarak pelvik tabana yük bindirir."),
     q("İdrar kaçırma kaygısıyla su içmeyi kısmak neden önerilmez?", ["Mesaneyi rahatsız edebilir", "Kasları güçlendirir", "Uykuyu artırır"], 0, "Yoğun idrar mesaneyi tahriş edebilir; yeterli sıvı önemlidir.")
   ], ["who_diet", "nhs_water", "nhs_incont"]),
   lesson("ls-3", "Alkol ve sigara", [
     sl("🍺", "Alkol", "Fazla alkol idrar söktürücü etki yapabilir ve sertleşme sorunlarına katkıda bulunabilir."),
     sl("🚭", "Sigara", "Sigara damarlara zarar verir; damar sağlığı sertleşme için önemli bir etkendir."),
     sl("📉", "Azaltmak da değerli", "Tamamen bırakmak en iyisidir; ancak azaltmak bile sağlık açısından fark yaratabilir."),
     sl("🤝", "Destek almak", "Sigarayı bırakma ve alkolü azaltma konusunda destek hatları ve uzmanlar yardımcı olabilir.")
   ], [
     q("Sigara cinsel sağlığı hangi yoldan etkileyebilir?", ["Damarlara zarar vererek", "Kasları büyüterek", "Uykuyu düzenleyerek"], 0, "Sigara damar sağlığını bozar."),
     q("Alkolü tamamen bırakamıyorsan ne söylenebilir?", ["Azaltmak da fark yaratabilir", "Hiçbir şey değişmez", "Daha fazla içmek daha iyidir"], 0, "Azaltmak bile sağlık açısından değerlidir.")
   ], ["nhs_alcohol", "nhs_smoking", "nhs_ed"]),
   lesson("ls-4", "Kilo ve karın içi basınç", [
     sl("⚖️", "Karın bölgesi", "Karın bölgesindeki fazla kilo, pelvik tabana sürekli ek basınç bindirebilir."),
     sl("🔗", "Ortak risk", "Fazla kilo; kalp-damar hastalıkları ve sertleşme sorunlarıyla ortak risk etkenlerini paylaşır."),
     sl("🐢", "Yavaş ve kalıcı", "Hızlı diyetler yerine sürdürülebilir küçük değişiklikler daha kalıcı sonuç verir."),
     sl("🧑‍⚕️", "Kişisel plan", "Kilo vermek istiyorsan bir sağlık profesyoneliyle sana uygun bir plan oluşturmak en güvenli yoldur.")
   ], [
     q("Karın bölgesindeki fazla kilo pelvik tabanı nasıl etkileyebilir?", ["Ek basınç bindirebilir", "Basıncı azaltır", "Etkisi yoktur"], 0, "Karın içi basınç artar."),
     q("Hangisi daha kalıcı sonuç verir?", ["Çok hızlı diyetler", "Sürdürülebilir küçük değişiklikler", "Öğün atlamak"], 1, "Küçük ve sürdürülebilir adımlar kalıcıdır.")
   ], ["who_diet", "mayo_ed"]),
   lesson("ls-5", "Düzenli kontroller", [
     sl("🩺", "Erken uyarı", "Sertleşme sorunları bazen kalp-damar hastalığı veya diyabet gibi durumların erken işareti olabilir."),
     sl("🚩", "Ne zaman başvurmalı?", "İdrarda kan, ağrı, ani idrar sorunları veya uzun süren sertleşme sorunlarında bir doktora başvur."),
     sl("🗣️", "Çekinme", "Doktorlar bu konuları her gün konuşur; açık olmak doğru yardımı almanı kolaylaştırır."),
     sl("📱", "Uygulamanın yeri", "Bu uygulama bir antrenman yardımcısıdır; muayene ve tedavinin yerini tutmaz.")
   ], [
     q("Sertleşme sorunları neden önemsenmelidir?", ["Başka sağlık sorunlarının erken işareti olabilir", "Her zaman kendiliğinden geçer", "Sadece yaşla ilgilidir"], 0, "Kalp-damar hastalığı veya diyabetin erken işareti olabilir."),
     q("Hangi durumda doktora başvurmalısın?", ["İdrarda kan gördüğünde", "Antrenmanı bitirdiğinde", "Seri kazandığında"], 0, "İdrarda kan bir doktor tarafından değerlendirilmelidir.")
   ], ["nhs_ed", "mayo_ed", "nhs_incont"]),
  ]},
 {"id": "daily-life", "title": "Günlük Hayat Kampüsü", "emoji": "🏃", "reviewed": False,
  "description": "Pelvik taban kasını gün içinde doğru kullanmak ve motivasyonu uzun süre korumak.",
  "lessons": [
   lesson("dl-1", "Farklı pozisyonlarda", [
     sl("🛋️", "Önce uzanarak", "Başlangıçta sırtüstü uzanarak çalışmak kası bulmayı kolaylaştırır."),
     sl("🪑", "Sonra oturarak", "Kası rahatça bulduğunda oturarak da yapabilirsin; masa başında kimse fark etmez."),
     sl("🧍", "En son ayakta", "Ayakta yapmak daha zordur ama günlük hayattaki kullanıma en yakın pozisyondur."),
     sl("🔁", "Teknik aynı", "Pozisyon değişse de kural aynı: karın ve kalça gevşek, nefes serbest, tam gevşeme.")
   ], [
     q("Kası bulmak için başlangıçta hangi pozisyon daha kolaydır?", ["Ayakta", "Sırtüstü uzanarak", "Koşarken"], 1, "Uzanırken kası bulmak ve izole etmek daha kolaydır."),
     q("Pozisyon değiştiğinde hangisi değişmez?", ["Doğru teknik kuralları", "Yer çekiminin etkisi", "Zorluk derecesi"], 0, "Teknik kuralları her pozisyonda geçerlidir.")
   ], ["nhs_pelvic_men", "mayo_kegel_men"]),
   lesson("dl-2", "Öksürmeden önce sık", [
     sl("🤧", "Ani basınç", "Öksürük, hapşırık ve gülme karın içi basıncı aniden artırır."),
     sl("⏱️", "Bir an önce", "Bu anlardan hemen önce pelvik taban kasını kısaca sıkmak idrar kontrolüne yardımcı olabilir."),
     sl("🏋️", "Ağır kaldırırken", "Bir şey kaldırmadan önce kası sıkmak ve nefesini tutmamak aynı mantıkla çalışır."),
     sl("🎯", "Alışkanlık hâline getir", "Tekrar ettikçe bu küçük sıkma otomatik bir alışkanlığa dönüşebilir.")
   ], [
     q("Öksürmeden hemen önce ne yapmak idrar kontrolüne yardımcı olabilir?", ["Pelvik taban kasını kısaca sıkmak", "Nefesi uzun süre tutmak", "Karnı şişirmek"], 0, "Kısa bir sıkma ani basınca karşı destek olur."),
     q("Ağır bir şey kaldırırken hangisi doğrudur?", ["Nefesi tutmak", "Kası sıkıp nefes almaya devam etmek", "Kası tamamen gevşek bırakmak"], 1, "Nefesi tutmak karın içi basıncı artırır.")
   ], ["nhs_incont", "nhs_pelvic_men"]),
   lesson("dl-3", "Tuvalet sonrası damlama", [
     sl("💧", "Yaygın bir durum", "İdrar bittikten sonra birkaç damla gelmesi erkeklerde sık görülen bir durumdur."),
     sl("⬆️", "Sık ve boşalt", "İdrar bittikten sonra pelvik taban kasını güçlüce sıkmak, kanalda kalan idrarın çıkmasına yardımcı olabilir."),
     sl("🚫", "Yarıda kesme değil", "Bu, idrarı yarıda kesmekle aynı şey değildir; idrar tamamen bittikten sonra yapılır."),
     sl("🩺", "Değişiklik varsa", "Damlama yeni başladıysa veya artıyorsa bir doktora danış.")
   ], [
     q("Tuvalet sonrası damlamaya karşı sıkma ne zaman yapılır?", ["İdrar tamamen bittikten sonra", "İdrarın ortasında", "Tuvalete gitmeden önce"], 0, "İdrarı yarıda kesmek önerilmez; sıkma idrar bittikten sonra yapılır."),
     q("Damlama yeni başladıysa ne yapmalısın?", ["Bir doktora danışmalısın", "Su içmeyi bırakmalısın", "Görmezden gelmelisin"], 0, "Yeni başlayan değişiklikler değerlendirilmelidir.")
   ], ["nhs_pelvic_men", "nhs_incont"]),
   lesson("dl-4", "Duruş ve nefes", [
     sl("🧘", "Dik ama rahat", "Dik ama gergin olmayan bir duruş, pelvik taban kasını doğru kullanmayı kolaylaştırır."),
     sl("🌬️", "Diyafram ile uyum", "Nefes alırken pelvik taban hafifçe aşağı iner, nefes verirken yukarı toparlanır."),
     sl("🔄", "Nefes verirken sık", "Bu yüzden birçok kişi sıkmayı nefes verirken daha kolay bulur."),
     sl("😮‍💨", "Gevşerken nefes al", "Gevşeme fazında yavaşça nefes almak kasın tamamen bırakmasına yardımcı olur.")
   ], [
     q("Birçok kişi kası hangi sırada sıkmayı daha kolay bulur?", ["Nefes verirken", "Nefesi tutarken", "Hızlı nefes alırken"], 0, "Nefes verirken pelvik taban doğal olarak yukarı toparlanır."),
     q("Gevşeme fazında ne yapmak yardımcı olur?", ["Yavaşça nefes almak", "Nefesi tutmak", "Kalçayı sıkmak"], 0, "Yavaş nefes kasın tamamen gevşemesine yardımcı olur.")
   ], ["nhs_pelvic_men", "nhs_mindful"]),
   lesson("dl-5", "Plato ve motivasyon", [
     sl("📈", "İlerleme düz değildir", "Bazı haftalar hızlı, bazı haftalar yavaş ilerlersin; bu normaldir."),
     sl("🧪", "Ölçüme güven", "Hissin değişse bile haftalık güç testi gerçek eğilimi görmene yardım eder."),
     sl("🎚️", "Zorluğu bildir", "Seanslar çok kolay ya da çok zor geliyorsa geri bildirim ver; seviye buna göre ayarlanır."),
     sl("🔥", "Kendine nazik ol", "Bir gün kaçırmak her şeyi bitirmez; önemli olan geri dönmektir.")
   ], [
     q("İlerleme bir süre yavaşlarsa ne düşünmelisin?", ["Bu normaldir, devam etmeliyim", "Hiç işe yaramıyor", "Süreyi üçe katlamalıyım"], 0, "İlerleme dalgalı olabilir."),
     q("Seanslar sana çok kolay geliyorsa ne yapmalısın?", ["Geri bildirimde Çok kolay seçeneğini seçmeliyim", "Antrenmanı bırakmalıyım", "Hiçbir şey yapmamalıyım"], 0, "Geri bildirim seviyeni otomatik ayarlar.")
   ], ["nhs_pelvic_men", "nhs_wellbeing"]),
  ]},
]

out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'courses.tr.json')
json.dump(COURSES, open(out, 'w'), ensure_ascii=False, indent=2)
print(len(COURSES), 'courses', sum(len(c['lessons']) for c in COURSES), 'lessons')
