"""Generates src/content/porn.tr.json — Özgür Zihin Kampüsü (problematic pornography use).

Original Turkish content, reviewed=false. Evidence (see SOURCES):
- Brief Pornography Screen (Kraus et al., 2020): 5 items, last 6 months, 0/1/2 each, total 0–10;
  4+ = possible problematic use (preliminary cut-off).
- Problematic use is about control, not frequency (ICD-11 6C72; high-frequency use is not always problematic).
- Moral incongruence predicts feeling "addicted" more than use itself (Grubbs et al., 2019).
- ACT: 93% reduction in viewing vs 21% on a waitlist (Crosby & Twohig, 2016); values work is core to ACT.
- Pornography use and satisfaction: small negative association for men, causality unclear (Wright et al., 2017).
- Problematic (not frequent) use is linked to erectile problems (JMIR Public Health, 2021).
- If-then plans (Gollwitzer & Sheeran, 2006); lapses: avoid the all-or-nothing "abstinence violation effect".
Unique tools: lapse chain analysis → personal risk map and recommendations; ACT values compass.
"""
import json, os

SOURCES = [
 {"title": "Kraus ve ark. (2020) – Kısa Pornografi Taraması (BPS)", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8939429"},
 {"title": "WHO ICD-11 – 6C72 Kompulsif cinsel davranış bozukluğu", "url": "https://icd.who.int/browse/2024-01/mms/en"},
 {"title": "Grubbs ve ark. (2019) – Ahlaki uyumsuzluk ve algılanan pornografi sorunları", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8987424"},
 {"title": "Crosby ve Twohig (2016) – Problemli pornografi kullanımında ACT, randomize çalışma", "url": "https://pubmed.ncbi.nlm.nih.gov/27157029"},
 {"title": "Wright ve ark. (2017) – Pornografi kullanımı ve memnuniyet, meta-analiz", "url": "https://doi.org/10.1111/hcre.12108"},
 {"title": "JMIR Public Health (2021) – Pornografi kullanımı ve erektil fonksiyon, 3.419 erkek", "url": "https://publichealth.jmir.org/2021/10/e32542"},
 {"title": "Gollwitzer ve Sheeran (2006) – Eğer-o zaman planları meta-analizi", "url": "https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f"},
]


def sec(title, text):
    return {"title": title, "text": text}


CAMPUS = {
 "id": "porn",
 "title": "Özgür Zihin Kampüsü (Porno Bağımlılığı)",
 "emoji": "🕊️",
 "description": "Pornografi kullanımını kontrol altına al: ortamını düzenle, kaymaları anla, değerlerine yönel.",
 "reviewed": False,

 "bps": {
  "intro": "Son 6 ayı düşün. Pornografi kullanımınla ilgili bu durumlar ne sıklıkla oldu?",
  "questions": [
   {"id": "more", "text": "İstediğimden daha fazla pornografi izlediğimi fark ediyorum."},
   {"id": "cutback", "text": "Azaltmayı ya da bırakmayı denedim ama başaramadım."},
   {"id": "urges", "text": "Pornografi izleme dürtülerine karşı koymakta zorlanıyorum."},
   {"id": "cope", "text": "Üzüntü, öfke ya da yalnızlık gibi güçlü duygularla başa çıkmak için pornografi izliyorum."},
   {"id": "guilt", "text": "Suçluluk duymama rağmen pornografi izlemeye devam ediyorum."},
  ],
  "options": [{"text": "Hiç", "score": 0}, {"text": "Ara sıra", "score": 1}, {"text": "Çok sık", "score": 2}],
  "bands": [
   {"id": "low", "max": 3, "title": "Belirgin bir sorun işareti yok", "text": "Puanın tarama eşiğinin altında. Yine de kullanımını düzenlemek istiyorsan kampüs bunun için de uygun."},
   {"id": "possible", "max": 10, "title": "Olası problemli kullanım", "text": "4 ve üzeri puan, kontrolün zorlandığı olası problemli kullanıma işaret eder. Kampüs sana yardımcı olabilir; zorlanırsan bir uzmanla görüşmek süreci kolaylaştırır."},
  ],
  "values": "Rahatsızlığın daha çok bunun değerlerinle (dini ya da ahlaki) çelişmesinden mi kaynaklanıyor?",
  "valuesNote": "Araştırmalar, davranış değerlerle çeliştiğinde kişinin kendini bağımlı hissetme olasılığının belirgin şekilde arttığını gösteriyor. Hissettiğin sıkıntı gerçektir; kampüs, değerlerine uygun bir yol çizmene yardım eder.",
  "info": {"title": "Bu test nedir?", "text": "Kısa Pornografi Taraması (BPS), ABD ve Polonya'da beş farklı örneklemde geçerliliği gösterilmiş 5 soruluk bir tarama testidir. Her soru 0–2 puan alır; toplam 0–10'dur. 4 ve üzeri puan olası problemli kullanıma işaret eder. Tanı koymaz; eşik değeri araştırmacılar tarafından da ön değer olarak kabul edilir."},
 },

 "goals": [7, 15, 30, 60, 90],

 # Everyday activities for the urge screen ("Farklı şeylerle uğraş"). The user picks favourites at enrolment.
 "activityCategories": [
  {"id": "move", "emoji": "🏃", "label": "Hareket"},
  {"id": "social", "emoji": "💬", "label": "İnsanlarla"},
  {"id": "home", "emoji": "🏠", "label": "Evde"},
  {"id": "outside", "emoji": "🌳", "label": "Dışarıda"},
  {"id": "mind", "emoji": "📚", "label": "Zihin"},
  {"id": "create", "emoji": "🎨", "label": "Üretmek"},
  {"id": "calm", "emoji": "🧘", "label": "Dinlenmek"},
 ],
 "activities": [
  {"id": "walk", "category": "move", "emoji": "🚶", "label": "Yürüyüşe çık"},
  {"id": "run", "category": "move", "emoji": "🏃", "label": "Koşuya çık"},
  {"id": "pushups", "category": "move", "emoji": "💪", "label": "Şınav ya da squat yap"},
  {"id": "stretch", "category": "move", "emoji": "🤸", "label": "Esneme hareketleri yap"},
  {"id": "bike", "category": "move", "emoji": "🚴", "label": "Bisiklete bin"},
  {"id": "stairs", "category": "move", "emoji": "🪜", "label": "Merdivenleri inip çık"},
  {"id": "gym", "category": "move", "emoji": "🏋️", "label": "Spor salonuna git"},
  {"id": "kegel", "category": "move", "emoji": "🎯", "label": "Kegel antrenmanı yap"},
  {"id": "call-friend", "category": "social", "emoji": "📞", "label": "Bir arkadaşını ara"},
  {"id": "text-family", "category": "social", "emoji": "💌", "label": "Ailene mesaj at"},
  {"id": "meet", "category": "social", "emoji": "☕", "label": "Bir arkadaşınla buluş"},
  {"id": "partner", "category": "social", "emoji": "💞", "label": "Partnerinle vakit geçir"},
  {"id": "visit", "category": "social", "emoji": "🏡", "label": "Bir yakınına uğra"},
  {"id": "game", "category": "social", "emoji": "🎲", "label": "Biriyle oyun oyna"},
  {"id": "tidy", "category": "home", "emoji": "🧹", "label": "Odanı topla"},
  {"id": "dishes", "category": "home", "emoji": "🍽️", "label": "Bulaşıkları yıka"},
  {"id": "cook", "category": "home", "emoji": "🍳", "label": "Yemek yap"},
  {"id": "laundry", "category": "home", "emoji": "🧺", "label": "Çamaşırları katla"},
  {"id": "plants", "category": "home", "emoji": "🪴", "label": "Bitkilerle ilgilen"},
  {"id": "fix", "category": "home", "emoji": "🔧", "label": "Bir şey tamir et"},
  {"id": "market", "category": "outside", "emoji": "🛒", "label": "Markete git"},
  {"id": "cafe", "category": "outside", "emoji": "🫖", "label": "Bir kafeye git"},
  {"id": "park", "category": "outside", "emoji": "🌳", "label": "Parkta otur"},
  {"id": "worship", "category": "outside", "emoji": "🕌", "label": "İbadete git"},
  {"id": "errand", "category": "outside", "emoji": "📦", "label": "Ertelediğin bir işi hallet"},
  {"id": "read", "category": "mind", "emoji": "📖", "label": "Kitap oku"},
  {"id": "puzzle", "category": "mind", "emoji": "🧩", "label": "Bulmaca ya da sudoku çöz"},
  {"id": "language", "category": "mind", "emoji": "🗣️", "label": "Yabancı dil çalış"},
  {"id": "podcast", "category": "mind", "emoji": "🎧", "label": "Bir podcast dinle"},
  {"id": "study", "category": "mind", "emoji": "📝", "label": "Ders çalış ya da işine dön"},
  {"id": "draw", "category": "create", "emoji": "✏️", "label": "Çizim yap"},
  {"id": "music", "category": "create", "emoji": "🎸", "label": "Müzik çal"},
  {"id": "journal", "category": "create", "emoji": "📓", "label": "Günlük yaz"},
  {"id": "photo", "category": "create", "emoji": "📷", "label": "Fotoğraf çek"},
  {"id": "craft", "category": "create", "emoji": "🧶", "label": "El işi ya da hobi"},
  {"id": "shower", "category": "calm", "emoji": "🚿", "label": "Duş al"},
  {"id": "tea", "category": "calm", "emoji": "🍵", "label": "Çay ya da kahve demle"},
  {"id": "listen", "category": "calm", "emoji": "🎵", "label": "Sevdiğin müziği dinle"},
  {"id": "breathe", "category": "calm", "emoji": "🌬️", "label": "Nefes egzersizi yap"},
  {"id": "pray", "category": "calm", "emoji": "🤲", "label": "Dua et ya da sessizce otur"},
  {"id": "nap", "category": "calm", "emoji": "🛏️", "label": "Telefonsuz kısa bir dinlenme"},
 ],

 # Possible harms of problematic use (evidence described honestly; not everyone who watches has them).
 "harms": {
  "intro": "Pornografi izleyen herkes bu sorunları yaşamaz. Risk; kullanım kontrolden çıktığında, sıklaştığında ve zor duygularla başa çıkma yoluna dönüştüğünde artar.",
  "items": [
   {"id": "ed", "emoji": "🎯", "title": "Sertleşme ve cinsel zorluklar", "text": "18–35 yaş arası 3.400'den fazla erkekle yapılan bir araştırmada izleme sıklığı değil, kontrol edilemeyen (problemli) kullanım sertleşme sorunu olasılığıyla ilişkili bulundu."},
   {"id": "relationship", "emoji": "💞", "title": "İlişki ve cinsel memnuniyet", "text": "50 çalışmayı birleştiren bir analizde erkeklerde daha fazla kullanım, biraz daha düşük ilişki ve cinsel memnuniyetle ilişkiliydi. Etki küçüktür ve neden-sonuç ilişkisi kesin değildir."},
   {"id": "trust", "emoji": "🔒", "title": "Gizlilik ve güven", "text": "Gizli kullanım partnerle güven sorunlarına, kıskançlığa ve çatışmaya yol açabilir."},
   {"id": "mood", "emoji": "😔", "title": "Utanç, kaygı ve düşük ruh hâli", "text": "Kontrol kaybı yaşayan kişilerde utanç, kaygı ve keyifsizlik daha sık görülür. Kısa süreli rahatlamanın ardından gelen pişmanlık bir döngüye dönüşebilir."},
   {"id": "time", "emoji": "⏳", "title": "Zaman, uyku ve odak", "text": "Gece geç saatlere uzayan kullanım uykuyu kısaltır; işe, derslere ve sevdiklerine ayrılan zamandan çalar."},
   {"id": "escalation", "emoji": "📈", "title": "Daha yoğun içerik arayışı", "text": "Bazı kullanıcılar zamanla aynı etkiyi almak için daha yoğun ya da sıra dışı içeriklere yöneldiklerini bildiriyor. Bu durum araştırmalarda tartışmalıdır, ama kontrolün zayıfladığının bir işareti olabilir."},
   {"id": "expectations", "emoji": "🎭", "title": "Gerçek dışı beklentiler", "text": "Kurgulanmış sahneler, gerçek ilişkilerde süre, beden ve performans hakkında gerçek dışı beklentiler oluşturabilir ve performans kaygısını artırabilir."},
  ],
  "note": "Kör olma, kısırlık ya da kalıcı beyin hasarı gibi iddiaların bilimsel bir dayanağı yoktur. Önemli olan kontrol ve hayatına etkisidir.",
 },

 # ACT values: the user picks up to three; shown on the home screen as a reminder of what matters.
 "values": [
  {"id": "relationships", "emoji": "💞", "label": "İlişkilerim", "text": "Sevdiklerimle gerçek ve derin bağlar kurmak."},
  {"id": "health", "emoji": "💪", "label": "Sağlığım", "text": "Bedenime iyi bakmak; uyku, hareket ve beslenme."},
  {"id": "growth", "emoji": "📚", "label": "Öğrenmek ve gelişmek", "text": "Yeni şeyler öğrenmek ve kendimi geliştirmek."},
  {"id": "work", "emoji": "🎯", "label": "İşim ve hedeflerim", "text": "İşime ve hedeflerime odaklanmak."},
  {"id": "meaning", "emoji": "🤲", "label": "Maneviyat ve anlam", "text": "Değerlerime ve inancıma uygun yaşamak."},
  {"id": "creativity", "emoji": "🎨", "label": "Üretmek ve hobiler", "text": "Zamanımı üreterek ve keyif aldığım uğraşlarla geçirmek."},
 ],

 # Lapse chain analysis options.
 "analysis": {
  "devices": [{"id": "phone", "emoji": "📱", "label": "Telefon"}, {"id": "computer", "emoji": "💻", "label": "Bilgisayar"}, {"id": "tablet", "emoji": "📺", "label": "Tablet ya da TV"}],
  "feelings": [
   {"id": "stress", "emoji": "😣", "label": "Stres"},
   {"id": "lonely", "emoji": "🫥", "label": "Yalnızlık"},
   {"id": "bored", "emoji": "🥱", "label": "Can sıkıntısı"},
   {"id": "tired", "emoji": "😴", "label": "Yorgunluk"},
   {"id": "sad", "emoji": "🌧️", "label": "Üzüntü ya da öfke"},
   {"id": "aroused", "emoji": "🔥", "label": "Merak ya da uyarılma"},
  ],
  "firstSteps": [
   {"id": "social", "emoji": "📲", "label": "Sosyal medyada gezinmek"},
   {"id": "search", "emoji": "🔎", "label": "Bir arama yapmak"},
   {"id": "video", "emoji": "▶️", "label": "Video sitesi ya da uygulama"},
   {"id": "random", "emoji": "🎲", "label": "Karşıma çıkan bir içerik"},
   {"id": "planned", "emoji": "🧭", "label": "Doğrudan bilinçli olarak"},
  ],
  "recommendations": {
   "device:phone": "Kaymalarının çoğu telefonda. Telefonu geceleri yatak odası dışında şarj et ve ekran süresi sınırı koy.",
   "device:computer": "Kaymalarının çoğu bilgisayarda. Bilgisayarda içerik filtresi kur ve mümkünse kapısı açık bir odada kullan.",
   "device:tablet": "Kaymalarının çoğu tablet ya da TV'de. Bu cihazlarda da içerik filtresini aç ve geceleri ortak alanda bırak.",
   "time:night": "En riskli saatlerin gece. Saat 23'ten sonra ekranı bırakma kuralı koy; yatağa telefonsuz gir.",
   "time:evening": "En riskli saatlerin akşam. Akşam saatlerine önceden bir plan koy: spor, buluşma ya da bir hobi.",
   "time:afternoon": "En riskli saatlerin öğleden sonra. Bu saatlerde yalnız ve boş kalmamaya çalış; kısa molalarını dışarıda ver.",
   "time:morning": "En riskli saatlerin sabah. Uyanınca yatakta kalma; hemen kalk, yüzünü yıka ve güne başla.",
   "feeling:stress": "Stres en büyük tetikleyicin. Stres anında 10 dakika yürü ya da nefes egzersizi yap; stresi ekranla değil hareketle at.",
   "feeling:lonely": "Yalnızlık en büyük tetikleyicin. Yalnız hissettiğinde gerçek bir bağlantı kur: birine yaz, ara ya da dışarı çık.",
   "feeling:bored": "Can sıkıntısı en büyük tetikleyicin. Boş anlar için önceden üç etkinlik seç ve görebileceğin bir yere yaz.",
   "feeling:tired": "Yorgunluk en büyük tetikleyicin. Yorgunken irade düşer; uyku düzenini koru ve yorgunken telefonu elinden bırak.",
   "feeling:sad": "Zor duygular en büyük tetikleyicin. Duygunu bir cümleyle not et ve güvendiğin biriyle paylaş; kaçmak yerine onunla ilgilen.",
   "feeling:aroused": "Merak ve uyarılma en büyük tetikleyicin. İlk düşünce geldiğinde hemen ortamı değiştir; ilk 2 dakika en kritik andır.",
   "first:social": "Kaymaların çoğu sosyal medyada başlıyor. Tetikleyici hesapları takipten çık, keşfet sayfasını kullanma.",
   "first:search": "Kaymaların çoğu bir aramayla başlıyor. Arama motorunda güvenli aramayı aç ve gizli sekmeyi devre dışı bırak.",
   "first:video": "Kaymaların çoğu bir video uygulamasında başlıyor. Bu uygulamaların otomatik oynatma ve öneri özelliğini kapat ya da bir süre sil.",
   "first:random": "Kaymaların çoğu karşına çıkan bir içerikle başlıyor. Gördüğün anda kapat ve 'Dürtü anı' adımlarını uygula.",
   "first:planned": "Kaymaların çoğu bilinçli bir kararla başlıyor. O anlarda değer pusulana dön ve 'Dürtü anı' adımlarını uygula.",
  },
 },

 "stop": [
  {"id": "s", "letter": "D", "title": "Dur", "text": "Ne yapıyorsan bırak. Ekranı kapat ya da elinden bırak."},
  {"id": "t", "letter": "N", "title": "Nefes al", "text": "Burnundan yavaşça al, ağzından daha uzun ver. Birkaç kez tekrarla."},
  {"id": "o", "letter": "G", "title": "Gözlemle", "text": "Dürtüyü fark et ve adını koy: 'Şu an izleme dürtüsü yaşıyorum.' Onunla savaşma; dalga gibi yükselip inecek."},
  {"id": "p", "letter": "S", "title": "Seç", "text": "Değer pusulana bak ve değerine uygun bir şey yap: kalk, odadan çık, birine yaz, yürü."},
 ],

 "env": [
  {"id": "filter", "text": "Cihazlarında içerik filtresi aç", "detail": "Telefonun ekran süresi ya da ebeveyn denetimi ayarlarından yetişkin içeriği engelleyebilirsin; bilgisayarda da aynı adımı uygula."},
  {"id": "safesearch", "text": "Arama motorunda güvenli aramayı aç", "detail": "Rastgele karşına çıkan içerikleri azaltır."},
  {"id": "unfollow", "text": "Tetikleyici hesapları takipten çık", "detail": "Sosyal medyada seni tetikleyen hesapları ve önerileri temizle."},
  {"id": "bedroom", "text": "Telefonu geceleri yatak odası dışında şarj et", "detail": "Kaymaların önemli kısmı gece ve yatakta olur."},
  {"id": "incognito", "text": "Gizli sekmeyi ve şüpheli uygulamaları kaldır", "detail": "İz bırakmayan araçlar dürtüyü kolaylaştırır."},
  {"id": "curfew", "text": "Gece için ekran saati belirle", "detail": "Örneğin 23.00'ten sonra ekran yok."},
  {"id": "plan", "text": "Boş ve yalnız anlar için bir plan yaz", "detail": "Can sıkıntısında yapacağın üç şeyi önceden belirle."},
 ],

 "facts": [
  {"id": "frequency", "myth": "Sorun ne kadar sık izlediğindir.", "fact": "Araştırmalar sık izlemenin her zaman sorunlu olmadığını gösteriyor. Belirleyici olan kontrol kaybı, bırakamamak ve hayatın olumsuz etkilenmesidir."},
  {"id": "ed", "myth": "Pornografi izlemek doğrudan sertleşme sorunu yapar.", "fact": "3.400'den fazla genç erkekle yapılan bir araştırmada izleme sıklığı değil, kontrol edilemeyen kullanım sertleşme sorunu olasılığıyla ilişkili bulundu."},
  {"id": "relationship", "myth": "İlişkiye hiçbir etkisi yoktur.", "fact": "50 çalışmayı birleştiren bir analizde erkeklerde daha fazla kullanım, biraz daha düşük ilişki ve cinsel memnuniyetle ilişkiliydi. Etki küçüktür ve neden-sonuç ilişkisi kesin değildir."},
  {"id": "superpower", "myth": "Bırakınca özel güçler, sınırsız enerji ve özgüven kazanılır.", "fact": "Bunu gösteren güvenilir bir araştırma yoktur. Bırakmanın gerçek değeri, kontrolü ve zamanını geri kazanmak, değerlerine uygun yaşamaktır."},
  {"id": "alone", "myth": "Bu sorunu yaşayan çok az kişi var.", "fact": "42 ülkede yapılan uluslararası bir araştırmada katılımcıların yaklaşık %3'ünde problemli kullanım riski bulundu; en yüksek düzeyler erkeklerde görüldü."},
 ],

 "lapseLines": [
  "Bir kayma, başarısız olduğun anlamına gelmez; değişim düz bir çizgide ilerlemez.",
  "En büyük tehlike 'zaten bozdum' düşüncesidir. Bu düşünce tek kaymayı uzun bir döneme çevirebilir.",
  "Şimdi kısa bir analiz yap: bu bilgiler risk haritanı oluşturur ve sana kişisel öneriler verir.",
 ],

 "help": [
  {"id": "therapy", "title": "Psikolog ya da psikiyatrist", "text": "Bu konuda en çok araştırılan yöntemler bilişsel davranışçı terapi (BDT) ve kabul ve kararlılık terapisidir (ACT). Kaygı, depresyon ya da yalnızlık eşlik ediyorsa birlikte ele almak sonuçları iyileştirir."},
  {"id": "partner", "title": "Partnerin ya da güvendiğin biri", "text": "Hazır hissettiğinde güvendiğin biriyle konuşmak utanç duygusunu azaltır ve hedefine bağlılığını artırabilir."},
 ],

 "steps": [
  {"id": "what", "emoji": "🕊️", "title": "Özgür Zihin nedir?", "summary": "Amaç kendini yargılamak değil, kontrolü ve zamanını geri kazanmak.",
   "sections": [
    sec("Sorun ne zaman başlar?", "Pornografi izleyen herkes bağımlı değildir. Sorun; bırakmak istediğin hâlde bırakamadığında, izlemek zor duygularla başa çıkma yolun olduğunda ve işini, uykunu ya da ilişkilerini etkilediğinde başlar. Dünya Sağlık Örgütü bu durumu kompulsif cinsel davranış bozukluğu başlığı altında ele alır."),
    sec("Yalnız değilsin", "42 ülkede yapılan uluslararası bir araştırmada katılımcıların yaklaşık %3'ünde problemli kullanım riski bulundu; en yüksek düzeyler erkeklerde görüldü."),
    sec("Kampüs nasıl çalışır?", "Kampüs üç şey üzerine kurulu: dijital ortamını düzenlemek, kayma olduğunda neden olduğunu anlamak ve gününü değerlerine göre şekillendirmek. Pornografisiz gün sayacın da ilerlemeni gösterir."),
   ],
   "actions": ["Kısa testi dürüstçe yanıtla.", "Neden değişmek istediğini düşün."]},
  {"id": "values", "emoji": "🧭", "title": "Değer pusulası", "summary": "Bir şeyi bırakmak, yerine anlamlı bir şey koymakla kolaylaşır.",
   "sections": [
    sec("Neden değerler?", "Kabul ve kararlılık terapisi (ACT), dürtülerle savaşmak yerine onları fark edip değerlerine uygun hareket etmeyi öğretir. 28 erkekle yapılan randomize bir çalışmada 12 seanslık ACT sonrasında pornografi izleme %93 azaldı; bekleme listesindekilerde azalma %21'di."),
    sec("Değer pusulan", "Birazdan senin için en önemli üç değeri seçeceksin. Bunlar ana sayfanda durur; dürtü anında 'Seç' adımında neye yöneleceğini hatırlatır. Boş kalan zamanı bu değerlere uygun küçük işlerle doldurmak değişimi kalıcı kılar."),
   ],
   "actions": ["Senin için gerçekten önemli olan değerleri seç."]},
  {"id": "digital", "emoji": "🛡️", "title": "Dijital ortamını düzenle", "summary": "İrade sınırlıdır; ortamı değiştirmek dürtünün ortaya çıkmasını baştan azaltır.",
   "sections": [
    sec("Neden ortam?", "Kaymaların büyük kısmı tahmin edilebilir anlarda olur: gece, yatakta, telefonla ve yalnızken. Bu bağlantıyı kesmek her seferinde iradeyle savaşmaktan çok daha etkilidir."),
    sec("Filtreler ve engeller", "İçerik filtreleri tek başına yeterli değildir ama ilk dürtü ile davranış arasına zaman koyar. O birkaç saniye, çoğu zaman fikrini değiştirmene yeter."),
    sec("Eğer-o zaman planları", "'Eğer yatağa girersem, telefonu odanın dışında bırakırım' gibi somut planlar hedefe ulaşma olasılığını belirgin şekilde artırır."),
   ],
   "actions": ["Kayıt sonunda dijital ortam listeni oluştur."]},
  {"id": "urges", "emoji": "🌊", "title": "Dürtü anı", "summary": "Dürtü bir emir değil, bir dalgadır: yükselir ve geçer.",
   "sections": [
    sec("Bastırmak yerine fark et", "Bir düşünceyi zorla bastırmaya çalışmak onu daha sık akla getirir. Bunun yerine dürtüyü fark et, adını koy ve ne yapacağını sen seç."),
    sec("DNGS adımları", "Dur, Nefes al, Gözlemle, Seç. Dürtü anı butonuna bastığında bu dört adım seni yönlendirir. İlk iki dakika en kritik andır; ortamı değiştirmek çoğu zaman yeterli olur."),
   ],
   "actions": ["Dürtü anı butonunun yerini öğren."]},
  {"id": "lapse", "emoji": "🧩", "title": "Kayma analizi", "summary": "Her kayma, seni en çok zorlayan anlar hakkında bilgi verir.",
   "sections": [
    sec("Ya hep ya hiç tuzağı", "Nüks araştırmalarında en sık görülen tuzak, tek bir kaymadan sonra 'zaten bozdum' diyerek tamamen bırakmaktır. Kaymayı bir veri olarak gör."),
    sec("Risk haritası", "Kayma olduğunda kampüs sana dört kısa soru sorar: hangi cihaz, ne hissediyordun, ilk adım ne oldu ve saat. Bu bilgilerden seni en çok zorlayan cihaz, duygu, saat ve başlangıç noktasını gösteren kişisel bir risk haritası ve öneriler oluşur."),
    sec("Sayaç", "Kayma olduğunda pornografisiz gün sayacın yeniden başlar; ama en uzun serin, atlattığın dürtüler ve öğrendiklerin seninle kalır."),
   ],
   "actions": ["Kayma olursa analizi atlamadan yap."]},
  {"id": "support", "emoji": "🤝", "title": "Destek ve uzun vade", "summary": "Bu süreçte yardım istemek bir zayıflık değil, güçlü bir adımdır.",
   "sections": [
    sec("Profesyonel destek", "Bilişsel davranışçı terapi ve ACT bu konuda araştırılmış yöntemlerdir. Kontrol kaybı ağırsa ya da kaygı ve depresyon eşlik ediyorsa bir uzmandan destek almak süreci kolaylaştırır."),
    sec("İlişki ve yakınlık", "50 çalışmayı birleştiren bir analizde erkeklerde daha fazla kullanım biraz daha düşük ilişki memnuniyetiyle ilişkiliydi. Gerçek hayattaki yakınlığa yatırım yapmak, değişimi kalıcı kılar."),
   ],
   "actions": ["Gerekirse destek almaktan çekinme."]},
 ],
 "sources": SOURCES,
}

assert [s["id"] for s in CAMPUS["steps"]] == ["what", "values", "digital", "urges", "lapse", "support"]
assert all(v["text"] for v in CAMPUS["values"])
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'porn.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(CAMPUS, f, ensure_ascii=False, indent=2)
print('porn campus:', len(CAMPUS["steps"]), 'steps,', len(CAMPUS["values"]), 'values,', len(CAMPUS["analysis"]["recommendations"]), 'recommendations')
