"""Generates src/content/challenges.tr.json — 28-day nutrition plan for sexual health.

Each day has 3 short tasks: one snack, one fruit, one food for the plate. Foods only
(no pills, no referrals); original Turkish content, reviewed=false. The "why" lines
describe evidence honestly (mostly associations or small trials). Sources:
- Flavonoids (berries, citrus, apples/pears) ~ lower ED risk (Cassidy et al., AJCN 2016; observational).
- Mediterranean diet improved erectile and endothelial function (Esposito et al., 2006).
- Dietary nitrate (beetroot, leafy greens) modestly lowers blood pressure (meta-analyses 2018, 2022).
- L-arginine / citrulline: precursors of nitric oxide (meta-analysis 2021).
- NIH ODS fact sheets: zinc, selenium (one Brazil nut ≈ 68–91 mcg), vitamin D, magnesium, folate, omega-3, vitamin C.
"""
import json, os

S = {
 "flav": {"title": "Cassidy ve ark. (2016) – Flavonoid alımı ve erektil disfonksiyon, AJCN", "url": "https://ueaeprints.uea.ac.uk/id/eprint/57156/"},
 "med": {"title": "Esposito ve ark. (2006) – Akdeniz diyeti ve erektil fonksiyon", "url": "https://pubmed.ncbi.nlm.nih.gov/16395320/"},
 "nitrate": {"title": "İnorganik nitrat ve kardiyovasküler risk faktörleri – meta-analiz (2018)", "url": "https://pubmed.ncbi.nlm.nih.gov/29506204/"},
 "beet": {"title": "Pancar nitratı ve kan basıncı – meta-analiz (2022)", "url": "https://www.frontiersin.org/articles/10.3389/fnut.2022.823039/full"},
 "arg": {"title": "L-arjinin ve erektil fonksiyon – meta-analiz (2021)", "url": "https://pubmed.ncbi.nlm.nih.gov/33587304/"},
 "zinc": {"title": "NIH ODS – Çinko", "url": "https://ods.od.nih.gov/factsheets/Zinc-Consumer/"},
 "selenium": {"title": "NIH ODS – Selenyum", "url": "https://ods.od.nih.gov/factsheets/Selenium-Consumer/"},
 "vitd": {"title": "NIH ODS – D vitamini", "url": "https://ods.od.nih.gov/factsheets/VitaminD-Consumer/"},
 "vitc": {"title": "NIH ODS – C vitamini", "url": "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/"},
 "mag": {"title": "NIH ODS – Magnezyum", "url": "https://ods.od.nih.gov/factsheets/Magnesium-Consumer/"},
 "folate": {"title": "NIH ODS – Folat", "url": "https://ods.od.nih.gov/factsheets/Folate-Consumer/"},
 "omega": {"title": "NIH ODS – Omega-3 yağ asitleri", "url": "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/"},
}

# (emoji, task, why, source)
C = {
 "snack": [
  ("🌰", "Bir avuç ceviz ye.", "Arjinin ve bitkisel omega-3 içerir; damar sağlığını destekler.", "med"),
  ("🥜", "Bir avuç tuzsuz antep fıstığı ye.", "Arjinin ve antioksidanlardan zengindir.", "arg"),
  ("🌰", "Bir avuç çiğ badem ye.", "Magnezyum ve E vitamini kaynağıdır.", "mag"),
  ("🎃", "Yoğurduna ya da salatana 1 yemek kaşığı kabak çekirdeği ekle.", "Testosteron üretimi için gerekli çinkonun iyi kaynaklarındandır.", "zinc"),
  ("🍫", "1–2 kare %70+ kakaolu bitter çikolata ye.", "Kakao flavanolleri damar iç yüzeyinin işlevini destekler.", "flav"),
  ("🌰", "1 adet Brezilya cevizi ye; fazlasını değil.", "Tek tanesi günlük selenyum ihtiyacını karşılar; selenyum üreme sağlığı için önemlidir.", "selenium"),
  ("🥜", "Bir avuç kaju ye.", "Çinko ve magnezyum içerir.", "zinc"),
  ("🌻", "Bir avuç tuzsuz ay çekirdeği ye.", "E vitamini ve çinko kaynağıdır.", "zinc"),
  ("🫘", "Ara öğünde bir avuç leblebi ye.", "Bitkisel protein, arjinin ve folat sağlar.", "folate"),
  ("🌾", "Yoğurduna 1 tatlı kaşığı öğütülmüş keten tohumu ekle.", "Bitkisel omega-3 ve lif içerir.", "omega"),
  ("🥄", "Yoğurduna ya da sütüne 1 tatlı kaşığı chia tohumu ekle.", "Omega-3, lif ve magnezyum içerir.", "omega"),
  ("☕", "Sütüne 1 tatlı kaşığı şekersiz kakao ekle.", "Saf kakao, flavanollerin en yoğun kaynaklarındandır.", "flav"),
  ("🍵", "1–2 fincan yeşil çay iç.", "Kateşin adlı flavonoidlerden zengindir.", "flav"),
 ],
 "fruit": [
  ("🫐", "Bir kase yaban mersini ye.", "Antosiyaninden zengin meyveler, daha düşük ereksiyon sorunu riskiyle ilişkilendirildi.", "flav"),
  ("🍓", "Bir kase çilek ye.", "Çilek, flavonoid araştırmasında en çok katkı sağlayan meyvelerdendi.", "flav"),
  ("🔴", "Yarım nar ye.", "Polifenollerden zengindir; damar sağlığını destekler.", "flav"),
  ("🍉", "Birkaç dilim karpuz ye; mevsimi değilse bir kase çilekle değiştir.", "Vücutta arjinine dönüşen sitrülin içerir.", "arg"),
  ("🍊", "Bir portakal ye.", "Turunçgil flavanonları daha düşük ereksiyon sorunu riskiyle ilişkilendirildi.", "flav"),
  ("🍎", "Bir elma ye.", "Elma, flavonoid araştırmasında öne çıkan meyvelerdendi.", "flav"),
  ("🍌", "Bir muz ye.", "Potasyum ve magnezyum, kan basıncının dengesine katkı sağlar.", "mag"),
  ("🍇", "Bir avuç kırmızı ya da siyah üzüm ye.", "Kabuğu antosiyanin ve resveratrol içerir.", "flav"),
  ("🍒", "Bir kase kiraz ya da vişne ye; mevsimi değilse kurusundan bir avuç.", "Antosiyaninden zengindir.", "flav"),
  ("🫐", "Bir avuç böğürtlen ya da dut ye.", "Antosiyanin ve lif kaynağıdır.", "flav"),
  ("🥑", "Yarım avokado ye.", "Sağlıklı yağ, folat ve magnezyum içerir.", "folate"),
  ("🍊", "İki mandalina ye.", "Flavanon ve C vitamini kaynağıdır.", "flav"),
  ("🍐", "Bir armut ye.", "Armut, flavonoid araştırmasında elmayla birlikte öne çıkan meyvelerdendi.", "flav"),
  ("🥝", "Bir kivi ye.", "Bir tanesi günlük C vitamini ihtiyacının büyük kısmını karşılar.", "vitc"),
 ],
 "plate": [
  ("🟣", "Öğününe kırmızı pancar ekle.", "Doğal nitrat içerir; nitrat, damarları gevşeten nitrik okside dönüşür.", "beet"),
  ("🥬", "Salatana bir avuç roka ekle.", "Nitrattan en zengin yeşilliklerdendir.", "nitrate"),
  ("🥬", "Bir öğününe ıspanak ekle.", "Nitrat, folat ve magnezyum kaynağıdır.", "nitrate"),
  ("🥦", "Bir porsiyon brokoli ye.", "Folat ve C vitamini içerir.", "folate"),
  ("🍅", "Bir öğünde domates ye.", "Likopen içerir; Akdeniz tipi beslenmenin temelidir.", "med"),
  ("🫒", "Salatana bir kaşık zeytinyağı ekle.", "Zeytinyağı temelli Akdeniz diyeti, bir çalışmada erektil fonksiyonu iyileştirdi.", "med"),
  ("🥚", "Kahvaltında yumurta ye.", "D vitamini, B12 ve kaliteli protein sağlar.", "vitd"),
  ("🐟", "Bir öğünde somon ya da uskumru ye.", "Omega-3 ve D vitamini kaynağıdır.", "omega"),
  ("🐟", "Bir öğünde hamsi ya da sardalya ye.", "Omega-3 açısından zengin, ekonomik balıklardır.", "omega"),
  ("🫘", "Bir öğünde nohut ye.", "Arjinin, çinko ve folat içerir.", "arg"),
  ("🥣", "Bir kase mercimek çorbası iç.", "Folat, çinko ve bitkisel protein sağlar.", "folate"),
  ("🍗", "Bir öğünde hindi ya da tavuk göğsü ye.", "Arjinin ve çinko kaynağıdır.", "arg"),
  ("🦪", "Bir öğünde midye ya da karides ye.", "Kabuklu deniz ürünleri çinkonun en zengin kaynaklarındandır.", "zinc"),
 ],
}

DAYS = 28
prefix = {"snack": "sn", "fruit": "fr", "plate": "pl"}
items = []
for cat, rows in C.items():
    assert len({r[1] for r in rows}) == len(rows), cat
    for i, (emoji, text, why, src) in enumerate(rows, 1):
        items.append({"id": f"{prefix[cat]}{i:02d}", "category": cat, "emoji": emoji, "text": text, "why": why, "source": S[src]})

# Day d gets snack d, fruit d, plate d (each list cycles on its own length),
# so combinations keep changing and each food comes back only every ~2 weeks.
ids = {cat: [f"{prefix[cat]}{i:02d}" for i in range(1, len(rows) + 1)] for cat, rows in C.items()}
plan = [[ids["snack"][d % len(ids["snack"])], ids["fruit"][d % len(ids["fruit"])], ids["plate"][d % len(ids["plate"])]] for d in range(DAYS)]
assert len({tuple(p) for p in plan}) == DAYS

out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'challenges.tr.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump({"days": DAYS, "items": items, "plan": plan}, f, ensure_ascii=False, indent=2)
print(len(items), 'foods,', DAYS, 'days')
