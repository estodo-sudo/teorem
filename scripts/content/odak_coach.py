"""Odak Kampı offline coach: 12 rule-based scenarios (imported by odak.py).

Original Turkish text, reviewed=false. The coach never diagnoses, never gives religious or moral verdicts,
never shames, uses no unproven claims, and points to a specialist where it fits (spec 5.10).
Replies go to another node ("next") or open a camp tool ("action"):
  sos · slip · checkin · diary · boundaries · rebuild · call115 · call112 · end · skill:<id> · library:<id>
Placeholders: {days} current run of goal-fitting days · {value} one of the user's values · {managed} urges managed.
"""


def n(text, *replies):
    out = []
    for label, target in replies:
        out.append({"label": label, "next": target[1:]} if target.startswith(">") else {"label": label, "action": target})
    return {"text": text, "replies": out}


S = []


def scenario(id, emoji, title, nodes):
    S.append({"id": id, "emoji": emoji, "title": title, "start": "s", "nodes": nodes})


scenario("urge", "🌊", "Şu an güçlü bir dürtü var", {
    "s": n("Bunu benimle paylaşman çok değerli. Dürtü şu an ne kadar güçlü?", ("Çok güçlü", ">strong"), ("Orta", ">mid"), ("Hafif ama geçmiyor", ">mid")),
    "strong": n("Güçlü dürtüler genelde birkaç dakika içinde zirve yapar ve sonra azalır. Önce yerinden kalk: odayı değiştir, ışığı aç ya da bir bardak su iç. Sonra ne yapmak istersin?", ("Dürtü anı aracını aç", "sos"), ("Önce konuşalım", ">talk")),
    "mid": n("Dürtüyü fark etmen önemli bir adım. Şu an yorgun, aç, yalnız ya da gergin misin?", ("Evet, biri var", ">dayy"), ("Pek değil", ">value")),
    "dayy": n("Dürtünün altında çoğu zaman bir ihtiyaç vardır. O ihtiyaca iyi bakmak dürtüyü de hafifletir: biraz dinlenmek, bir şeyler yemek, birine yazmak ya da birkaç dakika nefes.", ("Dürtü anı aracını aç", "sos"), ("Biraz daha iyiyim", ">better")),
    "value": n("Bu konuda nasıl biri olmak istediğini yazmıştın: “{value}”. Şu an bu dürtüye göre davranmak seni o değere yaklaştırır mı?", ("Hayır, uzaklaştırır", ">better"), ("Dürtü anı aracını aç", "sos")),
    "talk": n("Dürtüyü bedeninin neresinde hissediyorsun? Sadece fark et; onunla savaşmana gerek yok. Dalga yükselecek ve alçalacak.", ("Biraz hafifledi", ">better"), ("Hâlâ çok güçlü", "sos")),
    "better": n("Çok iyi. Bu güne kadar {managed} dürtü anını yönettin; bu da onlardan biri olabilir. İstersen kısa bir not al.", ("Dürtüyü kaydet", "diary"), ("Teşekkürler", "end")),
})

scenario("sleepless", "🌙", "Gece uyuyamıyorum", {
    "s": n("Gece uyuyamamak zor, ve gece geç saatler dürtülerin en güçlü olduğu zamandır. Telefon şu an yanında mı?", ("Evet", ">phone"), ("Hayır", ">calm")),
    "phone": n("Telefonu yataktan uzağa, mümkünse başka bir odaya bırakmak hem uykuya hem dürtüye iyi gelir. Bırakabilir misin?", ("Bıraktım", ">calm"), ("Zor geliyor", ">hard")),
    "hard": n("Anlıyorum. O zaman ekranı gri tonlamaya al ve sadece bu sohbeti bitirdikten sonra telefonu ters çevir. Küçük adımlar da sayılır.", ("Tamam", ">calm")),
    "calm": n("Uyuyamıyorsan yataktan kalkıp loş ışıkta sakin bir şey yapmak (kitap, yavaş nefes) uykuyu kolaylaştırabilir. Birkaç dakika nefes egzersizi ister misin?", ("Nefes için Dürtü anı aracını aç", "sos"), ("Uyku dersini okuyayım", "skill:sleep")),
})

scenario("slip-bad", "🤍", "Kaydım, kendimi berbat hissediyorum", {
    "s": n("Bunu yazman cesaret ister. Şunu bil: bir kayma, bütün emeğinin silindiği anlamına gelmez. Şu an en çok ne hissediyorsun?", ("Utanç", ">shame"), ("Öfke, kendime kızgınım", ">shame"), ("Boşluk", ">empty")),
    "shame": n("Kendine sert davranmak bir sonrakini kolaylaştırmaz; çoğu zaman zorlaştırır. Bir arkadaşın aynı durumda olsa ona ne söylerdin?", ("Ona nazik davranırdım", ">kind"), ("Bilmiyorum", ">kind")),
    "empty": n("Boşluk hissi çok yaygındır. Bu his geçicidir; şu an onu değiştirmeye çalışmadan sadece fark edebilirsin.", ("Tamam", ">kind")),
    "kind": n("Aynı nezaketi kendine de gösterebilirsin: “Bu zor bir an. Hata yapabilirim; yine de yoluma devam ediyorum.” Birlikte ne olduğuna bakalım mı?", ("Kayma adımlarına geç", "slip"), ("Utanç ve suçluluk dersi", "skill:shame")),
})

scenario("addicted", "❓", "Kendimi bağımlı hissediyorum, öyle miyim?", {
    "s": n("Bu soruyu sormak, kendine dikkat ettiğini gösteriyor. Ben bir tanı koyamam; bunu ancak bir uzman değerlendirebilir. Ama birlikte düşünebiliriz.", ("Devam et", ">info")),
    "info": n("Dünya Sağlık Örgütü bu konuda bir bağımlılık değil, “kompulsif cinsel davranış bozukluğu” tanımı kullanır. Ölçüt sıklık değil; isteğine rağmen kontrol edememek ve hayatının belirgin biçimde etkilenmesidir.", ("Bu beni çok etkiliyor", ">impact"), ("Daha çok değerlerimle çelişiyor", ">moral")),
    "impact": n("Hayatını belirgin biçimde etkiliyorsa bir uzmanla konuşmak gerçekten iyi gelebilir. Bu bir zayıflık değil, kendine yatırımdır.", ("115'i ara", "call115"), ("Uzman ne zaman gerekir?", "library:when-expert")),
    "moral": n("Araştırmalar, değerlerle çelişki ve utancın “bağımlıyım” hissini davranıştan bağımsız olarak büyütebildiğini gösteriyor. Bu senin hissini küçültmez; sadece ona farklı bir yerden bakmayı sağlar.", ("Bu konuyu oku", "library:moral"), ("Teşekkürler", "end")),
})

scenario("harmful", "🩺", "Mastürbasyon zararlı mı?", {
    "s": n("Güzel bir soru. Mastürbasyonun kendisi tıbben zararlı kabul edilmez; yaygın ve insan cinselliğinin doğal bir parçasıdır.", ("Peki ne zaman sorun olur?", ">when"), ("İnternette korkutucu şeyler okudum", ">myths")),
    "when": n("Sorun davranışın kendisi değil; kontrol edemediğini hissetmen, hayatının diğer alanlarının aksaması ya da kendi değerlerinle derin bir çelişki yaşaman. Bu yüzden hedefini sen seçersin.", ("Tıbbi gerçekleri oku", "library:mast-facts"), ("Teşekkürler", "end")),
    "myths": n("İnternetteki korkutucu ya da mucizevi iddiaların çoğu bilimsel kanıta dayanmıyor. Güvenilir kaynaklarla hazırlanmış bilgilere bakmak ister misin?", ("İddiaları ve bilimi oku", "library:nofap-claims"), ("Tıbbi gerçekleri oku", "library:mast-facts")),
})

scenario("filter", "🧱", "Filtreyi aştım", {
    "s": n("Olabilir; hiçbir filtre aşılmaz değildir. Filtre bir fren, asıl güç senin becerilerin ve planın. Şu an ne durumdasın?", ("Aştım ama bir şey olmadı", ">ok"), ("Aştım ve kaydım", ">slip")),
    "ok": n("Fark edip durman çok değerli. Filtreyi aşmaya iten an neydi? Saat, yer ya da duygu?", ("Bunu kaydedeyim", "diary"), ("Sınırlarımı güçlendireyim", "boundaries")),
    "slip": n("Kendine sert davranmana gerek yok. Bu, sınırlarının nerede zayıf olduğunu gösteren bir bilgi. Birlikte bakalım mı?", ("Kayma adımlarına geç", "slip"), ("Sınırlarımı güçlendireyim", "boundaries")),
})

scenario("lonely", "🫂", "Yalnız hissediyorum", {
    "s": n("Yalnızlık çok insani bir duygu ve dürtülerin en sık tetikleyicilerinden biri. Şu an konuşabileceğin biri var mı?", ("Var", ">reach"), ("Yok gibi", ">nobody")),
    "reach": n("Ona kısa bir mesaj atmak bile iyi gelebilir. Ayrıntı vermene gerek yok: “Şu an biraz zor bir an yaşıyorum, konuşabilir miyiz?”", ("Dürtü anı aracından yaz", "sos"), ("Teşekkürler", "end")),
    "nobody": n("Böyle hissetmek zor. Küçük adımlarla bağlantı kurmak mümkün: dışarıda insanların olduğu bir yere gitmek, bir kursa ya da topluluğa katılmak. Yeşilay 115 de konuşmak için arayabileceğin bir hat.", ("Bağlantı dersini oku", "skill:connection"), ("115'i ara", "call115")),
})

scenario("stress", "😣", "Stresliyim", {
    "s": n("Stres bir çıkış arar; dürtü de bu çıkışlardan biri olabilir. Şu an bedeninde nerede hissediyorsun?", ("Göğsümde / omuzlarımda", ">body"), ("Kafamda, düşünceler dönüyor", ">mind")),
    "body": n("İki dakika yavaş nefes ya da kısa bir hareket bedenindeki yükü azaltabilir. Hangisini denemek istersin?", ("Nefes / hareket aracını aç", "sos"), ("Duygu düzenleme dersi", "skill:emotions")),
    "mind": n("Dönen düşünceleri adlandırmak mesafe koyar: “Şu an … düşüncesini fark ediyorum.” Bunu bir dene; sonra ne hissettiğine bak.", ("Düşünce dersini oku", "skill:defusion"), ("Biraz daha iyiyim", "end")),
})

scenario("partner", "💬", "Partnerime söylemeli miyim?", {
    "s": n("Bu senin kararın; söylemek zorunda değilsin. Ne seni bu soruyu düşünmeye itti?", ("Dürüst olmak istiyorum", ">honest"), ("İlişkimize zarar veriyor", ">relationship"), ("Korkuyorum", ">fear")),
    "honest": n("Dürüstlük önemli bir değer. Hazır hissettiğinde sakin bir zaman seçip “ben” diliyle konuşmak işini kolaylaştırır: “Bu konuda zorlanıyorum ve üzerinde çalışıyorum.”", ("Partnerle konuşmak içeriği", "library:partner"), ("Teşekkürler", "end")),
    "relationship": n("İlişkiyi etkiliyorsa birlikte bir çift terapistinden ya da uzmandan destek almak sohbeti kolaylaştırabilir.", ("Partnerle konuşmak içeriği", "library:partner"), ("115'i ara", "call115")),
    "fear": n("Korkman çok anlaşılır. Acele etmene gerek yok. Önce kendin için netleşmek, sonra hazır hissettiğinde konuşmak da bir yoldur.", ("Partnerle konuşmak içeriği", "library:partner"), ("Teşekkürler", "end")),
})

scenario("motivation", "🔋", "Motivasyonum yok", {
    "s": n("Motivasyon iniş çıkış yapar; bu çok normal. Bu yolculuğa neden başlamıştın?", ("Hatırlıyorum", ">value"), ("Hatırlamıyorum", ">remind")),
    "remind": n("Bu konuda nasıl biri olmak istediğini yazmıştın: “{value}”. Bu hâlâ senin için önemli mi?", ("Evet", ">small"), ("Hedefimi gözden geçirmek istiyorum", ">goal")),
    "value": n("Güzel. Şu ana kadar {days} gündür hedefinle uyumlu yaşıyorsun ve {managed} dürtü anını yönettin. Bunlar senin emeğin.", ("Bugün küçük bir adım", ">small")),
    "small": n("Bugün sadece küçük bir adım yeterli: günlük kontrolünü yapmak ya da bir dersi okumak. Hangisi?", ("Günlük kontrol", "checkin"), ("Değerler dersi", "skill:values")),
    "goal": n("Hedefini değiştirmek bir geri adım değildir. Belki şu an azaltma hedefi daha gerçekçidir; karar senin.", ("Yeni kimlik dersi", "skill:identity"), ("Teşekkürler", "end")),
})

scenario("values-conflict", "🕊️", "Değerlerimle çelişiyorum", {
    "s": n("Bu çelişki hissi, senin için neyin önemli olduğunu gösteriyor. Ben dini ya da ahlaki bir değerlendirme yapmam; ama değerlerine göre yaşamana yardım edebilirim.", ("Devam et", ">kind")),
    "kind": n("Değerlerine bağlı olmak kendine sert davranmayı gerektirmez. Utanç değişimi zorlaştırır; şefkat ise değerlerine dönmeyi kolaylaştırır.", ("Değerlerinle barışık olmak dersi", "skill:congruence"), ("Bugün ne yapabilirim?", ">step")),
    "step": n("Bugün değerlerine uygun küçük, kusursuz olması gerekmeyen bir adım seçebilirsin. Kusursuzluk değil, yön.", ("Değerler ve maneviyat içeriği", "library:values-faith"), ("Teşekkürler", "end")),
})

scenario("expert", "🩺", "Uzmana gitmeli miyim?", {
    "s": n("Bunu düşünmen kendine iyi baktığını gösteriyor. Şunlardan biri senin için geçerli mi: işini, okulunu ya da ilişkilerini belirgin biçimde etkiliyor, uzun süredir kaygılı ya da çökkün hissediyorsun, ya da kendine zarar verme düşüncelerin var?", ("Kendime zarar verme düşüncelerim var", ">urgent"), ("Diğerlerinden biri", ">yes"), ("Pek değil", ">maybe")),
    "urgent": n("Bunu paylaştığın için teşekkür ederim. Lütfen hemen 112'yi ara ya da en yakın acil servise başvur. Yalnız değilsin.", ("112'yi ara", "call112"), ("115'i ara", "call115")),
    "yes": n("O zaman bir uzmanla konuşmak gerçekten iyi gelebilir. Psikiyatri polikliniği ya da bir klinik psikolog ilk adım olabilir; Yeşilay 115 de ücretsiz danışmanlık verir.", ("115'i ara", "call115"), ("Ne zaman uzmana başvurmalı?", "library:when-expert")),
    "maybe": n("Şu an acil bir durum yok gibi görünüyor. Yine de istediğin zaman bir uzmanla konuşabilirsin; bunun için “çok kötü” olman gerekmez.", ("Ne zaman uzmana başvurmalı?", "library:when-expert"), ("Teşekkürler", "end")),
})

COACH = {
    "reviewed": False,
    "evidenceLevel": "expert",
    "sourceIds": ["crosby2016", "bothe2021", "marlatt", "briken2024", "yedam"],
    "disclaimer": "Koç önceden hazırlanmış bir rehberdir; insan veya yapay zekâ değildir. Tanı koymaz.",
    "scenarios": S,
}
