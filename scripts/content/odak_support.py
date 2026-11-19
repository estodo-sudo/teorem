"""Odak Kampı support screen, specialist summary, statistics and badges (imported by odak.py).

Original Turkish text, reviewed=false. Phone numbers carry lastVerified / needsVerification and must be
confirmed before release (Yeşilay 115 scope; MHRS 182 — the user approved adding it flagged for checking).
Neutral wording for anything that can be shared or shown outside the camp.
"""

SUPPORT = {
    "reviewed": False,
    "evidenceLevel": "guideline",
    "sourceIds": ["yedam", "briken2024"],
    "title": "Destek ve profesyonel yardım",
    "emergency": {"title": "Acil durumda 112", "text": "Kendine zarar verme düşüncelerin varsa ya da acil bir durumdaysan hemen 112'yi ara.", "phone": "112", "button": "112'yi ara"},
    "help": [
        {"id": "yedam", "emoji": "📞", "title": "Yeşilay Danışma Hattı 115 (YEDAM)", "text": "Bağımlılık alanında kişilere, yakınlarına ve bilgi almak isteyenlere ücretsiz danışmanlık verir; teknoloji bağımlılığı alanında da hizmet verir ve gerekirse il merkezinde randevu planlar. Bu konudaki başvuruların kapsamını hatta sorabilirsin.", "phone": "115", "button": "115'i ara", "lastVerified": "2026-11-18", "needsVerification": True},
        {"id": "mhrs", "emoji": "🏥", "title": "Psikiyatri randevusu (MHRS)", "text": "Psikiyatri polikliniğinden ya da bir klinik psikologdan randevu alabilirsin. Hastane randevuları için ALO 182 (MHRS) hattını arayabilir ya da MHRS / e-Nabız uygulamasını kullanabilirsin.", "phone": "182", "button": "182'yi ara", "lastVerified": "2026-11-18", "needsVerification": True},
    ],
    "expert": {"title": "Ne zaman uzmana başvurmalı?", "text": "Davranış işini, okulunu ya da ilişkilerini belirgin biçimde etkiliyorsa; uzun süredir kaygılı ya da çökkün hissediyorsan; ya da yalnız başa çıkmakta zorlanıyorsan bir uzmanla konuşmak iyi gelebilir."},
    "supporter": {
        "title": "Destekçine yaz",
        "desc": "Güvendiğin birine nötr bir mesaj gönder. Mesajlar ayrıntı içermez.",
        "templates": [
            "Şu an zor bir an yaşıyorum, konuşabilir miyiz?",
            "Bu akşam biraz yalnız hissediyorum, kısa bir yürüyüşe çıkalım mı?",
            "Bir hedef üzerinde çalışıyorum; ara sıra sana yazsam bana iyi gelir.",
        ],
        "share": "Gönder",
    },
    "summary": {
        "title": "Uzmana göster",
        "desc": "Dürtü ve kayma istatistiklerin, tarama sonuçların ve tetikleyicilerinden oluşan bir özet. Bu telefonda üretilir; nereye göndereceğine sen karar verirsin.",
        "privacy": "Özet dosyası şifresizdir. Yalnızca güvendiğin bir uzmanla, güvenli bir yoldan paylaş.",
        "button": "Özeti oluştur ve paylaş",
        "confirm": "Anladım, paylaş",
        "failed": "Özet oluşturulamadı. Yeniden deneyebilirsin.",
    },
}

SUMMARY = {
    "title": "Odak Kampı – kişisel özet",
    "subtitle": "Kullanıcının kendi kayıtlarından, cihazda üretilmiştir. Tanı aracı değildir.",
    "note": "Bu özet bir öz-yardım programındaki kayıtlara dayanır; klinik bir değerlendirme yerine geçmez. Tarama ölçeklerinin yorumu uzmana aittir.",
    "rows": {
        "date": "Özet tarihi",
        "day": "Program günü",
        "phase": "Aşama",
        "goal": "Hedef",
        "fitTotal": "Hedefe uygun toplam gün",
        "longest": "En uzun seri",
        "current": "Mevcut seri",
        "urges": "Kaydedilen dürtü anı (toplam)",
        "managed": "Yönetilen dürtü anı",
        "urgeIntensity": "Ortalama dürtü şiddeti (1–10)",
        "slipDays14": "Son 14 günde kayma günü",
        "slipDays30": "Son 30 günde kayma günü",
        "triggers": "En sık durumlar",
        "tools": "En çok işe yarayan araçlar",
        "bps": "Kısa Pornografi Taraması (BPS)",
        "phq2": "PHQ-2 (son ölçüm)",
        "gad2": "GAD-2 (son ölçüm)",
        "mood": "Ortalama ruh hali (son 14 gün, 1–5)",
        "sleep": "Ortalama uyku kalitesi (son 14 gün, 1–5)",
    },
    "none": "Kayıt yok",
    "dayN": "{n}. gün",
}

STATS = {
    "title": "İstatistikler",
    "calendarTitle": "Hedefe uygun günler",
    "calendarLegend": "Renkli: hedefe uygun · Gri: kayma ya da kayıt",
    "urgesTitle": "Dürtü anları (son 6 hafta)",
    "intensityTitle": "Ortalama dürtü şiddeti",
    "heatTitle": "Riskli saatler (gün × saat)",
    "heatEmpty": "Isı haritası için birkaç kayıt gerekiyor.",
    "triggersTitle": "En sık durumlar",
    "toolsTitle": "En çok işe yarayan araçlar",
    "emotionsTitle": "Önce ve sonra",
    "bpsTitle": "Kısa tarama ilerlemesi",
    "bpsNote": "Yalnızca kendi ilerlemeni görmen için; bilimsel bir değerlendirme değildir.",
    "managedTitle": "Yönettiğin dürtü anları",
    "none": "Henüz yeterli kayıt yok.",
    "weekShort": "{n}. hf",
    "days": ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    "hours": ["00", "03", "06", "09", "12", "15", "18", "21"],
}

BADGES = {
    "title": "Rozetler",
    "intro": "Her rozet, emeğinin bir kanıtı. Kazandığın rozetler bir kaymayla geri alınmaz.",
    "kicker": "Yeni rozet",
    "cta": "Devam",
    "items": [
        {"id": "days-1", "emoji": "🌱", "title": "İlk gün", "desc": "Hedefine uygun ilk günün."},
        {"id": "days-3", "emoji": "🌿", "title": "3 gün", "desc": "Hedefine uygun 3 gün."},
        {"id": "days-7", "emoji": "🍀", "title": "Bir hafta", "desc": "Hedefine uygun 7 gün."},
        {"id": "days-14", "emoji": "🌳", "title": "İki hafta", "desc": "Hedefine uygun 14 gün."},
        {"id": "days-30", "emoji": "🏔️", "title": "30 gün", "desc": "Hedefine uygun 30 gün."},
        {"id": "days-60", "emoji": "🌄", "title": "60 gün", "desc": "Hedefine uygun 60 gün."},
        {"id": "days-90", "emoji": "🌅", "title": "90 gün", "desc": "Hedefine uygun 90 gün."},
        {"id": "urges-10", "emoji": "🌊", "title": "10 dalga", "desc": "10 dürtü anını yönettin."},
        {"id": "urges-50", "emoji": "🏄", "title": "50 dalga", "desc": "50 dürtü anını yönettin."},
        {"id": "urges-100", "emoji": "🐬", "title": "100 dalga", "desc": "100 dürtü anını yönettin."},
        {"id": "first-plan", "emoji": "📝", "title": "İlk plan", "desc": "İlk Eğer–O zaman planını yaptın."},
        {"id": "boundaries", "emoji": "🧱", "title": "Sınırlar kuruldu", "desc": "Dijital sınırlarını kurdun."},
        {"id": "checkin-7", "emoji": "📅", "title": "7 gün kontrol", "desc": "7 gün kesintisiz günlük kontrol."},
        {"id": "all-skills", "emoji": "🎓", "title": "Tüm dersler", "desc": "16 beceri dersinin hepsini tamamladın."},
        {"id": "comeback", "emoji": "🔁", "title": "Geri dönüş", "desc": "Bir kaymadan sonra 7 gün devam ettin. Öz-şefkat işe yarıyor."},
        {"id": "graduate", "emoji": "🎖️", "title": "Mezuniyet", "desc": "90 günlük programı tamamladın."},
    ],
    "locked": "Henüz kazanılmadı",
}

METHOD = {
    "title": "Kaynaklar ve Yöntem",
    "intro": "Odak Kampı, problemli pornografi kullanımı ve kompulsif cinsel davranış üzerine yapılan araştırmalara dayanan bir öz-yardım programıdır. Tanı koymaz ve tedavinin yerine geçmez.",
    "methodTitle": "Yöntem",
    "method": [
        "Kabul ve Kararlılık Terapisi (ACT): dürtüyle savaşmak yerine davranışı değerlere göre seçmek.",
        "Bilişsel davranışçı yaklaşım (BDT): tetikleyici, düşünce, his ve davranış zincirini fark etmek.",
        "Kendini izleme, ortam düzenleme ve Eğer–O zaman planları.",
        "Kayma önleme: bir kaymayı utançla değil öğrenmeyle karşılamak.",
        "6 haftalık çekirdek program ve 90. güne kadar pekiştirme.",
    ],
    "evidenceTitle": "Kanıt düzeyleri",
    "levels": {
        "guideline": "Kılavuz / resmi tanım (ör. DSÖ ICD-11)",
        "rct": "Randomize kontrollü çalışma",
        "review": "Derleme ya da meta-analiz",
        "expert": "Uzman görüşü / genel öneri",
    },
    "reviewNote": "Tüm içerikler yayından önce bir klinik psikolog ya da psikiyatrist tarafından incelenecektir. İnceleme tamamlanana kadar içerikler “incelenmedi” olarak işaretlidir.",
    "sourcesTitle": "Kaynaklar",
    "usedIn": "{n} içerikte kullanıldı",
}
