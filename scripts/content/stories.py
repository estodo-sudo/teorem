"""Generates src/content/stories.tr.json (original Turkish content, reviewed=false)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sources import S

def sl(emoji, title, text, dyk=None):
    d = {"emoji": emoji, "title": title, "text": text}
    if dyk: d["didYouKnow"] = dyk
    return d

def story(id, cat, emoji, title, slides, srcs):
    return {"id": id, "title": title, "category": cat, "emoji": emoji, "minutes": 2,
            "slides": slides, "sources": [S[s] for s in srcs], "reviewed": False}

STORIES = [
 story("pf-basics", "menHealth", "🧭", "Erkeklerde pelvik taban", [
   sl("🧭", "Görünmeyen kas grubu", "Pelvik taban, leğen kemiğinin altında hamak gibi uzanan kaslardan oluşur. Çoğu erkek varlığından bile haberdar değildir."),
   sl("🛡️", "Ne işe yarar?", "Mesaneyi ve bağırsakları destekler, idrar ve gaz kontrolüne yardımcı olur, cinsel fonksiyonda da rol oynar."),
   sl("📉", "Zamanla zayıflayabilir", "Yaş, uzun süre oturmak, kronik öksürük, fazla kilo veya bazı ameliyatlar bu kasları zayıflatabilir.", "Pelvik taban egzersizleri, prostat ameliyatı sonrası idrar kontrolünü desteklemek için sıkça önerilen yöntemlerdendir."),
   sl("💪", "Çalıştırılabilir", "Diğer kaslar gibi düzenli ve doğru egzersizle güçlenebilir. Anahtar kelime: istikrar."),
   sl("🩺", "Ne zaman doktora?", "Ağrı, idrarda kan, ani idrar kaçırma veya yeni başlayan sertleşme sorunlarında egzersizden önce bir doktora danış.")
 ], ["mayo_kegel_men", "nhs_pelvic_men"]),
 story("kegel-mistakes", "menHealth", "⚠️", "En sık yapılan 5 Kegel hatası", [
   sl("🙅", "1. Yanlış kası sıkmak", "Karın, kalça veya bacakları sıkmak çok yaygındır. Pelvik taban hareketi içeriden ve küçüktür."),
   sl("😮‍💨", "2. Nefesi tutmak", "Sıkarken nefesi tutmak karın içi basıncı artırır. Sakin nefes almaya devam et."),
   sl("🔁", "3. Gevşemeyi atlamak", "Kası tamamen bırakmak, sıkmak kadar önemlidir. Sürekli gergin bir kas da sorun yaratabilir."),
   sl("🚽", "4. Tuvalette egzersiz", "İdrarı yarıda kesmek kası bulmak için bir fikir verebilir ama düzenli egzersiz olarak yapılmamalı."),
   sl("📆", "5. Çabuk vazgeçmek", "Kas gücündeki değişim haftalar içinde gelişir. Kısa ama düzenli seanslar, seyrek uzun seanslardan daha faydalıdır.")
 ], ["mayo_kegel_men", "nhs_pelvic_men"]),
 story("erection-blood", "menHealth", "❤️", "Sertleşme ve damar sağlığı", [
   sl("❤️", "Kalp ve damarlar", "Sertleşme büyük ölçüde sağlıklı kan akışına bağlıdır. Bu yüzden damar sağlığını etkileyen her şey önemlidir."),
   sl("🚬", "Risk faktörleri", "Sigara, yüksek tansiyon, diyabet, yüksek kolesterol ve hareketsizlik sertleşme sorunlarıyla ilişkilendirilir."),
   sl("🏃", "Yaşam tarzı", "Düzenli egzersiz, dengeli beslenme ve sigarayı bırakmak genel damar sağlığını destekler.", "Yeni başlayan sertleşme sorunları bazen kalp-damar hastalıklarının erken bir işareti olabilir; bu yüzden doktorla konuşmak önemlidir."),
   sl("🧩", "Pelvik tabanın yeri", "Bazı çalışmalar pelvik taban egzersizlerinin sertleşme sorunlarında destekleyici olabileceğini gösteriyor; ancak tek başına bir tedavi değildir."),
 ], ["nhs_ed", "mayo_ed", "pubmed_pfmt_ed"]),
 story("bladder-control", "menHealth", "💧", "Mesane kontrolü üzerine", [
   sl("💧", "Sık rastlanır", "İdrar kaçırma özellikle yaş ilerledikçe ve prostat ameliyatı sonrasında erkeklerde de görülebilir."),
   sl("⏳", "Damla kaçırma", "İdrar yaptıktan sonra birkaç damla kaçırmak yaygındır. Bitirdikten sonra pelvik tabanı birkaç kez sıkmak yardımcı olabilir."),
   sl("☕", "Tetikleyiciler", "Kafein, alkol ve gazlı içecekler bazı kişilerde mesaneyi uyarabilir. Kendi tetikleyicilerini gözlemle."),
   sl("🩺", "Değerlendirme şart", "Yeni başlayan veya artan idrar kaçırma bir sağlık profesyoneli tarafından değerlendirilmelidir.")
 ], ["nhs_incont", "nhs_pelvic_men", "pubmed_pfmt_prost"]),
 story("talk-partner", "relationships", "💬", "Partnerinle konuşmak", [
   sl("💬", "Sessizlik ağırlaştırır", "Cinsel konularda yaşanan zorluklar konuşulmadığında kaygı ve yanlış anlamalar büyüyebilir."),
   sl("🕰️", "Doğru zaman", "Yatak odası dışında, sakin ve acelesiz bir an seçmek konuşmayı kolaylaştırır."),
   sl("🙋", "Ben dili", "\"Sen hiç…\" yerine \"Ben son zamanlarda … hissediyorum\" demek savunmayı azaltır."),
   sl("🤝", "Ekip olmak", "Sorunu ortak bir konu olarak görmek, çözüm arayışını birlikte yapmanızı sağlar.", "Araştırmalar, ilişki doyumunda iletişimin cinsel sıklıktan daha belirleyici olabileceğini gösteriyor.")
 ], ["who_sexual", "nhs_ed"]),
 story("performance-anxiety", "relationships", "🎭", "Performans kaygısı", [
   sl("🎭", "Çok yaygın", "Performans kaygısı pek çok erkeğin hayatının bir döneminde yaşadığı bir durumdur."),
   sl("🔄", "Kısır döngü", "Bir kez yaşanan zorluk, sonraki seferde endişeye; endişe de vücudun gevşemesini zorlaştırarak yeni zorluklara yol açabilir."),
   sl("🌬️", "Bedeni sakinleştirmek", "Yavaş nefes, odağı sonuçtan duyulara kaydırmak ve beklentileri azaltmak döngüyü kırmaya yardımcı olabilir."),
   sl("🧠", "Destek almak", "Kaygı sürekli hâle geldiyse cinsel sağlık konusunda deneyimli bir uzmanla konuşmak faydalı olabilir.")
 ], ["nhs_ed", "mayo_stress"]),
 story("intimacy-beyond", "relationships", "🫶", "Yakınlık sadece cinsellik değil", [
   sl("🫶", "Geniş bir kavram", "Yakınlık; dokunma, sohbet, birlikte gülmek ve birbirine zaman ayırmak gibi pek çok şeyi kapsar."),
   sl("📵", "Ekransız zaman", "Günde birkaç dakikalık telefonsuz sohbet, bağ kurmanın basit bir yoludur."),
   sl("🎯", "Baskıyı azaltmak", "Yakınlığı yalnızca cinsel birleşmeye indirgememek, performans baskısını hafifletebilir."),
   sl("🗓️", "Küçük ritüeller", "Haftada bir birlikte yürüyüş, ortak bir yemek ya da sadece sarılarak geçirilen birkaç dakika bağı güçlendirebilir.")
 ], ["who_sexual", "nhs_wellbeing"]),
 story("water", "nutrition", "🥤", "Su ve mesane", [
   sl("🥤", "Az içmek çözüm değil", "İdrar kaçırma endişesiyle su içmeyi azaltmak idrarı yoğunlaştırarak mesaneyi daha çok tahriş edebilir."),
   sl("📏", "Ne kadar?", "Genel öneri gün boyunca düzenli sıvı almaktır; ihtiyaç kilo, hava ve aktiviteye göre değişir."),
   sl("🌙", "Akşam düzeni", "Gece sık tuvalete kalkıyorsan, sıvının çoğunu gündüz almayı ve yatmadan önceki saatlerde azaltmayı deneyebilirsin."),
   sl("🔎", "İpucu", "Açık sarı idrar genellikle yeterli sıvı aldığının işaretidir.")
 ], ["nhs_water", "nhs_incont"]),
 story("plate", "nutrition", "🥗", "Damar dostu tabak", [
   sl("🥗", "Yarısı sebze", "Tabağın yarısını sebze ve meyveyle doldurmak basit ve etkili bir başlangıç."),
   sl("🌾", "Tam tahıl", "Beyaz ekmek ve pirinç yerine tam tahıllı seçenekler lif alımını artırır."),
   sl("🫒", "Yağ seçimi", "Zeytinyağı, kuruyemiş ve balık gibi sağlıklı yağ kaynaklarını tercih et; işlenmiş et ve kızartmaları sınırla."),
   sl("🧂", "Tuz ve şeker", "Fazla tuz tansiyonu, fazla şeker kilo ve kan şekerini etkileyebilir.", "WHO, günlük tuz alımının 5 gramın altında tutulmasını önerir.")
 ], ["who_diet", "mayo_ed"]),
 story("alcohol", "nutrition", "🍷", "Alkol ve performans", [
   sl("🍷", "Kısa vadede", "Alkol bazı kişilerde rahatlatıcı gibi görünse de fazlası sertleşmeyi ve hissetmeyi zorlaştırabilir."),
   sl("📆", "Uzun vadede", "Düzenli ve yüksek miktarda alkol hormonları, uykuyu ve damar sağlığını olumsuz etkileyebilir."),
   sl("🧮", "Azaltma fikirleri", "Alkolsüz günler belirlemek, küçük bardak kullanmak ve her içkinin arasına su koymak işe yarayabilir."),
   sl("🩺", "Ne zaman yardım?", "Alkolü azaltmakta zorlanıyorsan bu konuda destek veren sağlık hizmetlerinden yardım almak güçlü bir adımdır.")
 ], ["nhs_alcohol", "nhs_ed"]),
 story("sleep-hormones", "sleep", "😴", "Uyku ve hormonlar", [
   sl("😴", "Gece yenilenme", "Vücudun pek çok hormonu uyku sırasında düzenlenir."),
   sl("⏱️", "Kısa uyku", "Bazı çalışmalarda kısıtlı uykunun genç erkeklerde testosteron düzeylerini düşürebildiği gözlenmiştir."),
   sl("🛏️", "Hedef", "Yetişkinlerin çoğu için gecede 7–9 saat uyku önerilir."),
   sl("🔋", "Enerji ve istek", "Yorgunluk cinsel isteği ve ruh hâlini doğrudan etkileyebilir; uyku bu yüzden bir öncelik.")
 ], ["pubmed_sleep_t", "nhs_sleep"]),
 story("sleep-routine", "sleep", "🌙", "Daha iyi uyku için akşam rutini", [
   sl("🌙", "Sabit saat", "Her gün aynı saatte yatıp kalkmak iç saatini düzenler — hafta sonu da."),
   sl("📱", "Ekran molası", "Yatmadan 30–60 dakika önce ekranları bırakmak uykuya geçişi kolaylaştırabilir."),
   sl("☕", "Kafein saati", "Kafeinin etkisi saatlerce sürebilir; öğleden sonra kahveyi azaltmayı dene."),
   sl("🌬️", "Gevşeme", "Yatakta 4-7-8 nefesi veya beden taraması zihni yavaşlatmana yardımcı olabilir.")
 ], ["nhs_sleep", "mayo_sleep"]),
 story("night-bathroom", "sleep", "🚽", "Gece tuvalete kalkmak", [
   sl("🚽", "Noktüri", "Gece birden fazla kez tuvalete kalkmaya noktüri denir ve yaşla birlikte daha sık görülür."),
   sl("🥤", "Akşam sıvısı", "Akşam saatlerinde özellikle kafeinli ve alkollü içecekleri azaltmak fark yaratabilir."),
   sl("🩺", "Altta yatan nedenler", "Prostat büyümesi, diyabet veya uyku apnesi gibi durumlar noktüriye yol açabilir; sık oluyorsa doktora danış."),
   sl("🛏️", "Yatmadan önce", "Yatmadan hemen önce tuvalete gitmek ve gün içinde pelvik taban egzersizlerine devam etmek bazı kişilere yardımcı olabilir.")
 ], ["nhs_incont", "mayo_sleep"]),
 story("stress-body", "stress", "🌪️", "Stres bedende nasıl hissedilir?", [
   sl("🌪️", "Savaş ya da kaç", "Stres anında vücut alarm durumuna geçer: kalp hızlanır, kaslar gerilir, nefes sığlaşır."),
   sl("🧱", "Gergin kaslar", "Uzun süreli stres boyun, omuz ve hatta pelvik taban kaslarında istemsiz gerginliğe yol açabilir."),
   sl("🌬️", "Fren pedalı", "Yavaş ve uzun nefes vermek, vücudun sakinleşme sistemini devreye sokmanın en kolay yollarından biridir."),
   sl("🧘", "Küçük molalar", "Gün içinde 1–2 dakikalık nefes molaları birikimli bir etki yaratabilir.")
 ], ["mayo_stress", "nhs_stress"]),
 story("worry-time", "stress", "🗒️", "Endişe zamanı tekniği", [
   sl("🗒️", "Erteleme", "Endişeler gün boyu gelir; her geldiğinde bir kenara not edip \"bunu endişe zamanımda düşüneceğim\" diyebilirsin."),
   sl("⏰", "15 dakika", "Her gün aynı saatte 15 dakikalık bir \"endişe zamanı\" belirle ve notlarına o zaman bak."),
   sl("✍️", "Yazıya dökmek", "Düşünceleri yazmak onları somutlaştırır ve kafada dönmelerini azaltabilir. Zihin Boşaltma aracını deneyebilirsin."),
   sl("🔍", "Çözülebilir mi?", "Endişe zamanında her madde için sor: Bununla ilgili bugün atabileceğim küçük bir adım var mı? Yoksa bırakmayı dene.")
 ], ["nhs_stress", "nhs_mindful"]),
 story("mindfulness", "stress", "🍃", "Farkındalık nedir?", [
   sl("🍃", "Şimdi ve burada", "Farkındalık, dikkatini yargılamadan şu anki deneyimine vermektir."),
   sl("☕", "Günlük hayatta", "Bir fincan çayı içerken sadece sıcaklığına, kokusuna ve tadına odaklanmak bile bir farkındalık pratiğidir."),
   sl("🔁", "Dikkat kaçar", "Zihin dağılır; bu başarısızlık değil. Fark edip nazikçe geri dönmek pratiğin kendisidir."),
   sl("⏱️", "Kısa başla", "Günde 2–3 dakikalık pratik bile başlangıç için yeterli. Nefes aracındaki 1 dakikalık seçenekle deneyebilirsin.")
 ], ["nhs_mindful", "nhs_wellbeing"]),
 story("move-more", "exercise", "🚶", "Daha çok hareket", [
   sl("🚶", "Öneri", "WHO yetişkinler için haftada en az 150–300 dakika orta yoğunlukta aerobik aktivite öneriyor."),
   sl("🧩", "Parçalara böl", "Günde 3 kez 10 dakikalık yürüyüş de sayılır."),
   sl("🪑", "Oturmayı kes", "Uzun süre oturuyorsan her saat birkaç dakika kalkıp hareket et.", "Az hareket bile hiç hareketsizlikten iyidir."),
   sl("❤️", "Neden önemli?", "Düzenli hareket kalp-damar sağlığını, uykuyu ve ruh hâlini destekler.")
 ], ["who_activity"]),
 story("core-hips", "exercise", "🏋️", "Kalça ve gövde neden önemli?", [
   sl("🏋️", "Bir ekip", "Pelvik taban; karın, sırt ve kalça kaslarıyla birlikte çalışan bir sistemin parçasıdır."),
   sl("🌉", "Köprü ve squat", "Kalça kaslarını çalıştıran hareketler gövdenin stabilitesini destekler."),
   sl("📲", "Uygulamada", "Kasık Fitness bölümündeki kısa rutinler bu kas gruplarını hedefler."),
   sl("🧘", "Esneklik de önemli", "Kalça ve iç bacak esnemeleri bölgedeki gerginliği azaltmaya yardımcı olabilir; esnemeyi zorlamadan yap.")
 ], ["who_activity", "mayo_kegel_men"]),
 story("cycling", "exercise", "🚴", "Bisiklet ve pelvik bölge", [
   sl("🚴", "Uzun sürüşler", "Uzun süre sert bir selede oturmak bazı kişilerde perine bölgesinde uyuşma ve basıya yol açabilir."),
   sl("🪑", "Sele ayarı", "Doğru sele yüksekliği ve şekli, ara ara ayağa kalkmak ve mola vermek basıncı azaltabilir."),
   sl("🩺", "Dikkat", "Uyuşma veya his kaybı geçmiyorsa sürüşü azalt ve bir sağlık profesyoneline danış."),
   sl("🔄", "Dengeli antrenman", "Bisikleti seviyorsan bırakman gerekmez; kalça ve gövde güçlendirme, esneme ve molalarla dengelemek iyi bir fikir.")
 ], ["mayo_ed", "who_activity"]),
 story("smoking", "menHealth", "🚭", "Sigara ve cinsel sağlık", [
   sl("🚭", "Damarlar", "Sigara damarlara zarar vererek kan akışını azaltabilir; bu da sertleşmeyi olumsuz etkileyebilir."),
   sl("📈", "Bırakmanın faydası", "Sigarayı bırakmak birçok sağlık riskini zamanla azaltır; vücut iyileşmeye ilk günlerden başlar."),
   sl("🤝", "Destek", "Bırakma sürecinde profesyonel destek ve bırakma programları başarı şansını artırabilir."),
   sl("💡", "Tetikleyicileri tanı", "Kahve, stres veya belirli ortamlar sigara isteğini tetikleyebilir. Bu anlar için önceden bir alternatif (nefes, yürüyüş) planla.")
 ], ["nhs_smoking", "nhs_ed"]),
]

out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'stories.tr.json')
json.dump(STORIES, open(out, 'w'), ensure_ascii=False, indent=2)
print(len(STORIES), 'stories')
