"""Generates Odak Kampı content: src/content/camps/odak/*.json.

Original Turkish text, reviewed=false (to be checked by a clinical psychologist / psychiatrist, preferably
in sexual health or addiction). Rules (SPEC_ODAK_KAMPI 0.3 / 7): no diagnosis or labels, no shame or moral
judgement, nothing explicit, masturbation is never presented as harmful, no NoFap claims, no success
percentages. Every content block lists sourceIds and an evidenceLevel.

BPS items are PLACEHOLDERS until the official Turkish translation and permission are confirmed
(docs/SCALES.md). PHQ-2 / GAD-2 are public-domain screeners; the wording must be checked against the
official Turkish translation before release.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from odak_program import MISSIONS, SKILLS  # noqa: E402
from odak_library import LIBRARY, REBUILD  # noqa: E402
from odak_coach import COACH  # noqa: E402
from odak_support import BADGES, METHOD, STATS, SUMMARY, SUPPORT  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'camps', 'odak')
os.makedirs(OUT, exist_ok=True)

ACCESSED = '2026-11-18'
SOURCES = [
 {"id": "icd11", "title": "ICD-11, 6C72 Compulsive sexual behaviour disorder", "org": "Dünya Sağlık Örgütü (DSÖ)", "year": 2022, "url": "https://icd.who.int"},
 {"id": "briken2024", "title": "Assessment and treatment of compulsive sexual behavior disorder: a sexual medicine perspective", "org": "Briken P, Bőthe B, Carvalho J ve ark., Sexual Medicine Reviews", "year": 2024, "url": "https://academic.oup.com/smr"},
 {"id": "crosby2016", "title": "Acceptance and commitment therapy for problematic Internet pornography use: A randomized trial", "org": "Crosby JM, Twohig MP, Behavior Therapy 47(3):355–366", "year": 2016, "url": "https://doi.org/10.1016/j.beth.2016.02.001"},
 {"id": "twohig2010", "title": "ACT as a treatment for problematic internet pornography viewing", "org": "Twohig MP, Crosby JM, Behavior Therapy 41:285–295", "year": 2010, "url": "https://doi.org/10.1016/j.beth.2009.06.002"},
 {"id": "bothe2021", "title": "Hands-off: Feasibility and preliminary results of a two-armed RCT of a web-based self-help tool to reduce problematic pornography use", "org": "Bőthe B, Baumgartner C, Schaub MP, Demetrovics Z, Orosz G, J Behav Addict 10(4):1015–1035", "year": 2021, "url": "https://doi.org/10.1556/2006.2021.00070"},
 {"id": "meta2025", "title": "Psychotherapy for problematic pornography use: A comprehensive meta-analysis", "org": "J Behav Addict 14(2):630–643", "year": 2025, "url": "https://doi.org/10.1556/2006.2025.00018"},
 {"id": "roza2024", "title": "Treatment Approaches for Problematic Pornography Use: A Systematic Review", "org": "Roza TH ve ark., Arch Sex Behav 53(2):645–672", "year": 2024, "url": "https://doi.org/10.1007/s10508-023-02699-8"},
 {"id": "kraus2020", "title": "Validation of a Brief Pornography Screen across multiple samples", "org": "Kraus SW, Gola M, Grubbs JB ve ark., J Behav Addict 9(2):259–271", "year": 2020, "url": "https://doi.org/10.1556/2006.2020.00038"},
 {"id": "grubbs2019", "title": "Self-reported addiction to pornography in a nationally representative sample: The roles of use habits, religiousness, and moral incongruence", "org": "Grubbs JB, Kraus SW, Perry SL, J Behav Addict 8(1):88–93", "year": 2019, "url": "https://doi.org/10.1556/2006.7.2018.134"},
 {"id": "grubbs2019b", "title": "Moral Incongruence and Pornography Use: A Critical Review and Integration", "org": "Grubbs JB, Perry SL, J Sex Res", "year": 2019, "url": "https://doi.org/10.1080/00224499.2018.1427204"},
 {"id": "rowland2024", "title": "Pornography and Sexual Dysfunction: Is There Any Relationship?", "org": "Rowland DL, Cooper SE, Current Sexual Health Reports 16:19–34", "year": 2024, "url": "https://link.springer.com/journal/11930"},
 {"id": "dwulit2019", "title": "The Potential Associations of Pornography Use with Sexual Dysfunctions", "org": "Dwulit AD, Rzymski P, J Clin Med 8(7):914", "year": 2019, "url": "https://doi.org/10.3390/jcm8070914"},
 {"id": "spke9", "title": "Siber Pornografi Kullanım Envanteri-9'un Türkçe Geçerlilik ve Güvenirlik Çalışması", "org": "Bağımlılık Dergisi", "year": 2023, "url": "https://doi.org/10.51982/bagimli.1243882"},
 {"id": "marlatt", "title": "Relapse Prevention: Maintenance Strategies in the Treatment of Addictive Behaviors", "org": "Marlatt GA, Gordon JR (Guilford Press)", "year": 1985, "url": "https://www.guilford.com"},
 {"id": "phq2", "title": "The Patient Health Questionnaire-2: validity of a two-item depression screener", "org": "Kroenke K, Spitzer RL, Williams JB, Medical Care 41(11):1284–1292", "year": 2003, "url": "https://doi.org/10.1097/01.MLR.0000093487.78664.3C"},
 {"id": "gad2", "title": "Anxiety disorders in primary care: prevalence, impairment, comorbidity, and detection (GAD-2)", "org": "Kroenke K, Spitzer RL, Williams JB ve ark., Ann Intern Med 146(5):317–325", "year": 2007, "url": "https://doi.org/10.7326/0003-4819-146-5-200703060-00004"},
 {"id": "yedam", "title": "Yeşilay Danışmanlık Merkezi (YEDAM) / 115 Danışma Hattı", "org": "Türkiye Yeşilay Cemiyeti", "year": 2026, "url": "https://www.yedam.org.tr"},
 {"id": "apple", "title": "App Store Review Guidelines 1.1.4 ve 1.4.1; FamilyControls / ManagedSettings / DeviceActivity", "org": "Apple", "year": 2026, "url": "https://developer.apple.com/app-store/review/guidelines/"},
 {"id": "gollwitzer2006", "title": "Implementation intentions and goal achievement: A meta-analysis of effects and processes", "org": "Gollwitzer PM, Sheeran P, Advances in Experimental Social Psychology", "year": 2006, "url": "https://doi.org/10.1016/S0065-2601(06)38002-1"},
]
for s in SOURCES:
    s["accessed"] = ACCESSED

TRIGGERS = [
 ("night_bed", "🌙", "Gece yatakta telefonla"),
 ("alone_home", "🏠", "Yalnız evdeyken"),
 ("stress", "😣", "Stres / gerginlik"),
 ("boredom", "🥱", "Can sıkıntısı"),
 ("loneliness", "🫥", "Yalnızlık"),
 ("anxiety", "😟", "Kaygı"),
 ("sadness", "😔", "Üzüntü"),
 ("tired", "😮‍💨", "Yorgunluk"),
 ("sleepless", "🛌", "Uykusuzluk"),
 ("after_argument", "💢", "Tartışma sonrası"),
 ("social_media", "📱", "Sosyal medyada gezinirken"),
 ("alcohol", "🍺", "Alkol sonrası"),
 ("waking", "🌅", "Sabah uyanınca"),
]

ONBOARDING = {
 "reviewed": False,
 "evidenceLevel": "expert",
 "sourceIds": ["icd11", "briken2024", "bothe2021", "crosby2016", "kraus2020", "grubbs2019", "phq2", "gad2", "yedam"],
 "age": {
  "title": "Yaşın",
  "hint": "Bu kamp yalnızca yetişkinler içindir.",
  "adult": "18 yaşındayım ya da daha büyüğüm",
  "minor": "18 yaşından küçüğüm",
 },
 "under18": {
  "title": "Bu kamp 18 yaş ve üzeri için",
  "body": [
   "Bu konuyu merak etmen ya da bir şeyleri değiştirmek istemen çok doğal. Yalnız değilsin.",
   "Bu kamp yetişkinler için hazırlandı. Senin yaşına uygun destek almak en iyisi.",
  ],
  "help": [
   {"id": "adult", "emoji": "🤝", "title": "Güvendiğin bir yetişkin", "text": "Annen, baban, bir yakının ya da güvendiğin bir büyüğünle konuşmak ilk adım olabilir."},
   {"id": "school", "emoji": "🏫", "title": "Okul rehber öğretmeni", "text": "Okulundaki rehber öğretmen ya da psikolojik danışman gizlilik içinde seni dinler."},
   {"id": "yedam", "emoji": "📞", "title": "Yeşilay Danışma Hattı 115", "text": "YEDAM, çocuk ve ergenlere de ücretsiz danışmanlık verir. Arayıp konuşabilirsin.", "phone": "115", "lastVerified": "2026-11-18", "needsVerification": True},
  ],
  "emergency": "Acil bir durumda 112'yi ara.",
 },
 "facts": {
  "title": "Bilmen gerekenler",
  "items": [
   {"emoji": "🩺", "text": "Bu bir tanı aracı değildir. Sana bir etiket koymaz; yalnızca kendi durumunu görmene yardım eder."},
   {"emoji": "🌱", "text": "Cinsellik ve mastürbasyon insan doğasının bir parçasıdır. Buradaki amaç, davranışı kendi istediğin yere getirmen."},
   {"emoji": "🤍", "text": "Utanç değişimi zorlaştırır. Burada yargı yok; her adım bir öğrenme fırsatı."},
   {"emoji": "🔒", "text": "Her şey bu telefonda, kilit arkasında ve şifreli kalır. Sunucu yok, hesap yok."},
  ],
 },
 "lock": {
  "title": "Kamp kilidi",
  "body": "Kampa her girişte telefonunun kilidi (yüz, parmak izi ya da kod) sorulur; telefonunda kilit yoksa kendi PIN'ini belirlersin. Uygulama arka plana gidince kamp yeniden kilitlenir.",
 },
 "reasons": {
  "title": "Seni buraya getiren ne?",
  "hint": "Birden fazla seçebilirsin.",
  "options": [
   {"id": "porn_control", "emoji": "📵", "label": "Pornografi izlemeyi kontrol edemiyorum"},
   {"id": "mast_freq", "emoji": "🔁", "label": "Mastürbasyon sıklığım beni rahatsız ediyor"},
   {"id": "time", "emoji": "⏳", "label": "Zaman kaybı (uyku, iş, ders)"},
   {"id": "relationship", "emoji": "💞", "label": "İlişkime zarar veriyor"},
   {"id": "values", "emoji": "🧭", "label": "Değerlerimle çelişiyor"},
   {"id": "feel_bad", "emoji": "🌧️", "label": "Kendimi kötü hissediyorum (utanç / suçluluk)"},
   {"id": "coping", "emoji": "🌀", "label": "Kaygı ya da stresle başa çıkma yöntemim haline geldi"},
   {"id": "other", "emoji": "✏️", "label": "Diğer"},
  ],
  "otherPlaceholder": "Kendi cümlenle yaz (isteğe bağlı)",
 },
 "bps": {
  "title": "Kısa tarama (son 6 ay)",
  "hint": "Kısa Pornografi Taraması (BPS). Doğru ya da yanlış yanıt yok.",
  "placeholder": True,
  "placeholderNote": "Bu ölçeğin maddeleri, resmi Türkçe çevirisi ve kullanım izni teyit edilince eklenecek. Şimdilik yer tutucu gösteriliyor.",
  "items": [f"BPS maddesi {n} (resmi Türkçe çeviri teyidi bekleniyor)" for n in range(1, 6)],
  "options": [{"value": 0, "label": "Hiç"}, {"value": 1, "label": "Bazen"}, {"value": 2, "label": "Sık sık"}],
  "threshold": 4,
  "resultHigh": "Yanıtların, kullanımının seni zorladığını gösteriyor olabilir. Bir uzmanla konuşmak faydalı olabilir.",
  "resultLow": "Yanıtların yüksek bir zorlanmaya işaret etmiyor. Yine de rahatsız olduğun bir şey varsa bu kamp sana yardımcı olabilir.",
  "nonJudge": "Bu bir tanı değildir. Sadece bugün nerede olduğunu gösterir; 42. ve 90. günde yeniden bakıp kendi ilerlemeni görebilirsin.",
 },
 "freq": {
  "title": "Son 2 haftada kaç gün?",
  "hint": "Yaklaşık bir sayı yeterli. Bu bilgi yalnızca kendi başlangıç noktanı görmen için.",
  "porn": "Pornografi izlediğin gün sayısı",
  "mast": "Mastürbasyon yaptığın gün sayısı",
  "unit": "gün",
 },
 "triggers": {
  "title": "En çok hangi durumlarda oluyor?",
  "hint": "Birden fazla seçebilirsin. Bunlar ilk planlarının konusu olacak.",
  "options": [{"id": i, "emoji": e, "label": l} for i, e, l in TRIGGERS],
 },
 "emotions": {
  "title": "Önce ve sonra ne hissediyorsun?",
  "hint": "Sonrasındaki duyguyu fark etmek, davranışın sana gerçekte ne kazandırdığını görmene yardım eder.",
  "beforeTitle": "Genelde önce…",
  "afterTitle": "Genelde sonra…",
  "before": [
   {"id": "stressed", "emoji": "😣", "label": "Gergin"},
   {"id": "anxious", "emoji": "😟", "label": "Kaygılı"},
   {"id": "bored", "emoji": "🥱", "label": "Sıkılmış"},
   {"id": "lonely", "emoji": "🫥", "label": "Yalnız"},
   {"id": "sad", "emoji": "😔", "label": "Üzgün"},
   {"id": "tired", "emoji": "😮‍💨", "label": "Yorgun"},
   {"id": "angry", "emoji": "😠", "label": "Öfkeli"},
   {"id": "curious", "emoji": "🤔", "label": "Meraklı"},
   {"id": "neutral", "emoji": "😐", "label": "Belirli bir duygu yok"},
  ],
  "after": [
   {"id": "relieved", "emoji": "😮‍💨", "label": "Rahatlamış"},
   {"id": "empty", "emoji": "🕳️", "label": "Boşlukta"},
   {"id": "guilty", "emoji": "😞", "label": "Suçlu"},
   {"id": "ashamed", "emoji": "🙈", "label": "Utanmış"},
   {"id": "regret", "emoji": "😕", "label": "Pişman"},
   {"id": "tired", "emoji": "😴", "label": "Yorgun"},
   {"id": "calm", "emoji": "😌", "label": "Sakin"},
   {"id": "neutral", "emoji": "😐", "label": "Bir şey değişmedi"},
  ],
 },
 "values": {
  "title": "Bu konuda nasıl biri olmak istiyorsun?",
  "hint": "Senin için önemli olan değerleri seç ve istersen kendi cümlenle yaz. Zor anlarda sana bunları hatırlatacağız.",
  "cards": [
   {"id": "honesty", "emoji": "🤝", "label": "Dürüstlük"},
   {"id": "commitment", "emoji": "💞", "label": "İlişkime bağlılık"},
   {"id": "self_respect", "emoji": "🌟", "label": "Öz saygı"},
   {"id": "focus", "emoji": "🎯", "label": "Odak"},
   {"id": "health", "emoji": "💪", "label": "Sağlık"},
   {"id": "faith", "emoji": "🕊️", "label": "İnanç / maneviyat"},
   {"id": "family", "emoji": "🏡", "label": "Aile"},
   {"id": "productivity", "emoji": "🛠️", "label": "Üretkenlik"},
   {"id": "learning", "emoji": "📚", "label": "Öğrenme"},
   {"id": "freedom", "emoji": "🦋", "label": "Özgürlük"},
   {"id": "connection", "emoji": "🫂", "label": "Yakınlık ve bağ"},
   {"id": "responsibility", "emoji": "🧱", "label": "Sorumluluk"},
  ],
  "textPlaceholder": "Örnek: Zamanımı ve dikkatimi önem verdiğim şeylere vermek istiyorum.",
 },
 "moral": {
  "title": "Değerlerinle uyum",
  "statement": "Bu davranış değerlerimle çelişiyor.",
  "scale": ["Hiç katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Tamamen katılıyorum"],
  "note": "Bu yanıt yalnızca içeriği sana göre sıralamak için kullanılır; seni yargılamak için değil.",
 },
 "mood": {
  "title": "Son 2 haftada ruh halin",
  "hint": "Son 2 hafta içinde aşağıdaki sorunlar seni ne sıklıkla rahatsız etti?",
  "phq": ["Bir şeyler yapmaya karşı ilgi ya da istek duymamak", "Kendini çökkün, depresif ya da umutsuz hissetmek"],
  "gad": ["Sinirli, kaygılı ya da çok gergin hissetmek", "Endişelenmeyi durduramamak ya da kontrol edememek"],
  "options": [{"value": 0, "label": "Hiç"}, {"value": 1, "label": "Birkaç gün"}, {"value": 2, "label": "Günlerin yarısından fazlası"}, {"value": 3, "label": "Neredeyse her gün"}],
  "threshold": 3,
  "resultHigh": "Son günlerin zor geçmiş olabilir. Bir uzmanla konuşmak iyi gelebilir; bu kamp bunun yerine geçmez ama yanında olabilir.",
  "resultLow": "Teşekkürler. Ruh halin bu süreçte önemli; günlük kontrollerde de soracağız.",
 },
 "attempts": {
  "title": "Daha önce denedin mi? Ne oldu?",
  "hint": "Birden fazla seçebilirsin. Önceki denemeler bu kez neye dikkat edeceğimizi gösterir.",
  "options": [
   {"id": "first", "emoji": "✨", "label": "İlk kez deniyorum"},
   {"id": "short", "emoji": "⏱️", "label": "Kısa sürede bıraktım"},
   {"id": "slip_quit", "emoji": "↩️", "label": "Bir kayma sonrası tamamen bıraktım"},
   {"id": "filter", "emoji": "🧱", "label": "Filtre koydum ama aştım"},
   {"id": "shame", "emoji": "🌧️", "label": "Utanç beni daha kötü yaptı"},
  ],
  "note": "Daha önce denemiş olmak çok değerli: Neyin işe yaramadığını biliyorsun.",
 },
 "goal": {
  "title": "Hedefini seç",
  "hint": "Her davranış için ayrı seçersin. Hiçbir hedef diğerinden daha doğru değil; istediğin zaman değiştirebilirsin.",
  "porn": {
   "title": "Pornografi",
   "options": [
    {"id": "quit", "emoji": "🛑", "label": "Tamamen bırakmak"},
    {"id": "reduce", "emoji": "📉", "label": "Azaltmak (haftalık üst sınır)"},
    {"id": "undecided", "emoji": "🤔", "label": "Henüz karar vermedim"},
   ],
  },
  "mast": {
   "title": "Mastürbasyon",
   "options": [
    {"id": "none", "emoji": "➖", "label": "Hedefim yok (sadece pornografi)"},
    {"id": "reduce", "emoji": "📉", "label": "Azaltmak (haftalık üst sınır)"},
    {"id": "pause", "emoji": "⏸️", "label": "Belirli bir süre ara vermek"},
    {"id": "undecided", "emoji": "🤔", "label": "Henüz karar vermedim"},
   ],
  },
  "weeklyMax": "Haftada en fazla",
  "weeklyUnit": "gün",
  "pauseTitle": "Ne kadar süre?",
  "pauseUnit": "gün",
  "note": "Mastürbasyonun kendisi tıbben zararlı kabul edilmez. Hedefin, senin değerlerin ve hayat kaliten için ne istediğine göre belirlenmeli.",
  "undecidedNote": "Karar vermemiş olmak da bir başlangıç. İlk hafta kendini izleyerek ne istediğini netleştirebilirsin.",
 },
 "risky": {
  "title": "En riskli saatlerin",
  "hint": "Birden fazla aralık seçebilirsin. Bildirimler ve sınır planın bu saatlere göre ayarlanır.",
  "ranges": [
   {"id": "06-09", "label": "06:00–09:00", "from": "06:00", "to": "09:00"},
   {"id": "09-12", "label": "09:00–12:00", "from": "09:00", "to": "12:00"},
   {"id": "12-15", "label": "12:00–15:00", "from": "12:00", "to": "15:00"},
   {"id": "15-18", "label": "15:00–18:00", "from": "15:00", "to": "18:00"},
   {"id": "18-21", "label": "18:00–21:00", "from": "18:00", "to": "21:00"},
   {"id": "21-23", "label": "21:00–23:00", "from": "21:00", "to": "23:00"},
   {"id": "23-01", "label": "23:00–01:00", "from": "23:00", "to": "01:00"},
   {"id": "01-06", "label": "01:00–06:00", "from": "01:00", "to": "06:00"},
  ],
 },
 "plans": {
  "title": "İlk 3 planın",
  "hint": "En sık zorlandığın durumlar için \"Eğer… o zaman…\" planı seç. Önceden karar vermek, o anda karar vermekten çok daha kolaydır.",
  "if": "Eğer",
  "then": "O zaman",
  "empty": "Bir durum seçmedin. Planlarını daha sonra kamp panelinden ekleyebilirsin.",
 },
 "expert": {
  "title": "Bir uzmanla konuşmak iyi gelebilir",
  "body": "Psikiyatri polikliniği ya da bir klinik psikologdan randevu alabilirsin. Yeşilay Danışma Hattı 115 de ücretsiz danışmanlık verir; konunun kapsamını hatta sorabilirsin.",
  "phone": "115",
  "phoneLabel": "115'i ara",
  "lastVerified": "2026-11-18",
  "needsVerification": True,
  "emergency": "Acil bir durumda 112'yi ara.",
 },
 "summary": {
  "title": "Planın hazır",
  "goalsTitle": "Hedeflerin",
  "valuesTitle": "Değerlerin",
  "plansTitle": "İlk planların",
  "boundariesTitle": "Ortamını düzenle",
  "boundaries": [
   "Telefonu yatak odası dışında şarj et.",
   "Gece ekranı gri tonlamaya al.",
   "Çalışma ve yatma alanını ayır.",
   "Riskli saatlerine başka bir etkinlik planla.",
  ],
  "boundariesNote": "Hiçbir filtre aşılmaz değildir. Filtre bir fren; asıl güç senin becerilerin ve planın.",
  "programTitle": "Programın",
  "programIntro": "6 haftalık çekirdek program, ardından 90. güne kadar pekiştirme.",
  "phases": [
   {"emoji": "🔍", "name": "Farkındalık", "days": "1–7. gün", "focus": "Kendini izleme, tetikleyiciler, değerler, ortam düzenleme"},
   {"emoji": "🧱", "name": "Sınırlar", "days": "8–14. gün", "focus": "Ortam ve dijital sınırlar, riskli saat planları"},
   {"emoji": "🌊", "name": "Beceriler", "days": "15–28. gün", "focus": "Dürtü sörfü, düşüncelerden ayrışma, duygu düzenleme"},
   {"emoji": "🏗️", "name": "Yeniden İnşa", "days": "29–42. gün", "focus": "Sağlıklı rutinler, bağlantı, anlam, uyku, hareket"},
   {"emoji": "🔗", "name": "Pekiştirme", "days": "43–90. gün", "focus": "Kayma önleme, kimlik, haftalık görevler"},
   {"emoji": "🌿", "name": "Bakım", "days": "90. günden sonra", "focus": "Aylık kontrol, mezuniyet"},
  ],
  "goalLabels": {
   "porn": {"quit": "Pornografi: tamamen bırakmak", "reduce": "Pornografi: haftada en fazla {n} gün", "undecided": "Pornografi: henüz karar vermedim"},
   "mast": {"none": "Mastürbasyon: hedef yok", "reduce": "Mastürbasyon: haftada en fazla {n} gün", "pause": "Mastürbasyon: {n} gün ara", "undecided": "Mastürbasyon: henüz karar vermedim"},
  },
  "bpsAgain": "Kısa taramayı 42. ve 90. günde yeniden yapacağız; yalnızca kendi ilerlemeni görmen için.",
 },
}

PLANS = {
 "reviewed": False,
 "evidenceLevel": "review",
 "sourceIds": ["gollwitzer2006", "bothe2021", "crosby2016"],
 "templates": {
  "night_bed": {"if": "gece yatağa telefonla girmek istersem", "then": ["Telefonu yatak odası dışında şarja takarım.", "Yatmadan önce 10 dakika kitap okurum.", "Uyku moduna alıp ışığı kapatırım."]},
  "alone_home": {"if": "evde yalnız kalıp canım sıkılırsa", "then": ["Kısa bir yürüyüşe çıkarım.", "Bir arkadaşımı ararım.", "Önceden seçtiğim bir işe başlarım."]},
  "stress": {"if": "gergin ve stresli hissedersem", "then": ["2 dakika yavaş nefes alırım.", "Duş alır ya da yüzümü yıkarım.", "Hissettiğimi bir cümleyle yazarım."]},
  "boredom": {"if": "canım sıkılır ve amaçsızca gezinmeye başlarsam", "then": ["Telefonu bırakıp kalkar, odayı değiştiririm.", "10 dakikalık bir hareket yaparım.", "Yarım kalan bir işime dönerim."]},
  "loneliness": {"if": "kendimi yalnız hissedersem", "then": ["Güvendiğim birine mesaj atarım.", "Dışarıda insanların olduğu bir yere giderim.", "Değer kartlarıma bakarım."]},
  "anxiety": {"if": "kaygım yükselirse", "then": ["Dürtü sörfü aracını açarım.", "5-4-3-2-1 farkındalık egzersizi yaparım.", "Kısa bir yürüyüş yaparım."]},
  "sadness": {"if": "üzgün hissedersem", "then": ["Kendime nazikçe ne hissettiğimi söylerim.", "Sevdiğim bir müzik açarım.", "Bir yakınımla konuşurum."]},
  "tired": {"if": "çok yorgun hissedersem", "then": ["Ekranı kapatıp erkenden yatarım.", "Bir bardak su içip dinlenirim.", "Kısa bir duş alırım."]},
  "sleepless": {"if": "uyuyamazsam", "then": ["Yataktan kalkıp loş ışıkta kitap okurum.", "Nefes egzersizi yaparım.", "Telefonu odanın dışına bırakırım."]},
  "after_argument": {"if": "bir tartışmadan sonra kendimi kötü hissedersem", "then": ["10 dakika yürüyüp sakinleşirim.", "Hissettiklerimi yazarım.", "Bir arkadaşımla konuşurum."]},
  "social_media": {"if": "sosyal medyada gezinirken dürtü gelirse", "then": ["Uygulamayı kapatıp telefonu bırakırım.", "Hemen başka bir odaya geçerim.", "SOS aracını açarım."]},
  "alcohol": {"if": "alkol aldıktan sonra dürtü gelirse", "then": ["Telefonu başka bir odaya bırakırım.", "Birinin yanında kalırım.", "Su içip uyumaya giderim."]},
  "waking": {"if": "sabah uyanınca yatakta oyalanırsam", "then": ["Hemen kalkıp perdeyi açarım.", "Telefonu yataktan uzakta tutarım.", "Güne kısa bir esneme ile başlarım."]},
 },
}

PANEL = {
 "reviewed": False,
 "evidenceLevel": "expert",
 "sourceIds": ["bothe2021", "crosby2016", "marlatt"],
 "targets": {"porn": "Pornografi", "mast": "Mastürbasyon"},
 "counter": {
  "quit": "{n} gündür hedefinde",
  "zero": "Bugünü kaydettin; yarın serin yeniden başlıyor",
  "pause": "Ara: {n}/{limit}. gün",
  "pauseDone": "{limit} günlük aranı tamamladın 🌿",
  "reduce": "Bu hafta {used}/{limit} gün",
  "reduceOver": "Bu hafta {used}/{limit} gün · Sınırın biraz üstündesin; yarın yeni bir gün.",
  "detail": "Hedefine uygun toplam {total} gün · En uzun seri {longest} gün",
 },
 "undecided": {
  "title": "Kendini izleme",
  "body": "Henüz bir sayı hedefi seçmedin. Bu hafta {n} kayıt girdin; kayıtların, ne istediğini netleştirmene yardım eder.",
 },
 "value": {
  "title": "Değerlerinden biri",
  "own": "Kendine yazdığın cümle:",
 },
 "log": {
  "title": "Bir davranış kaydet",
  "hint": "Yargı yok. Kayıt, örüntünü görmene yardım eder; yalnızca bu telefonda, şifreli tutulur.",
  "options": [
   {"id": "porn", "emoji": "📵", "label": "Pornografi"},
   {"id": "mast", "emoji": "🔁", "label": "Mastürbasyon"},
   {"id": "both", "emoji": "➕", "label": "İkisi birlikte"},
  ],
  "saved": "Kaydedildi. Dürüstçe kaydetmek de bir beceri.",
  "slipTitle": "Bu, yolun bir parçası",
  "slipBody": "Kendine sert davranmak bir sonrakini kolaylaştırmaz. Birlikte bakalım: ne olduğunu fark etmek bir sonraki sefere hazırlanmaktır.",
  "kept": "Bir kayma bütün emeğinin silindiği anlamına gelmez: toplam {total} gün hedefine uygun geçti, en uzun serin {longest} gün.",
 },
 "sosStub": {"title": "Dürtü anı"},
}

SOS = {
 "reviewed": False,
 "evidenceLevel": "rct",
 "sourceIds": ["crosby2016", "twohig2010", "bothe2021", "meta2025", "marlatt"],
 "check": {
  "title": "Şu an neredesin, ne hissediyorsun?",
  "hint": "Kısa bir DAYY kontrolü. Doğru ya da yanlış yanıt yok.",
  "items": [
   {"id": "tired", "letter": "D", "emoji": "😴", "label": "Dinlenmemiş / yorgun", "tip": "Yorgunken dürtüler güçlenir. Bu gece biraz erken yatmak iyi gelebilir."},
   {"id": "hungry", "letter": "A", "emoji": "🍽️", "label": "Aç", "tip": "Açlık gerginliği artırır. Bir şeyler yemek ya da su içmek bedenini sakinleştirir."},
   {"id": "lonely", "letter": "Y", "emoji": "🫥", "label": "Yalnız", "tip": "Yalnızlık en sık tetikleyicilerden biri. Birine yazmak ya da insanların olduğu bir yere gitmek yardımcı olabilir."},
   {"id": "loaded", "letter": "Y", "emoji": "😣", "label": "Yüklü (stres / öfke)", "tip": "Gerginlik bir çıkış arar. Nefes ya da kısa bir hareket bu yükü azaltabilir."},
  ],
  "intensity": "Dürtü şu an ne kadar güçlü?",
  "intensityLabels": {"low": "Hafif", "high": "Çok güçlü"},
 },
 "relocate": {
  "title": "Önce davranış",
  "lead": "Dürtüyle savaşmana gerek yok. Sadece şu an olduğun yerden kalk.",
  "seconds": 60,
  "steps": ["Telefonu bırak", "Odadan çık", "Işığı aç", "Bir bardak su iç"],
  "start": "60 saniye mekân değiştir",
  "done": "Yer değiştirdin. Bu küçük adım, dürtü ile davranış arasına mesafe koyar.",
 },
 "tools": {
  "title": "Bir araç seç",
  "hint": "İstediğin kadarını dene. Birini bitirince başka birine geçebilirsin.",
  "items": [
   {"id": "surf", "emoji": "🌊", "title": "Dürtü sörfü", "desc": "3–5 dakikalık dalga"},
   {"id": "breath", "emoji": "🌬️", "title": "Nefes", "desc": "2 dakika yavaş nefes"},
   {"id": "move", "emoji": "🏃", "title": "Hareket", "desc": "2 dakikalık hızlı set"},
   {"id": "values", "emoji": "🧭", "title": "Değerlerim", "desc": "Kendi cümlelerin"},
   {"id": "futureSelf", "emoji": "✉️", "title": "Gelecekteki ben", "desc": "Kendine yazdığın mektup"},
   {"id": "supporter", "emoji": "💬", "title": "Birine yaz", "desc": "Hazır, nötr bir mesaj"},
  ],
 },
 "surf": {
  "desc": "Dürtüyü yok etmeye çalışma; onu bir dalga gibi izle. Yükselecek, zirve yapacak ve alçalacak.",
  "prompts": [
   "Dürtüyü fark et. Şu an bir dürtü var; bu yalnızca bir his.",
   "Bedeninde nerede hissediyorsun? Göğsünde mi, karnında mı, ellerinde mi?",
   "İzle; yükselecek ve alçalacak. Ona göre hareket etmek zorunda değilsin.",
   "Nefesin dalganın üstünde bir sörf tahtası gibi. Yavaş al, yavaş ver.",
   "Dalga zirveye yaklaşıyor olabilir. Bu da geçecek.",
   "Dalga alçalıyor. Sen hâlâ buradasın ve sen seçiyorsun.",
  ],
  "done": "Dalgayı izledin. Dürtü geldi ve sen onu davranışa çevirmeden izlemeyi seçtin.",
 },
 "breath": {"desc": "Nefesini yavaşlatmak bedenini sakinleştirir. Kutu nefesi ya da 4-7-8 ile iki dakika."},
 "move": {
  "desc": "Kısa bir hareket enerjiyi başka yöne çevirir. Her hareket 30 saniye; kendi temponda yap.",
  "seconds": 120,
  "steps": ["Squat (çömelip kalkma)", "Duvar şınavı", "Yerinde tempolu yürüyüş", "Kollarını ve omuzlarını esnet"],
  "start": "2 dakikalık seti başlat",
  "done": "Seti bitirdin. Bedenin şu an farklı hissediyor olabilir.",
 },
 "values": {"desc": "Bu konuda nasıl biri olmak istediğini kendin yazdın:", "empty": "Henüz bir değer seçmedin. Panelden ekleyebilirsin."},
 "futureSelf": {
  "desc": "Zor bir anda okuman için kendine bir mektup yaz. Ne hissettiğini ve neden bu yolda olduğunu hatırlat.",
  "placeholder": "Sevgili ben, bu anı okuyorsan…",
  "save": "Mektubu kaydet",
  "edit": "Mektubu düzenle",
  "saved": "Mektubun şifreli olarak kaydedildi.",
 },
 "supporter": {
  "desc": "Güvendiğin birine yaz. Mesaj nötr; ayrıntı içermez.",
  "message": "Şu an zor bir an yaşıyorum, konuşabilir miyiz?",
  "share": "Mesajı gönder",
 },
 "end": {
  "question": "Şimdi nasılsın?",
  "managed": "Geçti",
  "hard": "Hâlâ zor",
  "slipped": "Kaydım",
  "managedTitle": "Bu anı yönettin",
  "managedBody": "Dürtü geldi ve sen onu izlemeyi seçtin. Her yönettiğin an, bir sonrakini biraz daha kolaylaştırır.",
  "hardBody": "Sorun değil; bazı dalgalar daha uzun sürer. Başka bir araç deneyelim: {tool}.",
  "slippedTitle": "Bu, yolun bir parçası",
  "slippedBody": "Kendine sert davranmak bir sonrakini kolaylaştırmaz. Bir kayma bütün emeğinin silindiği anlamına gelmez. İstersen ne olduğunu kaydedelim.",
  "count": "Bu güne kadar {n} dürtü anını yönettin.",
  "logSlip": "Kaydı ekle",
  "back": "Panele dön",
 },
 "emergency": "Acil bir durumda 112'yi ara.",
}

DIARY = {
 "reviewed": False,
 "evidenceLevel": "rct",
 "sourceIds": ["bothe2021", "crosby2016", "marlatt"],
 "title": "Günlüğüm",
 "intro": "Kendini izlemek değişimin ilk adımı. Kayıtların yalnızca bu telefonda, şifreli tutulur.",
 "urge": {
  "title": "Dürtü kaydı",
  "hint": "Üç dokunuşta: ne kadar güçlü, ne oldu, ne yaptın.",
  "intensity": "Ne kadar güçlüydü?",
  "trigger": "Ne zaman / nerede? (isteğe bağlı)",
  "dayy": "O an nasıldın? (isteğe bağlı)",
  "outcome": "Ne yaptın?",
  "managed": "Yönettim",
  "slipped": "Kaydım",
  "saved": "Kaydedildi. Fark etmek, yönetmenin yarısı.",
 },
 "behavior": {
  "title": "Davranış kaydı",
  "hint": "Yargı yok. Ne olduğunu fark etmek bir sonraki sefere hazırlanmaktır.",
  "kind": "Ne oldu?",
  "trigger": "Hangi durumda? (isteğe bağlı)",
  "before": "Önce ne hissediyordun? (isteğe bağlı)",
  "after": "Sonra ne hissettin? (isteğe bağlı)",
  "satisfaction": "Ne kadar tatmin etti? (isteğe bağlı)",
  "satisfactionScale": ["Hiç", "Az", "Orta", "Oldukça", "Çok"],
  "save": "Kaydet",
 },
 "week": {
  "title": "Bu haftanın özeti",
  "empty": "Özet için bu hafta en az {min} kayıt gerekiyor. Şu an {n} kayıt var.",
  "counts": "{urges} dürtü anı · {managed} yönetildi · {behaviors} davranış kaydı",
  "riskyHour": "En riskli saat: {range}",
  "riskyDay": "En riskli gün: {day}",
  "topTrigger": "En sık durum: {trigger}",
  "bestTool": "En çok işe yarayan araç: {tool}",
  "emotions": "Genelde önce “{before}”, sonra “{after}” hissetmişsin.",
  "satisfaction": "Ortalama tatmin: {avg}/5",
  "note": "Bu özet farkındalık içindir; bir değerlendirme ya da not değildir.",
 },
 "days": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
 "list": {
  "title": "Son kayıtlar",
  "empty": "Henüz kayıt yok. Dürtü ya da davranış kaydı ekleyebilirsin.",
  "urge": "Dürtü · {n}/10",
  "managed": "yönetildi",
  "still_hard": "zordu",
  "slipped": "kayma",
 },
}

CHECKIN = {
 "reviewed": False,
 "evidenceLevel": "rct",
 "sourceIds": ["bothe2021", "crosby2016", "phq2"],
 "title": "Günlük kontrol",
 "hint": "30 saniye. Doğru ya da yanlış yanıt yok.",
 "onGoal": {"q": "Bugün hedefine uygun muydun?", "yes": "Evet", "no": "Hayır"},
 "urges": {"q": "Kaç kez güçlü bir dürtü oldu?", "options": [0, 1, 2, 3, 5], "max": "5+"},
 "mood": {"q": "Ruh halin", "scale": ["Çok kötü", "Kötü", "Orta", "İyi", "Çok iyi"]},
 "sleep": {"q": "Uyku kalitesi", "scale": ["Çok kötü", "Kötü", "Orta", "İyi", "Çok iyi"]},
 "loneliness": {"q": "Yalnızlık hissi", "scale": ["Hiç", "Az", "Orta", "Oldukça", "Çok"]},
 "value": {"q": "Bugün değerlerine uygun yaptığın bir şey (isteğe bağlı)", "placeholder": "Örnek: Akşam yürüyüşe çıktım."},
 "save": "Kaydet",
 "done": "Teşekkürler. Kendini fark etmek değişimin temelidir.",
 "doneSlip": "Dürüst yanıtın için teşekkürler. İstersen birlikte bakalım; bu bir öğrenme fırsatı.",
 "toSlip": "Birlikte bakalım",
 "lowMood": "Son birkaç gündür kendini çok kötü hissediyorsun. Bunu yalnız taşımak zorunda değilsin.",
 "panelDue": "Günlük kontrolün hazır",
 "panelDone": "Bugünkü kontrol tamam ✓",
 "panelNext": "Sonraki kontrol: {days} gün sonra",
}

SLIP = {
 "reviewed": False,
 "evidenceLevel": "review",
 "sourceIds": ["marlatt", "bothe2021", "crosby2016", "grubbs2019b"],
 "welcome": {"title": "Bu, yolun bir parçası", "body": "Kendine sert davranmak bir sonrakini kolaylaştırmaz. Birlikte bakalım."},
 "what": {
  "title": "Ne oldu?",
  "hint": "Fark etmek, bir sonraki sefere hazırlanmaktır. Hepsi isteğe bağlı.",
  "kind": "Ne oldu?",
  "trigger": "Hangi durumda?",
  "emotion": "Önce ne hissediyordun?",
  "when": "Ne zaman?",
  "whenOptions": [{"id": "now", "label": "Az önce"}, {"id": "today", "label": "Bugün daha erken"}, {"id": "yesterday", "label": "Dün"}],
 },
 "notErased": {
  "title": "Bir kayma, bütün emeğin silindiği anlamına gelmez",
  "body": "\"Nasılsa bozuldu, artık fark etmez\" düşüncesi çok yaygındır ve kaymayı uzatır. Gerçek şu: emeğin yerinde duruyor.",
  "total": "Hedefine uygun toplam gün: {n}",
  "longest": "En uzun serin: {n} gün",
  "managed": "Yönettiğin dürtü anları: {n}",
 },
 "compassion": {
  "title": "Bir dakika kendine nazik ol",
  "seconds": 60,
  "prompts": [
   "Bir elini göğsüne koy. Şu an zorlandığını kabul et: \"Bu zor bir an.\"",
   "Bunu yaşayan tek kişi sen değilsin. Değişim herkes için inişli çıkışlıdır.",
   "Kendine, bir arkadaşına söyleyeceğin gibi söyle: \"Hata yapabilirim; yine de yoluma devam ediyorum.\"",
  ],
  "start": "1 dakikayı başlat",
  "done": "Kendine nazik davranmak, bir sonraki adımı atmayı kolaylaştırır.",
 },
 "plan": {
  "title": "Planını güncelle",
  "hint": "Bu durum bir dahaki sefere nasıl farklı olabilir? Bir \"Eğer… o zaman…\" planı seç.",
  "own": "Kendi planımı yazayım",
  "ownPlaceholder": "O zaman…",
  "skip": "Şimdilik geç",
  "save": "Planı kaydet",
 },
 "done": {"title": "Yoluna devam", "body": "Kaymayı fark ettin, ondan öğrendin ve planını güncelledin. Bu, güçlü bir beceri.", "back": "Panele dön"},
}

RELAPSE = {
 "reviewed": False,
 "evidenceLevel": "review",
 "sourceIds": ["marlatt", "bothe2021", "roza2024"],
 "panelTitle": "Son günler zor geçti",
 "panelBody": "Birkaç gündür hedefinin dışındasın. Bu, yeniden başlamayı öğrenmek için bir fırsat.",
 "panelButton": "Birlikte bakalım",
 "intro": {"title": "Yeniden başlamak bir beceridir", "body": "Çoğu insan bir değişimi kalıcı yapana kadar birkaç kez dener. Her deneme, neyin işe yaradığını öğretir."},
 "learned": {
  "title": "Bu süreçte öğrendiklerin",
  "triggers": "En sık zorlandığın durumlar: {list}",
  "tools": "İşe yarayan araçların: {list}",
  "managed": "Yönettiğin dürtü anları: {n}",
  "none": "Henüz yeterli kayıt yok. Bundan sonraki kayıtların sana yol gösterecek.",
 },
 "goal": {
  "title": "Hedefini gözden geçir",
  "hint": "Hedefini değiştirmek bir geri adım değildir. Belki şu an azaltma hedefi daha gerçekçidir; karar senin.",
  "keep": "Hedefimi koruyorum",
  "save": "Hedefi kaydet",
 },
 "restart": {
  "title": "Sınırlar aşamasından devam",
  "body": "Programına Sınırlar aşamasından (8. gün) yeniden başlarsın: ortamını ve riskli saatlerini birlikte yeniden düzenleriz. Toplam günlerin, en uzun serin ve yönettiğin dürtü anları korunur.",
  "button": "Sınırlar aşamasından devam et",
  "done": "Hazırsın. Programın Sınırlar aşamasından devam ediyor.",
 },
}

REFERRAL = {
 "reviewed": False,
 "evidenceLevel": "expert",
 "sourceIds": ["briken2024", "meta2025", "phq2", "gad2", "yedam"],
 "title": "Profesyonel destek bu süreci kolaylaştırabilir",
 "slips": "Son iki haftada birkaç kez zorlandın. Bir uzmanla konuşmak, bu yükü birlikte taşımana yardım edebilir.",
 "screen": "Tarama ve ruh hali yanıtların, bir uzmanla konuşmanın iyi gelebileceğini gösteriyor.",
 "mood": "Son birkaç gündür kendini çok kötü hissediyorsun. Bunu yalnız taşımak zorunda değilsin.",
}

BOUNDARIES = {
 "reviewed": False,
 "evidenceLevel": "rct",
 "sourceIds": ["bothe2021", "crosby2016", "apple"],
 "title": "Ortam ve dijital sınırlar",
 "intro": "Ortamı düzenlemek, dürtü anında karar vermeyi kolaylaştırır. Filtreler ve sınırlar zor anlara bir fren koyar.",
 "honesty": "Hiçbir filtre aşılmaz değildir. Filtre bir fren, asıl güç senin becerilerin ve planın.",
 "checklistTitle": "Fiziksel ortam",
 "checklist": [
  {"id": "charge", "emoji": "🔌", "label": "Telefonu yatak odası dışında şarj et"},
  {"id": "grayscale", "emoji": "🌫️", "label": "Gece ekranı gri tonlamaya al"},
  {"id": "spaces", "emoji": "🛋️", "label": "Çalışma ve yatma alanını ayır"},
  {"id": "activities", "emoji": "🗓️", "label": "Riskli saatlerine bir etkinlik planla"},
 ],
 "grayscaleHint": "Gri tonlama ekranı daha az çekici yapar. iPhone: Ayarlar > Erişilebilirlik > Ekran ve Metin Boyutu > Renk Filtreleri. Android: Ayarlar > Dijital Denge > Yatma vakti modu ya da Erişilebilirlik > Renk düzeltme.",
 "ios": {
  "title": "iPhone: Ekran Süresi",
  "steps": [
   "Ayarlar > Ekran Süresi'ni aç ve Ekran Süresi'ni etkinleştir.",
   "İçerik ve Gizlilik Kısıtlamaları > İçerik Kısıtlamaları > Web İçeriği > \"Yetişkin Web Sitelerini Sınırla\"yı seç.",
   "Kapalı Kalma Süresi'ni riskli saatlerine göre ayarla.",
   "Uygulama Limitleri ile tetikleyici uygulamalara günlük süre koy.",
   "İstersen bir Ekran Süresi parolası belirle ve güvendiğin birine sakla.",
  ],
  "note": "Bu ayarların hepsi iPhone'un kendi içinde çalışır; uygulama hiçbir veriye erişmez.",
  "done": "Ekran Süresi'ni kurdum",
 },
 "android": {
  "title": "Android: Dijital Denge",
  "steps": [
   "Ayarlar > Dijital Denge ve ebeveyn denetimleri'ni aç.",
   "Uygulama zamanlayıcıları ile tetikleyici uygulamalara günlük süre koy.",
   "Odak modu ile riskli saatlerinde dikkat dağıtan uygulamaları duraklat.",
   "Yatma vakti modunu aç: gece ekran gri tonlamaya geçer ve bildirimler susar.",
  ],
  "open": "Dijital Denge'yi aç",
  "note": "Bu ayarlar telefonun kendi içinde çalışır; uygulama hiçbir veriye erişmez.",
  "done": "Dijital Denge'yi kurdum",
 },
 "reminder": {
  "title": "Riskli saat hatırlatıcısı",
  "body": "Riskli saatlerinde seçtiğin uygulamalardan biri açılırsa, nazik bir \"Odak zamanı\" hatırlatması gelir. Engellemez; yalnızca hatırlatır.",
  "disclosure": "Bu özellik, \"Kullanım erişimi\" izniyle hangi uygulamaların ne zaman açıldığını yalnızca bu telefonda okur. Bu bilgi hiçbir yere gönderilmez, saklanmaz; sadece hatırlatmanın gerekip gerekmediğine bakılır.",
  "enable": "Hatırlatıcıyı aç",
  "grant": "Kullanım erişimi iznini ver",
  "grantHint": "Açılan listede bu uygulamayı bulup izni aç, sonra buraya dön.",
  "appsTitle": "Hangi uygulamalar?",
  "appsHint": "Genelde tetikleyici olanları seç (ör. sosyal medya, tarayıcı).",
  "hoursTitle": "Riskli saatlerin",
  "noHours": "Önce en az bir riskli saat aralığı seç.",
  "unavailable": "Bu özellik uygulamanın tam sürümünde (Android) çalışır; bu sürümde kullanılamıyor.",
  "delay": "Telefon bu kontrolü yaklaşık 15 dakikada bir yapar; hatırlatma birkaç dakika gecikebilir.",
  "notifTitle": "Odak zamanı 🎯",
  "notifBody": "Planını hatırlamak için iyi bir an.",
 },
}

for name, data in [("onboarding.tr.json", ONBOARDING), ("plans.tr.json", PLANS), ("panel.tr.json", PANEL), ("sos.tr.json", SOS), ("diary.tr.json", DIARY), ("checkin.tr.json", CHECKIN), ("slip.tr.json", SLIP), ("relapse.tr.json", RELAPSE), ("referral.tr.json", REFERRAL), ("boundaries.tr.json", BOUNDARIES), ("missions.tr.json", MISSIONS), ("skills.tr.json", SKILLS), ("library.tr.json", LIBRARY), ("rebuild.tr.json", REBUILD), ("coach.tr.json", COACH), ("support.tr.json", SUPPORT), ("summary.tr.json", SUMMARY), ("stats.tr.json", STATS), ("badges.tr.json", BADGES), ("method.tr.json", METHOD), ("sources.json", SOURCES)]:
    with open(os.path.join(OUT, name), 'w', encoding='utf8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
print('ok', OUT)
