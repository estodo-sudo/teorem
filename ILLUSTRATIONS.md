# İllüstrasyon listesi (SPEC_UI_V3 §4.2)

Şu an uygulamadaki illüstrasyonlar **geometrik yer tutuculardır** (daire + çizgi). Bu liste bir illüstratöre ya da üretim aracına verilmek için hazırlandı.

## Ortak stil

- Sade, **iki tonlu çizgi illüstrasyon**: modül tonu + nötr gri. Yuvarlak uçlu, **2 px** çizgiler; dolgu yalnızca arkadaki yumuşak dairede (modül tonunun açık hali).
- İnsan figürü varsa **yüzsüz ve soyut** (baş = daire, gövde = yay).
- Kamp ve kriz illüstrasyonlarında **sigara, duman, alev, alkol şişesi veya cinsellik çağrıştıran öğe YOK**.
- Tuval **160×160** (görünen boyut 96–160 px). Arka plan saydam. Kenarlarda 8 px boşluk.
- Teslim: SVG, tek dosya, metin yok, `currentColor` kullanılmaz (renkler aşağıdaki rollerden).
- Renk rolleri (açık tema): `fg` = modül tonu, `soft` = tonun yumuşak zemini, `line` = nötr gri `#9AA0A6`. Koyu temada uygulama aynı rolleri koyu tonlarla boyar; bu yüzden **renkleri sabit kodlamadan, rollerle** çizin ya da üç renkli bir palet kullanın.

## Modül tonları

| Ton | fg | soft |
|---|---|---|
| `kegel` | `#1E6B66` | `#E2EFEC` |
| `mind` | `#5B7FB8` | `#E6EDF7` |
| `smokefree` | `#3B8DAE` | `#E2F0F5` |
| `focus` | `#6466C9` | `#E9E9F8` |
| `campus` | `#8A7A5C` | `#F1ECE3` |
| `knowledge` | `#7A6F9B` | `#EEEBF4` |

## Liste

| Ad | Ton | Nerede | İstenen | Yer tutucu |
|---|---|---|---|---|
| `onboarding-welcome` | `kegel` | Onboarding karşılama başlığı (7.9) | Sakin bir başlangıç: güneşin doğuşu gibi yükselen yay, ortada soyut ve yüzsüz bir figür. | `assets/illustrations/onboarding-welcome.svg` |
| `onboarding-goals` | `kegel` | Onboarding hedef seçimi başlığı | Üç iç içe halka (hedef) ve tek bir ince ok; rekabetçi değil, yönelim hissi. | `assets/illustrations/onboarding-goals.svg` |
| `onboarding-plan` | `kegel` | Onboarding "planın hazır" adımı | Basamak basamak yükselen noktalar ve onları birleştiren düz çizgi: 30 günlük yol. | `assets/illustrations/onboarding-plan.svg` |
| `empty-progress` | `kegel` | İlerleme ekranında veri yokken grafik boş durumu (7.6) | Üç kısa, boş çubuk ve kesik taban çizgisi; "yakında burada olacak" hissi. | `assets/illustrations/empty-progress.svg` |
| `empty-history` | `kegel` | Günlük / geçmiş listesi boşken | Açık bir defter sayfası: iki satır çizgisi ve bir kalem ucu. | `assets/illustrations/empty-history.svg` |
| `empty-trophies` | `kegel` | Henüz kupa yokken (7.11) | Boş bir altıgen madalyon çerçevesi ve etrafında yarım ilerleme halkası. | `assets/illustrations/empty-trophies.svg` |
| `session-complete` | `kegel` | Seans geri bildirimi üstü (7.5) | Kapanan halka ve içinde onay işareti; sakin kutlama, konfeti yok. | `assets/illustrations/session-complete.svg` |
| `paywall-hero` | `kegel` | Paywall üstü (7.10) — logo gelene kadar | İki yumuşak halka ve ortada yaprak; güven ve süreklilik. | `assets/illustrations/paywall-hero.svg` |
| `mind-breathing` | `mind` | Zihin araçları karşılama / nefes (7.12) | Genişleyen üç halka (nefes dalgası) ve ortada sabit bir nokta. | `assets/illustrations/mind-breathing.svg` |
| `camp-smokefree-welcome` | `smokefree` | Sigarasız Kamp karşılama (7.13) — sigara çağrıştırmaz | Açık hava: rüzgâr çizgileri ve yükselen güneş yayı. Sigara, duman, alev YOK. | `assets/illustrations/camp-smokefree-welcome.svg` |
| `camp-focus-welcome` | `focus` | Odak Kampı karşılama (7.13) — hassas çağrışım yok | Kademeli netleşen odak: dağınık noktalar ortadaki tek halkaya toplanıyor. | `assets/illustrations/camp-focus-welcome.svg` |
| `campus-welcome` | `campus` | Kampüs karşılama ekranları (7.14) | Basit bir kemer/kapı ve önünde yol; öğrenme yeri hissi. | `assets/illustrations/campus-welcome.svg` |

## Teknik not

- Uygulama SVG dosyasını doğrudan okumaz (svg-transformer kurulu değil). Gerçek illüstrasyonlar gelince her biri `src/components/illustrations/` altında `react-native-svg` bileşenine çevrilir ya da `shapes.json` içindeki şekil listesi değiştirilir.
- Yer tutucuların tek kaynağı `src/components/illustrations/shapes.json`; `assets/illustrations/*.svg` dosyaları ondan üretilir (açık tema renkleriyle).
- Kullanım: `<Illustration name="empty-progress" size={96} />`; `EmptyState` bileşeni `illustration` prop'u alır.
