"""Generates docs/CONTENT_REVIEW.md — the expert review checklist for Sigarasız Kamp content (spec 7.3).

Lists every content file and item still marked reviewed=false, with the sources it cites, plus the
reviewer's signature / date fields. After the expert signs off, set reviewed=true in the generators
and regenerate the content.
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
CONTENT = os.path.join(ROOT, 'src', 'content', 'camp')
OUT = os.path.join(ROOT, 'docs', 'CONTENT_REVIEW.md')

sources = {s['id']: s for s in json.load(open(os.path.join(CONTENT, 'sources.json'), encoding='utf8'))}


def load(name):
    return json.load(open(os.path.join(CONTENT, name), encoding='utf8'))


def src(ids):
    return ', '.join(f"[{sources[i]['org']} ({sources[i]['year']})]({sources[i]['url']})" for i in ids if i in sources) or '–'


lines = [
    '# İçerik Uzman Kontrolü — Sigarasız Kamp (90 Gün)',
    '',
    '> Bu dosya `scripts/content/camp_review.py` ile üretilir; elle düzenlemeyin.',
    '> Yeniden üretmek için: `PYTHONUTF8=1 python scripts/content/camp_review.py`',
    '',
    'Kamptaki tüm içerikler `reviewed: false` olarak işaretlidir. Yayın öncesinde bir **göğüs hastalıkları uzmanı**',
    'ya da **sertifikalı sigara bırakma hekimi** tarafından kontrol edilmelidir. Onaydan sonra ilgili üretici',
    'betikte `reviewed` değeri `True` yapılır ve içerik yeniden üretilir.',
    '',
    '## Kontrol eden uzman',
    '',
    '| Alan | Değer |',
    '|---|---|',
    '| Ad Soyad | |',
    '| Uzmanlık / unvan | |',
    '| Kurum | |',
    '| Kontrol tarihi | |',
    '| İmza | |',
    '',
    '## Her kontrolde bakılacaklar',
    '',
    '- Tıbbi iddia yok; başarı yüzdesi, "kesin bırakırsın" gibi vaat yok.',
    '- İlaç adı ya da dozu yok; ilaç bilgisi yalnızca "hekim kararı + ALO 171 + poliklinik" çerçevesinde.',
    '- E-sigara, ısıtılmış tütün, nargile veya nikotin poşeti bırakma yöntemi olarak önerilmiyor.',
    '- Yargılayıcı dil yok ("başarısız", "pes ettin", "sıfırdan" geçmiyor; otomatik testle de denetlenir).',
    '- Kurumsal bilgiler (ALO 171, poliklinikler, ücretsiz ilaç, Yeşilay 115) güncel; `lastVerified` tarihi her sürümde kontrol edilir.',
    '- Gizli bildirim metinlerinde "sigara", "nikotin", "tütün", "duman" geçmiyor (otomatik test).',
    '',
]

total = 0


def section(title, rows, header=('Öğe', 'Kaynaklar')):
    global total
    lines.extend([f'### {title}', '', f'| # | {header[0]} | {header[1]} | Onay |', '|---|---|---|---|'])
    for i, (name, ids) in enumerate(rows, 1):
        lines.append(f'| {i} | {name} | {src(ids)} | ☐ |')
        total += 1
    lines.append('')


lines.append('## İçerik listesi')
lines.append('')

onb = load('onboarding.tr.json')
section('Değerlendirme ve plan (onboarding.tr.json)', [('Ürünler, tetikleyiciler, nedenler, yöntemler', onb['sourceIds']), ('Bağımlılık düzeyi (HSI) açıklamaları ve ilaç bilgisi', onb['sourceIds']), ('18 yaş altı yönlendirmesi', onb['sourceIds']), ('ALO 171 metni', onb['sourceIds'])])
plans = load('plans.tr.json')
section(f"Eğer–O zaman şablonları (plans.tr.json, {len(plans['templates'])} tetikleyici)", [(t['if'], plans['sourceIds']) for t in plans['templates'].values()])
health = load('health-timeline.tr.json')
section('Sağlık zaman çizelgesi (health-timeline.tr.json)', [(f"{x['label']}: {x['text']}", health['sourceIds']) for x in health['items']])
sos = load('sos.tr.json')
section('SOS kriz aracı (sos.tr.json)', [('Dalga sörfü yönergeleri', sos['sourceIds']), ('Nefes, erteleme, 4E kuralı', sos['sourceIds']), ('Kriz bitiş mesajları', sos['sourceIds'])])
chk = load('checkin.tr.json')
section('Belirti ipuçları (checkin.tr.json)', [(f"{x['label']}: {x['eases']}", chk['sourceIds']) for x in chk['symptoms']] + [('Ruh hali güvenlik kartı', chk['sourceIds']), ('Kayma ve nüks akışı metinleri', chk['sourceIds'])])
mis = load('missions.tr.json')
section(f"Günlük görevler (missions.tr.json, {len(mis['missions'])} görev)", [(f"[{m['phase']} · gün {m['day']}] {m['title']} — BCT {', '.join(m['bctCodes'])}", mis['sourceIds']) for m in mis['missions']])
section('Bırakma Günü ekranı (missions.tr.json → quitDay)', [('Kural ve kontrol listesi', mis['sourceIds'])])
sk = load('skills.tr.json')
section(f"Beceri dersleri (skills.tr.json, {len(sk['lessons'])} ders)", [(f"{l['order']}. {l['title']}", l['sourceIds']) for l in sk['lessons']])
lib = load('library.tr.json')
section(f"Bilgi kütüphanesi (library.tr.json, {len(lib['stories'])} hikâye)", [(s['title'], s['sourceIds']) for s in lib['stories']])
co = load('coach.tr.json')
section(f"Koç senaryoları (coach.tr.json, {len(co['scenarios'])} senaryo)", [(f"{s['title']} ({len(s['nodes'])} mesaj)", co['sourceIds']) for s in co['scenarios']])
sup = load('support.tr.json')
section(f"Destek ekranı (support.tr.json, kontrol: {sup['lastVerified']})", [('ALO 171', ['alo171']), ('Sigara bırakma poliklinikleri', ['alo171']), ('Yeşilay (YEDAM 115)', ['yedam']), ('Destekçi mesajları ve hekime özet notu', sup['sourceIds'])])
rw = load('rewards.tr.json')
section('Rozetler ve mezuniyet (rewards.tr.json)', [(f"{b['title']}: {b['desc']}", rw['sourceIds']) for b in rw['badges']])

lines.extend(['## Kaynak listesi', '', '| Kimlik | Başlık | Kurum / yazar | Yıl | Erişim |', '|---|---|---|---|---|'])
for s in sources.values():
    lines.append(f"| `{s['id']}` | [{s['title']}]({s['url']}) | {s['org']} | {s['year']} | {s['accessed']} |")
lines.append('')
lines.insert(8, '')
lines.insert(9, f'**Toplam kontrol edilecek öğe: {total}** · **Kaynak sayısı: {len(sources)}**')
lines.insert(10, '')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(lines))
print('CONTENT_REVIEW.md:', total, 'items,', len(sources), 'sources')
