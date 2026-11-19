"""Odak Kampı programme content: 90-day missions and the skill lessons (imported by odak.py).

Original Turkish text, reviewed=false. ACT + CBT + mindfulness (Crosby & Twohig 2016; Bőthe et al. 2021).
Clinical, calm language: nothing explicit, no shame, no diagnosis, masturbation never presented as harmful,
no NoFap claims, no success percentages. Every lesson lists sourceIds and an evidenceLevel.
"""

M = [
    # Farkındalık (1–7)
    (1, "awareness", "Başlangıç fotoğrafı", "Bugün hiçbir şeyi değiştirmeye çalışma. Sadece dürtü ve davranışlarını günlüğüne kaydet; nerede durduğunu görmek ilk adımdır.", 5, "reflection"),
    (2, "awareness", "Tetikleyici avı", "Bugün bir dürtü geldiğinde hemen öncesinde ne olduğunu fark et: yer, saat, duygu. Günlüğüne bir cümle yaz.", 5, "reflection"),
    (3, "awareness", "Değer cümlen", "Değer kartlarından birini seç ve şu cümleyi tamamla: “Bu hafta bu değere göre atacağım küçük adım: …”", 5, "reflection"),
    (4, "awareness", "Önce ve sonra", "Bir davranış olduysa öncesindeki ve sonrasındaki duyguyu karşılaştır. Olmadıysa bir dürtü anında ne hissettiğini yaz.", 5, "reflection"),
    (5, "awareness", "İlk sürtünme", "Bu gece telefonunu yatak odası dışında şarj et. Küçük bir zorluk, otomatik davranışı yavaşlatır.", 5, "action"),
    (6, "awareness", "DAYY kontrolü", "Gün içinde üç kez kendine sor: Dinlenmemiş miyim, aç mıyım, yalnız mıyım, yüklü müyüm? Yanıtı not et.", 3, "action"),
    (7, "awareness", "İlk haftanın özeti", "Günlüğündeki haftalık özete bak. En riskli saatin hangisi? O saat için bir Eğer–O zaman planı seç.", 10, "reflection"),
    # Sınırlar (8–14)
    (8, "boundaries", "Telefonunun kendi filtresi", "Ortam ve dijital sınırlar ekranından telefonunun kendi filtresini kur (iPhone'da Ekran Süresi, Android'de Dijital Denge).", 15, "action"),
    (9, "boundaries", "Gece kuralı", "Yatmadan 30 dakika önce ekranları kapat. Yerine kitap, müzik ya da sakin bir sohbet koy.", 30, "action"),
    (10, "boundaries", "Ana ekran düzeni", "Tetikleyici olan uygulamaları ana ekrandan kaldır ya da bir klasörün içine taşı. Birkaç saniyelik ek adım bir fren olur.", 10, "action"),
    (11, "boundaries", "Riskli saat planı", "En riskli saat aralığın için iki alternatif etkinlik yaz: yürüyüş, duş, birini aramak, bir nefes seansı…", 10, "reflection"),
    (12, "boundaries", "Gri tonlama", "Bu gece ekranı gri tonlamaya al ve ekranın sana nasıl geldiğini fark et.", 5, "action"),
    (13, "boundaries", "Destekçin", "Güvendiğin birine, ayrıntı vermeden, zor anlarda ona yazabileceğini söyle. “Bazen konuşmaya ihtiyacım olabilir” demek yeterli.", 10, "social"),
    (14, "boundaries", "Sınır kontrolü", "Bu hafta kurduğun sınırlardan hangisi işe yaradı? Birini biraz daha güçlendir.", 10, "reflection"),
    # Beceriler (15–28)
    (15, "skills", "İlk dalga", "Bir dürtü geldiğinde Dürtü anı ekranındaki dürtü sörfünü baştan sona uygula.", 5, "action"),
    (16, "skills", "Düşünceyi adlandır", "“Bir kereden bir şey olmaz” gibi bir düşünce geldiğinde içinden şunu söyle: “Şu an … düşüncesini fark ediyorum.”", 3, "action"),
    (17, "skills", "Nefes pratiği", "Dürtü yokken iki dakika nefes egzersizi yap. Sakin anda çalışılan beceri, zor anda daha kolay hatırlanır.", 2, "learning"),
    (18, "skills", "Yer aç", "Rahatsız bir hissi 60 saniye boyunca değiştirmeye çalışmadan izle. Bedeninde nerede, nasıl bir his?", 3, "action"),
    (19, "skills", "Yeni yollar listesi", "Stresli ya da sıkıntılı anlarda yapabileceğin üç yeni şeyi listele.", 5, "reflection"),
    (20, "skills", "Öz-şefkat cümlen", "Zor bir anda kendine söyleyeceğin nazik bir cümle yaz. Bir arkadaşına ne söylerdin?", 5, "reflection"),
    (21, "skills", "Araç değerlendirmesi", "Günlüğündeki haftalık özete bak: hangi araç en çok işe yaradı? Onu bir sonraki zor ana hazırla.", 10, "reflection"),
    (22, "skills", "Hareketle dalga", "Bir dürtü anında 2 dakikalık hareket setini dene ve sonrasında ne hissettiğini not et.", 2, "action"),
    (23, "skills", "Gelecekteki ben", "Dürtü anı ekranındaki “Gelecekteki ben” bölümünden kendine kısa bir mektup yaz.", 10, "reflection"),
    (24, "skills", "Duygunun ihtiyacı", "Bugün dürtüden önce hangi duygu vardı? O duygu neye ihtiyaç duyuyordu ve ona başka nasıl iyi bakabilirsin?", 5, "reflection"),
    (25, "skills", "On dakika", "Bir dürtü anında kararını 10 dakika ertele ve dürtünün nasıl değiştiğini izle.", 10, "action"),
    (26, "skills", "Nazik iç ses", "Kendi kendine konuşmanda sert bir cümleyi fark et ve onu daha nazik bir cümleyle değiştir.", 5, "reflection"),
    (27, "skills", "Favori becerin", "Şimdiye kadar öğrendiğin becerilerden en çok işine yarayanı bugün bilinçli olarak kullan.", 5, "action"),
    (28, "skills", "Beceriler haftası", "Bu iki haftada neyi öğrendin? Tek bir cümleyle yaz.", 5, "reflection"),
    # Yeniden İnşa (29–42)
    (29, "rebuild", "Uyku saati", "Bu hafta her gün aynı saatte yatmayı dene. Düzenli uyku, gece gelen dürtüleri hafifletebilir.", 5, "action"),
    (30, "rebuild", "Gece rutini", "Yatmadan önce üç adımlık sakin bir rutin oluştur: ekranı kapat, ışığı azalt, birkaç dakika nefes ya da kitap.", 10, "action"),
    (31, "rebuild", "Bağlantı planı", "Bir arkadaşınla ya da ailenden biriyle bu hafta buluşmak için bir plan yap.", 10, "social"),
    (32, "rebuild", "Yeni bir uğraş", "Merak ettiğin bir hobiye 20 dakika ayır: çizim, müzik, yemek, bir dil…", 20, "action"),
    (33, "rebuild", "Hareket zamanı", "20 dakikalık bir yürüyüş yap ya da uygulamadaki bir fitness seansını uygula.", 20, "action"),
    (34, "rebuild", "Bedenine iyi bak", "Uygulamadaki bir Kegel ya da nefes seansıyla bedenine birkaç dakika ayır.", 10, "action"),
    (35, "rebuild", "Haftalık bağlantı görevi", "Bir topluluk etkinliğine katıl ya da uzun süredir konuşmadığın birini ara.", 30, "social"),
    (36, "rebuild", "Ekran yerine", "Riskli saatinde, planladığın alternatif etkinliği uygula.", 20, "action"),
    (37, "rebuild", "Anlam", "Bu hafta değerlerinle uyumlu yaptığın üç şeyi yaz.", 5, "reflection"),
    (38, "rebuild", "Uyku kontrolü", "Günlük kontrollerine bak: uyku kalitende bir değişim var mı?", 5, "reflection"),
    (39, "rebuild", "Saygılı bakış", "“Sağlıklı cinsellik anlayışı” dersini oku ve kendine uygun bir ilke yaz.", 10, "learning"),
    (40, "rebuild", "Teşekkür", "Bu süreçte seni destekleyen birine teşekkür et.", 5, "social"),
    (41, "rebuild", "Rutin kontrolü", "Hangi yeni rutin sana en iyi geldi? Onu sonraki haftalarda da sürdürmeyi planla.", 5, "reflection"),
    (42, "rebuild", "Çekirdek programın sonu", "Altı haftayı tamamladın. Kısa taramayı yeniden yap ve kendi ilerlemene bak; bu bir not değil, yalnızca bir fotoğraf.", 10, "reflection"),
    # Pekiştirme (43–90): haftalık görevler
    (43, "consolidation", "Yüksek riskli durumlar haritası", "“Kayma önleme planı” dersini oku ve en riskli üç durumun için bir plan yap.", 15, "learning"),
    (50, "consolidation", "Erken uyarı işaretleri", "Bir kaymadan önce genelde fark ettiğin üç işareti yaz (ör. uykusuzluk, yalnızlık, gece geç saatte telefon).", 10, "reflection"),
    (57, "consolidation", "Kimlik cümlen", "“Değerlerime göre yaşayan biriyim” cümlesini kendi kelimelerinle yaz.", 5, "reflection"),
    (64, "consolidation", "Planlarını güncelle", "Eğer–O zaman planlarından birini bugünkü hayatına göre güncelle.", 10, "action"),
    (71, "consolidation", "Bağlantıyı sürdür", "Bu hafta birisiyle yüz yüze zaman geçir.", 30, "social"),
    (78, "consolidation", "Kendine teşekkür", "Bu süreçte kendine teşekkür ettiğin üç şeyi yaz.", 5, "reflection"),
    (85, "consolidation", "Bakım planı", "90. güne az kaldı. Sonraki aylar için ayda bir yapacağın küçük bir kontrol planı hazırla.", 10, "reflection"),
    (90, "consolidation", "90 gün", "90 günü tamamladın. Kısa taramayı yeniden yap ve yolculuğuna dönüp bak. Bundan sonra ayda bir kontrol yeterli.", 10, "reflection"),
]

MISSIONS = {
    "reviewed": False,
    "evidenceLevel": "rct",
    "sourceIds": ["bothe2021", "crosby2016", "twohig2010", "marlatt", "gollwitzer2006"],
    "missions": [{"id": f"d{d}", "phase": p, "day": d, "title": t, "body": b, "durationMin": mi, "type": ty, "reviewed": False} for d, p, t, b, mi, ty in M],
}


def lesson(id, order, phase, emoji, title, summary, slides, practice, quiz, sources, level, minutes=4, bonus=False):
    return {
        "id": id,
        "order": order,
        "phase": phase,
        "emoji": emoji,
        "title": title,
        "summary": summary,
        "slides": [{"emoji": e, "title": t, "text": x} for e, t, x in slides],
        "practice": {"title": "Uygula", "text": practice},
        "quiz": [{"q": q, "options": o, "answer": a, "explain": ex} for q, o, a, ex in quiz],
        "sourceIds": sources,
        "evidenceLevel": level,
        "minutes": minutes,
        "bonus": bonus,
        "reviewed": False,
    }


ACT = ["crosby2016", "twohig2010"]

LESSONS = [
    lesson("values", 1, "awareness", "🧭", "Neden buradasın? Değerlerin pusulası", "Değişimin yönünü değerlerin gösterir.", [
        ("🧭", "Pusulan ne gösteriyor?", "Değerler, hayatta neyin önemli olduğunu gösteren pusulandır: ilişkin, sağlığın, odağın, inancın, emeğin. Hedefler bir gün biter; değerler hep yol gösterir."),
        ("🎯", "Kurallar değil, yön", "Kendini kurallarla zorlamak çoğu zaman tersine çalışır. Değerler ise “Bu davranış beni önem verdiğim şeye yaklaştırıyor mu?” diye sormana yardım eder."),
        ("✍️", "Somut cümleler", "“Odak” yerine “Akşamlarımı uyku ve derslerime ayırmak” gibi somut bir cümle, zor anda çok daha güçlü bir hatırlatıcıdır."),
        ("🌱", "Mükemmel olmak gerekmez", "Değerlere göre yaşamak her gün kusursuz olmak değil; her seferinde yönünü yeniden onlara çevirmektir."),
    ], "Senin için en önemli iki değeri düşün. Her biri için bu hafta yapabileceğin küçük, somut bir davranış yaz.", [
        ("Değerler bu süreçte nasıl yardım eder?", ["Dürtüyü tamamen yok eder", "Davranışın beni önem verdiğim şeye yaklaştırıp yaklaştırmadığını sormamı sağlar", "Kendimi suçlamam için bir ölçüdür"], 1, "Değerler dürtüyü silmez; ama hangi yöne gitmek istediğini hatırlatarak seçimini kolaylaştırır."),
    ], ACT + ["bothe2021"], "rct", minutes=3),
    lesson("cycle", 2, "awareness", "🔄", "Dürtünün anatomisi", "Tetikleyici → düşünce → his → dürtü → davranış.", [
        ("🔄", "Bir zincir", "Davranış genelde birden olmaz. Bir tetikleyici (yer, saat, duygu), ardından bir düşünce, bir his, bir dürtü ve sonunda davranış gelir."),
        ("🔍", "Zinciri görmek", "Zinciri tanıdıkça onu erken bir halkada kırmak kolaylaşır. Gece yatakta telefon bir tetikleyici olabilir; “Biraz bakarım” bir düşüncedir."),
        ("✂️", "Erken halkada müdahale", "En kolay müdahale çoğu zaman en baştadır: tetikleyiciyi değiştirmek (telefonu odadan çıkarmak) ya da düşünceyi fark etmek."),
        ("🧩", "Senin zincirin", "Herkesin zinciri biraz farklıdır. Günlüğün, senin zincirindeki halkaları görmene yardım eder."),
    ], "Son zorlandığın anı düşün ve zincirini yaz: tetikleyici → düşünce → his → dürtü → davranış.", [
        ("Zinciri kırmak genelde nerede en kolaydır?", ["En sonda, davranışın ortasında", "Erken halkalarda: tetikleyici ya da düşüncede", "Zincir kırılamaz"], 1, "Ne kadar erken fark edersen, değiştirmek o kadar kolay olur."),
    ], ["bothe2021", "meta2025"], "rct"),
    lesson("monitoring", 3, "awareness", "📓", "Kendini izlemek neden işe yarar?", "Görmediğin örüntüyü değiştiremezsin.", [
        ("📓", "Fark etmek bir beceri", "Kendini izlemek, otomatik giden davranışları görünür kılar. Araştırmalar, düzenli kayıt tutmanın tek başına bile değişimi desteklediğini gösteriyor."),
        ("🕐", "Ne kaydedilir?", "Saat, yer, öncesindeki duygu ve sonrasında ne hissettiğin. Uzun yazmak gerekmez; birkaç dokunuş yeter."),
        ("🙅", "Yargı değil, veri", "Kayıt bir karne değil. Amaç kendini eleştirmek değil, örüntüyü görmek: “Demek ki gece yorgunken zorlanıyorum.”"),
        ("📊", "Haftalık bakış", "Haftalık özet, en riskli saatini ve en çok işe yarayan aracını gösterir. Planlarını buna göre ayarlarsın."),
    ], "Bugün en az bir dürtü ya da davranış kaydı gir; sadece fark etmek için.", [
        ("Kayıt tutmanın amacı nedir?", ["Kendimi yargılamak", "Örüntüleri görüp planımı ona göre ayarlamak", "Bir puan toplamak"], 1, "Kayıt bir veri kaynağıdır; ne zaman ve neden zorlandığını gösterir."),
    ], ["bothe2021"], "rct", minutes=3),
    lesson("environment", 4, "boundaries", "🧱", "Ortamı tasarlamak", "Frenler ve sürtünme.", [
        ("🧱", "Sürtünme", "Bir davranışı biraz zorlaştırmak bile sıklığını azaltır. Telefonu başka odada şarj etmek, tetikleyici uygulamayı bir klasöre taşımak birer frendir."),
        ("🚪", "Kolay olanı değiştir", "Ortam, irademizden daha güçlüdür. Bu yüzden zor anda direnmek yerine, zor anın gelme ihtimalini azaltmak daha akıllıcadır."),
        ("🔐", "Filtreler bir fren", "Telefonunun kendi filtresi ve uygulama zamanlayıcıları yardımcı olur. Hiçbir filtre aşılmaz değildir; asıl güç planında ve becerilerinde."),
        ("🌙", "Riskli saatler", "En riskli saatlerde ortamı önceden hazırlamak (ışık açık, telefon uzakta, bir etkinlik planlı) en büyük farkı yaratır."),
    ], "En riskli saatin için ortamında yapabileceğin bir değişikliği seç ve bu akşam uygula.", [
        ("Ortam düzenlemenin mantığı nedir?", ["Zor anda daha çok direnmek", "Zor anın gelme ihtimalini baştan azaltmak", "Filtrelerin her şeyi çözmesi"], 1, "Sürtünme eklemek, karar anını kolaylaştırır."),
    ], ["bothe2021", "apple"], "review"),
    lesson("dayy", 5, "boundaries", "🔋", "DAYY: dinlenmemiş, aç, yalnız, yüklü", "Dört durum dürtüyü güçlendirir.", [
        ("🔋", "Dört durum", "Dinlenmemiş (yorgun), Aç, Yalnız ve Yüklü (stresli ya da öfkeli) olduğumuzda dürtüler daha güçlü gelir."),
        ("😴", "Yorgunluk ve gece", "Uykusuzluk, kendini düzenleme gücünü azaltır. Gece geç saatler bu yüzden en riskli dilimdir."),
        ("🫥", "Yalnızlık", "Yalnızlık sık görülen bir tetikleyicidir. Davranış kısa bir rahatlama sağlasa da çoğu zaman yalnızlığı gidermez."),
        ("🛠️", "Kökene bak", "Dürtü geldiğinde önce kendine sor: Hangisi? Bazen bir bardak su, kısa bir uyku ya da bir telefon görüşmesi dürtüyü değiştirir."),
    ], "Bugün üç kez DAYY kontrolü yap ve her seferinde fark ettiğini not et.", [
        ("Yalnızken gelen bir dürtüde neye bakmak işe yarar?", ["Dürtüyü bastırmaya", "Asıl ihtiyaca: bağlantı kurmaya", "Hiçbir şeye"], 1, "Dürtünün altındaki ihtiyacı karşılamak, onu daha kalıcı biçimde hafifletir."),
    ], ["bothe2021", "marlatt"], "expert", minutes=3),
    lesson("surfing", 6, "skills", "🌊", "Dürtü sörfü", "Dürtüyle kavga etmeden durabilmek.", [
        ("🌊", "Dalga gibi", "Dürtüler dalgalar gibidir: yükselir, zirve yapar ve alçalır. Ona göre hareket etmediğinde de geçer."),
        ("🥊", "Kavga etmek yorar", "Dürtüyü bastırmaya ya da düşünmemeye çalışmak çoğu zaman onu büyütür. ACT, dürtüyle savaşmak yerine onu izlemeyi önerir."),
        ("👀", "Bedende izle", "Dürtüyü bedeninde nerede hissettiğini fark et. Nefesini bir sörf tahtası gibi kullan; dalganın üstünde kal."),
        ("✅", "Seçim senin", "Dürtüyü hissetmek, ona göre davranmak zorunda olduğun anlamına gelmez. Hissetmek ve seçmek ayrı şeylerdir."),
    ], "Bir dürtü geldiğinde Dürtü anı ekranındaki dalga sörfünü uygula ve dalganın nasıl değiştiğini not et.", [
        ("Dürtü sörfünde amaç nedir?", ["Dürtüyü hemen yok etmek", "Dürtüyü izleyip ona göre davranmadan geçmesine izin vermek", "Dürtüyü düşünmemeye çalışmak"], 1, "Dürtüyü izlemek, onunla savaşmaktan daha az yorar ve davranışı seçmeni sağlar."),
    ], ACT + ["meta2025"], "rct"),
    lesson("defusion", 7, "skills", "💭", "Düşünce sadece düşüncedir", "“Bir kereden bir şey olmaz”, “Zaten mahvettim”.", [
        ("💭", "Zihnin sesi", "Zor anlarda zihin ikna edici cümleler kurar: “Bir kereden bir şey olmaz.” “Zaten bozdum, artık fark etmez.”"),
        ("🏷️", "Adını koy", "Düşünceyle aranıza mesafe koymak için ona ad ver: “Şu an ‘bir kereden bir şey olmaz’ düşüncesini fark ediyorum.”"),
        ("📻", "Radyo gibi", "Düşünceleri arka planda çalan bir radyo gibi düşünebilirsin. Sesini duyarsın ama söylediği her şeyi yapmak zorunda değilsin."),
        ("🧭", "Değerlere dön", "Düşünceyi fark ettikten sonra sor: “Bu düşünceyi takip etmek beni önem verdiğim şeye yaklaştırır mı?”"),
    ], "Bu hafta zihninin en sık kurduğu cümleyi yaz ve başına “Şu an … düşüncesini fark ediyorum” ekle.", [
        ("“Zaten mahvettim” düşüncesi geldiğinde ne yapmak işe yarar?", ["Ona inanıp devam etmek", "Onu bir düşünce olarak fark edip değerlerine dönmek", "Kendini suçlamak"], 1, "Düşünceyi fark etmek, onun söylediğini yapmak zorunda olmadığını hatırlatır."),
    ], ACT, "rct"),
    lesson("acceptance", 8, "skills", "🤲", "Kabul: rahatsız hisler için yer açmak", "Hissi değiştirmeye çalışmadan taşımak.", [
        ("🤲", "Kabul pes etmek değildir", "Kabul, rahatsız bir hissi sevmek ya da ona boyun eğmek değil; onunla birlikte, değerlerine uygun davranabilmektir."),
        ("📦", "Yer açmak", "Gerginlik, sıkıntı ya da boşluk hissi geldiğinde onu bedeninde fark et ve ona biraz yer aç: “Bu his burada, ve ben bununla durabilirim.”"),
        ("⏳", "Hisler geçicidir", "Kaçmaya çalışmadığımızda hisler çoğu zaman beklediğimizden daha çabuk değişir."),
        ("🧭", "Yön kaybolmaz", "Rahatsız his oradayken bile küçük bir değer adımı atabilirsin: bir yürüyüş, bir mesaj, bir sayfa kitap."),
    ], "Rahatsız bir hissi 60 saniye boyunca değiştirmeye çalışmadan izle; sonra küçük bir değer adımı at.", [
        ("Kabul ne demektir?", ["Rahatsız hissi sevmek", "Rahatsız hisle birlikte durup değerlerime göre davranabilmek", "Pes etmek"], 1, "Kabul, hisle savaşmadan seçimini yapabilmektir."),
    ], ACT, "rct"),
    lesson("emotions", 9, "skills", "🌤️", "Duygu düzenleme", "Stres, kaygı ve sıkıntı için yeni yollar.", [
        ("🌤️", "Bir başa çıkma yolu", "Davranış çoğu zaman zor duygulardan kısa süreli bir kaçış olur. Bu çok insani; ama uzun vadede duyguyu çözmez."),
        ("🧰", "Yeni araçlar", "Stres için nefes ya da hareket, kaygı için 5-4-3-2-1 farkındalık, sıkıntı için birine yazmak ya da küçük bir uğraş işe yarayabilir."),
        ("🏷️", "Duyguyu adlandır", "“Şu an gerginim” demek bile beynin duygu yükünü hafifletir."),
        ("📋", "Kendi listen", "Her duygu için bir ya da iki yeni yol belirlemek, zor anda ne yapacağını önceden bilmeni sağlar."),
    ], "En sık zorlandığın iki duygu için birer yeni başa çıkma yolu yaz ve birini bu hafta dene.", [
        ("Duyguyu adlandırmanın faydası nedir?", ["Hiçbir faydası yoktur", "Duygunun yükünü hafifletip seçim alanı açar", "Duyguyu kalıcı hale getirir"], 1, "Adlandırmak, duyguyla aranıza küçük bir mesafe koyar."),
    ], ["meta2025", "bothe2021"], "review"),
    lesson("shame", 10, "skills", "🤍", "Utanç ve suçluluk farkı", "Utanç neden işe yaramaz, öz-şefkat neden yarar?", [
        ("🤍", "İki farklı his", "Suçluluk “Yaptığım şey değerlerimle uyuşmadı” der. Utanç ise “Ben kötüyüm” der. İkisi aynı değildir."),
        ("🔁", "Utanç döngüsü", "Utanç, kişiyi kötü hissettirir; kötü his de yeniden kaçış arayışını tetikleyebilir. Araştırmalar, utancın değişimi zorlaştırdığını gösteriyor."),
        ("🫶", "Öz-şefkat", "Öz-şefkat, kendini mazur görmek değil; hatanı kabul edip kendine bir arkadaşına davrandığın gibi nazik davranmaktır."),
        ("🌱", "Sorumluluk ve nezaket", "“Bu zor bir an. Hata yapabilirim; yine de yoluma devam ediyorum.” Bu tutum, bir sonraki adımı atmayı kolaylaştırır."),
    ], "Zor bir anda kendine söyleyeceğin nazik bir cümle yaz ve telefonuna not al.", [
        ("Utanç ile suçluluk arasındaki fark nedir?", ["Hiçbir fark yoktur", "Suçluluk davranışa, utanç kişinin kendisine yönelir", "Utanç daha faydalıdır"], 1, "Davranışa odaklanan suçluluk değişime alan açar; kişiliğe yönelen utanç ise çoğu zaman tıkar."),
    ], ["grubbs2019b", "grubbs2019", "marlatt"], "review"),
    lesson("sleep", 11, "rebuild", "🌙", "Uyku ve gece rutini", "En riskli zaman dilimine hazırlık.", [
        ("🌙", "Neden gece?", "Gece yorgunluk artar, ortam sessizleşir ve telefon elimizdedir. Bu yüzden gece geç saatler en riskli dilimdir."),
        ("🛏️", "Sakin bir rutin", "Her gün benzer saatte yatmak, yatmadan önce ekranı kapatmak ve ışığı azaltmak uykuyu kolaylaştırır."),
        ("📵", "Yatak = uyku", "Telefonu yatağa götürmemek, yatağı uykuyla eşleştirir. Uyuyamıyorsan kalkıp loş ışıkta kitap okumak işe yarayabilir."),
        ("ℹ️", "Genel bilgi", "Bunlar genel uyku önerileridir, tıbbi tedavi değildir. Uyku sorunun uzun sürüyorsa bir hekime danış."),
    ], "Bu akşam için üç adımlık bir gece rutini yaz ve uygula.", [
        ("Gece riskini azaltmanın en kolay yolu hangisidir?", ["Yatağa telefonla girip direnmeye çalışmak", "Telefonu yatak odası dışında bırakıp sakin bir rutin kurmak", "Daha geç yatmak"], 1, "Ortamı önceden düzenlemek, gece karar vermeyi kolaylaştırır."),
    ], ["bothe2021"], "expert", minutes=3),
    lesson("connection", 12, "rebuild", "🫂", "Yalnızlık ve bağlantı", "İnsanlarla yeniden bağ kurmak.", [
        ("🫂", "Bağlantı ihtiyacı", "İnsan bağlantıya ihtiyaç duyar. Yalnızlık arttığında kısa süreli rahatlama arayışı da artabilir."),
        ("📱", "Küçük adımlar", "Bağlantı büyük adımlar gerektirmez: bir mesaj, kısa bir telefon, bir kahve, bir yürüyüş."),
        ("👥", "Topluluk", "Bir kurs, spor, gönüllülük ya da ilgi alanı grubu düzenli bağlantı için iyi bir yoldur."),
        ("💬", "Açık olmak", "Ayrıntı vermeden de güvendiğin birine zorlandığını söyleyebilirsin. Yalnız taşımadığın yük hafifler."),
    ], "Bu hafta yüz yüze görüşmek için birine mesaj at ve bir gün belirle.", [
        ("Yalnızlık hissinde hangisi daha kalıcı yardım eder?", ["Kısa süreli kaçış", "Gerçek bağlantı kurmak", "Daha çok ekran"], 1, "Bağlantı, dürtünün altındaki ihtiyacı karşılar."),
    ], ["bothe2021", "meta2025"], "review", minutes=3),
    lesson("leisure", 13, "rebuild", "🎨", "Boş zamanı yeniden tasarlamak", "Hobiler, hareket ve üretkenlik.", [
        ("🎨", "Boşluk doldurulur", "Bir davranışı azalttığında açılan zaman boş kalırsa, eski alışkanlık o boşluğa geri dönmeye çalışır."),
        ("🏃", "Hareket", "Düzenli hareket stresi azaltır ve uykuyu iyileştirir. Uygulamadaki fitness ve nefes seansları da buna dahildir."),
        ("🛠️", "Anlamlı uğraşlar", "Bir şey öğrenmek, üretmek ya da başkasına yardım etmek, değerlerinle uyumlu bir doyum sağlar."),
        ("🗓️", "Planlamak", "Riskli saatlerine önceden bir etkinlik koymak, o saati “boş” olmaktan çıkarır."),
    ], "Riskli saatlerinden biri için bu hafta yapacağın keyifli ya da anlamlı bir etkinlik planla.", [
        ("Açılan boş zamanı planlamak neden önemli?", ["Önemli değildir", "Plansız boşluk eski alışkanlığın geri dönmesini kolaylaştırır", "Daha çok yorulmak için"], 1, "Planlı bir etkinlik, riskli saati yeni bir anlamla doldurur."),
    ], ["bothe2021"], "expert", minutes=3),
    lesson("sexuality", 14, "rebuild", "🤝", "Sağlıklı cinsellik anlayışı", "Kendine ve partnere saygı, gerçekçi beklentiler.", [
        ("🤝", "Doğal bir parça", "Cinsellik insan hayatının doğal bir parçasıdır. Mastürbasyonun kendisi tıbben zararlı kabul edilmez; önemli olan davranışın senin değerlerin ve hayat kalitenle uyumu."),
        ("🎬", "Gerçekçi beklentiler", "Pornografide gösterilenler çoğu zaman kurgudur ve gerçek ilişkileri yansıtmaz. Bunu bilmek, kendine ve partnerine yönelik beklentileri daha gerçekçi kılar."),
        ("💬", "Saygı ve iletişim", "Sağlıklı bir cinsel yaşamın temeli karşılıklı rıza, saygı ve açık iletişimdir."),
        ("🩺", "Endişelerin için", "Cinsel sağlıkla ilgili bir endişen varsa, internetteki iddialar yerine bir hekim ya da uzmanla konuşmak en doğrusudur."),
    ], "Kendin için “saygı” ve “gerçekçi beklenti” üzerine bir ilke cümlesi yaz.", [
        ("Bu derste hangisi doğrudur?", ["Ölçü, başkalarının ne düşündüğüdür", "Önemli olan davranışın değerlerim ve hayat kalitemle uyumudur", "Pornografi gerçek ilişkileri yansıtır"], 1, "Ölçü, kişinin kendi değerleri ve hayat kalitesidir."),
    ], ["rowland2024", "dwulit2019", "briken2024"], "review"),
    lesson("relapse", 15, "consolidation", "🗺️", "Kayma önleme planı", "Yüksek riskli durumlar haritası.", [
        ("🗺️", "Haritayı çiz", "Kayma önleme modeli, yüksek riskli durumları önceden tanımayı önerir: belirli saatler, yerler, duygular ve kişiler."),
        ("⚠️", "Erken uyarılar", "Kayma çoğu zaman küçük işaretlerle başlar: uykusuzluk, yalnızlık, “sadece bakacağım” düşüncesi."),
        ("📝", "Her durum için plan", "Her riskli durum için bir Eğer–O zaman planı hazırla. Önceden verilen karar, o anda verilen karardan çok daha kolaydır."),
        ("🔁", "Kayma ≠ son", "Bir kayma olursa “Zaten bozdum” düşüncesi kaymayı uzatabilir. Bir kayma, emeğin silindiği anlamına gelmez; ondan öğrenip devam edebilirsin."),
    ], "En riskli üç durumunu yaz ve her biri için bir Eğer–O zaman planı oluştur.", [
        ("Bir kaymadan sonra en yardımcı tutum hangisidir?", ["“Zaten bozdum, fark etmez” demek", "Ne olduğunu öğrenip planı güncellemek ve devam etmek", "Her şeyi bırakmak"], 1, "Kaymayı bir öğrenme fırsatı olarak görmek, devam etmeyi kolaylaştırır."),
    ], ["marlatt", "bothe2021"], "review"),
    lesson("identity", 16, "consolidation", "🌟", "Yeni kimliğin", "“Değerlerime göre yaşayan biriyim.”", [
        ("🌟", "Davranıştan kimliğe", "Tekrar eden küçük davranışlar zamanla kendimizi nasıl gördüğümüzü değiştirir."),
        ("🪞", "Kim olmak istiyorsun?", "“Bunu yapmamaya çalışan biri” yerine “Değerlerime göre yaşayan biri” olmak, odağı yasaktan yöne çevirir."),
        ("🧱", "Kanıtlar", "Bu süreçte yönettiğin her dürtü anı, kurduğun her sınır ve uyguladığın her plan bu yeni kimliğin kanıtıdır."),
        ("🌿", "Sürdürmek", "Kimlik bir kez kazanılıp biten bir şey değil; her gün küçük seçimlerle yeniden onaylanır."),
    ], "“Ben … biriyim” cümlesini değerlerine göre tamamla ve bu süreçten üç kanıt yaz.", [
        ("Kimlik odaklı düşünmenin faydası nedir?", ["Odağı yasaklardan değerlere ve yöne çevirir", "Hiçbir faydası yoktur", "Mükemmel olmayı zorunlu kılar"], 0, "Kendini değerlerinle tanımlamak, davranışı daha doğal hale getirir."),
    ], ACT + ["bothe2021"], "rct", minutes=3),
    lesson("congruence", 17, "awareness", "🕊️", "Değerlerinle barışık olmak", "Kusursuzluk değil, yön.", [
        ("🕊️", "Çelişki hissi", "Bir davranış değerlerinle çeliştiğinde içsel bir gerilim hissedebilirsin. Bu his, senin için neyin önemli olduğunu gösterir."),
        ("⚖️", "Kusursuzluk tuzağı", "Araştırmalar, yoğun ahlaki çelişki ve utancın kişinin kendini daha “kontrolsüz” algılamasına yol açabildiğini gösteriyor; bu algı her zaman davranış miktarıyla örtüşmez."),
        ("🧭", "Yön yeter", "Amaç bir anda kusursuz olmak değil; her gün değerlerine biraz daha yakın yaşamak."),
        ("🫶", "Kendine nazik ol", "Değerlerin, inancın ya da ilkelerin ne olursa olsun, kendine nazik davranmak bu yolda en güçlü yardımcındır."),
    ], "Değerlerinden biri için bugün atabileceğin küçük, kusursuz olması gerekmeyen bir adım yaz.", [
        ("Bu derste vurgulanan nedir?", ["Hemen kusursuz olmak", "Kusursuzluk değil, değerlere doğru bir yön", "Kendini sert biçimde eleştirmek"], 1, "Yön ve öz-şefkat, değişimi sürdürülebilir kılar."),
    ], ["grubbs2019", "grubbs2019b"], "review", minutes=3, bonus=True),
]

SKILLS = {"reviewed": False, "evidenceLevel": "rct", "sourceIds": ACT + ["bothe2021", "meta2025", "marlatt"], "lessons": LESSONS}
