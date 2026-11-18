"""Generates src/content/camp/coach.tr.json — Sigarasız Kamp coach (K9).

Offline, rule-based: a decision tree of pre-written coach messages and reply buttons. No LLM, no
server, no free text. Messages may use template variables: {days} smoke-free days, {reason} one of
the user's own reasons, {phase} current phase, {saved} money saved (TL), {supporter} supporter name.
`byPhase` overrides the text for a phase. Reply `next` goes to a node; `action` opens a camp tool:
sos · call171 · slip · triggers · checkin · reasons · skill:<id> · library:<id> · end.
The coach never diagnoses, never names medication and points to ALO 171 / a doctor when needed.
Tone: motivational interviewing — empathy, the choice is the user's, support self-efficacy.
"""
import json, os


def n(text, replies, by_phase=None):
    d = {"text": text, "replies": replies}
    if by_phase:
        d["byPhase"] = by_phase
    return d


def go(label, nxt):
    return {"label": label, "next": nxt}


def act(label, action):
    return {"label": label, "action": action}


END = act("Teşekkürler, şimdilik bu kadar", "end")

SCENARIOS = [
 {"id": "craving", "emoji": "🌊", "title": "Şu an canım çekiyor", "start": "s", "nodes": {
  "s": n("Şu an bir istek yaşıyorsun. Bunu benimle paylaşman çok değerli. İsteğin ne kadar güçlü?", [go("Çok güçlü", "strong"), go("Orta", "mid"), go("Hafif ama sürekli", "mid")],
         {"preparation": "Hazırlık dönemindesin ve bir istek yaşıyorsun. Bu, bırakma gününden önce pratik yapmak için iyi bir fırsat. İsteğin ne kadar güçlü?"}),
  "strong": n("Güçlü istekler genellikle birkaç dakika içinde zirve yapar ve sonra azalır. Şu an seninle birlikte bu dalganın geçmesini bekleyelim. Ne denemek istersin?", [act("Dalga sörfü yap", "sos"), go("Önce konuşalım", "talk"), act("ALO 171'i ara", "call171")]),
  "mid": n("İstek orta düzeyde. Bu, onu fark edip izlemek için iyi bir an. Nedenlerinden birini hatırlayalım mı?", [go("Evet, hatırlat", "reason"), act("Kriz aracını aç", "sos")]),
  "reason": n("Sen bırakmak için şunu söylemiştin: \"{reason}\". {days} gündür bu nedene doğru yürüyorsun. Bu istek o yolu değiştirmek zorunda değil.", [go("Biraz daha iyiyim", "better"), act("Kriz aracını aç", "sos")]),
  "talk": n("İsteği bedeninin neresinde hissediyorsun? Göğsünde, boğazında, ellerinde? Bir nefes al ve sadece fark et; onunla savaşmana gerek yok.", [go("Fark ettim", "better"), go("Hâlâ çok zor", "hard")]),
  "hard": n("Zor olduğunu duyuyorum. Bu his geçici. Şu an kriz aracını açmak ya da ALO 171'deki bir danışmanla konuşmak iyi gelebilir.", [act("Kriz aracını aç", "sos"), act("ALO 171'i ara", "call171")]),
  "better": n("Harika. Bu isteğin içinden sigara içmeden geçiyorsun; her seferinde beynin bunun mümkün olduğunu öğreniyor.", [END]),
 }},
 {"id": "stress", "emoji": "😣", "title": "Stresliyim", "start": "s", "nodes": {
  "s": n("Stresli hissettiğini duyuyorum. Eskiden sigara bu anlarda bir kaçış gibi geliyordu. Şu an seni en çok ne zorluyor?", [go("İş / okul", "work"), go("Ailevi ya da ilişki", "people"), go("Tam bilmiyorum, gergin hissediyorum", "body")]),
  "work": n("Yoğun bir gün geçiriyor olabilirsin. Sigara stresi çözmez; yoksunluğu kısa süre giderdiği için rahatlatıyor gibi hissettirir. Beş dakikalık bir ara verebilir misin?", [go("Verebilirim", "break"), go("Şu an veremem", "breath")]),
  "people": n("İnsanlarla ilgili zorluklar yorucu olabilir. Hissettiğin şeye bir ad koymak ilk adım: öfke mi, kırgınlık mı, yorgunluk mu?", [go("Bunu fark ettim", "breath"), act("Biriyle konuşmak istiyorum", "call171")]),
  "body": n("Bazen gerginlik bedende kendini gösterir. Bırakmanın ilk haftalarında bu daha belirgin olabilir. Birlikte kısa bir nefes çalışması yapalım mı?", [go("Olur", "breath"), act("Kriz aracını aç", "sos")]),
  "break": n("Kalk, biraz yürü ya da pencereyi aç ve birkaç derin nefes al. Döndüğünde gerginliğin biraz azalmış olabilir.", [go("Yaptım, biraz daha iyiyim", "ok"), END]),
  "breath": n("Dört saniye nefes al, dört saniye tut, dört saniye ver, dört saniye bekle. Bunu birkaç kez tekrarla. Kriz aracındaki nefes bölümü sana eşlik edebilir.", [act("Nefes aracını aç", "sos"), go("Kendi başıma yaptım", "ok")]),
  "ok": n("Stresle sigarasız başa çıkabildiğini gösterdin. Duygularla çalışmak için kısa bir ders de var.", [act("Dersi aç", "skill:emotions"), END]),
 }},
 {"id": "offered", "emoji": "🚬", "title": "Biri sigara uzattı", "start": "s", "nodes": {
  "s": n("Biri sana sigara uzattı ya da uzatabilir. Bu çok sık yaşanan bir an. Şu an neredesin?", [go("Arkadaş ortamındayım", "friends"), go("İş yerindeyim", "work"), go("Henüz değil, hazırlanmak istiyorum", "prepare")]),
  "friends": n("Kısa ve net bir cümle yeterli: \"Teşekkürler, bıraktım.\" Açıklama yapmak zorunda değilsin. Elinde bir içecek tutmak da işini kolaylaştırır.", [go("Söyledim", "proud"), go("Israr ediyorlar", "insist")]),
  "work": n("Molada sigara içenlerin yanına gitmek yerine başka bir yöne yürümeyi ya da molayı biriyle konuşarak geçirmeyi deneyebilirsin.", [go("Tamam, deneyeceğim", "proud"), go("Israr ediyorlar", "insist")]),
  "insist": n("Israr karşısında aynı cümleyi sakince tekrar etmek işe yarar. Gerekirse ortamdan bir süre uzaklaşmak da senin hakkın. Bu senin kararın.", [go("Uzaklaştım", "proud"), act("Kriz aracını aç", "sos")]),
  "prepare": n("Harika bir fikir. Bu durum için bir Eğer–O zaman planı yazalım: \"Eğer biri sigara uzatırsa, o zaman 'Teşekkürler, bıraktım' diyeceğim.\"", [act("Planı tetikleyici haritama ekle", "triggers"), END]),
  "proud": n("Bu bir beceri ve sen onu kullandın. Her \"hayır\" bir sonrakini kolaylaştırır.", [act("Sosyal baskı dersini aç", "skill:social"), END]),
 }},
 {"id": "weight", "emoji": "⚖️", "title": "Kilo alıyorum endişesi", "start": "s", "nodes": {
  "s": n("Kilo almaktan endişe ediyorsun. Bu, bırakan kişilerin en sık dile getirdiği konulardan biri. Şu an seni en çok ne düşündürüyor?", [go("İştahım arttı", "appetite"), go("Tartıda fark gördüm", "scale"), go("Kilo alırsam yeniden başlarım diye korkuyorum", "fear")]),
  "appetite": n("Bıraktıktan sonra iştah artabilir; bu normaldir ve zamanla dengelenir. Elinin altında meyve, sebze ve su bulundurmak ani açlıklara yardımcı olur.", [go("Bunu deneyeceğim", "focus")]),
  "scale": n("Birkaç kilo değişimi olabilir. Sigarayı bırakmanın sağlığına katkısı, bu kilonun olası etkilerinden çok daha büyüktür.", [go("Anlıyorum", "focus")]),
  "fear": n("Bu korkuyu anlıyorum. Ama sigara kilo kontrolü için bir yöntem değildir. İlk haftalarda önceliğin dumansız kalmak; küçük adımlarla kilonu da yönetebilirsin.", [go("Tamam", "focus")]),
  "focus": n("Kilo endişesi için hazırladığım kısa bir ders var: diyet planı değil, küçük ve uygulanabilir öneriler.", [act("Dersi aç", "skill:weight"), act("Kütüphanede oku", "library:weight"), END]),
 }},
 {"id": "sleep", "emoji": "🌙", "title": "Uyuyamıyorum", "start": "s", "nodes": {
  "s": n("Uyku sorunu yaşıyorsun. Bıraktıktan sonraki ilk haftalarda bu sık görülür ve genellikle geçicidir. Ne zamandır böyle?", [go("Birkaç gündür", "few"), go("Haftalardır", "long")]),
  "few": n("Akşam kafeini azaltmak işe yarayabilir; sigarayı bıraktıktan sonra kahve daha güçlü etki edebilir. Yatmadan önce ekranı bırakmak ve her gün aynı saatte yatmak da yardımcı olur.", [go("Şu an yataktayım ve uyuyamıyorum", "now"), act("Uyku hakkında oku", "library:sleep")]),
  "long": n("Haftalardır süren uyku sorunları için bir hekime danışmanı öneririm. ALO 171 de seni yönlendirebilir.", [act("ALO 171'i ara", "call171"), go("Şu an yataktayım", "now")]),
  "now": n("Yatakta uzun süre uyuyamıyorsan kalkıp loş ışıkta sakin bir şeyle uğraşmak, sonra uykun gelince yatmak işe yarayabilir. Kısa bir nefes çalışması da bedenini yavaşlatır.", [act("Nefes aracını aç", "sos"), END]),
 }},
 {"id": "had-one", "emoji": "🌱", "title": "Bir tane içtim", "start": "s", "nodes": {
  "s": n("Bunu benimle paylaştığın için teşekkürler. Bir kayma, emeğini silmez; toplam dumansız günlerin korunuyor. Şu an nasıl hissediyorsun?", [go("Suçlu hissediyorum", "guilt"), go("Artık bozdum diye düşünüyorum", "broken"), go("İyiyim, ne yapacağımı bilmek istiyorum", "next")]),
  "guilt": n("Kendine bir arkadaşına davranır gibi davran. Suçluluk yerine merak deneyelim: Bu sigaradan önce ne oldu?", [go("Anlamak istiyorum", "next")]),
  "broken": n("\"Artık bozdum\" düşüncesi en riskli tuzaktır. Bir sigara, tekrar düzenli içmeye başlamak demek değildir. Şu an yolun ortasındasın ve devam edebilirsin.", [go("Tamam, devam etmek istiyorum", "next")]),
  "next": n("Kayma akışında ne olduğunu birlikte inceleyebilir ve o durum için yeni bir plan yapabiliriz.", [act("Kayma akışını aç", "slip"), act("Kayma dersini aç", "skill:slip")]),
 }},
 {"id": "alcohol", "emoji": "🍺", "title": "Alkol olan bir ortama gidiyorum", "start": "s", "nodes": {
  "s": n("Alkol olan bir ortama gideceksin. Alkol, kararlılığı zayıflatabilen güçlü bir tetikleyicidir. Hazırlanmak için birkaç dakikan var mı?", [go("Var", "plan"), go("Gitmekten vazgeçmeyi düşünüyorum", "skip")]),
  "plan": n("Üç soru: Ne kadar içeceksin? Sigara içenlerin yanında mı duracaksın? Biri teklif ederse ne diyeceksin? Bu cevaplar senin planın.", [act("Planı tetikleyici haritama yaz", "triggers"), go("Kafamda netleşti", "tips")], {"critical_week": "Kritik haftadasın; alkol bu dönemde özellikle riskli olabilir. Yine de gideceksen planın hazır olsun: Ne kadar içeceksin? Sigara içenlerin yanında mı duracaksın? Teklif gelirse ne diyeceksin?"}),
  "skip": n("İlk haftalarda bu tür ortamlardan kaçınmak ya da kısa tutmak akıllıca bir seçim olabilir. Bu senin kararın ve kararına saygı duyuyorum.", [END]),
  "tips": n("Bardağını sigarayı tuttuğun elinde tut, yanında su bulundur ve zorlanırsan kısa bir süre dışarı çık. Kriz aracı cebinde.", [act("Kriz aracını aç", "sos"), END]),
 }},
 {"id": "motivation", "emoji": "🔋", "title": "Motivasyonum düştü", "start": "s", "nodes": {
  "s": n("Motivasyonun düşmüş. Bu çok doğal; bırakma yolculuğu inişli çıkışlıdır. {days} gündür dumansızsın ve yaklaşık {saved} TL biriktirdin. Seni en çok ne yoruyor?", [go("Hep aynı istekler", "cravings"), go("Ne kazandığımı göremiyorum", "gains"), go("Bilmiyorum, sadece bıktım", "tired")]),
  "cravings": n("İstekler zamanla seyrekleşir ve zayıflar; şu an yaşadığın, beyninin yeniden öğrenme süreci. Atlattığın her istek bu süreci hızlandırır.", [go("Biraz umut verdi", "reason")]),
  "gains": n("Sağlık zaman çizelgende şimdiden ulaştığın kazanımlar var. Ayrıca kendi nedenin: \"{reason}\". Bu neden hâlâ senin için önemli mi?", [go("Evet, önemli", "values"), go("Emin değilim", "values")]),
  "tired": n("Yorulmak normal. Bugün mükemmel olmak zorunda değilsin; sadece bugünü dumansız geçirmeyi hedefle. {supporter} ile konuşmak da iyi gelebilir.", [go("Tamam", "reason")]),
  "reason": n("Sen bunu \"{reason}\" için yapıyorsun. Bu yolda bir gün daha ilerlemek, o nedene bir adım daha yaklaşmak demek.", [act("Nedenlerimi gör", "reasons"), END]),
  "values": n("Değerlerin sana yön gösterir. Kısa bir ders, neyin senin için gerçekten önemli olduğunu hatırlatabilir.", [act("Değerler dersini aç", "skill:values"), END]),
 }},
 {"id": "medication", "emoji": "💊", "title": "İlaç kullanmalı mıyım?", "start": "s", "nodes": {
  "s": n("Sigara bırakma ilaçları bırakma şansını artırabilir. Ancak hangi ilacın sana uygun olduğuna yalnızca bir hekim karar verebilir; ben ilaç önermem.", [go("Türkiye'de nasıl ulaşabilirim?", "access"), go("Bir sağlık sorunum var", "health")]),
  "access": n("Türkiye'de sigara bırakma polikliniklerinde hekim uygun görürse ilaçlar ücretsiz verilmektedir. ALO 171'i arayarak sana en yakın polikliniğe randevu alabilirsin.", [act("ALO 171'i ara", "call171"), act("İlaçlar hakkında oku", "library:medication-info")]),
  "health": n("Gebelik, kalp hastalığı ya da psikiyatrik bir tanın varsa herhangi bir yöntemden önce mutlaka hekimine danış.", [act("ALO 171'i ara", "call171"), END]),
 }},
 {"id": "why-hard", "emoji": "🤔", "title": "Neden bu kadar zor?", "start": "s", "nodes": {
  "s": n("Bu soruyu sorman çok anlaşılır. Bırakmak zor, çünkü nikotin hem bedende hem alışkanlıklarda güçlü bağlar kurar. Hangisini daha çok hissediyorsun?", [go("Bedensel istek ve huzursuzluk", "body"), go("Alışkanlıklar ve belirli anlar", "habits"), go("Duygularımla baş edememek", "emotions")]),
  "body": n("Bedensel belirtiler yoksunluğun parçasıdır ve genellikle ilk haftalarda en yoğundur. Geçicidir; vücudun nikotinsiz dengeye alışıyor.", [act("Yoksunluk dersini aç", "skill:withdrawal"), act("Günlük kontrol yap", "checkin")]),
  "habits": n("Kahve, yemek sonrası, araba... Bu anlar sigarayla eşleşmiş. Her biri için küçük bir plan yapmak, bağları zayıflatır.", [act("Tetikleyici haritamı aç", "triggers"), END]),
  "emotions": n("Sigara uzun süre duygularla baş etme aracın olmuş olabilir. Şimdi yeni yollar öğreniyorsun ve bu zaman alır.", [act("Duygular dersini aç", "skill:emotions"), act("ALO 171'i ara", "call171")]),
 }},
]

DATA = {
 "reviewed": False,
 "sourceIds": ["perski2019", "bricker2020", "nci-withdrawal", "alo171"],
 "disclaimer": "Koç önceden hazırlanmış bir rehberdir, bir insan veya yapay zekâ değildir. Tıbbi tanı koymaz ve ilaç önermez.",
 "scenarios": SCENARIOS,
}
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'camp', 'coach.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(DATA, f, ensure_ascii=False, indent=2)
print('coach:', len(SCENARIOS), 'scenarios,', sum(len(s['nodes']) for s in SCENARIOS), 'nodes')
