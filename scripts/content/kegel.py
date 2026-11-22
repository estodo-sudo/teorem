"""Generates the Kegel v2 content files (SPEC_KEGEL_V2 §15): src/content/kegel/*.json.

Every file is reviewed=False with sourceIds; a urologist or pelvic floor physiotherapist reviews it before
release. Run: PYTHONUTF8=1 python scripts/content/kegel.py
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'src', 'content', 'kegel')
os.makedirs(OUT, exist_ok=True)


def write(name, data):
    with open(os.path.join(OUT, name), 'w', encoding='utf8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('ok', name)


# ---------------------------------------------------------------- sources (spec appendix)
# url is filled only where the spec gives a DOI; the rest are verified before release.
SOURCES = [
    {'id': 'dorey2004_bjgp', 'title': 'Randomised controlled trial of pelvic floor muscle exercises and manometric biofeedback for erectile dysfunction', 'org': 'British Journal of General Practice', 'year': 2004, 'citation': 'Dorey G ve ark. BJGP 2004;54(508):819–825.', 'url': None},
    {'id': 'dorey2005_bju', 'title': 'Pelvic floor exercises for erectile dysfunction', 'org': 'BJU International', 'year': 2005, 'citation': 'Dorey G ve ark. BJU Int 2005;96(4):595–597.', 'url': 'https://doi.org/10.1111/j.1464-410X.2005.05690.x'},
    {'id': 'dorey2004_uronurs', 'title': 'Pelvic floor exercises for treating post-micturition dribble in men with erectile dysfunction: a randomised controlled trial', 'org': 'Urologic Nursing', 'year': 2004, 'citation': 'Dorey G ve ark. Urol Nurs 2004;24(6):490–497.', 'url': None},
    {'id': 'miller1996_knack', 'title': 'The Knack: use of precisely-timed pelvic muscle contraction can reduce leakage in SUI', 'org': 'Neurourology and Urodynamics', 'year': 1996, 'citation': 'Miller J, Ashton-Miller J, DeLancey J. Neurourol Urodyn 1996;15(4):392–393.', 'url': None},
    {'id': 'ics2022_knack', 'title': 'Adding knack manoeuvre and lifestyle recommendations to PFMT for post-prostatectomy urinary incontinence: an RCT', 'org': 'International Continence Society (Abstract 288)', 'year': 2022, 'citation': 'ICS 2022 Abstract 288.', 'url': None},
    {'id': 'mkuh_nhs', 'title': 'Pelvic floor exercises and advice for men', 'org': 'Milton Keynes University Hospital NHS', 'year': None, 'citation': 'Hasta broşürü.', 'url': None},
    {'id': 'papworth_nhs', 'title': 'Pelvic floor exercise for men (PI 104)', 'org': 'Royal Papworth Hospital NHS', 'year': None, 'citation': 'Hasta bilgilendirme broşürü PI 104.', 'url': None},
    {'id': 'smsna_hypertonic', 'title': 'Benefits of Pelvic Floor Treatments for Hypertonicity-Related Sexual Dysfunction', 'org': 'Sexual Medicine Society of North America', 'year': None, 'citation': 'SMSNA hasta bilgilendirme yazısı.', 'url': None},
    {'id': 'nebraska_hypertonic', 'title': 'Can you do too many Kegels? What to know about hypertonic pelvic floor', 'org': 'Nebraska Medicine', 'year': None, 'citation': 'Nebraska Medicine sağlık yazısı.', 'url': None},
    {'id': 'aua_eau_pfmt', 'title': 'Prostatektomi sonrası idrar kaçırmada pelvik taban kas eğitimi (birinci basamak)', 'org': 'AUA / EAU kılavuzları', 'year': None, 'citation': 'AUA ve EAU kılavuzları.', 'url': None},
    {'id': 'haptics_docs', 'title': 'Core Haptics, Android VibrationEffect ve Apple HIG – Playing haptics', 'org': 'Apple / Android', 'year': None, 'citation': 'Platform dokümantasyonu (teknik kaynak).', 'url': None},
]
CLINICAL = ['mkuh_nhs', 'papworth_nhs']

# ---------------------------------------------------------------- tracks (spec §3, §5, §8)
TRACKS = {
    'reviewed': False,
    'evidenceLevel': 'expert',
    'sourceIds': CLINICAL + ['dorey2004_bjgp', 'dorey2005_bju', 'dorey2004_uronurs', 'miller1996_knack', 'aua_eau_pfmt', 'nebraska_hypertonic'],
    'weekThemes': [
        {'week': 1, 'title': '1. Hafta: Kası tanı', 'text': 'Kası bulmayı, sıkıp tamamen bırakmayı öğreniyorsun.'},
        {'week': 2, 'title': '2. Hafta: Kontrol', 'text': 'Kasılmayı ve bırakmayı istediğin anda yapabilmek.'},
        {'week': 3, 'title': '3. Hafta: Güç', 'text': 'Tutma süreleri ve kasılmanın gücü artıyor.'},
        {'week': 4, 'title': '4. Hafta: Toparlanma', 'text': 'Hafif hafta (22.–30. gün): kasılma sayısı biraz azalır, süre aynı kalır. Kas dinlenerek güçlenir.'},
    ],
    'tracks': [
        {'id': 'general', 'emoji': '💪', 'title': 'Genel Güç', 'text': 'Dengeli tutma, hızlı sıkma ve yavaş sık–bırak çalışması.', 'sourceIds': CLINICAL},
        {'id': 'erection', 'emoji': '⚡', 'title': 'Sertleşme Desteği', 'text': 'Tam güçte kasılmalar; her seansta yatarak, oturarak ve ayakta.', 'note': 'Ev programı mantığı Dorey ve arkadaşlarının (2004–2005) çalışmalarından esinlenir. Tıbbi bir tedavi değildir.', 'sourceIds': ['dorey2004_bjgp', 'dorey2005_bju']},
        {'id': 'control', 'emoji': '🎚️', 'title': 'Kontrol ve Zamanlama', 'text': 'Hızlı kasılma ve tam bırakma koordinasyonu, nefesle eşleme, gevşeme farkındalığı.', 'note': 'Amaç kontrol ve farkındalık kazanmaktır; belirli bir sonuç vaat edilmez.', 'sourceIds': CLINICAL},
        {'id': 'bladder', 'emoji': '💧', 'title': 'İdrar Kontrolü ve Damlama', 'text': 'Yavaş tutma, hızlı kasılma, Knack pratiği ve idrar sonrası sıkma alışkanlığı.', 'sourceIds': ['dorey2004_uronurs', 'miller1996_knack'] + CLINICAL},
        {'id': 'surgery', 'emoji': '🩹', 'title': 'Prostat Ameliyatı Öncesi/Sonrası', 'text': 'Hafif başlangıç, yatarak başlayıp ayakta ilerleme, Knack pratiği.', 'note': 'Yalnızca doktorun onay verdiyse açılır. Sonda takılıyken egzersiz yapma.', 'requiresClearance': True, 'sourceIds': ['aua_eau_pfmt', 'ics2022_knack', 'miller1996_knack']},
        {'id': 'relax', 'emoji': '🌿', 'title': 'Gevşeme Odaklı', 'text': 'Bırakma, nazik ters Kegel ve beden farkındalığı.', 'note': 'Pelvik tabanında gerginlik olabileceğini düşünüyorsan önerilir. Bir üroloji uzmanına veya pelvik taban fizyoterapistine danışman iyi olur.', 'sourceIds': ['smsna_hypertonic', 'nebraska_hypertonic']},
    ],
}

# ---------------------------------------------------------------- cues (spec §4: rotating technique cues)
# types: which exercise types show the cue ('all' = any contraction type).
C = [
    ('sq_glutes', 'squeeze', ['all'], 'Kalçanı sıkma.'),
    ('sq_breath', 'squeeze', ['all'], 'Nefesini tutma; nefes akmaya devam etsin.'),
    ('sq_belly', 'squeeze', ['all'], 'Karın gevşek kalsın.'),
    ('sq_up', 'squeeze', ['all'], 'İçeri ve yukarı çek.'),
    ('sq_legs', 'squeeze', ['all'], 'Bacakların ve uyluğun gevşek kalsın.'),
    ('sq_face', 'squeeze', ['all'], 'Yüzün ve çenen rahat olsun.'),
    ('sq_quiet', 'squeeze', ['all'], 'Dışarıdan bakan biri bir şey fark etmemeli.'),
    ('sq_gentle', 'squeeze', ['slow_hold', 'endurance'], 'Tutarken gücü sabit tut; titremeye başlarsa biraz azalt.'),
    ('sq_full_release', 'squeeze', ['slow_hold', 'max_contraction'], 'Her tutmanın ardından tamamen bırak.'),
    ('quick_sharp', 'squeeze', ['quick_flick'], 'Kısa ve net sık, hemen bırak.'),
    ('quick_rhythm', 'squeeze', ['quick_flick'], 'Ritmi koru; hız değil netlik önemli.'),
    ('quick_release', 'release', ['quick_flick'], 'Her sıkmadan sonra kas tamamen yerine insin.'),
    ('max_strong', 'squeeze', ['max_contraction'], 'Olabildiğince güçlü sık, ama kalça ve karın devreye girmesin.'),
    ('max_rest', 'release', ['max_contraction'], 'Güçlü kasılmadan sonra uzun dinlenme kası korur.'),
    ('max_quality', 'squeeze', ['max_contraction'], 'Güç düşerse tekrarı bitirmek yerine iyi bir dinlenme ver.'),
    ('el_floors', 'squeeze', ['elevator'], 'Yavaşça, saniye saniye artırarak sık; bir anda değil.'),
    ('el_top', 'squeeze', ['elevator'], 'En güçlü noktada kısa tut, sonra yavaşça bırak.'),
    ('el_down', 'release', ['elevator'], 'Bırakırken acele etme; kas yavaş yavaş insin.'),
    ('end_steady', 'squeeze', ['endurance'], 'Orta güçte, uzun ve sakin tut.'),
    ('end_breathe', 'squeeze', ['endurance'], 'Uzun tutmada nefes almayı unutma.'),
    ('kn_before', 'squeeze', ['knack'], 'Öksürmeden hemen önce sık.'),
    ('kn_hold', 'squeeze', ['knack'], 'Öksürük boyunca tut, sonra bırak.'),
    ('kn_daily', 'squeeze', ['knack'], 'Günlük hayatta da hapşırma, öksürme veya ağır kaldırmadan önce sık.'),
    ('rl_down', 'release', ['release'], 'Pelvik tabanı nazikçe aşağı bırak.'),
    ('rl_no_push', 'release', ['release'], 'Ikınma değil, nazikçe bırak.'),
    ('rl_soft', 'release', ['release', 'breath'], 'Karnını ve kalçanı da yumuşat.'),
    ('rel_ground', 'release', ['all'], 'Tamamen bırak, kas yere iner gibi.'),
    ('rel_jaw', 'release', ['all', 'release', 'breath'], 'Çeneni gevşet, dişlerini sıkma.'),
    ('rel_equal', 'release', ['all'], 'Bırakmak da sıkmak kadar antrenmandır.'),
    ('br_belly', 'breath', ['breath', 'release'], 'Burnundan al, karnın yükselsin.'),
    ('br_long', 'breath', ['breath', 'release'], 'Nefes verişi alıştan biraz daha uzun olsun.'),
    ('br_scan', 'breath', ['breath'], 'Bedeninde gergin bir yer varsa nefesle orayı yumuşat.'),
    ('pain_stop', 'squeeze', ['all'], 'Ağrı olursa dur; Kegel ağrı yapmamalı.'),
]
CUES = {
    'reviewed': False,
    'evidenceLevel': 'expert',
    'sourceIds': CLINICAL + ['miller1996_knack', 'nebraska_hypertonic'],
    'cues': [{'id': i, 'phase': p, 'types': t, 'text': x} for i, p, t, x in C],
}

# ---------------------------------------------------------------- positions (spec §5: position cards)
POSITIONS = {
    'reviewed': False,
    'evidenceLevel': 'expert',
    'sourceIds': CLINICAL,
    'positions': [
        {'id': 'lying', 'emoji': '🛏️', 'title': 'Yatarak', 'text': 'Sırtüstü uzan, dizlerini bük, ayak tabanların yerde. Kas en kolay bu pozisyonda hissedilir.'},
        {'id': 'sitting', 'emoji': '🪑', 'title': 'Oturarak', 'text': 'Sandalyede dik otur, ayakların yerde, dizlerin hafif aralık. Kalçana yaslanma, omuzların gevşek.'},
        {'id': 'standing', 'emoji': '🧍', 'title': 'Ayakta', 'text': 'Ayakların omuz genişliğinde, dizlerin kilitli değil. Ağırlığın iki ayağına eşit dağılsın.'},
        {'id': 'functional', 'emoji': '🚶', 'title': 'Günlük hayatta', 'text': 'Yürürken, merdiven çıkarken veya ayağa kalkarken: hareketten hemen önce sık.'},
    ],
}

# ---------------------------------------------------------------- screening (spec §2) — not a diagnosis
SCREENING = {
    'reviewed': False,
    'evidenceLevel': 'expert',
    'sourceIds': ['smsna_hypertonic', 'nebraska_hypertonic'] + CLINICAL,
    'title': 'Kas profili',
    'intro': 'Son 1 ayı düşünerek 8 kısa soruyu Evet ya da Hayır ile yanıtla. Bu bir tanı değildir; yalnızca sana uygun programı seçmek için kullanılır. Yanıtların yalnızca bu telefonda kalır.',
    'questions': [
        {'id': 'pelvic_pain', 'text': 'Pelviste, perinede (makat ile testisler arası), kasıkta veya makatta süregelen ağrı ya da baskı hissin var mı?', 'pain': True},
        {'id': 'sitting_pain', 'text': 'Uzun süre oturunca artan bir ağrın var mı?', 'pain': True},
        {'id': 'ejaculation_pain', 'text': 'Boşalma sırasında veya sonrasında ağrı oluyor mu?', 'pain': True},
        {'id': 'urgency', 'text': 'Sık ve ani idrar ihtiyacı yaşıyor musun?'},
        {'id': 'incomplete', 'text': 'Mesaneni tam boşaltamama hissi ya da idrara başlamakta zorlanma oluyor mu?'},
        {'id': 'constipation', 'text': 'Kabızlık veya ıkınma ihtiyacı yaşıyor musun?'},
        {'id': 'clenching', 'text': 'Stres altındayken kalçanı ya da karnını farkında olmadan sıktığın oluyor mu?'},
        {'id': 'dribble', 'text': 'İdrar yaptıktan sonra damlama oluyor mu?', 'note': 'Bu, kas zayıflığının bir işareti olabilir; gerginlik puanına girmez.'},
    ],
    'result': {
        'relaxTitle': 'Gevşeme odaklı başlamanı öneriyoruz',
        'relaxText': 'Yanıtların, pelvik tabanın gerginlik taşıyor olabileceğini gösteriyor. Bu durumda yalnızca sıkma egzersizleri rahatsızlığı artırabilir. Gevşeme odaklı başlamanı ve bir üroloji uzmanına veya pelvik taban fizyoterapistine danışmanı öneriyoruz.',
        'relaxNote': 'Bu bir öneri; programı sen seçersin. Gevşeme izinde tutma süreleri kısa tutulur ve 2 haftada bir taramayı yenilemeni isteriz.',
        'okTitle': 'Profilin hazır',
        'okText': 'Yanıtlarında gerginliğe işaret eden belirgin bir durum yok. Hedefine uygun programla başlayabilirsin.',
        'dribbleText': 'İdrar sonrası damlama için İdrar Kontrolü izi ve “idrar sonrası 2 kez sık” alışkanlığı yardımcı olabilir.',
        'painNotice': 'Ağrı olursa dur. Kegel ağrı yapmamalıdır; rahatsızlık hissedersen sağ üstteki kalkan butonuna dokun.',
    },
}

# ---------------------------------------------------------------- functional tasks (spec §5: micro habits from week 6)
# tracks: where the task fits best ('all' = every track except relax, which gets its own calm tasks).
F = [
    ('stand_up', '🪑', 'Ayağa kalkarken önce sık', 'Bugün oturduğun yerden 3 kez kalkarken, kalkmadan hemen önce kası sık.', ['all']),
    ('stairs', '🪜', 'Merdivende sık', 'Bugün merdiven çıkarken ilk 3 basamakta kası hafifçe sık.', ['all']),
    ('after_urine', '🚻', 'İdrar sonrası 2 kez sık', 'İdrarın bittikten sonra 2 kez sık ve bırak; damlamayı azaltmaya yardım eder.', ['bladder', 'surgery', 'general']),
    ('cough_knack', '🤧', 'Öksürmeden önce sık (Knack)', 'Bugün öksürürken ya da hapşırırken hemen önce kası sık.', ['bladder', 'surgery', 'general']),
    ('lift', '📦', 'Kaldırmadan önce sık', 'Çanta, kutu ya da bir şey kaldırmadan hemen önce kası sık, kaldırırken nefes ver.', ['all']),
    ('walk', '🚶', 'Yürürken 5 hafif sıkma', 'Yürüyüş sırasında 5 kez hafifçe sık ve tamamen bırak.', ['all']),
    ('red_light', '🚦', 'Kırmızı ışıkta 3 sıkma', 'Trafikte ya da sırada beklerken 3 yavaş sıkma yap, aralarında tamamen bırak.', ['all']),
    ('kettle', '☕', 'Su ısınırken 5 hızlı sıkma', 'Çay ya da kahve suyu ısınırken 5 hızlı sıkma yap.', ['all']),
    ('teeth', '🪥', 'Diş fırçalarken tut', 'Diş fırçalarken 2 kez 5 saniye tut, sonra bırak.', ['all']),
    ('phone_call', '📞', 'Telefonda dik dur', 'Bir telefon görüşmesinde dik dur ve 3 kez hafifçe sık.', ['all']),
    ('sit_posture', '🧘', 'Oturuşunu kontrol et', 'Bugün 3 kez oturuşuna bak: dik otur, kalçanı sıkmadan pelvik tabanı hafifçe kaldır.', ['all']),
    ('elevator_wait', '🛗', 'Beklerken yavaş sık–bırak', 'Asansör ya da otobüs beklerken 3 kez yavaşça sık, kısa tut ve yavaşça bırak.', ['general', 'control']),
    ('max_morning', '⚡', 'Sabah 3 tam güç', 'Sabah kalkınca ayakta 3 tam güç kasılma yap, aralarında uzun dinlen.', ['erection']),
    ('standing_hold', '🧍', 'Ayakta 5 saniye tut', 'Gün içinde ayaktayken 3 kez 5 saniye tut, tamamen bırak.', ['erection', 'general']),
    ('breath_sync', '🌬️', 'Nefesle eşle', 'Nefes verirken sık, alırken bırak: 5 tekrar.', ['control']),
    ('release_scan', '🌿', 'Gün içinde bırak', 'Bugün 3 kez dur ve pelvik tabanını, kalçanı, çeneni bilinçli olarak gevşet.', ['control', 'relax']),
    ('quick_control', '🎚️', '10 hızlı, tam bırak', '10 hızlı sıkma yap; her birinden sonra kasın tamamen bırakıldığını hisset.', ['control']),
    ('evening_breath', '🌙', 'Yatmadan nefes', 'Yatmadan önce 6 yavaş nefes: verirken pelvik tabanı yumuşakça bırak.', ['relax', 'control']),
    ('desk_release', '💻', 'Masa başında bırak', 'Uzun oturduysan kalk, omuzlarını ve kalçanı gevşet, 3 derin nefes al.', ['relax', 'all']),
    ('toilet_relax', '🚽', 'Tuvalette ıkınma', 'Tuvalette ıkınmadan, nefes vererek ve gevşeyerek boşaltmaya dikkat et.', ['relax', 'bladder']),
    ('stress_check', '😌', 'Stres anında kontrol', 'Gergin bir anda kalçanı ya da karnını sıkıp sıkmadığına bak; sıkıyorsan bırak.', ['relax', 'control']),
    ('shoe_tie', '👟', 'Ayakkabı bağlarken', 'Eğilmeden ya da ayakkabı bağlamadan önce kası hafifçe sık.', ['surgery', 'bladder', 'general']),
    ('get_out_bed', '🛏️', 'Yataktan kalkarken', 'Sabah yataktan kalkarken önce kası sık, sonra kalk.', ['surgery', 'bladder', 'all']),
]
TASKS = {
    'reviewed': False,
    'evidenceLevel': 'expert',
    'sourceIds': CLINICAL + ['miller1996_knack', 'dorey2004_uronurs'],
    'tasks': [{'id': i, 'emoji': e, 'title': t, 'text': x, 'tracks': tr} for i, e, t, x, tr in F],
}

# ---------------------------------------------------------------- self rating (spec §10) — the app's own simple questions,
# NOT licensed clinical scales (IIEF/SHIM, ICIQ…). 0–10 sliders, once a month.
def q(i, text, lo, hi, better='high'):
    return {'id': i, 'text': text, 'minLabel': lo, 'maxLabel': hi, 'better': better}
SELF_RATING = {
    'reviewed': False,
    'evidenceLevel': 'expert',
    'sourceIds': CLINICAL,
    'title': 'Aylık öz değerlendirme',
    'intro': 'Bu sorular uygulamanın kendi basit öz değerlendirme sorularıdır; lisanslı bir klinik ölçek veya tıbbi ölçüm değildir. Ayda bir yanıtla, kendi gidişatını gör.',
    'tracks': {
        'erection': [
            q('hardness', 'Sertleşmenin sertliğinden memnuniyetim', 'Hiç memnun değilim', 'Çok memnunum'),
            q('maintain', 'Sertleşmeyi sürdürmekten memnuniyetim', 'Hiç memnun değilim', 'Çok memnunum'),
            q('confidence', 'Kendime güvenim', 'Çok düşük', 'Çok yüksek'),
        ],
        'bladder': [
            q('dribble', 'Damlama sıklığı', 'Hiç olmuyor', 'Her seferinde', 'low'),
            q('control', 'Kontrol hissim', 'Hiç yok', 'Tam kontrol'),
        ],
        'surgery': [
            q('leak', 'İdrar kaçırma sıklığı', 'Hiç olmuyor', 'Çok sık', 'low'),
            q('control', 'Kontrol hissim', 'Hiç yok', 'Tam kontrol'),
            q('confidence', 'Günlük hayatta kendime güvenim', 'Çok düşük', 'Çok yüksek'),
        ],
        'control': [
            q('timing', 'Zamanlama üzerindeki kontrol hissim', 'Hiç yok', 'Tam kontrol'),
            q('awareness', 'Kası fark etme ve bırakabilme hissim', 'Hiç yok', 'Çok net'),
        ],
        'general': [
            q('control', 'Pelvik taban kasımı kontrol hissim', 'Hiç yok', 'Tam kontrol'),
            q('confidence', 'Kendime güvenim', 'Çok düşük', 'Çok yüksek'),
        ],
        'relax': [
            q('tension', 'Pelvik bölgede gerginlik veya rahatsızlık', 'Hiç yok', 'Çok fazla', 'low'),
            q('letgo', 'Kası bırakabilme hissim', 'Hiç yok', 'Çok net'),
        ],
    },
}

write('sources.json', SOURCES)
write('tracks.tr.json', TRACKS)
write('cues.tr.json', CUES)
write('positions.tr.json', POSITIONS)
write('screening.tr.json', SCREENING)
write('functional-tasks.tr.json', TASKS)
write('self-rating.tr.json', SELF_RATING)
