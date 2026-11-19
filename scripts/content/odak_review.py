"""Generates docs/CONTENT_REVIEW_ODAK.md — the expert review checklist for Odak Kampı content (spec 7.5).

Lists every content file and every item marked reviewed=false, with evidence level and sources, plus the
reviewer's name / title / date fields. After the expert signs off, set reviewed=True in the generators
(scripts/content/odak*.py) and regenerate.
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
CONTENT = os.path.join(ROOT, 'src', 'content', 'camps', 'odak')
OUT = os.path.join(ROOT, 'docs', 'CONTENT_REVIEW_ODAK.md')

sources = {s['id']: s for s in json.load(open(os.path.join(CONTENT, 'sources.json'), encoding='utf8'))}


def load(name):
    return json.load(open(os.path.join(CONTENT, name), encoding='utf8'))


def src(ids):
    return ', '.join(f"[{sources[i]['org']} ({sources[i]['year']})]({sources[i]['url']})" for i in ids if i in sources) or '–'


lines = [
    '# İçerik Uzman Kontrolü — Odak Kampı',
    '',
    '> Bu dosya `scripts/content/odak_review.py` ile üretilir; elle düzenlemeyin.',
    '> Yeniden üretmek için: `PYTHONUTF8=1 python scripts/content/odak_review.py`',
    '',
    'Kamptaki tüm içerikler `reviewed: false` olarak işaretlidir. Yayın öncesinde bir **klinik psikolog** ya da',
    '**psikiyatrist** (tercihen cinsel sağlık veya bağımlılık alanında) tarafından kontrol edilmelidir. Onaydan sonra',
    'ilgili üretici betikte `reviewed` değeri `True` yapılır ve içerik yeniden üretilir.',
    '',
    'Kontrol sırasında özellikle bakılacaklar: tanı ya da etiket yok · utanç ve ahlaki hüküm yok · mastürbasyon zararlı',
    'olarak sunulmuyor · kanıtsız iddia ve başarı yüzdesi yok · müstehcen ifade yok · kriz ve uzman yönlendirmeleri doğru.',
    'Dil kuralları: `docs/ODAK_DIL_REHBERI.md`. Ölçekler: `docs/SCALES.md`.',
    '',
    '## Kontrol eden uzman',
    '',
    '| Alan | Değer |',
    '|---|---|',
    '| Ad Soyad | |',
    '| Uzmanlık / unvan | |',
    '| Kurum | |',
    '| Tarih | |',
    '| İmza | |',
    '',
    '## Telefon numaraları (yayından önce teyit)',
    '',
    '| Hat | Numara | Bilgi tarihi | Teyit eden | Tarih |',
    '|---|---|---|---|---|',
]
for h in load('support.tr.json')['help']:
    lines.append(f"| {h['title']} | {h['phone']} | {h['lastVerified']} | | |")
lines += ['| Acil | 112 | – | | |', '']

FILES = [
    ('onboarding.tr.json', 'Değerlendirme ve plan', None),
    ('plans.tr.json', 'Eğer–O zaman şablonları', None),
    ('panel.tr.json', 'Panel metinleri', None),
    ('sos.tr.json', 'Dürtü anı (SOS)', None),
    ('diary.tr.json', 'Günlük', None),
    ('checkin.tr.json', 'Günlük kontrol', None),
    ('slip.tr.json', 'Kayma akışı', None),
    ('relapse.tr.json', 'Nüks akışı', None),
    ('referral.tr.json', 'Uzman yönlendirme', None),
    ('boundaries.tr.json', 'Ortam ve dijital sınırlar', None),
    ('rebuild.tr.json', 'Yeniden İnşa', None),
    ('support.tr.json', 'Destek ve profesyonel yardım', None),
    ('missions.tr.json', '90 günlük görevler', 'missions'),
    ('skills.tr.json', 'Beceri dersleri', 'lessons'),
    ('library.tr.json', '“Bilim Ne Diyor?” kütüphanesi', 'stories'),
    ('coach.tr.json', 'Koç senaryoları', 'scenarios'),
]

total = 0
for name, title, items in FILES:
    d = load(name)
    lines += [f'## {title} (`{name}`)', '', f"Kanıt düzeyi: `{d.get('evidenceLevel', '–')}` · Kaynaklar: {src(d.get('sourceIds', []))}", '']
    if items:
        lines += ['| ✓ | İçerik | Kanıt | Kaynaklar |', '|---|---|---|---|']
        for it in d[items]:
            label = it.get('title') or it.get('id')
            day = f"{it['day']}. gün · " if 'day' in it else ''
            lines.append(f"| ☐ | {day}{label} | `{it.get('evidenceLevel', d.get('evidenceLevel', '–'))}` | {src(it.get('sourceIds', d.get('sourceIds', [])))} |")
            total += 1
        lines.append('')
    else:
        lines += ['☐ Dosyanın tamamı kontrol edildi', '']
        total += 1

lines += ['## Özet', '', f'Kontrol edilecek öğe sayısı: **{total}**', '']
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf8', newline='\n').write('\n'.join(lines))
print('ok', OUT, total)
