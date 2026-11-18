"""Generates src/content/neck.tr.json — Dik Boyun Kampüsü (boyun düzleşmesi / öne eğik baş duruşu).

Original Turkish content, reviewed=false. Evidence (see SOURCES):
- Corrective exercise improves the craniovertebral angle in forward head posture (strong evidence) and
  neck pain moderately (Sheikhhoseini et al., 2018 meta-analysis).
- "Loss of cervical lordosis" is an imaging finding; the cause needs assessment. Exercise is the most
  helpful treatment for ongoing neck pain; reduce or stop an exercise that causes moderate/high pain (NHS trusts).
- Red flags: arm/leg weakness, numbness or tingling; pain after trauma; fever, night sweats, weight loss;
  balance/walking problems or bladder/bowel changes → see a doctor.
- Head flexion load model: ~12 kg at 15°, ~18 kg at 30°, ~22 kg at 45°, ~27 kg at 60° (Hansraj, 2014; computer model).
The wall test (back-of-head to wall distance) is used only for personal tracking, not diagnosis.
"""
import json, os

SOURCES = [
 {"title": "Sheikhhoseini ve ark. (2018) – Öne eğik baş duruşunda egzersiz, meta-analiz", "url": "https://pubmed.ncbi.nlm.nih.gov/30107937/"},
 {"title": "Midlands Partnership NHS – Boyun ağrısında kendi kendine bakım ve egzersiz", "url": "https://mpft.nhs.uk/services/msk/self-help/neck/neck-pain"},
 {"title": "RJAH NHS – Boyun ağrısı: egzersiz ve ağrı kuralı", "url": "https://www.rjah.nhs.uk/our-services/therapy/supported-self-care/neck-pain/"},
 {"title": "Hansraj (2014) – Baş eğimi ve boyun omurgasına binen yük", "url": "https://pubmed.ncbi.nlm.nih.gov/25393825/"},
]


def sec(title, text):
    return {"title": title, "text": text}


def ex(id, emoji, title, steps, reps, hold, rest, sides=False, tip=""):
    return {"id": id, "emoji": emoji, "title": title, "steps": steps, "reps": reps, "holdSec": hold, "restSec": rest, "sides": sides, "tip": tip}


CAMPUS = {
 "id": "neck",
 "title": "Dik Boyun Kampüsü (Boyun Düzleşmesi)",
 "emoji": "🦒",
 "description": "Öne eğik baş duruşunu ve boyun düzleşmesini günlük kısa bir rutinle düzelt.",
 "reviewed": False,
 "weeks": 8,
 "weeklyTarget": 5,

 "redFlags": {
  "intro": "Başlamadan önce güvenliğin için: aşağıdakilerden biri sende var mı?",
  "questions": [
   {"id": "nerve", "text": "Kollarında ya da ellerinde uyuşma, karıncalanma veya güçsüzlük"},
   {"id": "trauma", "text": "Düşme, kaza ya da darbe sonrasında başlayan boyun ağrısı"},
   {"id": "systemic", "text": "Ateş, gece terlemesi ya da açıklanamayan kilo kaybı"},
   {"id": "severe", "text": "Çok şiddetli, sürekli ya da geceleri artan ağrı"},
   {"id": "cord", "text": "Dengede ya da yürümede bozulma, idrar veya dışkı kontrolünde sorun"},
  ],
  "title": "Önce bir doktora görün",
  "text": "Seçtiğin belirtiler, egzersize başlamadan önce bir hekim değerlendirmesi gerektirebilir. Bu kampüsün rutinleri bu durumlar için tasarlanmadı.",
  "ok": "Kırmızı bayrak belirtmedin. Egzersiz sırasında ağrın orta ya da şiddetli düzeye çıkarsa o hareketi hafiflet ya da bırak.",
 },

 "selfTest": {
  "questions": [
  {"id": "screen", "text": "Günde toplam kaç saat telefona ya da bilgisayara bakıyorsun?", "options": [{"id": "lt2", "label": "2 saatten az"}, {"id": "2to4", "label": "2–4 saat"}, {"id": "4to6", "label": "4–6 saat"}, {"id": "gt6", "label": "6 saatten fazla"}]},
  {"id": "pain", "text": "Boynunda ya da sırtının üst kısmında ne sıklıkla ağrı oluyor?", "options": [{"id": "none", "label": "Hiç"}, {"id": "some", "label": "Ara sıra"}, {"id": "often", "label": "Sık sık"}]},
  ],
  "loads": [
   {"deg": 0, "kg": 5, "label": "Dik"},
   {"deg": 15, "kg": 12, "label": "15°"},
   {"deg": 30, "kg": 18, "label": "30°"},
   {"deg": 45, "kg": 22, "label": "45°"},
   {"deg": 60, "kg": 27, "label": "60°"},
  ],
  "loadNote": "Bir bilgisayar modeline göre baş öne eğildikçe boyna binen yük hızla artar. Bu bir modeldir, ama telefonu göz hizasına kaldırmanın neden önemli olduğunu gösterir.",
 },

 "measure": {
  "id": "wall", "kind": "stepper", "title": "Baş–duvar mesafesi", "unit": "cm", "min": 0, "max": 15, "step": 0.5, "better": "lower",
  "howTo": [
   "Topukların, kalçan ve sırtın duvara değecek şekilde dik dur.",
   "Çeneni yukarı kaldırmadan, gözlerin karşıya bakarken başını rahatça geriye getir.",
   "Başının arkası ile duvar arasındaki mesafeyi ölç: bir yardımcıdan yardım al ya da parmaklarınla tahmin et (1 parmak ≈ 2 cm).",
  ],
  "hint": "Bu bir tanı testi değildir; yalnızca kendi ilerlemeni görmen için. Haftada bir, aynı koşullarda ölç.",
 },

 "exercises": [
  ex("chin-tuck", "🙂", "Çene içe çekme", ["Dik otur, gözlerin karşıya baksın.", "Çeneni yere paralel tutarak başını geriye kaydır; sanki çift çene yapıyormuş gibi.", "Boynunun arkasında hafif bir gerilme hisset ve tut.", "Yavaşça bırak."], 10, 5, 3, tip="Başını aşağı eğme; hareket geriye doğru kaymadır."),
  ex("wall-tuck", "🧱", "Duvarda çene içe çekme", ["Sırtını duvara daya, topukların duvardan bir adım önde olsun.", "Çeneni içe çekerek başının arkasını duvara doğru hafifçe bastır.", "Tut, sonra bırak."], 10, 5, 3, tip="Bastırırken çeneni kaldırma."),
  ex("deep-flexor", "🛏️", "Yatarak derin boyun kası çalışması", ["Sırtüstü yat, dizlerini bük.", "Başını yerden kaldırmadan, 'evet' der gibi çeneni çok hafifçe içe çek.", "Boynunun ön tarafındaki derin kasları hisset ve tut."], 10, 10, 5, tip="Hareket çok küçük olmalı; boynunun yüzeydeki kasları gerilmemeli."),
  ex("scap-squeeze", "🔙", "Kürek kemiği sıkıştırma", ["Dik otur ya da ayakta dur, kolların yanda olsun.", "Kürek kemiklerini geriye ve aşağıya doğru birbirine yaklaştır.", "Omuzlarını kulaklarına doğru kaldırma; tut ve bırak."], 12, 5, 3),
  ex("wall-angel", "👼", "Duvar melekleri", ["Sırtın ve başın duvara değsin, kollarını 'kale direği' gibi yanlara aç.", "Kollarını duvara değdirmeye çalışarak yavaşça yukarı kaydır.", "Yavaşça aşağı indir."], 10, 3, 2, tip="Belin duvardan kopmasın; zorlanırsan kollarını daha az kaldır."),
  ex("chair-extension", "🪑", "Sandalyede sırt açma", ["Arkalığı alçak bir sandalyeye otur, ellerini ensende birleştir.", "Sırtının üst kısmını arkalığın üzerinden hafifçe geriye doğru aç.", "Tut ve dik pozisyona dön."], 8, 3, 2),
  ex("doorway", "🚪", "Kapı aralığında göğüs germe", ["Bir kapı aralığında dur, ön kollarını kasanın iki yanına omuz hizasında yerleştir.", "Bir adım öne çıkarak göğsünün önünde gerilme hisset.", "Gerginlikte bekle; ağrı değil, hafif gerilme olmalı."], 2, 30, 10),
  ex("side-stretch", "↔️", "Boyun yan germe", ["Dik otur, bir elinle sandalyenin kenarını tut.", "Başını diğer omzuna doğru yavaşça eğ.", "Boynunun yanında gerilme hisset ve bekle."], 2, 30, 5, sides=True),
 ],

 "checklist": [
  {"id": "screen-height", "text": "Ekranını göz hizasına getir", "detail": "Monitörün üst kenarı göz hizasında ya da hafif altında olsun; dizüstü için yükseltici ve ayrı klavye kullan."},
  {"id": "phone-up", "text": "Telefonu göz hizasına kaldır", "detail": "Başını eğmek yerine telefonu yukarı kaldır; dirseklerini bir yere dayayabilirsin."},
  {"id": "breaks", "text": "Her 30–45 dakikada bir mola ver", "detail": "Kalk, omuzlarını çevir ve birkaç çene içe çekme yap."},
  {"id": "chair", "text": "Sandalyeni ayarla", "detail": "Sırtın desteklensin, ayakların yere tam bassın, dirseklerin 90 dereceye yakın olsun."},
  {"id": "pillow", "text": "Yastığını gözden geçir", "detail": "Yan yatarken baş ve boyun düz bir çizgide kalmalı; çok yüksek ya da çok alçak yastık boynu zorlayabilir."},
  {"id": "bag", "text": "Ağır çantayı tek omzunda taşıma", "detail": "Yükü iki omza dağıtan sırt çantası tercih et."},
 ],

 "facts": [
  {"id": "xray", "myth": "Röntgende boyun düzleşmesi varsa kesin ağrı olur.", "fact": "Boyun düzleşmesi röntgende sık görülen bir bulgudur ve ağrısı olmayan birçok kişide de görülür. Nedeni değerlendirilmeli; çoğu zaman kas gerginliği ve duruş alışkanlıkları rol oynar."},
  {"id": "permanent", "myth": "Duruş bir kez bozulduysa düzelmez.", "fact": "Araştırmaları bir araya getiren bir analizde düzenli egzersizin öne eğik baş duruşunu belirgin şekilde düzelttiği ve boyun ağrısını orta düzeyde azalttığı bulundu."},
  {"id": "rest", "myth": "Boyun ağrıyorsa tamamen hareketsiz kalmak gerekir.", "fact": "NHS kaynaklarına göre süregelen boyun ağrısında en yararlı tedavi egzersizdir. Hareket ağrıyı orta ya da şiddetli düzeye çıkarırsa hafifletilir, ama tamamen bırakmak genellikle önerilmez."},
  {"id": "phone", "myth": "Telefona eğilmek boyna yük bindirmez.", "fact": "Bir modele göre baş 60 derece öne eğildiğinde boyna binen yük yaklaşık 27 kilograma çıkar. Telefonu göz hizasına kaldırmak bu yükü azaltır."},
 ],

 "steps": [
  {"id": "what", "emoji": "🦒", "title": "Boyun düzleşmesi nedir?", "summary": "Boynun doğal hafif kavisinin azalması ve başın öne kayması.",
   "sections": [
    sec("Doğal kavis", "Boyun omurları normalde hafif öne doğru bir kavis çizer. Bu kavis azaldığında röntgende 'boyun düzleşmesi' denir. Çoğu zaman öne eğik baş duruşu ve boyun–sırt kaslarındaki dengesizlik eşlik eder."),
    sec("Neden olur?", "Uzun süre telefona ya da bilgisayara eğilmek, kas gerginliği, zayıf derin boyun kasları ve hareketsizlik en sık nedenlerdir. Düşme ya da kaza sonrası gelişen düzleşmeler ise mutlaka hekim tarafından değerlendirilmelidir."),
    sec("Telefonun etkisi", "Bir bilgisayar modeline göre baş öne eğildikçe boyna binen yük artar: dikken yaklaşık 5 kg olan baş, 60 derece eğildiğinde boyna 27 kg kadar yük bindirir."),
   ],
   "actions": ["Kayıtta güvenlik sorularını dürüstçe yanıtla."]},
  {"id": "evidence", "emoji": "📈", "title": "Egzersiz işe yarıyor mu?", "summary": "Evet; özellikle düzenli ve birkaç hafta sürdürülen programlar.",
   "sections": [
    sec("Araştırmalar ne diyor?", "Çalışmaları bir araya getiren bir analizde düzeltici egzersizlerin başın öne kaymasını gösteren açıyı belirgin şekilde iyileştirdiği ve boyun ağrısını orta düzeyde azalttığı bulundu."),
    sec("Hangi egzersizler?", "En çok araştırılanlar derin boyun kaslarını çalıştıran çene içe çekme hareketleri, sırtın üst kısmını ve kürek kemiklerini güçlendiren hareketler ve göğüs kaslarını germedir. Kampüsün günlük rutini bunlardan oluşur."),
   ],
   "actions": ["8 hafta boyunca haftada en az 5 gün rutini tamamlamayı hedefle."]},
  {"id": "routine", "emoji": "⏱️", "title": "Günlük rutin", "summary": "Yaklaşık 12 dakika; zamanlayıcı seni adım adım yönlendirir.",
   "sections": [
    sec("Nasıl çalışır?", "Rutini başlattığında her egzersiz sırayla açılır: nasıl yapılacağı, kaç tekrar ve kaç saniye tutacağın ekranda görünür. Zamanlayıcı 'Tut' ve 'Dinlen' anlarını gösterir."),
    sec("Ağrı kuralı", "Hafif bir gerilme ya da yorgunluk normaldir. Bir hareket ağrını orta ya da şiddetli düzeye çıkarıyorsa o hareketi hafiflet ya da atla."),
   ],
   "actions": ["İlk rutinini bugün tamamla."]},
  {"id": "ergonomics", "emoji": "💻", "title": "Gün içindeki duruşun", "summary": "Günde 12 dakikalık rutin, kalan saatlerdeki duruşla birlikte işe yarar.",
   "sections": [
    sec("Ekran ve telefon", "Ekranı göz hizasına getirmek ve telefonu kaldırmak boynun gün boyu öne eğik kalmasını azaltır."),
    sec("Mola", "Her 30–45 dakikada kısa bir mola ver; omuzlarını çevir ve birkaç çene içe çekme yap. Ana sayfadaki ergonomi listesi sana yol gösterir."),
   ],
   "actions": ["Ergonomi listesinden bugün iki maddeyi uygula."]},
  {"id": "track", "emoji": "📏", "title": "İlerlemeni ölç", "summary": "Haftada bir duvar testiyle baş–duvar mesafeni kaydet.",
   "sections": [
    sec("Duvar testi", "Duvara dik dur, çeneni kaldırmadan başını geriye getir ve başının arkası ile duvar arasındaki mesafeyi ölç. Mesafe azaldıkça baş daha az öne kayıyor demektir."),
    sec("Bir not", "Bu ölçüm tanı amaçlı değildir; kendi ilerlemeni görmen içindir. Her hafta aynı saatte ve aynı koşullarda ölçmek en doğru sonucu verir."),
   ],
   "actions": ["İlk ölçümünü ana sayfadan kaydet."]},
 ],

 "help": [
  {"id": "physio", "title": "Fizyoterapist", "text": "Ağrın birkaç haftada geçmiyorsa ya da egzersizleri doğru yapıp yapmadığından emin değilsen bir fizyoterapist sana özel bir program hazırlayabilir."},
  {"id": "doctor", "title": "Doktor", "text": "Kollarda uyuşma ya da güçsüzlük, kaza sonrası ağrı, ateş veya denge sorunu gibi belirtilerde beklemeden bir hekime başvur."},
 ],
 "sources": SOURCES,
}

out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'neck.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(CAMPUS, f, ensure_ascii=False, indent=2)
total = sum(e["reps"] * (e["holdSec"] + e["restSec"]) * (2 if e["sides"] else 1) for e in CAMPUS["exercises"])
print('neck campus:', len(CAMPUS["exercises"]), 'exercises,', round(total / 60, 1), 'min')
