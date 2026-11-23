# Ölçekler ve lisans durumu (Odak Kampı)

Bu dosya SPEC_ODAK_KAMPI 7.6 gereği tutulur. Bir ölçek, kullanım izni ve resmi Türkçe çevirisi teyit edilmeden uygulamada gerçek maddeleriyle gösterilmez.

| Ölçek | Kullanım | Madde / puan | Lisans | Türkçe çeviri | Durum |
| --- | --- | --- | --- | --- | --- |
| **Kısa öz değerlendirme** (BPS yerine, 2026-11-23) | Değerlendirme (Gün 0), tekrar 42 ve 90. gün | 5 özgün madde, son 6 ay, 0–2 puan (Hiç / Bazen / Sık sık), toplam 0–10; ≥4 uzman önerisi | Gerekmez (maddeler uygulamaya özgü, BPS çevirisi değil) | Doğrulanmış bir ölçek değildir; tanı koymaz | ✅ Kullanımda. BPS'nin resmi Türkçe çevirisi ve izni teyit edilmediği için yer tutucu kaldırıldı; içerikte kimlik `bps` olarak kaldı. `scripts/content/odak.py` yeniden çalıştırılırsa eski yer tutucuyu geri yazar, önce oradaki maddeler güncellenmeli. |
| **PHQ-2** (Kroenke, Spitzer, Williams, 2003) | Değerlendirme, ruh hali taraması | 2 madde, son 2 hafta, 0–3 puan, toplam 0–6; ≥3 uzman kartı | Kamu malı (Pfizer, izin gerekmez) | Resmi Türkçe PHQ çevirisi var | ⚠️ Metin, resmi Türkçe çeviriyle karşılaştırılıp onaylanmalı (kök soru "sen" diline uyarlandı). |
| **GAD-2** (Kroenke ve ark., 2007) | Değerlendirme, kaygı taraması | 2 madde, son 2 hafta, 0–3 puan, toplam 0–6; ≥3 uzman kartı | Kamu malı (Pfizer, izin gerekmez) | Resmi Türkçe GAD-7 çevirisi var | ⚠️ Metin, resmi Türkçe çeviriyle karşılaştırılıp onaylanmalı. |
| **SPKE-9** – Siber Pornografi Kullanım Envanteri-9 (Türkçe geçerlik, Bağımlılık Dergisi 2023) | Kullanılmıyor (yalnızca kaynak) | — | — | Türkçe geçerlik çalışması var | Kullanılmıyor. |

## Kurallar

- Tarama sonucu **tanı değildir**. Metin: "Yanıtların, kullanımının seni zorladığını gösteriyor olabilir. Bir uzmanla konuşmak faydalı olabilir."
- BPS gün 0, 42 ve 90'da yalnızca kullanıcının kendi ilerlemesini görmesi için uygulanır; bilimsel iddia yapılmaz.
- Yüksek PHQ-2 / GAD-2 skorunda nazik uzman kartı, 115 ve her zaman 112 gösterilir.

## Teyit kaydı

| Ölçek | Teyit eden | Tarih | Not |
| --- | --- | --- | --- |
| BPS | | | |
| PHQ-2 | | | |
| GAD-2 | | | |
