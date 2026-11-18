"""Generates src/content/feet.tr.json — Güçlü Kemer Kampüsü (düz taban / pes planus).

Original Turkish content, reviewed=false. Evidence (see SOURCES):
- Flexible flat feet are common and usually need no treatment when painless; see a GP if feet are painful,
  stiff, weak or numb, if there are frequent injuries, if only one foot is flat or if flat feet appear
  suddenly; rigid feet need assessment (NHS).
- Flexible flat foot: the arch appears on tiptoe. Children develop arches roughly between 3 and 10 years;
  about 1 in 5 never does, and only a few have problems.
- Short-foot exercise: a 2022 meta-analysis found improved navicular drop and foot posture; a 2024 one found no
  overall effect except for programmes longer than 6 weeks — evidence is limited and mixed.
- Single-leg stance (eyes open) norms: about 40+ s in young adults, declining after 60 (Springer et al., 2007).
"""
import json, os

SOURCES = [
 {"title": "NHS – Düz taban", "url": "https://www.nhs.uk/conditions/flat-feet/"},
 {"title": "Huang ve ark. (2022) – Kısa ayak egzersizi ve düz taban, meta-analiz", "url": "https://pubmed.ncbi.nlm.nih.gov/36231295/"},
 {"title": "Kısa ayak egzersizi ve düz tabanda ayak duruşu, meta-analiz (2024)", "url": "https://pubmed.ncbi.nlm.nih.gov/38517769/"},
 {"title": "Guy's and St Thomas' NHS – Çocuklarda düz taban", "url": "https://guysandstthomas.nhs.uk/health-information/flat-feet-children"},
 {"title": "Springer ve ark. (2007) – Tek ayak denge testi normatif değerleri", "url": "https://geriatrictoolkit.missouri.edu/balance/Normative_Values_for_the_Unipedal_Stance_Test_Springer-JGPT.pdf"},
]


def sec(title, text):
    return {"title": title, "text": text}


def ex(id, emoji, title, steps, reps, hold, rest, sides=False, tip=""):
    return {"id": id, "emoji": emoji, "title": title, "steps": steps, "reps": reps, "holdSec": hold, "restSec": rest, "sides": sides, "tip": tip}


CAMPUS = {
 "id": "feet",
 "title": "Güçlü Kemer Kampüsü (Düz Taban)",
 "emoji": "🦶",
 "description": "Ayak kaslarını güçlendir, dengeni geliştir ve ayak kemerini destekle.",
 "reviewed": False,
 "weeks": 8,
 "weeklyTarget": 5,

 "redFlags": {
  "intro": "Başlamadan önce güvenliğin için: aşağıdakilerden biri sende var mı?",
  "questions": [
   {"id": "pain", "text": "Ayaklarında, topuğunda ya da ayak bileğinin iç tarafında süren ağrı"},
   {"id": "one", "text": "Yalnızca bir ayağında düz taban"},
   {"id": "sudden", "text": "Önceden kemerin varken sonradan, özellikle yetişkinlikte gelişen düzleşme"},
   {"id": "stiff", "text": "Ayakta sertlik, uyuşma ya da güçsüzlük"},
   {"id": "injury", "text": "Sık sık ayak bileği burkulması ya da ayak yaralanması"},
  ],
  "title": "Önce bir doktora ya da podoloğa görün",
  "text": "Seçtiğin belirtiler bir uzman değerlendirmesi gerektirebilir. Egzersizler bu durumlarda tek başına yeterli olmayabilir.",
  "ok": "Kırmızı bayrak belirtmedin. Egzersiz sırasında ağrı olursa o hareketi hafiflet ya da bırak.",
 },

 "selfTest": {
  "questions": [
  {
   "id": "footprint",
   "text": "Ayağını ıslatıp kuru bir zemine ya da kartona bas. Ayak izin hangisine benziyor?",
   "options": [
    {"id": "normal", "label": "Normal kemer", "desc": "Ayağın iç tarafında belirgin bir boşluk var; orta kısım izin yaklaşık yarısı kadar.", "mid": 0.45},
    {"id": "flat", "label": "Düz taban", "desc": "İz neredeyse tamamen dolu; ayağın orta kısmı da yere basıyor.", "mid": 0.95},
    {"id": "high", "label": "Yüksek kemer", "desc": "Orta kısım çok ince ya da hiç görünmüyor.", "mid": 0.15},
   ],
  },
  {
   "id": "tiptoe",
   "text": "Parmak uçlarında yükseldiğinde ayağının iç tarafında kemer oluşuyor mu?",
   "options": [{"id": "yes", "label": "Evet, kemer oluşuyor"}, {"id": "no", "label": "Hayır, ayak yine düz"}, {"id": "unsure", "label": "Emin değilim"}],
  },
  ],
   "flexible": "Parmak ucunda kemer oluşuyorsa buna esnek düz taban denir. Yaygındır ve ağrı yapmıyorsa genellikle tedavi gerektirmez.",
   "rigid": "Parmak ucunda bile kemer oluşmuyorsa ayak sert (rijit) olabilir. Bu durum bir uzman tarafından değerlendirilmelidir.",
 },

 "measure": {
  "id": "balance", "kind": "stopwatch", "title": "Tek ayak denge süresi", "unit": "sn", "min": 0, "max": 120, "step": 1, "better": "higher",
  "howTo": [
   "Yalın ayak, düz bir zeminde dur; gerekirse yanında tutunabileceğin bir şey olsun.",
   "Kollarını göğsünde çaprazla, bir ayağını yerden kaldır ve kronometreyi başlat.",
   "Kaldırdığın ayak yere değdiğinde ya da kolların açıldığında kronometreyi durdur.",
  ],
  "hint": "Genç yetişkinlerde gözler açıkken 40 saniye ve üzeri yaygındır; yaşla birlikte süre kısalır. Haftada bir, aynı ayakla ölç.",
 },

 "exercises": [
  ex("short-foot", "🦶", "Kısa ayak egzersizi", ["Otur, ayağın yerde düz dursun.", "Parmaklarını kıvırmadan, başparmağının kökünü topuğuna doğru çekerek ayak kemerini yükselt.", "Ayağın kısalmış gibi olacak; tut ve bırak."], 10, 5, 3, sides=True, tip="Parmaklarını yere bastırma; hareket ayağın ortasından gelir."),
  ex("toe-yoga", "🧘", "Parmak yogası", ["Ayağın yerde dursun.", "Diğer parmaklar yerde kalırken başparmağını kaldır.", "Sonra başparmak yerde kalırken diğer parmakları kaldır."], 10, 3, 2),
  ex("towel", "🧺", "Havlu toplama", ["Yere bir havlu ser, ayağını üzerine koy.", "Parmaklarınla havluyu kendine doğru büzerek topla.", "Havluyu düzelt ve tekrarla."], 2, 30, 10, sides=True),
  ex("marble", "🔴", "Küçük nesne toplama", ["Yere birkaç bilye, kalem ya da şişe kapağı koy.", "Parmaklarınla tek tek alıp bir kaba bırak."], 10, 3, 2, sides=True),
  ex("heel-raise", "⬆️", "Topuk kaldırma", ["Ayakta dur, gerekirse duvara tutun.", "Kemerini koruyarak parmak uçlarında yüksel.", "Yavaşça indir."], 15, 2, 1, tip="Yükselirken ayak bileğin dışa kaçmasın."),
  ex("calf", "🦵", "Baldır germe", ["Duvara karşı dur, bir bacağını arkaya al, topuğun yerde kalsın.", "Öndeki dizini bükerek arkadaki baldırında gerilme hisset.", "Bekle ve taraf değiştir."], 2, 30, 5, sides=True, tip="Gergin baldır kasları düz tabanı zorlayabilir."),
  ex("balance", "🧍", "Tek ayak denge", ["Yalın ayak dur, bir ayağını kaldır.", "Kısa ayak pozisyonunu koruyarak dengede kal."], 2, 30, 10, sides=True),
  ex("barefoot", "🌿", "Yalın ayak yürüyüş", ["Güvenli bir yüzeyde (halı, çim, kum) yalın ayak yürü.", "Adım atarken ayak kemerini hafifçe aktif tut."], 1, 120, 0),
 ],

 "checklist": [
  {"id": "shoes", "text": "Destekli ve rahat ayakkabı seç", "detail": "Topuğu kavrayan, tabanı aşırı yumuşak olmayan ve öne sığan ayakkabılar ayak kaslarının çalışmasını destekler."},
  {"id": "worn", "text": "Aşınmış ayakkabıları değiştir", "detail": "Tabanı iç taraftan aşınmış ayakkabılar ayağın içe çökmesini artırabilir."},
  {"id": "barefoot", "text": "Güvenli zeminde yalın ayak vakit geçir", "detail": "Evde ya da çimde yalın ayak yürümek ayak kaslarını çalıştırır."},
  {"id": "weight", "text": "Kilonu gözden geçir", "detail": "Fazla kilo ayak kemerine binen yükü artırır."},
  {"id": "insoles", "text": "Ağrın varsa tabanlık için uzmana danış", "detail": "Ağrılı düz tabanda kemer destekli tabanlıklar yardımcı olabilir; doğru seçim için podolog ya da fizyoterapiste danış."},
  {"id": "activity", "text": "Uzun süre ayakta kalacaksan mola planla", "detail": "Ara ara oturmak ve ayak bileklerini çevirmek yorgunluğu azaltır."},
 ],

 "facts": [
  {"id": "always-bad", "myth": "Düz taban her zaman tedavi edilmesi gereken bir sorundur.", "fact": "NHS'e göre ağrı ya da başka bir sorun yapmayan düz taban için bir şey yapmana gerek yoktur. Esnek düz taban yaygın bir varyasyondur."},
  {"id": "children", "myth": "Çocuğun ayağı düzse hemen tabanlık gerekir.", "fact": "Çocuklarda ayak kemeri genellikle 3 ile 10 yaş arasında gelişir. Yaklaşık her 5 çocuktan biri hiç belirgin kemer geliştirmez, ama çok azında sorun olur."},
  {"id": "exercise", "myth": "Egzersizle düz taban kesin düzelir.", "fact": "Kısa ayak egzersizi üzerine yapılan analizler çelişkili sonuçlar veriyor; etki daha çok 6 haftadan uzun programlarda görülüyor. Egzersiz ayak kaslarını ve dengeyi güçlendirir, ama kemik yapısını değiştirmez."},
  {"id": "insoles", "myth": "Herkes kemer destekli tabanlık kullanmalı.", "fact": "Tabanlıklar daha çok ağrılı düz tabanda önerilir. Ağrısız düz tabanda gerekli değildir."},
 ],

 "steps": [
  {"id": "what", "emoji": "🦶", "title": "Düz taban nedir?", "summary": "Ayakta dururken ayağın iç kemerinin çökmesi ya da belirgin olmaması.",
   "sections": [
    sec("Esnek ve sert düz taban", "Ayakta dururken kemer kayboluyor ama parmak ucunda yükselince ortaya çıkıyorsa buna esnek düz taban denir; en yaygın türdür. Parmak ucunda bile kemer oluşmuyorsa sert düz tabandan söz edilir ve bir uzman tarafından değerlendirilmelidir."),
    sec("Ne kadar yaygın?", "Çocuklarda kemer genellikle 3 ile 10 yaş arasında gelişir. Yaklaşık her 5 kişiden biri hiç belirgin kemer geliştirmez; çoğunda hiçbir sorun olmaz."),
   ],
   "actions": ["Kayıttaki ıslak ayak izi ve parmak ucu testini yap."]},
  {"id": "when", "emoji": "🩺", "title": "Ne zaman önemlidir?", "summary": "Ağrı yapmayan düz taban çoğu zaman sorun değildir.",
   "sections": [
    sec("Belirtiler", "Ayakta ya da yürürken ağrı, çabuk yorulma, ayak bileğinin iç tarafında şişlik ya da sık burkulma yaşıyorsan düz tabanın seni etkiliyor olabilir."),
    sec("Uzmana başvur", "Ayakların ağrılı, sert, güçsüz ya da uyuşuksa; yalnızca bir ayak düzse ya da düzleşme sonradan başladıysa bir doktora ya da podoloğa görün."),
   ],
   "actions": ["Güvenlik sorularını dürüstçe yanıtla."]},
  {"id": "evidence", "emoji": "📈", "title": "Egzersiz ne sağlar?", "summary": "Ayak kaslarını ve dengeyi güçlendirir; etki için sabır gerekir.",
   "sections": [
    sec("Kısa ayak egzersizi", "Ayağın içindeki küçük kasları çalıştırarak kemeri dinamik olarak destekler. Bir analizde ayak duruşunda iyileşme bulunurken, daha yeni bir analizde etkinin daha çok 6 haftadan uzun programlarda görüldüğü belirtildi."),
    sec("Denge ve güç", "Topuk kaldırma, baldır germe ve tek ayak denge çalışmaları ayağın ve bacağın birlikte çalışmasını destekler. Kampüs bu yüzden 8 haftalık bir program önerir."),
   ],
   "actions": ["8 hafta boyunca haftada en az 5 gün rutini tamamlamayı hedefle."]},
  {"id": "routine", "emoji": "⏱️", "title": "Günlük rutin", "summary": "Yaklaşık 15 dakika; zamanlayıcı seni adım adım yönlendirir.",
   "sections": [
    sec("Nasıl çalışır?", "Rutini başlattığında her egzersiz sırayla açılır; kaç tekrar ve kaç saniye tutacağın, hangi ayakla çalıştığın ekranda görünür."),
    sec("Ağrı kuralı", "Kaslarda hafif yorgunluk normaldir. Bir hareket ağrı yapıyorsa hafiflet ya da atla."),
   ],
   "actions": ["İlk rutinini bugün tamamla."]},
  {"id": "track", "emoji": "⏱️", "title": "İlerlemeni ölç", "summary": "Haftada bir tek ayak denge süreni kaydet.",
   "sections": [
    sec("Denge testi", "Kollarını göğsünde çaprazlayıp tek ayak üzerinde durabildiğin süreyi ölç. Ayak kasların güçlendikçe bu süre genellikle uzar."),
    sec("Ayakkabı ve alışkanlıklar", "Ana sayfadaki liste, ayaklarını gün boyunca destekleyecek küçük değişiklikleri gösterir."),
   ],
   "actions": ["İlk ölçümünü ana sayfadan kaydet."]},
 ],

 "help": [
  {"id": "podiatrist", "title": "Podolog ya da fizyoterapist", "text": "Ağrılı düz tabanda sana uygun egzersizleri ve gerekiyorsa tabanlığı belirleyebilirler."},
  {"id": "doctor", "title": "Doktor", "text": "Sert düz taban, tek taraflı ya da sonradan gelişen düzleşme, ayak bileğinin iç tarafında şişlik veya uyuşma gibi durumlarda bir hekime başvur."},
 ],
 "sources": SOURCES,
}

out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'feet.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(CAMPUS, f, ensure_ascii=False, indent=2)
total = sum(e["reps"] * (e["holdSec"] + e["restSec"]) * (2 if e["sides"] else 1) for e in CAMPUS["exercises"])
print('feet campus:', len(CAMPUS["exercises"]), 'exercises,', round(total / 60, 1), 'min')
