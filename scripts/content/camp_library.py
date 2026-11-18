"""Generates src/content/camp/library.tr.json — Sigarasız Kamp knowledge library (K8).

Original Turkish text, reviewed=false, every story cites sources from sources.json (WHO, T.C. Sağlık
Bakanlığı / ALO 171, NCI / smokefree.gov, NHS, CDC, Cochrane). No Wikipedia, blogs or news sites.
No medication names or doses; e-cigarettes are never presented as a way to quit.
"""
import json, os


def sl(emoji, title, text, did=None):
    s = {"emoji": emoji, "title": title, "text": text}
    if did:
        s["didYouKnow"] = did
    return s


def story(id, emoji, title, sources, slides):
    return {"id": id, "emoji": emoji, "title": title, "minutes": 2, "sourceIds": sources, "slides": slides}


STORIES = [
 story("addiction", "🧠", "Nikotin bağımlılığı nasıl çalışır?", ["nci-withdrawal", "who-tobacco"], [
  sl("🧠", "Hızlı bir yol", "Nikotin, solunduktan kısa süre sonra beyne ulaşır ve ödül sistemini uyarır. Bu hızlı etki, alışkanlığın kolay kurulmasının nedenlerinden biridir."),
  sl("🔁", "Alışma ve yoksunluk", "Beyin zamanla nikotine alışır. Nikotin düzeyi düşünce huzursuzluk ve istek başlar; bir sonraki sigara bu hissi geçici olarak giderir."),
  sl("🔗", "Alışkanlık bağları", "Kahve, yemek sonrası, araba gibi durumlar sigarayla eşleşir. Bu bağlar, istek uyandıran tetikleyicilere dönüşür."),
  sl("🌱", "Geri döndürülebilir", "Sigara bırakıldığında beyin yeniden dengeye gelir. İstekler zamanla seyrekleşir ve zayıflar."),
 ]),
 story("withdrawal-timeline", "📆", "Yoksunluk zaman çizelgesi", ["nci-withdrawal", "smokefree-withdrawal"], [
  sl("⏰", "İlk saatler", "Son sigaradan birkaç saat sonra istek ve huzursuzluk başlayabilir."),
  sl("🔥", "İlk üç gün", "Belirtiler genellikle ilk günlerde zirve yapar: güçlü istekler, sinirlilik, odaklanma güçlüğü."),
  sl("📉", "İlk haftalar", "Sinirlilik ve huzursuzluk 2–4 hafta içinde azalır. İştah artışı biraz daha uzun sürebilir."),
  sl("🌤️", "Sonrası", "Birkaç ay sonra istekler seyrekleşir; ama belirli ortamlarda beklenmedik anlarda gelebilir. Bu normaldir ve geçer."),
 ]),
 story("light-myth", "🪶", "\"Light\" sigara efsanesi", ["nci-light", "who-tobacco"], [
  sl("🪶", "Daha hafif mi?", "\"Light\", \"ultra\" ya da \"yumuşak\" diye pazarlanan sigaraların daha az zararlı olduğuna dair bir kanıt yoktur."),
  sl("🌬️", "Neden?", "Bu sigaraları içenler çoğu zaman farkında olmadan daha derin ya da daha sık nefes çeker; böylece benzer miktarda zararlı madde alırlar."),
  sl("⚖️", "Sonuç", "Daha \"hafif\" bir sigaraya geçmek, bırakmanın sağladığı faydaların yerini tutmaz."),
 ]),
 story("hookah", "💨", "Nargile gerçekleri", ["who-waterpipe", "who-tobacco"], [
  sl("💨", "Su süzmez", "Nargiledeki su, dumanı serinletir ama zararlı maddelerin çoğunu süzmez."),
  sl("⏳", "Uzun oturum", "Bir nargile oturumu uzun sürer ve bu sürede çok miktarda duman solunur."),
  sl("🧪", "Nikotin ve karbonmonoksit", "Nargile dumanı nikotin, karbonmonoksit ve kanserle ilişkili maddeler içerir. Bağımlılık yapabilir."),
  sl("👥", "Paylaşmak risk", "Ortak ağızlık kullanımı enfeksiyon bulaşma riskini de artırabilir."),
 ]),
 story("ecig", "🔋", "E-sigara ve ısıtılmış tütün gerçekleri", ["who-ecig", "alo171"], [
  sl("🔋", "Zararsız değil", "Elektronik sigaralar ve ısıtılmış tütün ürünleri genellikle nikotin içerir ve bağımlılık yapar. Uzun vadeli etkileri hâlâ araştırılmaktadır."),
  sl("⚖️", "Türkiye'de yasal durum", "Türkiye'de elektronik sigara ve ısıtılmış tütün ürünlerinin ticari satışı yasaktır."),
  sl("🚫", "Bırakma yöntemi değil", "Bu kamp, e-sigara ya da ısıtılmış tütünü bir bırakma yöntemi olarak önermez. Bunları kullanıyorsan, onlar da birlikte bırakılacak ürünlerdir."),
  sl("📞", "Kanıtlanmış destek", "Bırakmak için davranışsal destek ve gerektiğinde hekim değerlendirmesi önerilir. ALO 171 seni doğru desteğe yönlendirebilir."),
 ]),
 story("secondhand", "🏠", "Pasif ve üçüncü el duman", ["cdc-secondhand", "who-tobacco"], [
  sl("🏠", "Pasif içicilik", "Sigara içilen ortamda bulunan herkes dumandaki zararlı maddeleri solur. Pasif içiciliğin güvenli bir düzeyi yoktur."),
  sl("👶", "Çocuklar için", "Çocuklar pasif dumandan daha çok etkilenir; solunum yolu enfeksiyonları ve astım atakları daha sık görülebilir."),
  sl("🧥", "Üçüncü el duman", "Duman kalıntıları giysilere, eşyalara ve araba içine yapışır ve zamanla yeniden havaya karışabilir."),
  sl("✅", "Dumansız alan", "Evini ve arabanı tamamen dumansız tutmak, sevdiklerini korumanın en etkili yoludur."),
 ]),
 story("vascular-sexual", "💞", "Sigara ve cinsel/damar sağlığı", ["cdc-health-effects", "who-tobacco", "nhs-quit"], [
  sl("🩸", "Damarlar", "Sigara damar iç yüzeyine zarar verir, damarları daraltır ve pıhtı oluşumunu kolaylaştırır."),
  sl("❤️", "Kalp ve dolaşım", "Bu etkiler kalp krizi, inme ve dolaşım sorunları riskini artırır."),
  sl("💞", "Cinsel sağlık", "Yeterli kan akışı cinsel işlev için önemlidir; sigara sertleşme sorunları için bilinen bir risk etkenidir."),
  sl("📈", "Bırakınca", "Bıraktıktan sonra dolaşım iyileşir ve risk zamanla azalır. Süregelen sorunlarda bir hekime danışmak önemlidir."),
 ]),
 story("skin-teeth", "😁", "Sigara, cilt ve dişler", ["cdc-health-effects", "nhs-quit"], [
  sl("🧴", "Cilt", "Sigara cilde giden kan akışını azaltır; cilt erken yaşlanabilir ve yaralar daha yavaş iyileşebilir."),
  sl("😁", "Dişler ve diş eti", "Sigara dişlerde lekelenmeye, ağız kokusuna ve diş eti hastalıklarına yol açabilir."),
  sl("👃", "Tat ve koku", "Bıraktıktan sonraki günlerde tat ve koku alma duyusu düzelmeye başlar."),
 ]),
 story("sport", "🏃", "Sigara ve spor performansı", ["who-benefits", "cdc-health-effects"], [
  sl("🫁", "Oksijen taşınması", "Sigara dumanındaki karbonmonoksit, kanın oksijen taşıma kapasitesini azaltır."),
  sl("🏃", "Dayanıklılık", "Bu nedenle sigara içenler eforla daha çabuk yorulabilir ve nefes nefese kalabilir."),
  sl("📈", "Bırakınca", "Bıraktıktan sonraki haftalarda dolaşım iyileşir ve akciğer fonksiyonu artar. Birçok kişi merdiven çıkarken farkı hisseder."),
 ]),
 story("medication-info", "💊", "Bırakma ilaçları hakkında genel bilgi", ["cochrane2019", "alo171"], [
  sl("💊", "İlaçlar yardımcı olabilir", "Sigara bırakma ilaçları, yoksunluk belirtilerini ve istekleri azaltarak bırakma şansını artırabilir."),
  sl("🩺", "Hekim kararı", "Hangi ilacın sana uygun olduğuna yalnızca hekim karar verebilir. Bu uygulama ilaç adı ya da doz önermez."),
  sl("🏥", "Türkiye'de ücretsiz", "Sigara bırakma polikliniklerinde hekim uygun görürse ilaçlar ücretsiz verilmektedir. Randevu için ALO 171'i arayabilirsin."),
  sl("⚠️", "Önce danış", "Gebelik, kalp hastalığı ya da psikiyatrik bir tanın varsa herhangi bir yöntemden önce hekimine danış."),
 ]),
 story("weight", "⚖️", "Kilo yönetimi", ["nci-withdrawal", "smokefree-withdrawal"], [
  sl("⚖️", "Neden kilo alınabilir?", "Bıraktıktan sonra iştah artabilir ve tatlı isteği çoğalabilir; metabolizmada da küçük değişiklikler olur."),
  sl("🍎", "Küçük adımlar", "Düzenli öğünler, sebze ve meyve, bol su ve günlük hareket ani kilo artışını sınırlamaya yardım eder."),
  sl("🎯", "Öncelik", "Sigarayı bırakmanın sağlığa faydası, alınabilecek birkaç kilonun riskinden çok daha büyüktür."),
 ]),
 story("stress", "😤", "Stres ve sigara ilişkisi", ["nci-withdrawal", "who-tobacco"], [
  sl("😤", "Sigara rahatlatır mı?", "Sigaranın rahatlatıcı hissi büyük ölçüde iki sigara arasındaki yoksunluğun giderilmesinden gelir."),
  sl("🔄", "Kısır döngü", "Yoksunluk gerginlik yaratır, sigara onu geçici olarak giderir; böylece sigara stresin kaynağı ile çözümü gibi görünür."),
  sl("🌿", "Bıraktıktan sonra", "Yoksunluk döneminden sonra birçok kişi daha az gergin hisseder. Nefes, hareket ve sosyal destek yeni başa çıkma yollarıdır."),
 ]),
 story("sleep", "🌙", "Uyku ve sigara", ["nci-withdrawal", "smokefree-withdrawal"], [
  sl("🌙", "İlk günler", "Bıraktıktan sonra uykuya dalmakta ya da uykuyu sürdürmekte güçlük çekebilirsin. Bu genellikle geçicidir."),
  sl("☕", "Kafein", "Sigara kafeinin vücuttan atılmasını hızlandırır. Bıraktıktan sonra aynı miktarda kahve daha güçlü etki edebilir; akşamları kafeini azalt."),
  sl("🛏️", "Uyku düzeni", "Her gün aynı saatte yatmak, yatmadan önce ekranı bırakmak ve sakin bir rutin oluşturmak yardımcı olur."),
 ]),
 story("ramadan", "🌙", "Ramazan'da sigara bırakmak", ["who-benefits", "alo171"], [
  sl("🌙", "Hazır bir fırsat", "Ramazan'da gün boyu sigara içilmez. Birçok kişi için bu, aslında saatlerce sigarasız kalabildiğini gösteren bir deneyimdir."),
  sl("🍽️", "Riskli saat: iftar sonrası", "İftardan hemen sonra istek güçlü olabilir. Bu an için önceden bir Eğer–O zaman planı yapmak işini kolaylaştırır."),
  sl("🤝", "Sahurdan sonra", "Sahurdan sonraki sigarayı da bırakarak, oruçla kazandığın sigarasız saatleri bütün güne yayabilirsin."),
  sl("📅", "Bırakma günü seç", "Ramazan'ın başı ya da ortası, bırakma günü için anlamlı bir tarih olabilir."),
 ]),
 story("any-age", "🕰️", "Her yaşta bırakmanın faydası", ["who-benefits", "nhs-quit"], [
  sl("🕰️", "Hiçbir zaman geç değil", "Sigarayı hangi yaşta bırakırsan bırak, sağlığına faydası olur."),
  sl("❤️", "Hızlı kazanımlar", "Bıraktıktan kısa süre sonra kalp atış hızı ve kandaki karbonmonoksit düzeyi düşer."),
  sl("📈", "Uzun vadeli kazanımlar", "Yıllar içinde kalp hastalığı, inme ve birçok kanser türünün riski azalır."),
  sl("🌱", "Yaşam kalitesi", "Daha rahat nefes, daha iyi tat ve koku, daha fazla enerji: kazanımlar sadece uzun vadeli değildir."),
 ]),
]

DATA = {"reviewed": False, "sourceIds": sorted({s for st in STORIES for s in st["sourceIds"]}), "stories": STORIES}
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'camp', 'library.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(DATA, f, ensure_ascii=False, indent=2)
print('library:', len(STORIES), 'stories')
