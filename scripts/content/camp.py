"""Generates Sigarasız Kamp (90 Gün) content: src/content/camp/*.json.

Original Turkish text, reviewed=false (to be checked by a chest physician / certified cessation doctor).
No medication names or doses, no success percentages, e-cigarettes never suggested as a quit method.
Every content item lists sourceIds from sources.json.
"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'camp')
os.makedirs(OUT, exist_ok=True)

ACCESSED = '2026-11-17'
SOURCES = [
 {"id": "bricker2020", "title": "Efficacy of Smartphone Applications for Smoking Cessation: A Randomized Clinical Trial", "org": "Bricker JB ve ark., JAMA Internal Medicine", "year": 2020, "url": "https://doi.org/10.1001/jamainternmed.2020.4055"},
 {"id": "bricker2021", "title": "Mechanisms of Smartphone Apps for Cigarette Smoking Cessation (iCanQuit)", "org": "Bricker JB, Levin M, Lappalainen R ve ark., JMIR mHealth uHealth", "year": 2021, "url": "https://mhealth.jmir.org/"},
 {"id": "crane2018", "title": "Relative effectiveness of a full versus reduced version of the 'Smoke Free' mobile application", "org": "Crane D, Ubhi HK, Brown J, West R, F1000Research", "year": 2018, "url": "https://doi.org/10.12688/f1000research.16148.1"},
 {"id": "perski2019", "title": "Does the addition of a supportive chatbot promote user engagement with a smoking cessation app?", "org": "Perski O, Crane D, Beard E, Brown J, Digital Health", "year": 2019, "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6775545/"},
 {"id": "cochrane2019", "title": "Mobile phone text messaging and app-based interventions for smoking cessation", "org": "Whittaker R ve ark., Cochrane Database of Systematic Reviews", "year": 2019, "url": "https://doi.org/10.1002/14651858.CD006611.pub5"},
 {"id": "guo2023", "title": "The Effectiveness of Smartphone App-Based Interventions for Assisting Smoking Cessation: Systematic Review and Meta-analysis", "org": "Guo YQ ve ark., J Med Internet Res", "year": 2023, "url": "https://www.jmir.org/2023/1/e43242"},
 {"id": "black2020", "title": "Behaviour change techniques associated with smoking cessation in intervention and comparator groups of RCTs", "org": "Black N, Johnston M, Michie S ve ark., Addiction", "year": 2020, "url": "https://doi.org/10.1111/add.15056"},
 {"id": "heatherton1989", "title": "Measuring the heaviness of smoking (Heaviness of Smoking Index)", "org": "Heatherton TF ve ark., British Journal of Addiction", "year": 1989, "url": "https://doi.org/10.1111/j.1360-0443.1989.tb03059.x"},
 {"id": "who-benefits", "title": "Tobacco: Health benefits of smoking cessation", "org": "Dünya Sağlık Örgütü (DSÖ)", "year": 2020, "url": "https://www.who.int/news-room/q-a-detail/health-benefits-of-smoking-cessation"},
 {"id": "nci-withdrawal", "title": "Handling Nicotine Withdrawal and Triggers When You Decide To Quit Tobacco", "org": "National Cancer Institute (NCI)", "year": 2022, "url": "https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco/withdrawal-fact-sheet"},
 {"id": "smokefree-withdrawal", "title": "Managing Nicotine Withdrawal", "org": "Smokefree.gov", "year": 2024, "url": "https://smokefree.gov/challenges-when-quitting/managing-withdrawal"},
 {"id": "alo171", "title": "ALO 171 Sigara Bırakma Danışma Hattı", "org": "T.C. Sağlık Bakanlığı", "year": 2026, "url": "https://alo171.saglik.gov.tr"},
 {"id": "tuik2025", "title": "Türkiye Sağlık Araştırması 2025", "org": "TÜİK", "year": 2025, "url": "https://data.tuik.gov.tr"},
 {"id": "apple141", "title": "App Store Review Guidelines — 1.4.1", "org": "Apple", "year": 2026, "url": "https://developer.apple.com/app-store/review/guidelines/#safety"},
 {"id": "michie2013", "title": "The Behavior Change Technique Taxonomy (v1) of 93 Hierarchically Clustered Techniques", "org": "Michie S ve ark., Annals of Behavioral Medicine", "year": 2013, "url": "https://doi.org/10.1007/s12160-013-9486-6"},
 {"id": "yedam", "title": "Yeşilay Danışmanlık Merkezi (YEDAM) – 115 YEDAM Danışma Hattı", "org": "Türkiye Yeşilay Cemiyeti", "year": 2026, "url": "https://www.yedam.org.tr"},
 {"id": "who-tobacco", "title": "Tobacco – fact sheet", "org": "Dünya Sağlık Örgütü (DSÖ)", "year": 2025, "url": "https://www.who.int/news-room/fact-sheets/detail/tobacco"},
 {"id": "who-waterpipe", "title": "Advisory note: waterpipe tobacco smoking – health effects, research needs and recommended actions by regulators", "org": "Dünya Sağlık Örgütü (DSÖ)", "year": 2015, "url": "https://www.who.int/publications/i/item/advisory-note-waterpipe-tobacco-smoking-health-effects-research-needs-and-recommended-actions-by-regulators-2nd-ed"},
 {"id": "who-ecig", "title": "Tobacco: E-cigarettes (Q&A)", "org": "Dünya Sağlık Örgütü (DSÖ)", "year": 2024, "url": "https://www.who.int/news-room/questions-and-answers/item/tobacco-e-cigarettes"},
 {"id": "cdc-health-effects", "title": "Health Effects of Cigarettes", "org": "CDC", "year": 2024, "url": "https://www.cdc.gov/tobacco/"},
 {"id": "cdc-secondhand", "title": "Secondhand Smoke", "org": "CDC", "year": 2024, "url": "https://www.cdc.gov/tobacco/secondhand-smoke/"},
 {"id": "nci-light", "title": "Light Cigarettes and Cancer Risk", "org": "National Cancer Institute (NCI)", "year": 2010, "url": "https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco/light-cigarettes-fact-sheet"},
 {"id": "nhs-quit", "title": "Quit smoking – Better Health", "org": "NHS", "year": 2024, "url": "https://www.nhs.uk/better-health/quit-smoking/"},
 {"id": "gollwitzer2006", "title": "Implementation intentions and goal achievement: A meta-analysis of effects and processes", "org": "Gollwitzer PM, Sheeran P, Advances in Experimental Social Psychology", "year": 2006, "url": "https://doi.org/10.1016/S0065-2601(06)38002-1"},
]
for s in SOURCES:
    s["accessed"] = ACCESSED


def opt(id, emoji, label, **kw):
    return {"id": id, "emoji": emoji, "label": label, **kw}


ONBOARDING = {
 "reviewed": False,
 "sourceIds": ["heatherton1989", "alo171", "black2020"],
 "products": [
  opt("cigarette", "📦", "Sigara (paket)"),
  opt("rolling", "🌿", "Sarma tütün"),
  opt("hookah", "💨", "Nargile"),
  opt("cigar_pipe", "🪵", "Puro / pipo"),
  opt("ecig", "🔋", "Elektronik sigara"),
  opt("heated", "🔥", "Isıtılmış tütün"),
  opt("pouch", "🫙", "Nikotin poşeti / çiğneme tütünü"),
 ],
 "firstCig": [
  {"value": 5, "label": "5 dakika içinde"},
  {"value": 30, "label": "6–30 dakika"},
  {"value": 60, "label": "31–60 dakika"},
  {"value": 61, "label": "1 saatten sonra"},
 ],
 "hsiBands": {
  "low": {"title": "Düşük bağımlılık düzeyi", "text": "Vücudunun nikotine bağımlılığı görece düşük görünüyor. Yine de alışkanlıklar ve tetikleyiciler güçlü olabilir; kampın asıl işi onlarla çalışmak."},
  "mid": {"title": "Orta bağımlılık düzeyi", "text": "Nikotin bağımlılığın orta düzeyde. İlk günlerde yoksunluk belirtileri hissedebilirsin; bunlar geçicidir ve kampta onlarla başa çıkmanın yollarını öğreneceksin."},
  "high": {"title": "Yüksek bağımlılık düzeyi", "text": "Nikotin bağımlılığın yüksek. Bu bir yargı değil, bir bilgi: bırakırken destek almak işini kolaylaştırır. Davranışsal araçlar ve profesyonel destek birlikte en iyi sonucu verir."},
 },
 "hsiInfo": "Sigara İçme Yoğunluk İndeksi iki soruya dayanır: günde kaç sigara içtiğin ve uyandıktan ne kadar sonra ilk sigarayı yaktığın. 0 ile 6 arasında bir puan verir; dünyada nikotin bağımlılığını hızlıca değerlendirmek için yaygın olarak kullanılır. Bu bir tanı değildir.",
 "medication": "Sigara bırakma ilaçları bırakma şansını artırabilir. Türkiye'de sigara bırakma polikliniklerinde hekim uygun görürse ücretsiz verilmektedir. ALO 171'i arayarak randevu alabilirsin. Gebelik, kalp hastalığı ya da psikiyatrik bir tanın varsa önce hekimine danış.",
 "under18": "18 yaşından küçüksen ALO 171'i arayarak 18 yaş altına hizmet veren sigara bırakma polikliniklerine yönlendirilebilirsin. Kamptaki tüm davranışsal araçları kullanabilirsin.",
 "reasons": [
  opt("health", "❤️", "Sağlığım"),
  opt("family", "👨‍👩‍👧", "Ailem / çocuklarım"),
  opt("money", "💰", "Para"),
  opt("fitness", "🏃", "Spor ve kondisyon"),
  opt("sexual_health", "💞", "Cinsel sağlığım"),
  opt("looks", "✨", "Görünüm ve koku"),
  opt("freedom", "🕊️", "Özgürlük ve kontrol"),
  opt("spiritual", "🤲", "Dini / manevi nedenler"),
  opt("doctor", "🩺", "Doktorum önerdi"),
 ],
 "triggers": [
  opt("waking", "🌅", "Uyanınca"),
  opt("coffee_tea", "☕", "Kahve / çay ile"),
  opt("after_meal", "🍽️", "Yemekten sonra"),
  opt("work_break", "💼", "İş molasında"),
  opt("stress", "😤", "Stresli ya da sinirliyken"),
  opt("boredom", "🥱", "Canım sıkılınca"),
  opt("alcohol", "🍺", "Alkol alırken"),
  opt("friends", "👥", "Arkadaş ortamında"),
  opt("driving", "🚗", "Araba kullanırken"),
  opt("phone", "📱", "Telefonda konuşurken"),
  opt("bedtime", "🌙", "Yatmadan önce"),
  opt("toilet", "🚻", "Tuvalette"),
 ],
 "pastAttempts": [
  {"value": 0, "label": "Hiç denemedim"},
  {"value": 1, "label": "1–2 kez denedim"},
  {"value": 3, "label": "3 ya da daha fazla denedim"},
 ],
 "relapseCauses": [
  opt("stress", "😣", "Kriz ya da stres"),
  opt("weight", "⚖️", "Kilo alma"),
  opt("social", "👥", "Sosyal ortam"),
  opt("alcohol", "🍺", "Alkol"),
  opt("just_one", "☝️", "\"Bir tane\"den sonra"),
  opt("withdrawal", "🌀", "Yoksunluk belirtileri"),
 ],
 "relapseNote": "Daha önce denemiş olman, bırakmayı nasıl yapmadığını değil, neyin zorladığını öğrendiğin anlamına gelir. Bu cevaplara göre ilgili beceri derslerini öne çıkaracağız.",
 "methods": [
  {"id": "quit_day", "emoji": "📅", "label": "Bırakma günü seç", "desc": "Önerilen yol: 3 ile 14 gün sonrasına bir tarih belirle, o güne kadar hazırlan.", "recommended": True},
  {"id": "cut_down", "emoji": "📉", "label": "Azaltarak bırak", "desc": "2–4 hafta boyunca her hafta biraz azalt, sonunda yine bir bırakma günü. Azaltmak hedef değil, köprüdür."},
  {"id": "already_quit", "emoji": "✅", "label": "Zaten bıraktım", "desc": "Son sigaranın ne zaman olduğunu gir, kamp sana uygun aşamadan başlasın."},
 ],
 "ageRanges": [
  {"id": "under18", "label": "18'den küçük"},
  {"id": "18to24", "label": "18–24"},
  {"id": "25to39", "label": "25–39"},
  {"id": "40to59", "label": "40–59"},
  {"id": "60plus", "label": "60 ve üzeri"},
 ],
 "alo171": {"title": "ALO 171 Sigara Bırakma Danışma Hattı", "text": "7/24 hizmet verir. Sabit hattan ücretsizdir; cep telefonundan aramalarda operatör tarifesi uygulanabilir. Danışmanlık, bağımlılık değerlendirmesi ve sigara bırakma polikliniği randevusu için arayabilirsin.", "save": "Numarayı telefon rehberine \"ALO 171\" adıyla kaydetmeni öneririz; zorlandığın bir anda aramak kolaylaşır.", "lastVerified": "2026-11"},
 "phases": [
  {"id": "preparation", "emoji": "🧭", "title": "Hazırlık", "text": "Bırakma gününe kadar: her gün bir görev, sigara günlüğü ve kısa bir beceri dersi."},
  {"id": "quit_day", "emoji": "🚩", "title": "Bırakma Günü", "text": "Özel kontrol listesi ve \"tek nefes bile yok\" kuralı."},
  {"id": "critical_week", "emoji": "🛡️", "title": "Kritik Hafta", "text": "1.–7. gün: en yoğun destek; günde iki kısa kontrol."},
  {"id": "strengthening", "emoji": "💪", "title": "Güçlenme", "text": "8.–30. gün: günlük görevler ve haftalık değerlendirme."},
  {"id": "maintenance", "emoji": "🌱", "title": "Kalıcılık", "text": "31.–90. gün: haftada birkaç görev ve yeniden başlamayı önleme."},
  {"id": "freedom", "emoji": "🕊️", "title": "Özgürlük", "text": "90. günden sonra: mezuniyet ve aylık kontroller."},
 ],
}

# If–then plans (implementation intentions). "Then" options include acceptance-style plans (ACT):
# some triggers can't be avoided, so a plan can be "I'll make room for the urge and…".
PLANS = {
 "reviewed": False,
 "sourceIds": ["gollwitzer2006", "michie2013", "bricker2020"],
 "info": "\"Eğer–o zaman\" planı, zor anı önceden düşünüp ne yapacağına şimdiden karar vermektir. Araştırmalar bu tür planların niyeti davranışa dönüştürmeyi kolaylaştırdığını gösteriyor. Bazı durumlardan kaçınmak mümkün değildir; bu yüzden plan \"istekle birlikte şunu yapacağım\" şeklinde de olabilir.",
 "templates": {
  "waking": {"if": "Sabah uyanınca", "then": ["önce bir bardak su içip duş alacağım", "sigara yerine pencereyi açıp beş derin nefes alacağım", "isteği fark edip kahvaltımı başka bir odada yapacağım"]},
  "coffee_tea": {"if": "Kahvemi ya da çayımı içerken", "then": ["her zamankinden farklı bir yerde oturacağım", "elimi meşgul etmek için bir kalem ya da stres topu tutacağım", "isteği fark edip yudumlarıma odaklanacağım"]},
  "after_meal": {"if": "Yemek bitince", "then": ["hemen kalkıp dişlerimi fırçalayacağım", "masadan kalkıp beş dakika yürüyeceğim", "bulaşıkları yıkayarak ellerimi meşgul edeceğim"]},
  "work_break": {"if": "İş molası verdiğimde", "then": ["sigara içilen alana değil, başka bir yöne yürüyeceğim", "molamda birini arayıp sohbet edeceğim", "su şişemi alıp kısa bir esneme yapacağım"]},
  "stress": {"if": "Stresli ya da sinirli hissettiğimde", "then": ["dalga sörfü yapıp isteğin geçmesini izleyeceğim", "dört saniye nefes alıp altı saniyede vereceğim", "on dakika bekleyip ne hissettiğimi yazacağım"]},
  "boredom": {"if": "Canım sıkıldığında", "then": ["sevdiğim bir şarkıyı açıp kısa bir yürüyüş yapacağım", "elimle yapabileceğim küçük bir işe başlayacağım", "birine mesaj atacağım"]},
  "alcohol": {"if": "Alkol olan bir ortamda bulunduğumda", "then": ["sigarayı tuttuğum elime bardağımı alacağım", "sigara içenlerin yanından uzak duracağım", "ortama girmeden önce planımı gözden geçireceğim"]},
  "friends": {"if": "Arkadaşlarım sigara yaktığında", "then": ["\"Teşekkürler, bıraktım\" diyeceğim", "o sırada bir şey içip sohbete devam edeceğim", "isteği fark edip kendime nedenlerimi hatırlatacağım"]},
  "driving": {"if": "Araba kullanırken canım çektiğinde", "then": ["sakız çiğneyeceğim", "sevdiğim bir podcast açacağım", "camı açıp derin nefes alacağım"]},
  "phone": {"if": "Telefonda konuşurken", "then": ["boşta kalan elimle bir kalem tutacağım", "konuşurken yürüyeceğim", "balkona değil, içeride bir yere geçeceğim"]},
  "bedtime": {"if": "Yatmadan önce", "then": ["sıcak bir bitki çayı içeceğim", "kısa bir nefes egzersizi yapacağım", "dişlerimi erkenden fırçalayacağım"]},
  "toilet": {"if": "Tuvaletteyken canım çektiğinde", "then": ["telefonumda kısa bir oyun açacağım", "orada geçirdiğim zamanı kısaltacağım", "isteği fark edip bir dakika nefesime odaklanacağım"]},
 },
}

# Health benefits of quitting — faithful to the WHO list, no exaggeration. Ids match engine/milestones.ts.
HEALTH = {
 "reviewed": False,
 "sourceIds": ["who-benefits"],
 "intro": "Sigarayı bıraktığın andan itibaren vücudun kendini onarmaya başlar. Aşağıdaki zaman çizelgesi Dünya Sağlık Örgütü'nün listesine dayanır.",
 "note": "Kaynak: DSÖ · Kişiden kişiye değişir.",
 "items": [
  {"id": "min20", "label": "20 dakika", "emoji": "❤️", "text": "Kalp atış hızın ve kan basıncın düşer."},
  {"id": "h12", "label": "12 saat", "emoji": "🩸", "text": "Kanındaki karbonmonoksit düzeyi normale döner."},
  {"id": "w2", "label": "2–12 hafta", "emoji": "🫁", "text": "Kan dolaşımın iyileşir ve akciğerlerinin çalışması güçlenir."},
  {"id": "m1", "label": "1–9 ay", "emoji": "🌬️", "text": "Öksürük ve nefes darlığı azalır."},
  {"id": "y1", "label": "1 yıl", "emoji": "💪", "text": "Koroner kalp hastalığı riskin, sigara içen birinin yaklaşık yarısına iner."},
  {"id": "y5", "label": "5–15 yıl", "emoji": "🧠", "text": "İnme riskin, hiç sigara içmemiş birininkine iner."},
  {"id": "y10", "label": "10 yıl", "emoji": "🎗️", "text": "Akciğer kanseri riskin, sigara içen birinin yaklaşık yarısına iner. Ağız, boğaz, yemek borusu, mesane, rahim ağzı ve pankreas kanseri riskleri de azalır."},
  {"id": "y15", "label": "15 yıl", "emoji": "🕊️", "text": "Koroner kalp hastalığı riskin, hiç sigara içmemiş birininki gibi olur."},
 ],
}

# SOS crisis tool. Urge surfing (ACT) is the default: the aim is to stay with the urge, not to fight it.
SOS = {
 "reviewed": False,
 "sourceIds": ["bricker2020", "bricker2021", "nci-withdrawal", "smokefree-withdrawal"],
 "intro": "Bu istek gelip geçecek. Birkaç dakika birlikte kalalım.",
 "intensityLabels": {"low": "Hafif", "high": "Çok güçlü"},
 "surf": {
  "title": "Dalga sörfü",
  "desc": "İsteği yok etmeye çalışma; onu bir dalga gibi izle. Yükselecek, zirve yapacak ve alçalacak.",
  "prompts": [
   "İsteği fark et. Şu an bir sigara isteği var; bu sadece bir his.",
   "Bedeninde nerede hissediyorsun? Göğsünde mi, boğazında mı, ellerinde mi?",
   "Onunla savaşma. Sadece izle; merakla, yargılamadan.",
   "Nefesin doğal aksın. Dalganın üstünde, nefesinle birlikte duruyorsun.",
   "His şiddetlenebilir. Bu, dalganın zirvesi; zirveler hep geçer.",
   "Aklına \"bir tane bir şey olmaz\" gibi düşünceler gelebilir. Onları sadece fark et ve geçmelerine izin ver.",
   "Hissin değiştiğini fark ediyor musun? Biraz azaldı mı, şekil mi değiştirdi?",
   "Dalga alçalıyor. Sigara içmeden bu isteğin içinden geçtin.",
  ],
  "done": "Dalga geçti ya da hafifledi. İsteğe yer açıp onunla birlikte durabildin.",
 },
 "breath": {"title": "Nefes", "desc": "Nefesini yavaşlatmak bedenini sakinleştirir. Kutu nefesi ya da 4-7-8 ile iki dakika."},
 "delay": {
  "title": "10 dakika ertele",
  "desc": "Kararı sadece 10 dakika ertele. İstekler çoğu zaman birkaç dakikada zirve yapıp söner.",
  "ideas": ["Bir bardak su iç", "Kısa bir yürüyüş yap", "Dişlerini fırçala", "Birine mesaj at ya da ara", "Esneme hareketleri yap", "Şekersiz sakız çiğne", "Ellerini yıka, yüzüne su çarp", "Bir şarkı aç ve eşlik et"],
  "done": "10 dakika doldu. Kararı yeniden sen verebilirsin; istek muhtemelen biraz hafifledi.",
 },
 "fourE": {
  "title": "4E kuralı",
  "desc": "Zor anda hatırlaman kolay dört adım.",
  "items": [
   {"letter": "E", "title": "Ertele", "text": "\"Şimdi değil, 10 dakika sonra\" de. Çoğu istek bu sürede hafifler."},
   {"letter": "E", "title": "Elini meşgul et", "text": "Kalem, stres topu, telefonla kısa bir oyun; elin sigaraya gitmesin."},
   {"letter": "E", "title": "En sevdiğin içeceği iç", "text": "Bir bardak su ya da sevdiğin şekersiz bir içecek; yavaş yudumlarla."},
   {"letter": "E", "title": "Eğlenceli bir şey yap", "text": "Sevdiğin bir şarkı, kısa bir video, biriyle sohbet; dikkatini başka yöne çevir."},
  ],
 },
 "reasons": {"title": "Nedenlerim", "desc": "Neden bırakmak istediğini kendi sözlerinle hatırla.", "empty": "Henüz bir nedenin kayıtlı değil."},
 "game": {"title": "Eşleştirme oyunu", "desc": "60 saniye içinde kartları eşleştir. Dikkatini isteğin dışına taşı.", "seconds": 60},
 "alo": "Yalnız değilsin. ALO 171'deki danışmanlar şu an seninle konuşabilir.",
 "end": {
  "question": "Şimdi nasılsın?",
  "resisted": "Geçti, içmedim 💪",
  "hard": "Hâlâ zor",
  "smoked": "İçtim",
  "resistedTitle": "Bu krizi atlattın!",
  "resistedBody": "İsteğin içinden sigara içmeden geçmek, beynine yeni bir yol öğretmek demek. Her atlattığın kriz bir sonrakini kolaylaştırır.",
  "hardBody": "Bazen istek biraz daha uzun sürer. Başka bir araç dene; ya da ALO 171'i arayıp biriyle konuş.",
  "smokedTitle": "Bu bir öğrenme anı",
  "smokedBody": "Bir sigara, emeğini silmez. Toplam dumansız günlerin korunuyor. Ne olduğunu anlamak, bir dahaki sefere hazır olmanı sağlar.",
 },
}

# Daily check-in, withdrawal symptom tips (after NCI / Smokefree.gov, original Turkish), slip and relapse.
CHECKIN = {
 "reviewed": False,
 "sourceIds": ["nci-withdrawal", "smokefree-withdrawal", "alo171"],
 "symptoms": [
  {"id": "restless", "emoji": "🌀", "label": "Huzursuzluk", "tip": "Bedenini hareket ettir: kısa bir yürüyüş, merdiven inip çıkmak ya da birkaç esneme hareketi huzursuzluğu azaltır. Kafeinli içecekleri biraz azaltmak da işe yarayabilir.", "eases": "Genellikle ilk 2–4 hafta içinde azalır."},
  {"id": "irritable", "emoji": "😤", "label": "Sinirlilik, öfke", "tip": "Bu his geçici ve yoksunluğun normal bir parçası. Tepki vermeden önce birkaç yavaş nefes al; çevrendekilere bu dönemden geçtiğini söylemek de anlayış kazanmanı sağlar.", "eases": "İlk hafta en yoğundur; çoğu zaman 2–4 hafta içinde hafifler."},
  {"id": "insomnia", "emoji": "🌙", "label": "Uykusuzluk", "tip": "Akşam saatlerinde kafeinden kaçın, yatmadan önce ekranı bırak ve her gün aynı saatte yatmaya çalış. Yatakta uyuyamıyorsan kalkıp sakin bir şeyle uğraşmak yardımcı olur.", "eases": "Uyku düzeni çoğu zaman birkaç hafta içinde yerine oturur."},
  {"id": "appetite", "emoji": "🍽️", "label": "İştah artışı", "tip": "Acıktığında elinin altında meyve, sebze ya da su olsun. Yavaş yemek ve öğün atlamamak ani açlıkları azaltır. Sigaranın yerini atıştırmalıkla doldurduğunu fark etmek de önemli.", "eases": "İştah artışı birkaç hafta sürebilir; zamanla dengelenir."},
  {"id": "headache", "emoji": "🤕", "label": "Baş ağrısı", "tip": "Bol su iç, düzenli öğün ye ve kısa molalar ver. Baş ağrın şiddetliyse ya da geçmiyorsa bir hekime danış.", "eases": "Genellikle ilk günlerde görülür ve kısa sürede geçer."},
  {"id": "focus", "emoji": "🧠", "label": "Odaklanma güçlüğü", "tip": "İşlerini küçük parçalara böl ve sık ara ver. Önemli işleri gün içinde en dinç olduğun saatlere koy. Kısa bir yürüyüş zihnini toplamana yardım eder.", "eases": "Çoğu zaman birkaç hafta içinde düzelir."},
  {"id": "cough", "emoji": "😮‍💨", "label": "Öksürük", "tip": "Akciğerlerin temizlenirken bir süre öksürük artabilir. Bol su içmek balgamı yumuşatır. Öksürüğün uzun sürerse, kan gelirse ya da nefes darlığın varsa hekime başvur.", "eases": "Genellikle birkaç hafta içinde azalır."},
  {"id": "constipation", "emoji": "🥦", "label": "Kabızlık", "tip": "Lifli yiyecekler (sebze, meyve, tam tahıl) ve bol su tüket; her gün biraz hareket etmek bağırsakları çalıştırır.", "eases": "Genellikle birkaç hafta içinde düzelir."},
 ],
 "moods": [
  {"v": 1, "emoji": "😣", "label": "Çok kötü"},
  {"v": 2, "emoji": "😕", "label": "Kötü"},
  {"v": 3, "emoji": "😐", "label": "İdare eder"},
  {"v": 4, "emoji": "🙂", "label": "İyi"},
  {"v": 5, "emoji": "😄", "label": "Çok iyi"},
 ],
 "safety": {
  "title": "Son günlerde kendini çok kötü hissediyorsun",
  "text": "Üç gündür ruh halini \"çok kötü\" olarak işaretledin. Bırakma sürecinde zor günler olabilir, ama bu kadar zorlanıyorsan yalnız taşımak zorunda değilsin. Bir hekime başvurmanı ya da ALO 171'i arayıp konuşmanı öneririz. Acil bir durumda 112'yi ara.",
 },
 "slip": {
  "welcomeTitle": "Bu bir öğrenme anı",
  "welcome": "Bir kayma, bırakma yolculuğunun sık görülen bir parçasıdır ve emeğini silmez. Toplam dumansız günlerin korunuyor. Şimdi ne olduğunu birlikte anlayalım; bu, bir dahaki sefere hazır olmanı sağlar.",
  "howMany": "Kaç sigara içtin?",
  "what": "Ne oldu?",
  "feeling": "Nasıl hissediyordun?",
  "next": "Bir dahaki sefere ne yapacaksın?",
  "nextHint": "Bu durum için yeni bir Eğer–O zaman planı yap. Bir sonraki sefer hazır olacaksın.",
  "doneTitle": "Programa devam",
  "done": "Aşaman korunuyor. Bir kayma geri dönüş değil; şimdi bir sonraki adıma odaklan.",
  "relapseLink": "Tekrar düzenli içmeye başladım",
 },
 "relapse": {
  "title": "Yeniden başlamak için hazırlan",
  "intro": "Tekrar düzenli içmeye başlamış olman, öğrendiklerinin boşa gittiği anlamına gelmez. Çoğu kişi kalıcı olarak bırakmadan önce birkaç kez dener. Bu denemeden öğrendiklerin bir sonrakini güçlendirecek.",
  "learned": "Bu denemeden öğrendiklerin",
  "plan": "Yeni bırakma günü",
  "planHint": "Kısa bir hazırlıkla (3 gün önerilir) yeniden başla. Planların, nedenlerin ve kayıtların korunur.",
  "confirm": "Yeni denemeyi başlat",
 },
}

# Support screen: official help lines (dated; institutional details can change) and supporter messages.
SUPPORT = {
 "reviewed": False,
 "sourceIds": ["alo171", "yedam"],
 "lastVerified": "2026-11",
 "alo171": {
  "title": "ALO 171 Sigara Bırakma Danışma Hattı",
  "number": "171",
  "hours": "7 gün 24 saat",
  "cost": "Sabit hattan ücretsizdir; cep telefonundan aramalarda operatörünün tarifesi uygulanabilir.",
  "offers": ["Sigara bırakma danışmanlığı", "Bağımlılık düzeyinin değerlendirilmesi", "Sigara bırakma polikliniğinden randevu", "Bırakma sürecinde takip"],
 },
 "clinics": {
  "title": "Sigara bırakma poliklinikleri",
  "text": "Hastanelerde, sağlıklı hayat merkezlerinde ve aile sağlığı merkezlerinde sigara bırakma poliklinikleri bulunur. Hekim uygun görürse sigara bırakma ilaçları ücretsiz verilir. ALO 171 seni en yakın polikliniğe yönlendirir.",
 },
 "yesilay": {
  "title": "Yeşilay Danışmanlık Merkezi (YEDAM)",
  "number": "115",
  "text": "Yeşilay'ın danışmanlık merkezleri tütün bağımlılığı dahil bağımlılıklarda ücretsiz psikolojik ve sosyal destek sunar. 115 YEDAM Danışma Hattı'nı arayarak randevu alabilirsin.",
 },
 "emergency": {"title": "Acil durumda 112", "text": "Kendini ya da başkasını tehlikede hissettiğin acil bir durumda hemen 112'yi ara."},
 "supporter": {
  "intro": "Destekçine hazır bir mesaj gönder. Mesaj telefonunun paylaşım menüsüyle gider; uygulama hiçbir şeyi kendisi göndermez.",
  "messages": [
   {"id": "quit", "label": "Bırakma günü", "text": "Merhaba {supporter}, {date} günü sigarayı bırakıyorum. Zorlandığımda sana yazabilir miyim? Desteğin benim için çok değerli."},
   {"id": "progress", "label": "İlerleme", "text": "{days} gündür dumansızım! Bu süreçte yanımda olduğun için teşekkür ederim, {supporter}."},
   {"id": "hard", "label": "Zor bir an", "text": "{supporter}, şu an sigara isteğiyle zor bir an yaşıyorum. Birkaç dakika konuşabilir miyiz?"},
  ],
 },
 "doctor": {
  "intro": "Sigara bırakma polikliniğinde ya da hekiminle görüşürken kullanabileceğin kısa bir özet. Özet cihazında oluşturulur ve sadece sen paylaşırsan gönderilir.",
  "note": "Bu özet, kullanıcının uygulamaya kendi girdiği bilgilerden oluşturulmuştur; tıbbi bir değerlendirme değildir.",
 },
}

# Badges, reward jar and graduation (reward BCTs: Black et al., 2020). Ids match engine/stats.ts.
REWARDS = {
 "reviewed": False,
 "sourceIds": ["black2020", "michie2013"],
 "badges": [
  {"id": "days-1", "emoji": "🌅", "title": "İlk gün", "desc": "İlk dumansız gününü tamamladın."},
  {"id": "days-3", "emoji": "⛰️", "title": "Zirve atlatıldı", "desc": "Üç gün: yoksunluğun en yoğun günlerini geride bıraktın."},
  {"id": "days-7", "emoji": "🛡️", "title": "Bir hafta", "desc": "Kritik haftayı tamamladın."},
  {"id": "days-14", "emoji": "💪", "title": "İki hafta", "desc": "İki haftadır dumansızsın."},
  {"id": "days-30", "emoji": "🌙", "title": "Bir ay", "desc": "Bir ay dumansız: büyük bir eşik."},
  {"id": "days-60", "emoji": "🌱", "title": "İki ay", "desc": "Yeni alışkanlıkların kök salıyor."},
  {"id": "days-90", "emoji": "🎓", "title": "90 gün", "desc": "Kampın tamamını dumansız tamamladın."},
  {"id": "days-180", "emoji": "🌟", "title": "Altı ay", "desc": "Yarım yıl dumansız."},
  {"id": "days-365", "emoji": "🏆", "title": "Bir yıl", "desc": "Bir yıl dumansız. Muhteşem."},
  {"id": "crisis-10", "emoji": "🌊", "title": "10 kriz", "desc": "On isteği sigara içmeden atlattın."},
  {"id": "crisis-50", "emoji": "🏄", "title": "50 kriz", "desc": "Elli dalganın üzerinde sörf yaptın."},
  {"id": "crisis-100", "emoji": "🐋", "title": "100 kriz", "desc": "Yüz krizi atlattın; artık dalgaları tanıyorsun."},
  {"id": "first-plan", "emoji": "🧩", "title": "İlk plan", "desc": "İlk Eğer–O zaman planını yaptın."},
  {"id": "all-skills", "emoji": "📚", "title": "Tüm dersler", "desc": "Bütün beceri derslerini tamamladın."},
  {"id": "checkin-7", "emoji": "📋", "title": "7 gün kontrol", "desc": "Yedi gün art arda günlük kontrol yaptın."},
  {"id": "saved-1000", "emoji": "💰", "title": "İlk 1.000 TL", "desc": "Sigaraya harcamadığın para 1.000 TL'yi geçti."},
  {"id": "graduate", "emoji": "🎓", "title": "Mezun", "desc": "Sigarasız Kamp'tan mezun oldun."},
 ],
 "jar": {
  "intro": "Sigaraya harcamadığın parayla almak istediğin şeyleri ekle. İlerleme çubukları tasarrufunla dolar.",
  "examples": ["Yeni kulaklık", "Bir hafta sonu kaçamağı", "Spor ayakkabısı", "Ailece bir akşam yemeği"],
 },
 "graduation": {
  "title": "Tebrikler, mezun oluyorsun!",
  "text": "90 gün boyunca dumansız kalmak için her gün yeniden karar verdin. Bu sertifika o kararların toplamı.",
  "certTitle": "Sigarasız Kamp Mezuniyet Sertifikası",
  "certLine": "90 günlük Sigarasız Kamp'ı tamamlayarak dumansız bir hayata adım attın.",
  "after": "Mezuniyetten sonra da sayacın, kriz aracın, ALO 171 ve tüm araçların burada. Aylık kısa kontrollerle yolculuğun devam ediyor.",
 },
}

for name, data in [('sources.json', SOURCES), ('support.tr.json', SUPPORT), ('rewards.tr.json', REWARDS), ('onboarding.tr.json', ONBOARDING), ('plans.tr.json', PLANS), ('health-timeline.tr.json', HEALTH), ('sos.tr.json', SOS), ('checkin.tr.json', CHECKIN)]:
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
print('camp content:', len(SOURCES), 'sources,', len(PLANS['templates']), 'plan templates')
