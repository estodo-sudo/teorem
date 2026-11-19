"""Odak Kampı "Bilim Ne Diyor?" library (always free) and the Yeniden İnşa (rebuild) module (imported by odak.py).

Original Turkish text, reviewed=false. Sources only from WHO/ICD-11, peer-reviewed journals, national health
bodies and Yeşilay/YEDAM (spec 5.9) — never forums, NoFap sites, YouTube, blogs or news.
Myths are named only to be corrected; the banned claim wordings of spec 0.3/3 are never used.
"""


def story(id, emoji, title, summary, slides, sources, level, minutes=3):
    return {
        "id": id,
        "emoji": emoji,
        "title": title,
        "summary": summary,
        "slides": [{"emoji": e, "title": t, "text": x} for e, t, x in slides],
        "sourceIds": sources,
        "evidenceLevel": level,
        "minutes": minutes,
        "reviewed": False,
    }


STORIES = [
    story("csbd", "📘", "KCDB nedir, ne değildir?", "Dünya Sağlık Örgütü'nün tanımı.", [
        ("📘", "Resmi tanım", "Dünya Sağlık Örgütü'nün ICD-11 sınıflamasında “Kompulsif Cinsel Davranış Bozukluğu” (6C72) yer alır. Tanımın özü: yoğun ve tekrarlayan cinsel dürtüleri kontrol edememe."),
        ("🧩", "Ölçüt sıklık değil", "Belirleyici olan bir davranışın ne kadar sık yapıldığı değil; kişinin isteğine rağmen kontrol edememesi, olumsuz sonuçlara ve az doyuma rağmen sürmesi ve belirgin sıkıntı ya da işlev kaybıdır."),
        ("🔖", "Bağımlılık değil", "ICD-11 bu durumu bir bağımlılık olarak değil, dürtü kontrol bozuklukları arasında sınıflandırır. “Mastürbasyon bağımlılığı” diye resmi bir tanı yoktur."),
        ("🩺", "Tanıyı kim koyar?", "Bir tanı ancak bir ruh sağlığı uzmanının değerlendirmesiyle konur. Bu uygulama tanı koymaz; yalnızca kendi durumunu görmene ve hedefine ilerlemene yardım eder."),
    ], ["icd11", "briken2024"], "guideline"),
    story("mast-facts", "🌱", "Mastürbasyon: tıbbi gerçekler", "Doğal bir davranış ve ne zaman sorun olur?", [
        ("🌱", "Yaygın ve doğal", "Mastürbasyon her yaşta yaygın bir davranıştır ve insan cinselliğinin doğal bir parçasıdır."),
        ("🩺", "Tıbben zararlı değil", "Mastürbasyonun kendisi tıbben zararlı kabul edilmez. Görme, kas, hafıza ya da genel sağlık üzerine korkutucu iddialar bilimsel olarak desteklenmez."),
        ("⚖️", "Sorun ne zaman başlar?", "Sorun davranışın kendisi değil; kişinin kontrol edemediğini hissetmesi, hayatının diğer alanlarının aksaması ya da kendi değerleriyle derin bir çelişki yaşamasıdır."),
        ("🧭", "Hedef senin", "Bu yüzden kampta mastürbasyonla ilgili hedefi sen seçersin: hedef koymamak, azaltmak ya da bir süre ara vermek. Hiçbiri diğerinden “daha doğru” değildir."),
    ], ["briken2024", "icd11"], "review"),
    story("nofap-claims", "🔬", "NoFap ve benzeri iddialar: bilim ne diyor?", "Uzun süre boşalmamanın vaatleri.", [
        ("🔬", "İnternetteki vaatler", "Bazı internet toplulukları, uzun süre boşalmamanın hormonları kalıcı biçimde değiştirdiğini, olağanüstü enerji, kas ya da çekicilik kazandırdığını öne sürer."),
        ("📉", "Kanıt yok", "Bu iddiaları destekleyen sağlam bilimsel kanıt yoktur. Kısa süreli ve küçük hormon dalgalanmaları gösteren birkaç çalışma, bu büyük vaatleri desteklemez."),
        ("⚠️", "Neden önemli?", "Gerçekçi olmayan vaatler, beklenti karşılanmadığında hayal kırıklığı ve utanç yaratabilir. Bu da değişimi kolaylaştırmaz, zorlaştırır."),
        ("🧭", "Gerçek kazanç", "Gerçek kazanç; kontrol duygusu, zamanını ve dikkatini değerlerine ayırabilmek, daha iyi uyku ve ilişkilerdir. Bunlar ölçülebilir ve sana aittir."),
    ], ["briken2024", "roza2024"], "review"),
    story("erection", "🧪", "Pornografi ve sertleşme sorunu", "Kanıtlar ne gösteriyor?", [
        ("🧪", "Güçlü bir ilişki kanıtlanmadı", "Güncel derlemeler, pornografi kullanımı ile sertleşme sorunu arasında güçlü ve doğrudan bir ilişki olduğu iddialarının genel olarak desteklenmediğini gösteriyor."),
        ("🔗", "Dolaylı bağlantılar", "Bağlantı varsa bile dolaylı olabilir: performans kaygısı, beden memnuniyetsizliği, gerçekçi olmayan beklentiler ya da ilişki sorunları."),
        ("🫀", "Diğer nedenler", "Sertleşme sorunlarının damar sağlığı, diyabet, sigara, uyku, ilaçlar ve stres gibi pek çok nedeni olabilir."),
        ("🩺", "Ne yapmalı?", "Sertleşmeyle ilgili bir endişen varsa korkutucu internet iddiaları yerine bir üroloğa ya da hekime başvurmak en doğru adımdır."),
    ], ["rowland2024", "dwulit2019"], "review"),
    story("moral", "⚖️", "Ahlaki çelişki ve utanç", "“Bağımlıyım” hissi neden bazen davranıştan büyüktür?", [
        ("⚖️", "İlginç bir bulgu", "Araştırmalar, pornografiyi ahlaken yanlış bulup yine de kullananların, kullanımları az ya da ortalama olsa bile kendilerini “bağımlı” görme eğiliminde olduğunu gösteriyor."),
        ("🧠", "Algı ve davranış", "Bu algı, davranışın miktarından çok değerlerle yaşanan çelişkiyle ve utançla ilişkilidir."),
        ("🤍", "Utanç değil, yön", "Utanç bu hissi büyütür ve değişimi zorlaştırır. Değerlerini ciddiye alıp kendine nazik davranmak ise uzun vadede daha çok işe yarar."),
        ("🧭", "Senin değerlerin", "Kampın amacı seni yargılamak değil; kendi değerlerinle uyumlu yaşamana yardım etmektir. Değerlerin, inancın dahil, sana aittir."),
    ], ["grubbs2019", "grubbs2019b"], "review"),
    story("urges-pass", "🌊", "Dürtüler neden geçer?", "Bir dalganın yükselip alçalması.", [
        ("🌊", "Dalga gibi", "Dürtüler genelde kısa sürede zirve yapar ve sonra azalır. Ona göre hareket etmediğinde de bu iniş gerçekleşir."),
        ("🔁", "Her yönetilen an", "Bir dürtüyü davranışa çevirmeden izlemek, beynin “bu dürtü geçebilir” bilgisini öğrenmesine yardım eder."),
        ("🥊", "Bastırmak işe yaramaz", "Dürtüyü düşünmemeye zorlamak onu çoğu zaman güçlendirir. İzlemek ve yer açmak daha etkilidir."),
        ("📉", "Gerçekçi beklenti", "Araştırmalara göre tedaviyle davranış belirgin biçimde azalabilir; dürtünün kendisi ise daha yavaş değişir. Amaç dürtüyü yok etmek değil, davranışı yönetmektir."),
    ], ["crosby2016", "meta2025"], "rct"),
    story("slips-normal", "🔁", "Kayma neden normaldir?", "Değişimin inişli çıkışlı yolu.", [
        ("🔁", "Değişim doğrusal değildir", "Bir alışkanlığı değiştiren hemen herkes yol boyunca kaymalar yaşar. Bu, sürecin olağan bir parçasıdır."),
        ("🧱", "Perhiz ihlali etkisi", "Kayma sonrasında “Zaten bozdum, artık fark etmez” düşüncesi çok yaygındır ve kaymayı uzatır. Bunu tanımak, ona kapılmamayı kolaylaştırır."),
        ("📚", "Öğrenme fırsatı", "Her kayma, hangi durumun zor olduğunu gösterir. Planını bu bilgiyle güncellemek, bir sonraki seferi kolaylaştırır."),
        ("🌱", "Emeğin silinmez", "Bu yüzden kampta bir kayma toplam günlerini, en uzun serini ve yönettiğin dürtü anlarını silmez."),
    ], ["marlatt", "bothe2021"], "review"),
    story("when-expert", "🩺", "Ne zaman uzmana başvurmalı?", "Profesyonel desteğin işaretleri.", [
        ("🩺", "Destek almak güçtür", "Bir uzmandan destek almak bir zayıflık değil; kendine yatırım yapmaktır."),
        ("🚩", "Dikkat edilecek işaretler", "Davranış işini, okulunu ya da ilişkilerini belirgin biçimde etkiliyorsa; uzun süredir kaygı ya da çökkünlük hissediyorsan; zorlantılı düşünceler yaşıyorsan bir uzmanla konuşmak iyi gelebilir."),
        ("🏥", "Nereye?", "Psikiyatri polikliniği ya da bir klinik psikolog ilk adım olabilir. Yeşilay Danışma Hattı 115 de ücretsiz danışmanlık verir."),
        ("🆘", "Acil durum", "Kendine zarar verme düşüncelerin varsa ya da acil bir durumdaysan hemen 112'yi ara."),
    ], ["briken2024", "yedam"], "guideline"),
    story("mood-link", "🌧️", "Kaygı, depresyon ve kompulsif davranış", "Birbirini besleyen bir döngü.", [
        ("🌧️", "Sık birlikte görülür", "Kaygı, depresyon ve kontrol etmekte zorlanılan davranışlar sıklıkla birlikte görülür ve birbirini besleyebilir."),
        ("🔄", "Kısa rahatlama, uzun yük", "Davranış zor duygulardan kısa süreli bir kaçış sağlayabilir; ardından gelen suçluluk ya da boşluk hissi ise ruh halini daha da düşürebilir."),
        ("🛠️", "İkisine birden bakmak", "Ruh halini iyileştiren adımlar (uyku, hareket, bağlantı, gerektiğinde tedavi) davranış üzerinde de olumlu etki yaratabilir."),
        ("🩺", "Destek", "Ruh halin uzun süredir düşükse bu kamp tek başına yeterli olmayabilir; bir uzmanla konuşmak önemli bir adımdır."),
    ], ["briken2024", "phq2", "gad2"], "review"),
    story("partner", "💬", "Partnerle konuşmak", "Açık ve saygılı bir sohbet için.", [
        ("💬", "Konuşmak zorunda değilsin", "Bu konuyu partnerinle paylaşıp paylaşmamak senin kararın. Paylaşmak isteyebilirsin; hazır olmayabilirsin de."),
        ("🕰️", "Doğru an", "Sakin, acele olmayan bir zaman seç. Suçlama ya da savunma yerine “ben” diliyle konuş: “Bu konuda zorlanıyorum ve üzerinde çalışıyorum.”"),
        ("👂", "Dinlemek", "Partnerinin de duyguları olacaktır. Onları dinlemek ve anlamaya çalışmak güveni güçlendirir."),
        ("🤝", "Birlikte destek", "Gerekirse bir çift terapisti ya da uzman bu sohbeti kolaylaştırabilir."),
    ], ["briken2024"], "expert"),
    story("families", "👨‍👩‍👧", "Gençler ve aileler için kaynaklar", "Bir yakınına yardım etmek istersen.", [
        ("👨‍👩‍👧", "Bu kamp yetişkinler için", "Bu kamp 18 yaş ve üzeri içindir. Bir gence yardım etmek istiyorsan yaşına uygun kaynaklar daha doğru olur."),
        ("🗣️", "Yargısız konuşmak", "Gençlerle bu konuyu konuşurken utandırmadan, sakin ve merakla yaklaşmak güven oluşturur."),
        ("🏫", "Okul ve uzmanlar", "Okul rehber öğretmenleri ve psikolojik danışmanlar ilk başvuru noktası olabilir."),
        ("📞", "Yeşilay 115", "YEDAM, çocuk ve ergenler ile ailelerine de ücretsiz danışmanlık verir."),
    ], ["yedam"], "expert"),
    story("sleep-control", "🌙", "Uyku ve dürtü kontrolü", "Yorgun beyin daha zor fren yapar.", [
        ("🌙", "Uyku ve kendini düzenleme", "Uykusuzluk, dürtüleri yönetme ve plan yapma becerisini zayıflatır. Bu yüzden gece geç saatler en riskli dilimdir."),
        ("📵", "Ekran ve uyku", "Yatakta ekran kullanımı hem uykuyu geciktirir hem de riskli bir ortam yaratır."),
        ("🛏️", "Küçük adımlar", "Düzenli yatış saati, telefonu odadan çıkarmak ve sakin bir gece rutini fark edilir bir değişim yaratabilir."),
        ("ℹ️", "Genel bilgi", "Bunlar genel önerilerdir; uzun süren uyku sorunlarında bir hekime danış."),
    ], ["bothe2021"], "expert"),
    story("filters", "🧱", "Dijital sınırlar ve filtreler", "Gerçekçi beklentiler.", [
        ("🧱", "Filtre bir frendir", "Filtreler ve uygulama sınırları otomatik davranışı yavaşlatır ve zor anlarda zaman kazandırır."),
        ("🔓", "Aşılmaz değildir", "Hiçbir filtre aşılmaz değildir. Filtreye tek başına güvenmek, aşıldığında hayal kırıklığı yaratabilir."),
        ("🛠️", "Becerilerle birlikte", "Filtreler en iyi; değerler, planlar, dürtü sörfü ve destekle birlikte işe yarar."),
        ("📱", "Telefonun kendi araçları", "iPhone'da Ekran Süresi, Android'de Dijital Denge, ek bir uygulamaya gerek kalmadan iyi bir başlangıçtır."),
    ], ["bothe2021", "apple"], "review"),
    story("values-faith", "🕊️", "Değerler ve maneviyat", "Kendi değerlerinle uyumlu yaşamak.", [
        ("🕊️", "Herkesin değerleri", "Bazıları için inanç ve maneviyat, bazıları için ilişkiler, sağlık ya da özgürlük ön plandadır. Hepsi saygıyı hak eder."),
        ("🧭", "Uygulama hüküm vermez", "Bu uygulama dini ya da ahlaki bir değerlendirme yapmaz. Değerlerini sen yazarsın; uygulama yalnızca onları sana hatırlatır."),
        ("🤍", "Utanç yerine şefkat", "Değerlerine bağlı olmak, kendine sert davranmayı gerektirmez. Şefkatli bir tutum, değerlerine göre yaşamayı kolaylaştırır."),
        ("🌱", "Kusursuzluk değil, yön", "Amaç bir anda kusursuz olmak değil; her gün değerlerine biraz daha yakın yaşamaktır."),
    ], ["grubbs2019b"], "expert"),
]

LIBRARY = {"reviewed": False, "evidenceLevel": "review", "sourceIds": ["icd11", "briken2024", "roza2024", "rowland2024", "grubbs2019"], "stories": STORIES}

REBUILD = {
    "reviewed": False,
    "evidenceLevel": "expert",
    "sourceIds": ["bothe2021", "crosby2016"],
    "title": "Yeniden İnşa",
    "intro": "Davranışı azaltmak bir boşluk açar. O boşluğu sana iyi gelen rutinlerle doldurmak, değişimi kalıcı yapar.",
    "planner": {
        "title": "Riskli saatlerin için alternatifler",
        "hint": "Her riskli saat aralığın için 1–2 alternatif etkinlik seç.",
        "empty": "Önce Ortam ve dijital sınırlar ekranından ya da kayıt sırasında riskli saatlerini seç.",
        "max": 2,
        "options": [
            {"id": "walk", "emoji": "🚶", "label": "Yürüyüş"},
            {"id": "shower", "emoji": "🚿", "label": "Duş"},
            {"id": "book", "emoji": "📖", "label": "Kitap"},
            {"id": "call", "emoji": "📞", "label": "Birini aramak"},
            {"id": "kegel", "emoji": "💪", "label": "Kegel seansı"},
            {"id": "breath", "emoji": "🌬️", "label": "Nefes egzersizi"},
            {"id": "fitness", "emoji": "🏃", "label": "Fitness"},
            {"id": "hobby", "emoji": "🎨", "label": "Bir uğraş"},
            {"id": "music", "emoji": "🎧", "label": "Müzik"},
            {"id": "sleep", "emoji": "😴", "label": "Erken yatmak"},
        ],
    },
    "sleep": {
        "title": "Uyku hijyeni",
        "note": "Genel bilgidir; tıbbi tedavi değildir. Uyku sorunun uzun sürerse bir hekime danış.",
        "items": [
            {"id": "same-time", "label": "Her gün benzer saatte yatıp kalkıyorum"},
            {"id": "no-phone-bed", "label": "Telefonu yatak odası dışında bırakıyorum"},
            {"id": "screens-off", "label": "Yatmadan 30 dakika önce ekranları kapatıyorum"},
            {"id": "dark-cool", "label": "Odam karanlık, sessiz ve serin"},
            {"id": "caffeine", "label": "Öğleden sonra kafeini azaltıyorum"},
            {"id": "get-up", "label": "Uyuyamazsam kalkıp loş ışıkta sakin bir şey yapıyorum"},
        ],
    },
    "connection": {
        "title": "Haftalık bağlantı görevi",
        "done": "Bu hafta yaptım",
        "doneNote": "Harika. Bağlantı, dürtünün altındaki ihtiyaca iyi gelir.",
        "tasks": [
            "Bir arkadaşınla buluş.",
            "Ailenden birini ara ve hal hatır sor.",
            "Bir topluluk etkinliğine katıl (spor, kurs, gönüllülük).",
            "Uzun süredir konuşmadığın birine mesaj at.",
            "Biriyle birlikte yemek ye.",
            "Birine küçük bir iyilik yap.",
        ],
    },
    "bridge": {
        "title": "Uygulamadaki araçlar",
        "hint": "Bedenine iyi bakmak da yeniden inşanın parçası.",
        "items": [
            {"id": "kegel", "emoji": "💪", "label": "Kegel antrenmanı", "route": "/training"},
            {"id": "breathing", "emoji": "🌬️", "label": "Nefes egzersizi", "route": "/mind/breathing"},
            {"id": "bodyScan", "emoji": "🧘", "label": "Beden taraması", "route": "/mind/body-scan"},
            {"id": "fitness", "emoji": "🏃", "label": "Kasık Fitness", "route": "/training"},
        ],
    },
}
