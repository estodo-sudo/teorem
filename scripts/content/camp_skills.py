"""Generates src/content/camp/skills.tr.json — Sigarasız Kamp ACT skill lessons (K8).

Original Turkish text, reviewed=false. The core is Acceptance and Commitment Therapy (iCanQuit:
Bricker et al., 2020; mechanism: accepting urges and the feelings behind them). Lessons open in order;
answers about earlier relapse causes bring the related lessons forward. No medication names or doses.
"""
import json, os


def sl(emoji, title, text, did=None):
    s = {"emoji": emoji, "title": title, "text": text}
    if did:
        s["didYouKnow"] = did
    return s


def q(question, options, answer, explain):
    return {"q": question, "options": options, "answer": answer, "explain": explain}


ACT = ["bricker2020", "bricker2021"]
LESSONS = [
 {"id": "values", "emoji": "🧭", "title": "Değerlerin", "summary": "Sigarasız hayatta neye önem veriyorsun?", "relapse": [], "sourceIds": ACT,
  "slides": [
   sl("🧭", "Pusulan ne gösteriyor?", "Değerler, hayatta neyin önemli olduğunu gösteren pusulandır: sağlık, aile, özgürlük, merak, emek. Hedefler bir gün biter, değerler hep yol gösterir."),
   sl("💡", "Neden önemli?", "İstek geldiğinde \"Bu sigara beni önem verdiğim şeye yaklaştırır mı, uzaklaştırır mı?\" diye sormak, kararını kolaylaştırır."),
   sl("👨‍👩‍👧", "Somut hale getir", "\"Sağlık\" yerine \"Kızımla koşabilmek\" gibi somut bir cümle, zor anda daha güçlü bir hatırlatıcıdır."),
   sl("🌱", "Mükemmel olmak gerekmez", "Değerlere göre yaşamak her gün kusursuz olmak değil; her seferinde yönünü yeniden onlara çevirmektir."),
  ],
  "practice": {"title": "Uygula", "text": "Senin için en önemli iki değeri seç ve her biri için sigarasız hayatta yapmak istediğin bir şeyi yaz. Bu cümleleri nedenlerine ekleyebilirsin."},
  "quiz": [q("İstek geldiğinde değerler nasıl yardım eder?", ["İsteği tamamen yok eder", "Sigaranın beni önem verdiğim şeye yaklaştırıp yaklaştırmadığını sormamı sağlar", "Sadece motivasyon sözüdür"], 1, "Değerler isteği silmez; ama hangi yöne gitmek istediğini hatırlatarak seçim yapmanı kolaylaştırır.")]},
 {"id": "wave", "emoji": "🌊", "title": "İstek bir dalgadır", "summary": "İsteğin doğası: yükselir, zirve yapar, söner.", "relapse": ["withdrawal"], "sourceIds": ACT + ["nci-withdrawal"],
  "slides": [
   sl("🌊", "İstek nasıl davranır?", "Sigara isteği bir dalga gibidir: yükselir, zirveye ulaşır ve sonra alçalır. Çoğu istek birkaç dakika içinde zirve yapar."),
   sl("⏱️", "Zaman senden yana", "İsteğe hemen karşılık vermediğinde dalga kendiliğinden söner. Her seferinde beynin, isteğin geçebileceğini öğrenir."),
   sl("📉", "Zamanla seyrekleşir", "İlk günlerde istekler sık ve güçlüdür. Haftalar geçtikçe hem sıklıkları hem şiddetleri azalır.", "Yoksunluk belirtileri genellikle ilk hafta en yoğundur ve ilk ay içinde belirgin şekilde azalır."),
   sl("🏄", "Savaşmak yerine sörf", "İstekle savaşmak onu büyütebilir. Onu fark edip üzerinde durmak, dalganın geçmesine izin vermektir."),
  ],
  "practice": {"title": "Uygula", "text": "Bir sonraki istekte saati kontrol et ve isteğin ne kadar sürdüğünü gözlemle. Çoğu zaman düşündüğünden kısa sürdüğünü fark edeceksin."},
  "quiz": [q("Sigara isteği genellikle nasıl ilerler?", ["Sigara içene kadar sürekli artar", "Yükselir, zirve yapar ve kendiliğinden azalır", "Hiç değişmez"], 1, "İstekler dalga gibidir; karşılık vermediğinde zirveden sonra kendiliğinden azalır.")]},
 {"id": "surf", "emoji": "🏄", "title": "Dalga sörfü pratiği", "summary": "İstekle birlikte durabilmeyi rehberli pratikle öğren.", "relapse": ["withdrawal"], "sourceIds": ACT,
  "slides": [
   sl("👀", "1. Fark et", "İstek geldiğinde kendine söyle: \"Şu an sigara isteği hissediyorum.\" Adını koymak, isteğe kapılmadan onu görmeni sağlar."),
   sl("🫁", "2. Bedende bul", "İsteği bedeninin neresinde hissediyorsun? Göğüs, boğaz, eller, mide? Hissin şeklini, sıcaklığını, yoğunluğunu merakla incele."),
   sl("🌬️", "3. Nefesle eşlik et", "Nefesin doğal aksın. Her nefeste isteğe biraz daha yer aç; onu itmeye ya da kovmaya çalışma."),
   sl("📈", "4. Dalgayı izle", "His artabilir, değişebilir, azalabilir. Sadece izle. Zirve geçtiğinde, sigara içmeden bir dalgayı atlatmış olursun."),
  ],
  "practice": {"title": "Uygula", "text": "\"Canım çekiyor\" aracındaki dalga sörfünü bir istek anında 3 dakika boyunca dene. İstek yoksa bile bugün bir kez pratik yap."},
  "quiz": [q("Dalga sörfünün amacı nedir?", ["İsteği yok etmek", "İstekle birlikte durabilmek ve geçmesine izin vermek", "Sigarayı ertelemek için kendini zorlamak"], 1, "Amaç isteği silmek değil, onunla birlikte durabilmek; iCanQuit çalışmasındaki temel beceri de budur.")]},
 {"id": "thoughts", "emoji": "💭", "title": "Düşünceler sadece düşüncedir", "summary": "\"Bir tane bir şey olmaz\" düşüncesinden mesafe al.", "relapse": ["just_one"], "sourceIds": ACT,
  "slides": [
   sl("💭", "Zihnin konuşur", "Bırakma sürecinde zihin ikna edici cümleler kurar: \"Bir tane bir şey olmaz\", \"Bugün hak ettin\", \"Bu stresle bırakılmaz\"."),
   sl("🔍", "Düşünce ≠ gerçek", "Bir düşüncenin aklına gelmesi, onun doğru olduğu ya da ona uyman gerektiği anlamına gelmez."),
   sl("🏷️", "Etiketle", "Düşünceyi şöyle söyle: \"Aklıma 'bir tane bir şey olmaz' düşüncesi geliyor.\" Bu küçük cümle düşünceyle arana mesafe koyar."),
   sl("🚗", "Arka koltuktaki yolcu", "Düşünceleri arabanın arka koltuğundaki yolcular gibi düşün. Konuşabilirler, ama direksiyon sende.", "\"Bir tane\"den sonra yeniden başlamak, bırakmayı denemiş kişilerin en sık anlattığı deneyimlerden biridir."),
  ],
  "practice": {"title": "Uygula", "text": "Bugün sigara ile ilgili bir düşünce geldiğinde başına \"Aklıma şu düşünce geliyor:\" ekleyerek tekrar et. Hissettiğin farkı fark et."},
  "quiz": [q("\"Bir tane bir şey olmaz\" düşüncesi geldiğinde ne yapmak işe yarar?", ["Düşünceyle tartışıp onu yenmek", "Onu bir düşünce olarak fark edip uymadan geçmesine izin vermek", "Düşünce geçene kadar bir tane içmek"], 1, "Düşünceyi fark edip etiketlemek, ona uymak zorunda olmadığını hatırlatır.")]},
 {"id": "body", "emoji": "🫀", "title": "Bedensel hisleri kabul", "summary": "Gerginlik, huzursuzluk ve boşluk hissiyle durabilmek.", "relapse": ["withdrawal"], "sourceIds": ACT + ["nci-withdrawal"],
  "slides": [
   sl("🫀", "Bedenin konuşur", "Bırakınca gerginlik, huzursuzluk, ellerde boşluk ya da midede bir sıkışma hissedebilirsin. Bunlar yoksunluğun normal parçalarıdır."),
   sl("🧲", "Direnç büyütür", "Rahatsız edici bir hissi hemen gidermeye çalışmak çoğu zaman onu daha belirgin kılar."),
   sl("🛋️", "Yer aç", "Hissi düzeltmek yerine ona yer açmayı dene: \"Bu his burada olabilir, onunla birlikte de günümü sürdürebilirim.\""),
   sl("🌤️", "Geçicidir", "Bedensel yoksunluk hisleri genellikle birkaç hafta içinde azalır. Her geçen gün vücudun nikotinsiz dengeye alışır."),
  ],
  "practice": {"title": "Uygula", "text": "Bugün bir rahatsızlık hissettiğinde 60 saniye boyunca onu sadece gözlemle: nerede, nasıl, ne kadar güçlü? Sonra ne değiştiğine bak."},
  "quiz": [q("Rahatsız edici bir bedensel hisle başa çıkmanın ACT yolu hangisi?", ["Hemen gidermeye çalışmak", "Ona yer açıp onunla birlikte devam etmek", "Görmezden gelip bastırmak"], 1, "Kabul, hissi sevmek değil; ona yer açıp önem verdiğin şeyi yapmaya devam etmektir.")]},
 {"id": "emotions", "emoji": "🌦️", "title": "Duygularla çalışmak", "summary": "Stres, öfke ve can sıkıntısı (sigara olmadan).", "relapse": ["stress"], "sourceIds": ACT + ["nci-withdrawal"],
  "slides": [
   sl("🌦️", "Sigara bir duygu aracıydı", "Birçok kişi sigarayı stres, öfke ya da sıkıntıyla baş etmek için kullanır. Bırakınca bu duygular daha görünür hale gelir."),
   sl("🧯", "Sigara stresi çözmez", "Sigaranın rahatlatıyor gibi gelmesi, büyük ölçüde nikotin yoksunluğunu gidermesinden kaynaklanır. Bıraktıktan bir süre sonra birçok kişi daha sakin hisseder."),
   sl("🗣️", "Duyguya ad koy", "\"Şu an öfkeliyim\" ya da \"canım sıkılıyor\" demek, duyguyla arana küçük bir mesafe koyar ve seçim yapmanı kolaylaştırır."),
   sl("🧰", "Yeni araçlar", "Kısa bir yürüyüş, nefes egzersizi, biriyle konuşmak ya da duyguyu yazmak; sigaranın yerini alabilecek yollardır."),
  ],
  "practice": {"title": "Uygula", "text": "Bugün güçlü bir duygu yaşadığında ona bir ad koy ve sigara yerine bir aracı dene: nefes, yürüyüş ya da birine yazmak."},
  "quiz": [q("Sigaranın stresi azaltıyor gibi gelmesinin başlıca nedeni nedir?", ["Sigaranın sakinleştirici bir ilaç olması", "Nikotin yoksunluğunun geçici olarak giderilmesi", "Dumanın ciğerleri gevşetmesi"], 1, "Sigara içen biri, iki sigara arasında hafif bir yoksunluk yaşar; sigara bunu giderdiği için rahatlatıyor gibi hissettirir.")]},
 {"id": "willingness", "emoji": "🚪", "title": "İsteklilik", "summary": "Önem verdiğin şey için rahatsızlığa yer açmak.", "relapse": [], "sourceIds": ACT,
  "slides": [
   sl("🚪", "İsteklilik nedir?", "İsteklilik, önem verdiğin bir şey için rahatsız edici duygu ve düşüncelere yer açmaya razı olmaktır."),
   sl("⛰️", "Dağa tırmanmak gibi", "Zirveye çıkmak isteyen biri yorgunluğu sevmez, ama ona razı olur. Sigarasız hayat da bazı zor anlara razı olmayı gerektirir."),
   sl("🎚️", "Ya hep ya hiç değil", "İsteklilik bir anahtar gibidir: aç ya da kapat. İsteği azaltmaya çalışmak yerine ona kapıyı açmayı seçebilirsin."),
   sl("🧭", "Değerlerinle bağla", "\"Bu zorluğa neden razıyım?\" sorusunun cevabı değerlerindedir."),
  ],
  "practice": {"title": "Uygula", "text": "Bugün bir istek anında kendine sor: \"Önem verdiğim şey için bu rahatsızlığa yer açmaya razı mıyım?\" Cevabını not et."},
  "quiz": [q("İsteklilik ne anlama gelir?", ["İsteği sevmek", "Önem verdiğin şey için rahatsızlığa yer açmaya razı olmak", "İsteğe teslim olmak"], 1, "İsteklilik, rahatsızlığı sevmek değil; değerlerin için ona yer açmayı seçmektir.")]},
 {"id": "withdrawal", "emoji": "📆", "title": "Yoksunlukta ne beklemeli?", "summary": "Belirtiler, süreleri ve başa çıkma yolları.", "relapse": ["withdrawal"], "sourceIds": ["nci-withdrawal", "smokefree-withdrawal"],
  "slides": [
   sl("📆", "İlk günler", "Belirtiler genellikle bırakmadan sonraki ilk birkaç günde zirve yapar. İlk hafta en zor dönemdir."),
   sl("😤", "Sık görülen belirtiler", "Sigara isteği, sinirlilik, huzursuzluk, odaklanma güçlüğü, uyku sorunları ve iştah artışı en sık yaşananlardır."),
   sl("📉", "Ne kadar sürer?", "Çoğu belirti ilk ay içinde belirgin şekilde azalır. Sinirlilik ilk haftada en yoğundur ve 2–4 hafta sürebilir.", "Yoksunluk belirtileri vücudun nikotinsiz yaşamaya alıştığının işaretidir; geçicidir."),
   sl("🛠️", "Başa çıkma", "Günlük kontroldeki belirti ipuçları her belirti için kısa öneriler sunar. Destek almak da yoksunluğu kolaylaştırır."),
  ],
  "practice": {"title": "Uygula", "text": "Bugünkü kontrolünde hissettiğin belirtileri işaretle ve önerilerden birini dene."},
  "quiz": [q("Yoksunluk belirtileri genellikle ne zaman en yoğundur?", ["Bıraktıktan bir yıl sonra", "Bırakmadan sonraki ilk günlerde", "Hiçbir zaman azalmaz"], 1, "Belirtiler genellikle ilk günlerde zirve yapar ve ilk ay içinde belirgin şekilde azalır.")]},
 {"id": "weight", "emoji": "⚖️", "title": "Kilo alma endişesi", "summary": "Gerçekler ve küçük stratejiler.", "relapse": ["weight"], "sourceIds": ["nci-withdrawal", "smokefree-withdrawal"],
  "slides": [
   sl("⚖️", "Bir endişe, bir gerçek", "Bıraktıktan sonra bazı kişiler biraz kilo alabilir. Bunun nedenleri arasında iştahın artması ve metabolizmadaki küçük değişiklikler vardır."),
   sl("❤️", "Kazanç daha büyük", "Sigarayı bırakmanın sağlığa faydaları, birkaç kilonun olası etkilerinden çok daha büyüktür."),
   sl("🍎", "Küçük stratejiler", "Öğün atlamamak, elinin altında meyve ve sebze bulundurmak, su içmek ve her gün biraz hareket etmek yardımcı olur."),
   sl("🎯", "Önce dumansız kal", "İlk haftalarda önceliğin dumansız kalmak. Beslenmeye dair büyük değişiklikleri, kendini daha güçlü hissettiğinde yapabilirsin."),
  ],
  "practice": {"title": "Uygula", "text": "Yarın için elinin altında bulunacak iki sağlıklı atıştırmalık seç ve hazırla."},
  "quiz": [q("Kilo endişesi için ilk haftalarda en iyi yaklaşım hangisi?", ["Sıkı bir diyete başlamak", "Önceliği dumansız kalmaya verip küçük, sürdürülebilir adımlar atmak", "Kilo almamak için sigaraya dönmek"], 1, "Küçük adımlar yeterlidir; asıl kazanç dumansız kalmaktır.")]},
 {"id": "social", "emoji": "👥", "title": "Sosyal baskı ve \"hayır\" demek", "summary": "Arkadaş ortamları ve teklifler.", "relapse": ["social", "alcohol"], "sourceIds": ACT,
  "slides": [
   sl("👥", "Ortamlar tetikler", "Sigara içilen arkadaş ortamları, düğünler, kahvehaneler ve alkollü buluşmalar güçlü tetikleyicilerdir."),
   sl("🙅", "Kısa ve net", "\"Teşekkürler, bıraktım\" yeterlidir. Açıklama yapmak zorunda değilsin."),
   sl("🗺️", "Önceden planla", "Ortama girmeden önce ne içeceğini, nerede duracağını ve teklif gelirse ne diyeceğini düşün."),
   sl("🍺", "Alkol dikkat", "Alkol kararlılığı zayıflatabilir. İlk haftalarda alkollü ortamlardan kaçınmak ya da sınırlı tutmak işini kolaylaştırır."),
  ],
  "practice": {"title": "Uygula", "text": "Bu hafta karşılaşabileceğin bir sosyal durum için Eğer–O zaman planı yaz ve \"hayır\" cümleni bir kez yüksek sesle söyle."},
  "quiz": [q("Biri sigara uzattığında en işe yarar cevap hangisi olabilir?", ["Uzun bir açıklama yapmak", "\"Teşekkürler, bıraktım\" gibi kısa ve net bir cümle", "Bir tane alıp içmemek"], 1, "Kısa ve net bir cevap tartışmaya yer bırakmaz ve kararını güçlendirir.")]},
 {"id": "slip", "emoji": "🌱", "title": "Kayma çöküş değildir", "summary": "Öz-şefkat ve geri dönmek.", "relapse": ["just_one"], "sourceIds": ACT,
  "slides": [
   sl("🌱", "Kayma olabilir", "Bir ya da birkaç sigara içmek, bırakma sürecinde sık yaşanır. Bu, yolculuğun bittiği anlamına gelmez."),
   sl("🧱", "\"Zaten bozdum\" tuzağı", "En büyük risk, bir sigaradan sonra \"artık bozdum\" diyerek tamamen bırakmaktan vazgeçmektir."),
   sl("🤲", "Öz-şefkat", "Kendine bir arkadaşına davranır gibi davran. Kendini suçlamak yerine ne olduğunu anlamaya çalış."),
   sl("🧭", "Öğren ve devam et", "Kaymanın tetikleyicisini bul, onun için yeni bir plan yap ve programa devam et. Toplam dumansız günlerin korunur."),
  ],
  "practice": {"title": "Uygula", "text": "\"Bir kayma olursa ne yapacağım?\" sorusunun cevabını şimdiden yaz: kaydet, nedenini incele, yeni plan yap, devam et."},
  "quiz": [q("Bir kaymadan sonra en yararlı adım hangisi?", ["Kendini suçlayıp programı bırakmak", "Ne olduğunu anlayıp yeni bir plan yapmak ve devam etmek", "Hiçbir şey olmamış gibi davranmak"], 1, "Kaymadan öğrenmek ve devam etmek, bırakma yolculuğunun önemli bir parçasıdır.")]},
 {"id": "identity", "emoji": "🪪", "title": "Yeni kimliğin", "summary": "\"Ben sigara içmeyen biriyim.\"", "relapse": [], "sourceIds": ACT,
  "slides": [
   sl("🪪", "Kimlik değişir", "\"Sigarayı bırakmaya çalışan biri\" ile \"sigara içmeyen biri\" arasında küçük ama güçlü bir fark vardır."),
   sl("🗣️", "Dilini değiştir", "\"İçemem\" yerine \"İçmiyorum\" demek, seçimin sana ait olduğunu hatırlatır."),
   sl("🔁", "Her seçim bir oy", "Her sigarasız gün, olmak istediğin kişi için verilmiş bir oy gibidir. Oylar biriktikçe yeni kimliğin güçlenir."),
   sl("🌄", "Uzun vade", "Zamanla sigara, hayatının bir parçası olmaktan çıkar. Bu kampın sonunda bile yeni alışkanlıklarını sürdürmek önemlidir."),
  ],
  "practice": {"title": "Uygula", "text": "Bugün en az bir kez kendini \"sigara içmeyen biri\" olarak tanıt ya da düşün."},
  "quiz": [q("Hangi cümle yeni kimliği daha çok destekler?", ["\"Sigara içemem\"", "\"Sigara içmiyorum\"", "\"Şimdilik içmiyorum ama...\""], 1, "\"İçmiyorum\" demek seçimin senin olduğunu vurgular ve yeni kimliğini güçlendirir.")]},
 {"id": "sexual-health", "emoji": "💞", "title": "Sigara, damar ve cinsel sağlık", "summary": "Bonus ders: bırakmanın damarlara ve cinsel sağlığa etkisi.", "relapse": [], "bonus": True, "sourceIds": ["who-tobacco", "cdc-health-effects", "nhs-quit"],
  "slides": [
   sl("🩸", "Sigara damarları etkiler", "Sigara dumanındaki maddeler damar iç yüzeyine zarar verir ve damarları daraltabilir. Bu, kan akışını azaltır."),
   sl("💞", "Cinsel sağlıkla bağlantı", "Sertleşme, penise yeterli kan akışına bağlıdır. Bu nedenle sigara, sertleşme sorunları için bilinen risk etkenlerinden biridir."),
   sl("📈", "Bırakınca", "Sigarayı bırakmak dolaşımı iyileştirir. Bazı kişilerde zamanla cinsel sağlıkta da iyileşme görülebilir; ancak bu kişiden kişiye değişir."),
   sl("🩺", "Ne zaman hekime?", "Süregelen sertleşme sorunları kalp ve damar sağlığıyla ilgili olabilir. Bu durumda bir hekime danışmak önemlidir."),
  ],
  "practice": {"title": "Uygula", "text": "Bugün 10 dakikalık tempolu bir yürüyüş yap. Hareket de dolaşımı destekler."},
  "quiz": [q("Sigara cinsel sağlığı hangi yolla etkileyebilir?", ["Damarları daraltıp kan akışını azaltarak", "Hiçbir şekilde etkilemez", "Sadece kokuyla"], 0, "Sertleşme yeterli kan akışına bağlıdır; sigara damarları etkileyerek bunu zorlaştırabilir.")]},
]

for i, l in enumerate(LESSONS):
    l["order"] = i + 1
    l["minutes"] = 3
    l.setdefault("bonus", False)

DATA = {"reviewed": False, "sourceIds": ACT + ["nci-withdrawal"], "lessons": LESSONS}
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'camp', 'skills.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(DATA, f, ensure_ascii=False, indent=2)
print('skills:', len(LESSONS), 'lessons (', sum(1 for l in LESSONS if l['bonus']), 'bonus )')
