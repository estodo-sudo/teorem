"""Generates src/content/masturbation.tr.json — Mastürbasyon Bağımlılığı Kampüsü (original Turkish content, reviewed=false).

Approach and evidence (see SOURCES):
- Masturbation itself is normal and not harmful; the problem is loss of control (ICD-11 6C72
  Compulsive Sexual Behaviour Disorder: an impulse-control disorder, not an addiction).
  Distress from moral judgement alone is not enough for the diagnosis (WHO ICD-11; Grubbs et al. 2019).
- ~10% of men report clinically relevant distress about controlling sexual urges (Dickenson et al. 2018).
- CBT (Hallberg et al. 2019) and ACT (Crosby & Twohig 2016: 93% reduction in viewing vs 21%) have the best support.
- If-then plans (implementation intentions) help reach goals (Gollwitzer & Sheeran 2006, d = 0.65).
- Lapses: avoid the all-or-nothing "abstinence violation effect" (Marlatt's relapse prevention model).
- No promises; no "retention" claims. The user picks a pause goal; the campus is non-judgemental.
- Two paths: "control" (a weekly allowance set from the current frequency) or "quit" (a pause of at most 15 days).
"""
import json, os

SOURCES = [
 {"title": "WHO ICD-11 – 6C72 Kompulsif cinsel davranış bozukluğu", "url": "https://icd.who.int/browse/2024-01/mms/en"},
 {"title": "Dickenson ve ark. (2018) – Cinsel dürtüleri kontrol güçlüğünün yaygınlığı, JAMA Network Open", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6324590/"},
 {"title": "Grubbs ve ark. (2019) – Ahlaki uyumsuzluk ve algılanan pornografi sorunları, Archives of Sexual Behavior", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8987424"},
 {"title": "Crosby ve Twohig (2016) – Problemli internet pornografisi kullanımında ACT, Behavior Therapy", "url": "https://pubmed.ncbi.nlm.nih.gov/27157029"},
 {"title": "Hallberg ve ark. (2019) – Hiperseksüel bozuklukta grup BDT, randomize çalışma", "url": "https://pubmed.ncbi.nlm.nih.gov/30956109/"},
 {"title": "Gollwitzer ve Sheeran (2006) – Eğer-o zaman planları meta-analizi", "url": "https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f"},
 {"title": "Rider ve ark. (2016) – Boşalma sıklığı ve prostat kanseri riski, European Urology", "url": "https://pubmed.ncbi.nlm.nih.gov/27033442/"},
 {"title": "Perelman (2016) – Gecikmiş boşalmada psikoseksüel terapi ve mastürbasyon tarzı", "url": "https://tau.amegroups.org/article/view/11164/11777"},
 {"title": "Leproult ve Van Cauter (2011) – Uyku kısıtlaması ve testosteron, JAMA", "url": "https://stacks.cdc.gov/view/cdc/212252"},
]


def sec(title, text):
    return {"title": title, "text": text}


CAMPUS = {
 "id": "masturbation",
 "title": "Mastürbasyon Bağımlılığı Kampüsü",
 "emoji": "🧭",
 "description": "Kontrolü yeniden ele al: tetikleyicilerini tanı, ortamını düzenle, dürtü anında ne yapacağını bil.",
 "reviewed": False,

 # Self-check (not a diagnosis). Based on ICD-11 CSBD features; "last 6 months".
 "check": {
  "questions": [
   {"id": "control", "text": "Bırakmak ya da azaltmak istediğin hâlde birçok kez başaramadın mı?"},
   {"id": "more", "text": "Planladığından çok daha sık ya da uzun süre yaptığın oluyor mu?"},
   {"id": "neglect", "text": "Uykun, işin, derslerin ya da ilişkilerin bu yüzden aksıyor mu?"},
   {"id": "joyless", "text": "Artık pek keyif vermediği hâlde devam ediyor musun?"},
   {"id": "escape", "text": "Çoğu zaman stres, yalnızlık ya da can sıkıntısından kaçmak için mi yapıyorsun?"},
   {"id": "distress", "text": "Bu durum sende belirgin bir sıkıntı ya da huzursuzluk yaratıyor mu?"},
  ],
  "values": {"id": "values", "text": "Rahatsızlığın daha çok bunun değerlerinle (dini ya da ahlaki) çelişmesinden mi kaynaklanıyor?"},
  "bands": [
   {"id": "low", "max": 1, "title": "Kontrol kaybı belirtisi az", "text": "Yanıtların belirgin bir kontrol kaybına işaret etmiyor. Yine de alışkanlığını düzenlemek istiyorsan kampüs bunun için de uygun."},
   {"id": "some", "max": 3, "title": "Bazı kontrol zorlukları var", "text": "Bazı alanlarda kontrolün zorlandığını gösteriyor. Tetikleyicilerini tanımak ve ortamını düzenlemek burada en çok işe yarayan adımlardır."},
   {"id": "high", "max": 6, "title": "Belirgin kontrol kaybı", "text": "Yanıtların belirgin bir kontrol kaybına işaret ediyor. Kampüs sana yardımcı olabilir; ayrıca bir uzmandan destek almak süreci çok kolaylaştırır."},
  ],
  "valuesNote": "Uzmanlara göre yalnızca değerlerle çatışmadan doğan sıkıntı tek başına bir bozukluk anlamına gelmez. Yaşadığın sıkıntı yine de gerçektir; kampüs hedefini kendi değerlerine göre belirlemene yardım eder.",
  "disclaimer": "Bu kısa değerlendirme bir tanı aracı değildir; yalnızca nereden başladığını görmen içindir.",
 },

 "reasons": [
  {"id": "time", "emoji": "⏰", "label": "Zamanımı geri kazanmak"},
  {"id": "sleep", "emoji": "😴", "label": "Daha iyi uyumak"},
  {"id": "relationship", "emoji": "💞", "label": "İlişkime ve yakınlığa yer açmak"},
  {"id": "control", "emoji": "🧭", "label": "Kontrolün bende olduğunu hissetmek"},
  {"id": "focus", "emoji": "🎯", "label": "Odaklanmamı artırmak"},
  {"id": "guilt", "emoji": "🌿", "label": "Pişmanlık ve suçluluğu azaltmak"},
  {"id": "values", "emoji": "🤲", "label": "Değerlerimle uyumlu yaşamak"},
  {"id": "energy", "emoji": "⚡", "label": "Günlük hayatıma daha çok enerji ayırmak"},
 ],

 "triggers": [
  {"id": "bed-phone", "emoji": "📱", "label": "Yatakta telefon", "plan": "Yatağa girdiğimde telefonu odanın dışında şarja takarım; uyumadan önce kitap okur ya da ışığı kapatırım."},
  {"id": "boredom", "emoji": "🥱", "label": "Can sıkıntısı", "plan": "Canım sıkıldığında önceden seçtiğim 3 etkinlikten birini yaparım: yürüyüş, bir iş ya da birini aramak."},
  {"id": "alone", "emoji": "🏠", "label": "Evde yalnız kalmak", "plan": "Evde yalnız kalacağımı bildiğim günler için bir plan yaparım; kapımı açık bırakır, ortak alanda otururum ya da dışarı çıkarım."},
  {"id": "stress", "emoji": "😣", "label": "Stres ve gerginlik", "plan": "Gergin hissettiğimde Dürtü geldi butonuna basar, nefes alır ve beni sakinleştiren başka bir şey yaparım."},
  {"id": "lonely", "emoji": "🫥", "label": "Yalnızlık", "plan": "Yalnız hissettiğimde bir arkadaşıma ya da aileme mesaj atar, gerçek bir bağlantı kurmaya çalışırım."},
  {"id": "insomnia", "emoji": "🌙", "label": "Uyuyamamak", "plan": "20 dakika uyuyamazsam kalkar, loş ışıkta sakin bir şey yapar ve uykum gelince yatağa dönerim."},
  {"id": "content", "emoji": "🔥", "label": "Sosyal medyada tetikleyici içerik", "plan": "Beni tetikleyen hesapları takipten çıkarır, karşıma çıktığında hemen uygulamayı kapatırım."},
  {"id": "alcohol", "emoji": "🍺", "label": "Alkol sonrası", "plan": "Alkol aldığım gecelerde telefonu yatak odasına sokmam ve eve dönünce doğrudan uyumaya geçerim."},
  {"id": "low-mood", "emoji": "🌧️", "label": "Üzüntü ya da tartışma sonrası", "plan": "Üzgün olduğumda duygumu bir cümleyle not eder, kendimi oyalamak yerine onunla ilgilenmenin yolunu ararım."},
  {"id": "morning", "emoji": "🌅", "label": "Sabah yatakta oyalanmak", "plan": "Uyanınca yatakta kalmam; hemen kalkar, perdeyi açar ve yüzümü yıkarım."},
 ],

 "env": [
  {"id": "phone-out", "text": "Telefonu geceleri yatak odasının dışında şarj et", "detail": "Kayma çoğu zaman gece, yatakta ve telefonla olur. Bu tek değişiklik en etkili adımlardandır."},
  {"id": "filter", "text": "Telefonunda içerik filtresi ve ekran süresi sınırı aç", "detail": "Telefon ayarlarındaki ebeveyn denetimi veya ekran süresi bölümünden yetişkin içeriği engelleyebilirsin."},
  {"id": "unfollow", "text": "Tetikleyici hesapları ve uygulamaları kaldır", "detail": "Seni tetikleyen hesapları takipten çıkar; gerekirse bazı uygulamaları bir süre sil."},
  {"id": "alone-plan", "text": "Evde yalnız kalacağın zamanlar için plan yap", "detail": "O saatlerde ne yapacağını önceden seç: spor, dışarı çıkmak, ortak alanda çalışmak."},
  {"id": "night", "text": "Bir uyku rutini belirle", "detail": "Her gece aynı saatte yat; yatmadan 30 dakika önce ekranı bırak."},
  {"id": "actions", "text": "Dürtü anı için 3 eylem seç", "detail": "Dürtü geldi ekranındaki eylemlerden sana en uygun üçünü belirle; kriz anında düşünmek zorunda kalmazsın."},
  {"id": "person", "text": "İstersen güvendiğin birine hedefinden bahset", "detail": "Zorunlu değil; ama biriyle paylaşmak hedefine bağlılığı artırabilir."},
 ],

 "paths": {
  "control": {
   "emoji": "⚖️", "title": "Kontrol altına al",
   "text": "Tamamen bırakmadan, haftalık bir hak sınırı içinde kalmayı öğrenirsin. Mastürbasyon normal bir davranıştır; amaç onu senin planladığın sıklığa indirmek.",
   "points": ["Şu anki sıklığına göre haftalık hakkın belirlenir.", "Her hafta haklarını nasıl kullanacağını sen seçersin.", "Sınır içinde kalınan haftalar serini büyütür."],
  },
  "quit": {
   "emoji": "⛔", "title": "Tamamen kes",
   "text": "Kısa ve net bir süre için tamamen ara verirsin. Döngüyü kırmak ve dürtülerin geçici olduğunu görmek için güçlü bir başlangıçtır.",
   "points": ["En fazla 15 günlük bir hedef seçersin: 7, 10 ya da 15 gün.", "Bu süre boyunca hiç yapmamayı hedeflersin.", "Hedefe ulaşınca yeniden başlayabilir ya da kontrol yoluna geçebilirsin."],
  },
 },
 # Current weekly frequency → weekly allowance in the "control" path.
 "baselines": [
  {"id": "gt14", "label": "Haftada 14'ten fazla kez", "hint": "Günde 2 kereden fazla", "limit": 5},
  {"id": "10to14", "label": "Haftada 10–14 kez", "hint": "Günde 1–2 kez", "limit": 3},
  {"id": "7to9", "label": "Haftada 7–9 kez", "hint": "Hemen hemen her gün", "limit": 2},
  {"id": "lt7", "label": "Haftada 7 kereden az", "hint": "Her gün değil", "limit": 1},
 ],
 "quitGoals": [7, 10, 15],

 "urge": {
  "actions": [
   {"id": "shower", "emoji": "🚿", "title": "Duş al", "minutes": 5, "steps": ["Hemen kalk ve banyoya git.", "Ilık ya da serin bir duş al.", "Çıkınca giyin ve odadan farklı bir yere geç."]},
   {"id": "leave", "emoji": "🚪", "title": "Ortamı değiştir", "minutes": 3, "steps": ["Bulunduğun odadan çık.", "Işıkları aç, perdeyi aç.", "Ortak bir alana ya da dışarı geç."]},
   {"id": "move", "emoji": "🏃", "title": "Hareket et", "minutes": 5, "steps": ["20 squat ya da 10 şınav yap.", "Ardından birkaç dakika tempolu yürü.", "Nefesinin sakinleşmesini bekle."]},
   {"id": "talk", "emoji": "💬", "title": "Biriyle konuş", "minutes": 5, "steps": ["Bir arkadaşına ya da ailenden birine yaz.", "Konunun ne olduğu önemli değil; bağlantı kur.", "Mümkünse kısa bir telefon görüşmesi yap."]},
   {"id": "breathe", "emoji": "🌬️", "title": "Yavaş nefes", "minutes": 3, "steps": ["Burnundan 4 saniye al.", "Ağzından 6 saniyede yavaşça ver.", "Dürtüyü fark et; onunla savaşmadan geçmesine izin ver."]},
   {"id": "busy", "emoji": "📚", "title": "Telefonu bırak, meşgul ol", "minutes": 10, "steps": ["Telefonu başka bir odaya bırak.", "Elini ve aklını meşgul eden bir şey seç: kitap, ev işi, bir hobi.", "Süre dolunca nasıl hissettiğine bak."]},
  ],
  "tips": [
   "Dürtü bir dalga gibidir: yükselir, zirve yapar ve kendiliğinden azalır.",
   "Düşünceyi bastırmaya çalışmak onu güçlendirir. Fark et, adını koy ve ne yapacağını sen seç.",
   "Bir dürtüyü yaşamak bir şey yapmak zorunda olduğun anlamına gelmez.",
   "Her atlattığın dürtü, bir sonrakini biraz daha kolaylaştırır.",
  ],
 },

 "lapse": [
  "Bir kayma, başarısız olduğun anlamına gelmez. Değişim çoğu zaman düz bir çizgide ilerlemez.",
  "En büyük tehlike kaymanın kendisi değil, 'zaten bozdum, artık fark etmez' düşüncesidir. Bu düşünce tek bir kaymayı uzun bir döneme çevirebilir.",
  "Ne oldu? Saat, yer, duygu ve tetikleyici bir sonraki sefere hazırlanman için en değerli bilgidir.",
  "Öğrendiklerin ve geçirdiğin kontrollü günler seninle kalır.",
 ],

 # Possible harms when it becomes frequent, compulsive or hard to control (not of masturbation itself).
 "harms": {
  "intro": "Mastürbasyonun kendisi zararlı değildir. Aşağıdakiler daha çok mastürbasyon çok sık, kontrolsüz ve zorlayıcı hâle geldiğinde görülebilir.",
  "items": [
   {"id": "skin", "emoji": "🩹", "title": "Cilt tahrişi ve şişlik", "text": "Sık ve sert sürtünme penis derisinde kızarıklık, sıyrık ya da hafif şişliğe yol açabilir. Genellikle birkaç günlük arayla kendiliğinden geçer."},
   {"id": "partner", "emoji": "🎯", "title": "Partnerle hassasiyet ve gecikmiş boşalma", "text": "Çok sıkı tutuş, hızlı ritim ya da hep aynı yöntem; partnerle ilişkide uyarılmayı ve boşalmayı zorlaştırabilir. Klinik gözlemlere göre sık ve alışılmış bir mastürbasyon tarzı, gecikmiş boşalmanın sık görülen nedenleri arasındadır."},
   {"id": "sleep", "emoji": "😴", "title": "Uyku ve enerji", "text": "Gece geç saatlere uzayan oturumlar uykuyu kısaltır. Bir hafta boyunca gecede 5 saat uyumak sağlıklı genç erkeklerde testosteronu %10–15 düşürdü; yorgunluk ve odak kaybı da buna eşlik eder."},
   {"id": "time", "emoji": "⏳", "title": "Zaman ve sorumluluklar", "text": "Kontrolden çıktığında iş, ders, spor ve arkadaşlar için ayrılan zamandan çalar. Bu, kompulsif cinsel davranışın temel işaretlerinden biridir."},
   {"id": "mood", "emoji": "😔", "title": "Suçluluk, kaygı ve düşük ruh hâli", "text": "Kontrol kaybı yaşayan kişilerde utanç, kaygı ve keyifsizlik daha sık görülür. Kısa süreli rahatlama, ardından gelen pişmanlıkla bir döngüye dönüşebilir."},
   {"id": "relationship", "emoji": "💞", "title": "İlişki ve yakınlık", "text": "Partnerle cinselliğe isteksizlik, gizlilik ve buna bağlı çatışmalar ortaya çıkabilir."},
   {"id": "porn", "emoji": "📱", "title": "Pornografi döngüsü", "text": "18–35 yaş arası 3.400'den fazla erkekle yapılan bir araştırmada izleme sıklığı değil, kontrol edilemeyen (problemli) pornografi kullanımı sertleşme sorunu olasılığıyla ilişkili bulundu."},
  ],
  "note": "Görme bozukluğu, kısırlık, saç dökülmesi ya da kalıcı güç kaybı gibi iddiaların bilimsel bir dayanağı yoktur.",
 },

 "facts": [
  {"id": "harm", "myth": "Mastürbasyon kısırlık, görme bozukluğu ya da güç kaybı yapar.", "fact": "Bilimsel bir kanıt yoktur. Mastürbasyon her yaşta yaygın ve sağlıklı bir cinsel davranıştır; sorun olan sıklık değil, kontrolün kaybedilmesidir."},
  {"id": "retention", "myth": "Uzun süre boşalmamak özel bir güç, enerji ya da testosteron artışı sağlar.", "fact": "Bunu gösteren güvenilir bir araştırma yoktur. Ara vermenin değeri, kontrolü yeniden kazanmak ve zamanını istediğin şeylere ayırmaktır."},
  {"id": "prostate", "myth": "Sık boşalmak prostata zarar verir.", "fact": "31.000'den fazla erkeğin izlendiği bir çalışmada ayda 21 kez ve daha fazla boşalan erkeklerde prostat kanseri riski daha düşük bulundu. Bu bir ilişkidir, kesin bir etki kanıtı değildir."},
  {"id": "label", "myth": "Kendini bağımlı hissediyorsan kesinlikle bağımlısındır.", "fact": "Araştırmalar, davranış değerlerle çeliştiğinde kişinin kendini bağımlı hissetme olasılığının belirgin şekilde arttığını gösteriyor. Hissettiğin sıkıntı gerçektir; ama her zaman bir bozukluk anlamına gelmez."},
  {"id": "alone", "myth": "Bu sorunu yaşayan tek kişi benim.", "fact": "ABD'de yapılan bir araştırmada erkeklerin yaklaşık %10'u cinsel dürtülerini kontrol etmekte zorlandığını ve bundan belirgin sıkıntı duyduğunu bildirdi."},
 ],

 "help": [
  {"id": "therapy", "title": "Psikolog ya da psikiyatrist", "text": "Bu konuda en çok araştırılan yöntemler bilişsel davranışçı terapi (BDT) ve kabul ve kararlılık terapisidir (ACT). Kaygı, depresyon ya da yalnızlık eşlik ediyorsa birlikte ele almak sonuçları iyileştirir.", "phone": None},
 ],

 "steps": [
  {"id": "what", "emoji": "🧭", "title": "Bu kampüs ne yapar?", "summary": "Amaç mastürbasyonu kötülemek değil, kontrolün sende olmasını sağlamak.",
   "sections": [
    sec("Mastürbasyon normal mi?", "Evet. Mastürbasyon her yaşta yaygın ve sağlıklı bir cinsel davranıştır. Bu kampüs, bunu kendi isteğine rağmen kontrol edemediğini hisseden ya da bir süre ara vermek isteyenler içindir."),
    sec("Sorun ne zaman başlar?", "Dünya Sağlık Örgütü'nün sınıflamasında (ICD-11) bu durum kompulsif cinsel davranış bozukluğu olarak geçer: tekrarlayan ve kontrol edilemeyen dürtüler, bırakmaya yönelik başarısız denemeler, hayatın diğer alanlarının aksaması ve keyif vermediği hâlde devam etmek. Belirleyici olan sıklık değil, kontroldür."),
    sec("Yalnız değilsin", "ABD'de yapılan bir araştırmada erkeklerin yaklaşık %10'u cinsel dürtülerini kontrol etmekte zorlandığını ve bundan belirgin sıkıntı duyduğunu bildirdi."),
    sec("Nasıl çalışır?", "Kampüs, bu konuda en çok araştırılan yöntemlere dayanır: tetikleyicileri tanımak, ortamı düzenlemek, eğer-o zaman planları yapmak ve dürtüyle savaşmadan onu yönetmek. İki yoldan birini seçersin: haftalık bir hak sınırıyla kontrol altına almak ya da en fazla 15 gün tamamen ara vermek."),
   ],
   "actions": ["Bırakmak istemenin nedenlerini düşün.", "Kendine dürüst ol; burada kimse seni yargılamaz."]},
  {"id": "cycle", "emoji": "🔁", "title": "Döngüyü tanı", "summary": "Çoğu kayma rastgele değildir; tanıdık bir döngüyü izler.",
   "sections": [
    sec("Döngü", "Tetikleyici (yalnızlık, stres, yatakta telefon) → dürtü → küçük adımlar (bir şeye bakmak, odayı kapatmak) → davranış → kısa bir rahatlama → pişmanlık ya da boşluk hissi. Bu his yeni bir strese, o da yeni bir döngüye dönüşebilir."),
    sec("Küçük adımlar", "Döngüyü kırmanın en kolay yeri, davranıştan önceki küçük adımlardır. Telefonu yatağa almak ya da belirli bir uygulamayı açmak gibi ilk adımları fark ettiğinde durmak, son adımda durmaktan çok daha kolaydır."),
    sec("Dört kritik durum", "Aç, öfkeli, yalnız ve yorgun olduğun anlar dürtülerin en güçlü olduğu zamanlardır. Bu dört durumu fark etmek, kendini önceden korumana yardım eder."),
   ],
   "actions": ["Seni en çok tetikleyen durumları seç.", "Her biri için bir eğer-o zaman planı belirle."]},
  {"id": "environment", "emoji": "🏡", "title": "Ortamını düzenle", "summary": "İrade sınırlıdır; ortamı değiştirmek dürtünün ortaya çıkmasını baştan azaltır.",
   "sections": [
    sec("Neden ortam?", "Alışkanlıklar belirli yer, saat ve araçlara bağlanır. Kaymaların büyük kısmı tahmin edilebilir yerlerde olur: gece, yatakta, telefonla ve yalnızken. Bu bağlantıyı kesmek, her seferinde iradeyle savaşmaktan çok daha etkilidir."),
    sec("Eğer-o zaman planları", "'Eğer yatağa girersem, telefonu odanın dışında bırakırım' gibi somut planlar, hedefe ulaşma olasılığını belirgin şekilde artırır. 94 çalışmayı bir araya getiren bir analizde bu tür planların hedefe ulaşmada orta-büyük bir etkisi bulundu."),
    sec("Filtreler", "İçerik filtreleri tek başına yeterli değildir ama ilk dürtü ile davranış arasına zaman koyar. O birkaç saniye, fikrini değiştirmen için çoğu zaman yeterlidir."),
   ],
   "actions": ["Telefonun geceleri nerede kalacağına karar ver.", "Kayıt sonunda ortam listeni oluştur."]},
  {"id": "urges", "emoji": "🌊", "title": "Dürtüyle başa çıkma", "summary": "Dürtüyü bastırmaya çalışmak yerine fark et, adını koy ve ne yapacağını sen seç.",
   "sections": [
    sec("Bastırmak neden işe yaramaz?", "Bir düşünceyi zorla bastırmaya çalışmak onu daha sık akla getirir. Kabul ve kararlılık terapisi (ACT) bu yüzden dürtüyle savaşmak yerine onu fark etmeyi ve değerlerine uygun bir şey yapmayı öğretir."),
    sec("İşe yarıyor mu?", "28 erkekle yapılan randomize bir çalışmada 12 seanslık ACT sonrasında problemli pornografi izleme, bekleme listesindeki %21'lik azalmaya karşılık %93 azaldı. Çalışma küçüktür, ama bu yöntemin umut verici olduğunu gösterir."),
    sec("Dürtü anında", "Dürtü geldi butonuna bas, sana uygun bir eylem seç ve süre bitene kadar onu yap: duş almak, ortamı değiştirmek, hareket etmek, biriyle konuşmak. Amaç, dürtü ile davranış arasına zaman ve mesafe koymaktır."),
   ],
   "actions": ["Dürtü geldi ekranındaki eylemlere göz at.", "Sana en uygun üç eylemi aklında tut."]},
  {"id": "lapse", "emoji": "🧩", "title": "Kayma olursa", "summary": "Bir kayma bir başarısızlık değil, öğrenme fırsatıdır.",
   "sections": [
    sec("Ya hep ya hiç tuzağı", "Nüks önleme araştırmalarında en sık görülen tuzak, tek bir kaymadan sonra 'zaten bozdum' diyerek tamamen bırakmaktır. Bu düşünce, küçük bir kaymayı uzun bir döneme çevirir."),
    sec("Ne yapmalı?", "Kaymayı kaydet, kendini suçlamadan ne olduğunu düşün: saat kaçtı, neredeydin, ne hissediyordun? Bu bilgiyle planını güçlendir ve hemen yeni bir gün başlat."),
    sec("Kampüste nasıl işler?", "Kontrol yolunda haftalık hakkını aşarsan o hafta sınırın dışında kalır, yeni hafta temiz başlar. Tamamen kes yolunda tek bir fire sayacını bozmaz; aynı denemede ikinci fire olursa deneme sona erer ve yeniden başlarsın. İlerleme tek bir sayıdan ibaret değildir."),
   ],
   "actions": ["Olanı ilgili butonla dürüstçe kaydet.", "Sonraki ilk saat için bir plan belirle."]},
  {"id": "support", "emoji": "🤝", "title": "Destek ve uzun vade", "summary": "Boşalan zamanı anlamlı şeylerle doldurmak, kalıcı değişimin anahtarıdır.",
   "sections": [
    sec("Boşluğu doldur", "Bir alışkanlığı bırakmak, onun gördüğü işi başka bir şeyle karşılamayı gerektirir: stres için hareket, yalnızlık için insanlarla bağlantı, can sıkıntısı için yeni bir uğraş."),
    sec("Uyku ve hareket", "Düzenli uyku ve egzersiz hem dürtüleri hem de stresi azaltır. Kampüsün yanında Kegel antrenmanların ve nefes araçların da bu dengeye katkı sağlar."),
    sec("Profesyonel destek", "Bilişsel davranışçı terapinin bu konuda işe yaradığını gösteren randomize çalışmalar vardır. Kontrol kaybı ağırsa ya da kaygı, depresyon gibi sorunlar eşlik ediyorsa bir uzmandan destek almak süreci çok kolaylaştırır."),
   ],
   "actions": ["Bu hafta yeni bir uğraş ya da etkinlik planla.", "Gerekirse destek almaktan çekinme."]},
 ],

 "sources": SOURCES,
}

ids = [s["id"] for s in CAMPUS["steps"]]
assert ids == ["what", "cycle", "environment", "urges", "lapse", "support"], ids
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'masturbation.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(CAMPUS, f, ensure_ascii=False, indent=2)
print('masturbation campus:', len(CAMPUS["steps"]), 'steps,', len(CAMPUS["triggers"]), 'triggers,', len(CAMPUS["urge"]["actions"]), 'actions')
