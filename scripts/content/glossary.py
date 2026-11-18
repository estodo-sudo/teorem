"""Generates src/content/glossary.tr.json: short explanations of app concepts ("Neden, Nedir ve Ne Demek?").

Texts describe how the app itself works; keep them in sync with the training engine
(levels.ts, adjustLevel.ts, streak.ts) and settings when those change.
"""
import json, os


def sec(title, text):
    return {"title": title, "text": text}


def term(id, emoji, title, summary, sections):
    return {"id": id, "emoji": emoji, "title": title, "summary": summary, "sections": sections, "reviewed": False}


GLOSSARY = [
 term("kegel", "🎯", "Kegel Nedir ve Pelvik Kas Nerede?", "Pelvik taban, leğen kemiğinin tabanında hamak gibi uzanan kas katmanıdır. Kegel bu kası sıkıp gevşeterek çalıştırmaktır.", [
   sec("Pelvik taban nerede?", "Pelvik taban kasları, önde kasık kemiğinden arkada kuyruk sokumuna, yanlarda da iki oturma kemiği arasına uzanan bir kas katmanıdır. Bir hamak gibi mesaneyi ve bağırsağı aşağıdan taşır; idrar yolu ve makat bu kasların arasından geçer."),
   sec("Ne işe yarar?", "Bu kaslar idrarı ve gazı tutmanı sağlar, idrar sonrasında kanalda kalan son damlaları boşaltır. Sertleşme sırasında penis köküne yakın kaslar kanın geri akmasını zorlaştırarak sertliğin korunmasına yardım eder; boşalma da bu kasların ritmik kasılmasıyla gerçekleşir."),
   sec("Kası nasıl bulursun?", "Gaz çıkarmamak için makatını sıktığını ya da idrarını tutmaya çalıştığını hayal et. Doğru kası sıktığında makatın içeri ve yukarı çekilir, penis tabanı hafifçe yukarı kalkar ve testisler hafifçe yükselir. Ayna karşısında ya da otururken kontrol edebilirsin."),
   sec("Sık yapılan hatalar", "Karnı, kalçayı veya bacakları sıkmak; nefesi tutmak; kası bırakmayı unutmak. Ayrıca idrarı yarıda kesmeyi egzersiz olarak yapma; mesanenin tam boşalmasını engelleyebilir. Bu yalnızca kası tanımak için en fazla bir kez denenebilir."),
   sec("Kegel nereden gelir?", "Egzersiz, adını 1940'larda bu çalışmaları tanımlayan ve yaygınlaştıran Amerikalı kadın doğum uzmanı Arnold Kegel'den alır. Bugün pelvik taban egzersizleri erkeklerde idrar damlaması, sertleşme sorunu ve erken boşalma için de araştırılmaktadır."),
   sec("Ne zaman sonuç verir?", "Düzenli çalışmayla belirgin bir fark görmek genellikle 3–6 ay sürer. Her kasta olduğu gibi burada da süreklilik yoğunluktan daha önemlidir."),
   sec("Uygulamada", "Günün antrenmanı sana ne zaman sıkıp ne zaman gevşeyeceğini ekranda ve titreşimle gösterir. Doğru tekniği Profil > Eğitimi tekrar izle ile hatırlayabilirsin."),
   sec("Kaynaklar", "NHS, Erkekler için pelvik taban egzersizleri bilgilendirme broşürleri. Dorey ve ark., BJU International (2005)."),
 ]),
 # --- Sexual health topics (original Turkish content, reviewed=false; sources listed per term) ---
 term("premature-ejaculation", "⏱️", "Erken boşalma neden olur?", "Boşalmanın istenenden çok daha önce olması ve kontrol edilememesi. Sık görülür ve çoğu zaman geliştirilebilir.", [
   sec("Ne zaman erken boşalma denir?", "Uzmanlar üç ölçüte bakar: boşalmanın neredeyse her seferinde çok kısa sürede olması, kişinin onu geciktirememesi ve bunun sıkıntı yaratması. Ömür boyu süren tipte boşalma genellikle girişten sonraki 1 dakika içinde olur; sonradan başlayan tipte ise süre belirgin şekilde, çoğunlukla 3 dakikanın altına düşer."),
   sec("Ne kadar yaygın?", "Kendini erken boşalan olarak tanımlayan erkeklerin oranı %20–30'a kadar çıkar. Tanı ölçütlerinin hepsini karşılayanlar ise çok daha azdır: ömür boyu tip yaklaşık %2–3, sonradan başlayan tip yaklaşık %4."),
   sec("Neden olur?", "Ömür boyu süren tipte beyindeki serotonin sistemiyle ve kalıtımla ilgili biyolojik bir yatkınlık öne çıkar. Sonradan başlayan tipte sertleşme sorunu (sertliği kaybetme korkusuyla acele etmek), prostat iltihabı, tiroit hormonu fazlalığı, performans kaygısı, stres ve ilişki sorunları sık görülen nedenlerdir."),
   sec("Kısır döngü", "Bir kez erken boşalmak kaygı yaratır; kaygı da bir sonraki sefer boşalmayı daha da hızlandırır. Bu döngüyü fark etmek, onu kırmanın ilk adımıdır."),
   sec("Ne işe yarar?", "Pelvik taban kası boşalma refleksinde doğrudan rol oynar. Ömür boyu erken boşalması olan 40 erkekle yapılan bir çalışmada, 12 haftalık pelvik taban egzersizinden sonra 33'ü (%82) boşalmasını kontrol etmeye başladı ve ortalama süre 1 dakikanın altından yaklaşık 2,5 dakikaya çıktı. Dur-başla tekniği, kaygıyı azaltmak ve partnerle açıkça konuşmak da işe yarar. Sorun sürüyorsa üroloğun önerebileceği etkili tedaviler de vardır."),
   sec("Uygulamada", "Kegel antrenmanındaki Hızlı Sıkma kası tanımayı, Gevşeme ve Nefes bölümü ise kası bilinçli olarak bırakmayı öğretir. Boşalma kontrolü bu ikisinin birlikteliğine dayanır."),
   sec("Kaynaklar", "Serefoglu ve ark., ISSM erken boşalma tanımı, Sexual Medicine (2014). Pastore ve ark., Therapeutic Advances in Urology (2014)."),
 ]),
 term("erectile-dysfunction", "🩺", "Sertleşememek neden olur?", "Cinsel ilişki için yeterli sertliğe ulaşamamak ya da onu koruyamamak. Yaygındır ve sıklıkla damar sağlığıyla ilgilidir.", [
   sec("Ne zaman sorun sayılır?", "Arada bir sertleşmemek yorgunluk, alkol ya da stresle herkesin başına gelebilir. Sorun düzenli hâle gelip ilişkiyi etkilemeye başladığında erektil disfonksiyondan söz edilir."),
   sec("Nasıl olur?", "Sertleşme bir zincirdir: beyinden gelen sinir uyarısı penisteki damarları genişletir, damarlara kan dolar ve pelvik taban kasları bu kanın geri akmasını zorlaştırır. Zincirin herhangi bir halkasındaki sorun sertleşmeyi zorlaştırır."),
   sec("Sık nedenler", "Bedensel nedenler: damar sertliği, diyabet, yüksek tansiyon, yüksek kolesterol, fazla kilo, sigara, alkol ve bazı ilaçlar. Ruhsal nedenler: performans kaygısı, stres, depresyon ve ilişki sorunları. Gençlerde ruhsal nedenler, ileri yaşlarda damar kaynaklı nedenler daha sık öne çıkar."),
   sec("Kalbin erken uyarısı", "Penis damarları kalp damarlarından incedir; bu yüzden damar sorunları önce sertleşmede kendini gösterebilir. Ortalama 11 yıldan uzun süre izlenen erkeklerde sertleşme sorunu olanlarda kalp-damar hastalığı riski daha yüksek bulundu. Kalıcı bir sertleşme sorunu, kalp sağlığını da kontrol ettirmek için iyi bir nedendir."),
   sec("Ne işe yarar?", "Sertleşme sorunu olan 55 erkekle yapılan randomize bir çalışmada, pelvik taban egzersizleri ve yaşam tarzı değişikliğinden 6 ay sonra erkeklerin %40'ı normal sertleşmeye kavuştu, yaklaşık üçte biri de iyileşti. Düzenli hareket, kilo kontrolü, sigarayı bırakmak ve alkolü azaltmak damar sağlığını destekler. Bunlar yetmediğinde etkili ilaç tedavileri de vardır."),
   sec("Uygulamada", "Uzun Sıkma ve Dayanıklılık egzersizleri sertliği korumaya yardım eden kasları çalıştırır. Sigara içiyorsan Sigara Bırakma Kampüsü de bu yolda destek olur."),
   sec("Kaynaklar", "Dorey ve ark., BJU International (2005). Massachusetts Male Aging Study, Journal of the American College of Cardiology (2010)."),
 ]),
 term("masturbation", "🧠", "Mastürbasyon bağımlılığı var mı?", "Mastürbasyon normal ve yaygın bir davranıştır. Sorun sıklıktan çok kontrolün kaybedilmesi ve hayatın olumsuz etkilenmesidir.", [
   sec("Mastürbasyon zararlı mı?", "Hayır. Mastürbasyon her yaşta yaygın ve sağlıklı bir cinsel davranıştır; kısırlığa, görme bozukluğuna ya da güç kaybına yol açtığına dair bilimsel bir kanıt yoktur. 18–35 yaş arası 3.400'den fazla erkekle yapılan bir araştırmada mastürbasyon sıklığı ile sertleşme sorunu arasında bir ilişki bulunmadı."),
   sec("Resmi bir tanı mı?", "Mastürbasyon bağımlılığı diye resmi bir tanı yoktur. Dünya Sağlık Örgütü'nün sınıflamasında (ICD-11) bunun yerine kompulsif cinsel davranış bozukluğu yer alır; bu da bir bağımlılık olarak değil, dürtü kontrol sorunu olarak tanımlanır."),
   sec("Ne zaman sorun olur?", "Belirleyici olan sıklık değildir. Kişi aylarca bırakmak istediği hâlde kontrol edemiyorsa, davranış iş, uyku, ilişki ve sorumlulukların önüne geçiyorsa ve artık keyif vermediği hâlde sürüyorsa sorun olabilir. ABD'de 2.300'den fazla yetişkinle yapılan bir araştırmada erkeklerin yaklaşık %10'u cinsel dürtülerini kontrol etmekte zorlandığını ve bundan belirgin sıkıntı duyduğunu bildirdi."),
   sec("Suçluluk duygusu", "Bazı kişiler davranış ahlaki ya da dini değerleriyle çeliştiği için kendini bağımlı hisseder. Uzmanlara göre yalnızca bu çatışmadan doğan sıkıntı tanı koymak için yeterli değildir; ama yaşanan sıkıntı gerçektir ve üzerine düşünmeye değer."),
   sec("Ne yapılabilir?", "Davranışı tetikleyen durumları fark et: yalnızlık, stres, can sıkıntısı ya da gece geç saatte telefon. Telefonu yatak odası dışında şarj etmek, gün içinde hareket etmek ve dürtü geldiğinde birkaç dakika nefes egzersizi yapmak gibi küçük değişiklikler işe yarar. Kontrol kaybı sürüyorsa bu konuda en çok araştırılmış yöntem bilişsel davranışçı terapidir."),
   sec("Kaynaklar", "WHO ICD-11, Kompulsif cinsel davranış bozukluğu (6C72). Dickenson ve ark., JAMA Network Open (2018). JMIR Public Health and Surveillance (2021), 3.419 erkekle yapılan araştırma."),
 ]),
 term("lasting-longer", "🕰️", "Uzun ilişki kuramamak", "Çoğu zaman sorun süre değil beklentidir. Gerçek ortalamaları bilmek ve kontrolü geliştirmek işe yarar.", [
   sec("Gerçek ortalama ne?", "Türkiye'nin de dahil olduğu beş ülkede 500 çiftin kronometreyle ölçtüğü bir araştırmada, girişten boşalmaya kadar geçen ortanca süre 5,4 dakika bulundu. Süreler kişiden kişiye çok değişiyor ve yaş ilerledikçe kısalıyordu."),
   sec("Ne kadar yeterli?", "Cinsel terapistlerle yapılan bir ankette, girişli ilişki için 3–7 dakika yeterli, 7–13 dakika ise arzu edilen süre olarak değerlendirildi. Çok uzun süreler daha iyi bulunmadı."),
   sec("Beklentiler nereden geliyor?", "Filmler ve yetişkin içerikler kurgulanmış, kesilip birleştirilmiş sahneler gösterir. Bu görüntüler gerçek ilişkilerin süresi için yanlış bir ölçü oluşturup performans kaygısını artırabilir."),
   sec("Süreyi kısaltan şeyler", "Kaygı, uzun süre ilişkiye girmemiş olmak, çok yoğun uyarılma, sertliği kaybetme korkusuyla acele etmek ve zayıf ya da sürekli gergin pelvik taban kasları süreyi kısaltabilir."),
   sec("Ne işe yarar?", "Pelvik taban egzersizleri boşalma refleksi üzerindeki kontrolü artırabilir. Boşalma yaklaştığında durup isteğin azalmasını beklemek (dur-başla), yavaş ve derin nefes almak, ritmi ya da pozisyonu değiştirmek ve ön sevişmeye daha fazla zaman ayırmak da yardımcı olur."),
   sec("Uygulamada", "Hızlı Sıkma kası tanımayı, Gevşeme ve Nefes bölümü ise kası bilinçli olarak bırakmayı öğretir. Kontrol, kası güçlü sıkabilmek kadar onu istediğin anda gevşetebilmeye de bağlıdır."),
   sec("Kaynaklar", "Waldinger ve ark., Journal of Sexual Medicine (2005). Corty ve Guardiani, Journal of Sexual Medicine (2008). Pastore ve ark., Therapeutic Advances in Urology (2014)."),
 ]),
 term("partner-satisfaction", "💞", "Partnerini tatmin edemediğini düşünmek", "Yaygın bir kaygıdır ve çoğu zaman gerçeği yansıtmaz. Tatmini belirleyen süre ya da boyuttan çok iletişim ve yakınlıktır.", [
   sec("Bu kaygı neden yaygın?", "Birçok erkek partnerinin memnuniyetini kendi performansının notu gibi görür. Bu baskı performans kaygısına, kaygı da sertleşme ve boşalma sorunlarına yol açabilir. Araştırmalar özellikle genç erkeklerde sertleşme sorunlarının önemli bir nedeninin performans kaygısı olduğunu gösteriyor."),
   sec("Orgazm hakkında gerçekler", "Kadınların yalnızca yaklaşık %18'i yalnızca girişle orgazm olabildiğini bildiriyor; çoğu için klitoral uyarı gerekli ya da orgazmı kolaylaştırıcı. Partnerin yalnızca girişle orgazm olmuyorsa bu senin başarısızlığın değil, çok yaygın bir durumdur."),
   sec("Orgazm farkı", "ABD'de 52.000'den fazla yetişkinle yapılan bir araştırmada heteroseksüel erkeklerin %95'i, kadınların ise %65'i ilişkide genellikle ya da her zaman orgazm olduğunu söyledi. Daha sık orgazm olan kadınlar daha uzun ön sevişme, oral seks, sevgi sözleri ve isteklerini rahatça söyleyebilmeyi daha sık bildirdi."),
   sec("Boyut kaygısı", "15.000'den fazla erkeğin ölçümlerini bir araya getiren bir analizde sertleşmiş penisin ortalama uzunluğu yaklaşık 13 cm bulundu. Kendini küçük hisseden erkeklerin çoğu aslında ortalama aralığın içindedir."),
   sec("Ne işe yarar?", "Partnerine neyi sevdiğini sormak ve kendi isteklerini paylaşmak, en etkili ama en az kullanılan yöntemdir. Ön sevişmeye zaman ayırmak, yalnızca girişe odaklanmamak ve performans yerine birlikte keyif almayı hedeflemek kaygıyı azaltır."),
   sec("Uygulamada", "Pelvik taban antrenmanı sertliği ve boşalma kontrolünü destekleyebilir. Antrenman sekmesindeki nefes araçları da ilişki öncesindeki gerginliği azaltmana yardımcı olabilir."),
   sec("Kaynaklar", "Herbenick ve ark., Journal of Sex & Marital Therapy (2018). Frederick ve ark., Archives of Sexual Behavior (2018). Veale ve ark., BJU International (2015)."),
 ]),
 term("morning-erection", "🌅", "Sabah sertleşmesi neden olur?", "Uyku sırasında kendiliğinden olan sertleşmelerdir. Sağlıklı bir damar ve sinir sisteminin doğal bir işaretidir.", [
   sec("Neden olur?", "Uykunun rüya görülen REM evresinde beyin, sertleşmeyi baskılayan sinyalleri azaltır ve penise kan akışı artar. Bu yüzden sağlıklı erkeklerde bir gecede genellikle 3–5 kez, her biri yaklaşık 25–35 dakika süren sertleşme olur. Uyandığında son REM dönemine denk geldiğin için sabah fark edersin."),
   sec("Neyi gösterir?", "Bu sertleşmeler cinsel düşünceyle ilgili değildir; damarların, sinirlerin ve hormonların düzgün çalıştığını gösterir. Uzmanlar sertleşme sorunu yaşayan bir erkekte sabah ve gece sertleşmelerinin sürmesini, sorunun daha çok kaygı ya da stres gibi ruhsal kaynaklı olabileceğine dair bir ipucu olarak değerlendirir."),
   sec("Hiç olmuyorsa?", "Bir iki sabah olmaması önemli değildir; geç yatmak, alkol ve yorgunluk bunu sık etkiler. Haftalardır hiç sabah sertleşmesi yoksa bu damar, hormon ya da uyku kaynaklı bir sorunun işareti olabilir ve değerlendirilmeye değer."),
   sec("Ne etkiler?", "Uyku apnesi gibi uykuyu bölen sorunlar, yetersiz uyku, alkol, bazı ilaçlar, ileri yaş ve düşük testosteron sabah sertleşmelerini azaltabilir."),
   sec("Uygulamada", "Düzenli Kegel antrenmanı sertliğin korunmasına yardım eden kasları çalıştırır. Yeterli ve düzenli uyku da en az antrenman kadar önemlidir."),
   sec("Kaynaklar", "Uyku sırasında penil tümesans üzerine klinik incelemeler (Journal of Family Practice, 1994; Andrologia, 2005)."),
 ]),
 term("low-desire", "🌡️", "Cinsel isteksizlik neden olur?", "İstek zaman zaman herkeste azalır. Uzun süre devam ediyorsa genellikle stres, uyku, ruh hâli, ilişki ya da hormonlarla ilgilidir.", [
   sec("Ne zaman sorun sayılır?", "İstek dönem dönem değişir; yoğun iş, yorgunluk ya da kaygılı bir dönem bunu doğal olarak etkiler. Cinsel düşünce ve isteğin aylarca belirgin şekilde azalması ve bunun seni ya da ilişkini rahatsız etmesi durumunda sorundan söz edilir. Orta yaşlı 12.000'den fazla erkekle yapılan bir araştırmada bu oran yaklaşık %5 bulundu."),
   sec("Sık nedenler", "Stres ve yoğun iş temposu, depresyon ve kaygı, ilişkideki sorunlar ve iletişimsizlik, sertleşme ya da boşalma sorunu yaşadıktan sonra cinsellikten kaçınma, aşırı alkol, bazı ilaçlar (örneğin bazı antidepresanlar ve tansiyon ilaçları) ve düşük testosteron."),
   sec("Uyku ve testosteron", "Sağlıklı genç erkeklerle yapılan bir çalışmada yalnızca bir hafta boyunca gecede 5 saat uyumak, gündüz testosteron düzeyini %10–15 düşürdü ve katılımcılar kendilerini daha az enerjik hissetti. Düzenli ve yeterli uyku istek için önemli bir temeldir."),
   sec("Testosteron her şey değil", "Düşük testosteron isteği azaltabilir; ancak uzmanlara göre özellikle ileri yaşta istek ile kandaki testosteron düzeyi arasında birebir bir ilişki yoktur. İstek; beden, zihin ve ilişkinin birlikte etkilediği bir durumdur."),
   sec("Ne işe yarar?", "Uykunu düzenlemek, hareket etmek, alkolü azaltmak ve stresi yönetmek ilk adımlardır. Partnerinle baskı kurmadan konuşmak ve yakınlığı yalnızca cinsel ilişkiyle sınırlamamak da isteğin geri gelmesine yardım eder. Uzun süren isteksizlikte nedenin araştırılması gerekir."),
   sec("Kaynaklar", "Avrupa Üroloji Derneği (EAU), Cinsel ve üreme sağlığı kılavuzu: Düşük cinsel istek. Leproult ve Van Cauter, JAMA (2011)."),
 ]),
 term("dribble", "💧", "İdrar damlaması ve kaçırma neden olur?", "İdrardan sonra gelen son damlalar ve ani sıkışmalar çok yaygındır. Pelvik taban kasları burada doğrudan rol oynar.", [
   sec("İdrar sonrası damlama", "İşedikten ve fermuarını kapattıktan sonra birkaç damla idrarın gelmesi her yaşta erkekte görülebilir. Normalde penis kökündeki bir kas, idrar bittikten sonra kanalda kalan idrarı refleksle dışarı sıkar; bu kas zayıfladığında kanalda biraz idrar kalır ve sonradan damlar."),
   sec("Kaçırma türleri", "Öksürürken, hapşırırken ya da ağır kaldırırken olan kaçırmaya stres tipi denir. Aniden gelen ve tuvalete yetiştirmekte zorlandığın sıkışmaya ise sıkışma tipi denir. Erkeklerde kaçırma sıklıkla prostat büyümesi ya da prostat ameliyatı ile ilişkilidir."),
   sec("Ne işe yarar?", "Sertleşme sorunu ve idrar damlaması olan erkeklerle yapılan bir çalışmada pelvik taban egzersizlerinden 6 ay sonra katılımcıların %75'inin damlama şikâyeti tamamen geçti. Çalışmada egzersizin bir parçası, idrar bittikten hemen sonra kası güçlüce sıkarak kanalı boşaltmaktı."),
   sec("Hemen işe yarayan ipucu", "İdrarını bitirdikten sonra pelvik taban kasını birkaç kez güçlüce sık. İstersen testislerin arkasından penise doğru parmaklarınla hafifçe bastırarak kanalda kalan idrarı da boşaltabilirsin."),
   sec("Ne zaman önemlidir?", "İdrarda kan, ağrı ya da yanma, çok sık tuvalete gitmek, akışın belirgin şekilde zayıflaması veya mesaneyi boşaltamıyormuş gibi hissetmek değerlendirilmesi gereken belirtilerdir."),
   sec("Uygulamada", "Uzun Sıkma ve Dayanıklılık egzersizleri bu kasları güçlendirir. Hızlı Sıkma ise öksürük ve hapşırık anında kası hızla devreye sokmayı öğretir."),
   sec("Kaynaklar", "Dorey ve ark., Urologic Nursing (2004). Dorey, Physiotherapy (2002), idrar sonrası damlama derlemesi."),
 ]),
 term("tight-pelvic-floor", "🪢", "Gergin pelvik taban ve pelvik ağrı", "Pelvik taban kası yalnızca zayıf değil, sürekli gergin de olabilir. Bu durum ağrıya, idrar ve cinsel sorunlara yol açabilir.", [
   sec("Gergin kas ne demek?", "Bazı erkeklerde pelvik taban kası stres, uzun süre oturma ya da alışkanlık nedeniyle sürekli hafif kasılı kalır. Gevşeyemeyen bir kas da tıpkı zayıf bir kas gibi işini iyi yapamaz."),
   sec("Belirtiler", "Kasıkta, perinede (testislerle makat arası), penis ya da testislerde, alt karında süren ağrı ya da baskı; idrar yaparken zorlanma veya yanma; boşalma sırasında ya da sonrasında ağrı. Bu tablo çoğu zaman kronik prostatit ya da kronik pelvik ağrı sendromu olarak adlandırılır ve çoğunda enfeksiyon bulunmaz."),
   sec("Ne kadar yaygın?", "ABD'de yapılan geniş bir araştırmada erkeklerin yaklaşık %2'sinde bu sendromun belirtileri bulundu; farklı çalışmalarda ömür boyu görülme oranı %2 ile %10 arasında değişiyor."),
   sec("Ne işe yarar?", "Kası gevşetmeye odaklanan fizik tedavi en çok araştırılan yöntemlerdendir. Kadın ve erkeklerle yapılan bir ön çalışmada pelvik bölgeye yönelik özel fizik tedavi uygulananların %57'si belirgin iyileşme bildirdi; genel masaj grubunda bu oran %21'di. Yavaş ve derin nefes, sıcak duş, uzun oturmalara mola vermek ve stresi azaltmak da yardımcı olur."),
   sec("Dikkat", "Pelvik ağrın varsa yalnızca sıkma egzersizlerine yüklenme; önce kası tamamen bırakmayı öğrenmek önemlidir. Ağrı sürüyor ya da artıyorsa değerlendirilmesi gerekir."),
   sec("Uygulamada", "Her antrenmanın sonundaki Gevşeme ve Nefes bölümü, kası bilinçli olarak bırakmayı öğretir. Kegel sadece sıkmak değil, sıkıp tamamen gevşetebilmektir."),
   sec("Kaynaklar", "FitzGerald ve ark., Journal of Urology (2009). RAND RICE çalışması, kronik prostatit ve kronik pelvik ağrı sendromu yaygınlığı."),
 ]),
 term("after-prostate-surgery", "🏥", "Prostat ameliyatı sonrası pelvik taban", "Prostat ameliyatından sonra idrar kaçırma sık görülür ve çoğu zaman aylar içinde azalır. Pelvik taban egzersizleri bu süreçte yaygın olarak önerilir.", [
   sec("Neden kaçırma olur?", "Prostat, idrar kanalının etrafını saran ve idrarı tutmaya yardım eden yapılardan biridir. Prostatın alındığı ameliyattan sonra idrarı tutma görevi büyük ölçüde idrar yolunu çevreleyen kasa ve pelvik taban kaslarına kalır."),
   sec("Ne beklenir?", "Ameliyattan sonraki ilk haftalarda özellikle öksürürken, ayağa kalkarken ya da ağır kaldırırken kaçırma sık görülür. Çoğu erkekte kontrol ilk yıl içinde, kendiliğinden ve kademeli olarak düzelir."),
   sec("Egzersiz ne kadar etkili?", "Araştırmaların bir araya getirildiği incelemeler pelvik taban egzersizlerinin iyileşmeyi destekleyebileceğini gösteriyor; ancak Cochrane incelemesine göre egzersizin tek başına ne kadar ek fayda sağladığı henüz net değil. Yine de güvenli, ucuz ve yaygın olarak önerilen bir yöntemdir."),
   sec("Ne zaman başlanır?", "Pelvik taban egzersizlerine çoğunlukla ameliyattan önce başlanması ve sonda çıkarıldıktan sonra devam edilmesi önerilir. Sonda takılıyken egzersiz yapılmaz; ne zaman başlayacağını ameliyatı yapan ekibin önerisine göre belirlemelisin."),
   sec("Sertleşme", "Ameliyattan sonra sertleşme sorunu da sık görülür ve iyileşmesi aylar, bazen bir iki yıl sürebilir. Pelvik taban kası sertliğin korunmasına da katkı sağlar."),
   sec("Uygulamada", "Antrenmanlar Seviye 1'den, kısa ve hafif seanslarla başlar. Zor gelirse geri bildiriminle seviye otomatik düşer; böylece kendi hızında ilerleyebilirsin."),
   sec("Kaynaklar", "Anderson ve ark., Cochrane (2015), Prostat ameliyatı sonrası idrar kaçırmada konservatif tedavi. Pelvik taban egzersizi üzerine şemsiye inceleme (2022)."),
 ]),
 term("level", "📶", "Seviye ne demek?", "Antrenmanının zorluğu. 1'den 30'a kadar ilerler.", [
   sec("Kısaca", "Seviye, günlük antrenmanının ne kadar uzun ve zor olacağını belirler. Seviye 1 yaklaşık 4 dakika, Seviye 30 yaklaşık 8 dakika sürer."),
   sec("Nasıl değişir?", "Her antrenmandan sonra verdiğin geri bildirime göre otomatik ayarlanır: Çok kolay dersen bir seviye artar; üst üste 3 kez Uygun dersen bir seviye artar; Zor dersen bir seviye azalır."),
   sec("Tamamlayamadım", "Tamamlayamadım dersen seviye bir azalır ve ertesi gün aynı plan gününü tekrar edersin."),
   sec("Elle değiştirmek", "Seviyeni Profil > Antrenman bölümünden elle de değiştirebilirsin. Seviye arttıkça seans uzar."),
 ]),
 term("plan", "🗓️", "30 günlük plan nedir?", "Her gün bir antrenmandan oluşan, ilerlemeni takip eden plan.", [
   sec("Kısaca", "Plan 30 günden oluşur. Her gün için o günün seviyesine göre bir antrenman hazırlanır ve tamamladığın günler işaretlenir."),
   sec("Antrenman nasıl kurulur?", "Her antrenman hafif bir ısınmayla başlar, ana bölümle devam eder ve gevşeme ile nefesle biter. Seviye 5 ve üzerinde bir dayanıklılık bölümü de eklenir."),
   sec("Plan bitince", "30 gün tamamlandığında yeni plan otomatik başlar ve seviyen kaldığı yerden devam eder."),
 ]),
 term("exercises", "🧩", "Egzersiz türleri ne demek?", "Antrenmanlarda karşına çıkan altı farklı egzersiz.", [
   sec("Uzun Sıkma", "Kası sıkıp birkaç saniye tutar, sonra tamamen gevşetirsin."),
   sec("Hızlı Sıkma", "1 saniye sıkıp 1 saniye gevşetirsin. Hızlı ve kontrollü olmalı."),
   sec("Asansör", "Üç kademede gittikçe daha güçlü sıkar, tepede bekler, sonra kademe kademe bırakırsın."),
   sec("Ritim", "Kısa ve ritmik sıkma darbelerinden oluşan bloklar; bloklar arasında dinlenirsin."),
   sec("Dayanıklılık", "Tek ve uzun bir sıkmanın ardından uzun bir dinlenme gelir."),
   sec("Gevşeme ve Nefes", "Antrenmanın sonunda derin nefesle kasları bilinçli olarak serbest bırakırsın."),
 ]),
 term("vibration", "📳", "Titreşim dili nedir?", "Ekrana bakmadan antrenman yapmanı sağlayan titreşim işaretleri.", [
   sec("SIK", "Güçlü tek titreşim sıkma zamanının geldiğini söyler. Sıkarken her saniye hafif bir tık hissedersin."),
   sec("GEVŞE", "Çift hafif titreşim gevşeme zamanıdır."),
   sec("Bitti", "Üçlü titreşim egzersizin bittiğini gösterir."),
   sec("Şiddet ayarı", "Titreşim şiddetini Profil > Antrenman bölümünden Kapalı, Hafif, Normal veya Güçlü olarak seçebilirsin."),
 ]),
 term("streak", "🔥", "Seri nedir?", "Günlük antrenmanı üst üste kaç gün tamamladığın.", [
   sec("Kısaca", "Günün ana antrenmanını tamamladığın her gün serin bir artar."),
   sec("Ne zaman sıfırlanır?", "Bugün henüz antrenman yapmadıysan ama dün yaptıysan serin devam eder. Bir günü tamamen kaçırırsan seri sıfırlanır."),
   sec("Günde kaç seans?", "Seri için günde 1 seans yeterlidir. Profil > Antrenman bölümünden günlük hedefini 3 seansa kadar artırabilirsin."),
 ]),
 term("strength-test", "💪", "Güç testi nedir?", "Gelişimini görmen için haftada bir yapılan kısa ölçüm.", [
   sec("Test A · Tutma süresi", "Kası sıkarken butona basılı tutarsın, gevşediğin anda bırakırsın. Birkaç deneme yaparsın ve en iyisi kaydedilir."),
   sec("Test B · Hızlı kasılma", "Kısa bir sürede kası kaç kez sıkıp gevşetebildiğini ölçer. Her sıkışta butona dokunursun."),
   sec("Sonuçlar", "Sonuçlar İlerleme sekmesindeki grafiklerde görünür. Bu bir tıbbi ölçüm değildir; yalnızca kendi gelişimini takip etmen içindir."),
 ]),
 term("discreet", "🕶️", "Gizli mod ne demek?", "Antrenman ekranında yazı yerine yalnızca daire ve renklerin görünmesi.", [
   sec("Gizli oynatıcı", "Gizli mod açıkken antrenman ekranında SIK veya GEVŞE gibi yazılar görünmez; yalnızca daire ve renkler değişir. Profil > Antrenman bölümünden açabilirsin."),
   sec("Gizli bildirimler", "Hatırlatma bildirimleri varsayılan olarak nötr metinlerle gelir; kilit ekranında antrenmanın ne olduğu anlaşılmaz. Bunu Profil > Hatırlatıcılar bölümünden değiştirebilirsin."),
 ]),
 term("privacy", "🔒", "Verilerim nerede saklanır?", "Tüm verilerin yalnızca bu telefonda durur.", [
   sec("Sunucu yok", "Uygulamanın bir sunucusu ve hesap sistemi yoktur. Antrenmanların, testlerin ve notların yalnızca bu cihazda saklanır."),
   sec("İnternetsiz çalışır", "Uygulamanın tamamı internet olmadan çalışır. İnternet yalnızca mağaza üzerinden yapılan satın almalar için kullanılır."),
   sec("Yedekleme", "Profil > Verilerim bölümünden verilerini dosya olarak dışa aktarabilir, sonra tekrar içe aktarabilir ya da tamamen silebilirsin."),
 ]),
]

out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'glossary.tr.json')
with open(out, 'w', encoding='utf8', newline='\n') as f:
    json.dump(GLOSSARY, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(len(GLOSSARY), 'terms')
