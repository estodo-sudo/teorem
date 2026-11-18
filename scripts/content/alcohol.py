"""Generates src/content/alcohol.tr.json — Alkol Bağımlılığı Kampüsü (original Turkish content, reviewed=false).

Evidence (see SOURCES):
- WHO Europe (2023): no level of alcohol is safe for health; risk starts from the first drink.
- AUDIT-C (WHO AUDIT, 3 items, 0–12): a score of 4+ in men indicates hazardous drinking; a screen, not a diagnosis.
- One standard drink = 10 g of pure alcohol (WHO). Australian guidelines (NHMRC 2020): no more than
  10 standard drinks a week and no more than 4 on any one day to reduce the risk of harm.
- Withdrawal after long-term heavy drinking can cause seizures and delirium tremens; people with
  withdrawal symptoms need medical support to cut down/stop (NICE CG115, Drinkaware). Emergency: 112.
- Self-monitoring (drink diary), if-then plans and drink-free days are core parts of brief interventions (NICE).
- A month off alcohol: participants still drank less 6 months later (de Visser et al., Sussex, 2016).
- AA / twelve-step facilitation improves continuous abstinence (Cochrane, Kelly et al., 2020).
- Türkiye: AMATEM (adult alcohol and substance treatment centres), appointments via MHRS / ALO 182.
"""
import json, os

SOURCES = [
 {"title": "WHO Avrupa (2023) – Sağlık için güvenli bir alkol miktarı yoktur", "url": "https://www.who.int/azerbaijan/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health"},
 {"title": "NIDA – AUDIT-C alkol tarama testi", "url": "https://cde.nida.nih.gov/instrument/f229c68a-67ce-9a58-e040-bb89ad432be4"},
 {"title": "NHMRC (Avustralya) – Alkol kılavuzu: haftada en fazla 10, günde en fazla 4 standart içki", "url": "https://www.nhmrc.gov.au/health-advice/alcohol"},
 {"title": "NICE CG115 – Zararlı içme ve alkol bağımlılığının tedavisi", "url": "https://www.nice.org.uk/guidance/cg115"},
 {"title": "NHS – İçkiyi azaltmak için öneriler", "url": "https://www.nhs.uk/live-well/alcohol-advice/tips-on-cutting-down-alcohol/"},
 {"title": "Drinkaware – Alkol yoksunluğu belirtileri", "url": "https://www.drinkaware.co.uk/facts/health-effects-of-alcohol/general-health-effects/alcohol-withdrawal-symptoms"},
 {"title": "Sussex Üniversitesi – Alkolsüz bir ay sonrasında daha az içme (de Visser ve ark.)", "url": "https://www.sussex.ac.uk/broadcast/read/27612"},
 {"title": "Cochrane (2020) – Adsız Alkolikler ve 12 adım programları", "url": "https://www.cochrane.org/CD012880"},
 {"title": "Alkol ve erektil disfonksiyon – doz-yanıt meta-analizi (2018)", "url": "https://pubmed.ncbi.nlm.nih.gov/30232467/"},
]

ETHANOL_DENSITY = 0.789  # g/ml
STD_GRAMS = 10            # WHO standard drink


def std(ml, abv):
    return round(ml * abv * ETHANOL_DENSITY / STD_GRAMS, 1)


DRINKS = [
 ("beer33", "🍺", "Bira", "33 cl · %5", 330, 0.05),
 ("beer50", "🍺", "Büyük bira", "50 cl · %5", 500, 0.05),
 ("wine", "🍷", "Şarap", "1 kadeh · 15 cl", 150, 0.13),
 ("raki1", "🥛", "Rakı (tek)", "4 cl · %45", 40, 0.45),
 ("raki2", "🥛", "Rakı (duble)", "8 cl · %45", 80, 0.45),
 ("spirit", "🥃", "Viski, votka, cin", "4 cl · %40", 40, 0.40),
 ("shot", "🔥", "Shot", "3 cl · %40", 30, 0.40),
 ("cocktail", "🍸", "Kokteyl", "≈ 6 cl sert içki", 60, 0.40),
]


def sec(title, text):
    return {"title": title, "text": text}


CAMPUS = {
 "id": "alcohol",
 "title": "Alkol Bağımlılığı Kampüsü",
 "emoji": "🥃",
 "description": "Ne kadar içtiğini gör, güvenli bir hedef seç ve içkiyle ilişkini yeniden kur.",
 "reviewed": False,
 "drinks": [{"id": i, "emoji": e, "title": t, "detail": d, "std": std(ml, abv)} for i, e, t, d, ml, abv in DRINKS],
 "audit": {
  "questions": [
   # Each option carries its official AUDIT-C score. Q1 has no "never" option: the campus is for people who drink.
   {"id": "freq", "text": "Ne sıklıkla alkollü içki içersin?", "options": [{"text": "Ayda bir ya da daha az", "score": 1}, {"text": "Ayda 2–4 kez", "score": 2}, {"text": "Haftada 2–3 kez", "score": 3}, {"text": "Haftada 4 ya da daha fazla", "score": 4}]},
   {"id": "amount", "text": "İçtiğin bir günde genellikle kaç standart içki içersin?", "options": [{"text": "1–2", "score": 0}, {"text": "3–4", "score": 1}, {"text": "5–6", "score": 2}, {"text": "7–9", "score": 3}, {"text": "10 ya da daha fazla", "score": 4}]},
   {"id": "binge", "text": "Bir seferde 6 ya da daha fazla standart içkiyi ne sıklıkla içersin?", "options": [{"text": "Hiç", "score": 0}, {"text": "Ayda birden az", "score": 1}, {"text": "Ayda bir", "score": 2}, {"text": "Haftada bir", "score": 3}, {"text": "Her gün ya da neredeyse her gün", "score": 4}]},
  ],
  "standardNote": "1 standart içki = 10 gram saf alkol. Yaklaşık olarak: 1 küçük bira (33 cl) ≈ 1,3 · 1 kadeh şarap ≈ 1,5 · 1 tek rakı ≈ 1,4 standart içki.",
  "bands": [
   {"id": "low", "max": 3, "title": "Düşük risk", "text": "Puanın risk eşiğinin altında. Yine de sağlık açısından güvenli bir alkol miktarı yoktur; daha az her zaman daha iyidir."},
   {"id": "risky", "max": 7, "title": "Riskli içme", "text": "Erkeklerde 4 ve üzeri puan sağlığına zarar verebilecek düzeyde içtiğini gösteriyor. İçkiyi azaltmak ya da ara vermek belirgin fayda sağlar."},
   {"id": "high", "max": 12, "title": "Yüksek risk", "text": "Puanın yüksek riskli içmeye ve olası bir alkol kullanım bozukluğuna işaret ediyor. Kampüse ek olarak bir hekimle görüşmen önemli."},
  ],
  "disclaimer": "AUDIT-C bir tarama testidir, tanı koymaz. Dünya Sağlık Örgütü'nün geliştirdiği AUDIT testinin kısa sürümüdür.",
 },
 "withdrawal": {
  "questions": [
   {"id": "shakes", "text": "Sabahları ellerin titriyor ya da terliyor mu ve içince geçiyor mu?"},
   {"id": "morning", "text": "Güne içerek başlama ya da 'kendine gelmek' için içme ihtiyacı duyuyor musun?"},
   {"id": "history", "text": "Daha önce içmeyi bıraktığında nöbet, halüsinasyon ya da ağır bilinç bulanıklığı yaşadın mı?"},
   {"id": "daily", "text": "Neredeyse her gün, günde 8 ya da daha fazla standart içki mi içiyorsun?"},
  ],
  "riskTitle": "Tek başına aniden bırakma",
  "riskText": "Yanıtların, birden bırakırsan ciddi yoksunluk belirtileri yaşayabileceğini gösteriyor. Uzun süreli ağır içicilikte ani bırakma nöbete ve deliryum tremense yol açabilir. Önce bir hekimle ya da AMATEM ile görüş; bırakmayı ve azaltmayı tıbbi destekle planla.",
  "okText": "Ciddi yoksunluk belirtisi bildirmedin. Yine de bırakırken titreme, terleme, aşırı huzursuzluk ya da uyuyamama yaşarsan bir hekime başvur.",
  "emergency": "Nöbet, halüsinasyon, bilinç bulanıklığı ya da şiddetli titreme olursa hemen 112'yi ara.",
 },
 "paths": {
  "cut": {"emoji": "📉", "title": "Azalt", "text": "Haftalık bir standart içki sınırı belirler ve haftada birkaç gün hiç içmezsin.", "points": ["Haftalık sınırını sen seçersin: 10, 7 ya da 4 standart içki.", "Günde en fazla 4 standart içki önerilir.", "Haftada en az 3 gün alkolsüz geçirmeyi hedeflersin."]},
  "quit": {"emoji": "🚫", "title": "Bırak", "text": "Belirli bir süre boyunca hiç içmezsin. Alkolsüz geçen bir ay, sonraki aylarda daha az içmeye yardımcı olabilir.", "points": ["14, 30 ya da 60 günlük bir alkolsüz hedef seçersin.", "Sayaç son içkinden itibaren işler.", "Ağır içiciysen bu yolu yalnızca hekim desteğiyle seç."]},
 },
 "cutLimits": [10, 7, 4],
 "dailyMax": 4,
 "freeDaysTarget": 3,
 "quitGoals": [14, 30, 60],
 "reasons": [
  {"id": "health", "emoji": "❤️", "label": "Sağlığım için"},
  {"id": "sleep", "emoji": "😴", "label": "Daha iyi uyumak"},
  {"id": "sex", "emoji": "🔥", "label": "Cinsel sağlığım için"},
  {"id": "money", "emoji": "💰", "label": "Para biriktirmek"},
  {"id": "family", "emoji": "👨‍👩‍👧", "label": "Ailem ve ilişkilerim"},
  {"id": "work", "emoji": "💼", "label": "İşime ve odaklanmama"},
  {"id": "mood", "emoji": "🧠", "label": "Ruh hâlimi dengelemek"},
  {"id": "control", "emoji": "🧭", "label": "Kontrolün bende olması"},
 ],
 "triggers": [
  {"id": "social", "emoji": "🎉", "label": "Arkadaş ortamı ve davetler", "plan": "Davete gitmeden önce kaç içki içeceğime ya da hiç içmeyeceğime karar veririm; elimde hep alkolsüz bir içecek olur."},
  {"id": "raki-table", "emoji": "🍽️", "label": "Rakı sofrası", "plan": "Sofrada önceden belirlediğim sınırı aşmam; rakının yanında bol su ve yemekle yavaş giderim ya da şalgam, ayran tercih ederim."},
  {"id": "stress", "emoji": "😣", "label": "İş çıkışı stres", "plan": "İşten çıkınca eve dönmeden kısa bir yürüyüş yapar ya da spor yaparım; stresi içkiyle değil hareketle atarım."},
  {"id": "alone", "emoji": "🏠", "label": "Akşam evde yalnız", "plan": "Evde alkol bulundurmam; akşamları için önceden bir plan yaparım: yemek, dizi, arama ya da yürüyüş."},
  {"id": "weekend", "emoji": "📅", "label": "Hafta sonu", "plan": "Hafta sonu programıma alkolün merkezde olmadığı etkinlikler koyarım: kahvaltı, doğa, spor."},
  {"id": "match", "emoji": "⚽", "label": "Maç izlerken", "plan": "Maçı alkolsüz bira ya da başka bir içecekle izlerim; yanımda atıştırmalık bulundururum."},
  {"id": "sleep", "emoji": "🌙", "label": "Uyumak için içmek", "plan": "Uyumak için içmem; alkol uykuyu bölüp kalitesini düşürür. Yatmadan önce ekranı bırakır, ılık bir duş alırım."},
  {"id": "conflict", "emoji": "🌧️", "label": "Tartışma ya da üzüntü", "plan": "Üzgün ya da öfkeliyken içki yerine güvendiğim biriyle konuşur ya da duygumu bir kâğıda yazarım."},
 ],
 # Practical, evidence-based tips for cutting down (NHS "Tips on cutting down", NICE brief advice).
 "tips": [
  {"id": "home", "emoji": "🏠", "title": "Evde alkol bulundurma", "text": "Ulaşması zorlaştıkça daha az içilir. Alışverişte içki almamak, akşamları otomatik olarak içmenin önüne geçer."},
  {"id": "decide", "emoji": "📝", "title": "İçmeden önce karar ver", "text": "Başlamadan kaç standart içki içeceğine karar ver ve her birini o anda kaydet. Sınırına geldiğinde alkolsüz bir içeceğe geç."},
  {"id": "water", "emoji": "💧", "title": "Her içkinin arasına su", "text": "Her kadehin ardından bir bardak su ya da alkolsüz içecek iç. Hem hızını düşürür hem susuzluğu giderir; susuzluk çoğu zaman daha fazla içmeye yol açar."},
  {"id": "food", "emoji": "🍽️", "title": "Aç karnına içme", "text": "Yemekle ve yavaş iç. Midede yemek olması alkolün kana geçişini yavaşlatır."},
  {"id": "smaller", "emoji": "🥤", "title": "Daha küçük, daha hafif", "text": "Büyük bira yerine küçük, duble yerine tek seç. Daha düşük alkollü ya da alkolsüz seçenekler aynı keyfi daha az alkolle verir."},
  {"id": "free-days", "emoji": "📅", "title": "Alkolsüz günleri önceden planla", "text": "Haftanın hangi günlerinin alkolsüz olacağını baştan belirle; iş günleri iyi bir başlangıçtır. Planlanan alkolsüz gün, kendiliğinden gelen günden daha kolay korunur."},
  {"id": "routine", "emoji": "🔄", "title": "Alışkanlığın yerini doldur", "text": "İçtiğin saatlere yeni bir rutin koy: iş çıkışı yürüyüş, maçta sevdiğin alkolsüz bir içecek, akşam bir hobi. Boş kalan zaman en sık içilen zamandır."},
  {"id": "no", "emoji": "🙋", "title": "Kısa ve net hayır", "text": "Israr edilirse 'Hayır, teşekkürler' yeterlidir; açıklama yapmak zorunda değilsin. Elinde alkolsüz bir içecek olması ısrarı baştan azaltır."},
 ],
 "info": {
  "std": {"title": "Standart içki nedir?", "text": "Farklı içkileri karşılaştırmanın ortak birimidir: 1 standart içki 10 gram saf alkoldür. Hesap: hacim (ml) × alkol oranı × 0,789 ÷ 10. Örnekler: küçük bira (33 cl) 1,3 · kadeh şarap 1,5 · tek rakı 1,4 · duble rakı 2,8. Kampüs bu hesabı senin yerine yapar."},
  "audit": {"title": "AUDIT-C nedir?", "text": "Dünya Sağlık Örgütü'nün geliştirdiği 10 soruluk AUDIT alkol testinin, içme sıklığını ve miktarını soran 3 soruluk kısa sürümüdür. Her soru 0–4 puan alır; toplam 0–12'dir. Erkeklerde 4 ve üzeri puan sağlığa zarar verebilecek düzeyde içmeye, 8 ve üzeri yüksek riske işaret eder. Bir tarama testidir, tanı koymaz."},
  "statsCut": {"title": "Bu sayılar ne anlatıyor?", "text": "Halka: bu hafta (pazartesiden beri) içtiğin standart içki ve haftalık sınırın. Bugün: bugün kaydettiğin toplam standart içki. Alkolsüz gün: bu hafta hiç içmediğin günler; hedef en az 3. Bu hafta: haftanın toplamı. Her pazartesi sayaçlar sıfırlanır."},
  "statsQuit": {"title": "Bu sayılar ne anlatıyor?", "text": "Halka ve büyük sayı: son içkinden bu yana geçen alkolsüz gün ve hedefin. En uzun ara: kampüse başladığından beri iki içki arasındaki en uzun süre. Alkolsüz gün ve bu hafta: pazartesiden beri hiç içmediğin günler ve içtiğin toplam standart içki. Bir içki kaydettiğinde alkolsüz sayaç yeniden başlar."},
 },
 "sexual": [
  {"id": "acute", "title": "Sarhoşken", "text": "Alkol sinir sistemini yavaşlatır; çok içildiğinde sertleşmek ve boşalmak zorlaşır. Sarhoşken alınan kararlar korunmasız ilişki riskini de artırır."},
  {"id": "longterm", "title": "Uzun süreli ağır içicilikte", "text": "Uzun süre ve fazla içmek testosteron düzeyini düşürebilir, karaciğere ve sinirlere zarar vererek cinsel isteği ve sertleşmeyi olumsuz etkileyebilir."},
  {"id": "evidence", "title": "Araştırmalar ne diyor?", "text": "Hafif ve orta düzey içmenin sertleşme sorunu ile ilişkisi araştırmalarda net değildir; ancak Dünya Sağlık Örgütü'ne göre sağlık açısından güvenli bir alkol miktarı yoktur."},
 ],
 "help": [
  {"id": "amatem", "title": "AMATEM", "text": "Sağlık Bakanlığı'na bağlı Alkol ve Madde Bağımlılığı Tedavi Merkezleri; 18 yaş üstüne ayakta ve yatarak tedavi sunar. Randevu MHRS üzerinden ya da ALO 182 ile alınabilir.", "phone": "182"},
  {"id": "doctor", "title": "Aile hekimin", "text": "İçkini azaltırken ya da bırakırken ilk başvuracağın yer olabilir. Gerekirse isteği azaltan ilaçlar yalnızca hekim değerlendirmesiyle kullanılır.", "phone": None},
  {"id": "aa", "title": "Adsız Alkolikler", "text": "Dünya genelinde ve Türkiye'de ücretsiz destek grupları. Cochrane incelemesine göre 12 adım programları uzun süreli alkolsüz kalmayı destekliyor.", "phone": None},
  {"id": "emergency", "title": "Acil durum", "text": "Bırakırken nöbet, halüsinasyon, bilinç bulanıklığı ya da şiddetli titreme olursa beklemeden 112'yi ara.", "phone": None},
 ],
 "steps": [
  {"id": "what", "emoji": "🥃", "title": "Alkol ve sen", "summary": "Önce ne kadar içtiğini dürüstçe görmek, değişimin ilk adımıdır.",
   "sections": [
    sec("Güvenli miktar var mı?", "Dünya Sağlık Örgütü'ne göre sağlık açısından güvenli bir alkol miktarı yoktur; risk ilk kadehten başlar. Alkol en az yedi kanser türüyle ilişkilidir. Daha az içmek her zaman daha az risk demektir."),
    sec("Standart içki nedir?", "Farklı içkileri karşılaştırmanın yolu standart içkidir: 10 gram saf alkol. Bir küçük bira yaklaşık 1,3, bir kadeh şarap 1,5, bir tek rakı 1,4 standart içkidir. Kampüs bu hesabı senin yerine yapar."),
    sec("Kısa test", "Birazdan Dünya Sağlık Örgütü'nün geliştirdiği AUDIT testinin 3 soruluk kısa sürümünü yanıtlayacaksın. Erkeklerde 4 ve üzeri puan, sağlığa zarar verebilecek düzeyde içmeye işaret eder."),
   ],
   "actions": ["Son bir haftada ne kadar içtiğini düşün.", "Testi dürüstçe yanıtla; yanıtlar telefonundan çıkmaz."]},
  {"id": "safety", "emoji": "🛡️", "title": "Güvenle bırakmak", "summary": "Ağır içicilikte ani bırakma tehlikeli olabilir; önce güvenliğini kontrol et.",
   "sections": [
    sec("Yoksunluk neden önemli?", "Uzun süredir ve fazla içen biri birden bıraktığında beyin ve sinir sistemi alkolün yokluğuna sert tepki verebilir: titreme, terleme, huzursuzluk, uykusuzluk."),
    sec("Tehlike işaretleri", "Nöbetler son içkiden birkaç saat sonra başlayabilir. Deliryum tremens genellikle 24–72 saat içinde ortaya çıkar; bilinç bulanıklığı, halüsinasyon ve şiddetli titremeyle seyreder ve tedavi edilmezse hayati olabilir."),
    sec("Ne yapmalı?", "Sabah titremesi ya da güne içerek başlama ihtiyacı gibi belirtilerin varsa bırakmayı ve azaltmayı tek başına değil, bir hekim ya da AMATEM eşliğinde planla. Tehlike işaretlerinde 112'yi ara."),
   ],
   "actions": ["Birazdaki güvenlik sorularını dürüstçe yanıtla."]},
  {"id": "track", "emoji": "📒", "title": "Günlük tut", "summary": "Ölçtüğün şeyi değiştirebilirsin.",
   "sections": [
    sec("Neden günlük?", "İçki günlüğü, alkolde kısa müdahale programlarının temel parçasıdır. Çoğu kişi ne kadar içtiğini tutmaya başlayınca miktarın sandığından fazla olduğunu fark eder."),
    sec("Nasıl kaydedilir?", "İçtiğin her içkiyi türüne dokunarak kaydet; kampüs standart içkiyi hesaplar, günlük ve haftalık toplamını gösterir. Kaydı içtiğin anda yapmak, akşam sonunda tahmin etmekten çok daha doğrudur."),
    sec("Alkolsüz günler", "Haftada birkaç gün hiç içmemek, alışkanlığı kırmanın ve bedenin toparlanmasının en basit yoludur. Kampüs alkolsüz günlerini kendiliğinden sayar."),
   ],
   "actions": ["Bundan sonra her içkiyi o anda kaydet."]},
  {"id": "situations", "emoji": "🧭", "title": "Riskli durumlar ve hayır demek", "summary": "İçki çoğu zaman belirli durumlarda gelir; önceden hazırlıklı ol.",
   "sections": [
    sec("Eğer-o zaman planları", "'Eğer davete gidersem, elimde hep alkolsüz bir içecek olur' gibi somut planlar, hedefe ulaşma olasılığını belirgin şekilde artırır."),
    sec("Hayır demek", "Israra karşı kısa ve net bir cümle hazır olsun: 'Hayır, teşekkürler.' Açıklama yapmak zorunda değilsin; tekrar etmek yeterlidir."),
    sec("Ortam", "Evde alkol bulundurmamak, en etkili ortam değişikliklerinden biridir. Ulaşmak zorlaştıkça içmek de azalır."),
   ],
   "actions": ["Seni en çok içiren durumları seç.", "Ana sayfadaki önerilerden ikisini bu hafta dene."]},
  {"id": "body", "emoji": "🌱", "title": "Bedenin ve cinsel sağlığın", "summary": "Daha az içmenin faydaları kısa sürede hissedilir.",
   "sections": [
    sec("İlk haftalar", "Alkol uykuya dalmayı kolaylaştırsa da uykuyu böler. İçkiyi azaltanlar genellikle daha derin uyku, daha fazla enerji ve daha iyi ruh hâli bildirir."),
    sec("Cinsel sağlık", "Çok içildiğinde sertleşmek ve boşalmak zorlaşır; uzun süreli ağır içicilik testosteronu düşürebilir. İçkiyi azaltmak cinsel sağlığını da destekler."),
    sec("Bir aylık ara", "Alkolsüz bir ay geçirenlerin önemli bir kısmının altı ay sonra da daha az içtiği bildirildi."),
   ],
   "actions": ["Seni en çok motive eden nedeni seç."]},
  {"id": "support", "emoji": "🤝", "title": "Destek", "summary": "Alkol sorunu bir irade zayıflığı değil, tedavi edilebilir bir sağlık sorunudur.",
   "sections": [
    sec("Tıbbi destek", "AMATEM'ler ve aile hekimleri bırakma ve azaltma sürecinde destek verir. İsteği azaltan ilaçlar yalnızca hekim değerlendirmesiyle kullanılır."),
    sec("Destek grupları", "Adsız Alkolikler gibi 12 adım gruplarının uzun süreli alkolsüz kalmayı desteklediğini gösteren güçlü kanıtlar vardır."),
    sec("Kayma olursa", "Bir kayma her şeyin bittiği anlamına gelmez. Kaydet, ne olduğunu anlamaya çalış ve planına dön."),
   ],
   "actions": ["Gerekirse destek almaktan çekinme."]},
 ],
 "sources": SOURCES,
}

assert [s["id"] for s in CAMPUS["steps"]] == ["what", "safety", "track", "situations", "body", "support"]
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'alcohol.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(CAMPUS, f, ensure_ascii=False, indent=2)
print('alcohol campus:', [(d["id"], d["std"]) for d in CAMPUS["drinks"]])
