"""Generates src/content/challenges.tr.json (≥60 daily challenges in 4 categories)."""
import json, os
C = {
 "physical": [
  "10 dakika yürüyüş yap", "Asansör yerine merdiveni kullan", "Her saat başı 2 dakika ayağa kalk ve esne",
  "20 squat yap", "Akşam yemeğinden sonra 15 dakika yürü", "Gün içinde 3 kez omuzlarını çevir ve boynunu esnet",
  "5 dakika kalça esnemesi yap", "Bugün 7.000 adımı hedefle", "Bir Kasık Fitness rutinini tamamla",
  "1 dakika plank dene (bölerek de olur)", "Telefonla konuşurken ayakta yürü", "Otururken dik dur ve sırtını dikleştir",
  "Yatmadan önce 5 dakika hafif esneme yap", "Bugün en az 30 dakika aktif ol", "Kısa mesafeye araç yerine yürüyerek git",
  "10 köprü (glute bridge) hareketi yap"
 ],
 "mental": [
  "1 dakika nefes egzersizi yap", "Bugün minnettar olduğun 3 şeyi yaz", "Yatmadan önce 15 dk ekransız kal",
  "Zihin Boşaltma aracını kullan", "5 dakika telefonsuz, sadece etrafını gözlemle", "Bugün bir şeyi yavaşça, fark ederek ye",
  "Beden taramasını dene", "Bugün kendine nazik bir cümle söyle", "Bildirimlerini 1 saat sessize al",
  "Bugünün en iyi anını not et", "Yarın için tek bir öncelik belirle", "Bir bilgi hikâyesi oku",
  "10 dakika kitap oku", "Bugün bir kez 'hayır' demeyi dene, gerekiyorsa", "Uyumadan önce 4-7-8 nefesini 3 tur yap",
  "Sosyal medyaya bugün 30 dakikadan az zaman ayır"
 ],
 "social": [
  "Bir arkadaşına mesaj at", "Sevdiğin birine teşekkür et", "Partnerinle 10 dakika telefonsuz sohbet et",
  "Uzun süredir konuşmadığın birini ara", "Bugün birine içten bir iltifat et", "Ailenden biriyle birlikte yemek ye",
  "Birine küçük bir iyilik yap", "Bir arkadaşınla yürüyüşe çık", "Partnerine bugün nasıl hissettiğini sor",
  "Bir komşuna ya da iş arkadaşına selam ver ve hâlini sor", "Birlikte gülebileceğin biriyle vakit geçir",
  "Sevdiğin birine sarıl", "Bir arkadaşına bir şarkı veya kitap öner", "Bugün birini gerçekten dinle, sözünü kesmeden",
  "Hafta sonu için biriyle küçük bir plan yap"
 ],
 "nutrition": [
  "Bugün 2 litre su iç", "Şekerli içecek içme", "Bir öğüne bir porsiyon sebze ekle",
  "Bugün bir avuç kuruyemiş ye", "Akşam yemeğini yatmadan en az 2 saat önce bitir", "Öğleden sonra kafeinsiz kal",
  "Bugün alkol içme", "Bir öğünde beyaz ekmek yerine tam tahıl seç", "Bugün 2 porsiyon meyve ye",
  "Tuzluğu masadan kaldır", "Paketli atıştırmalık yerine meyve seç", "Bugün balık veya baklagil içeren bir öğün ye",
  "Her öğünden önce bir bardak su iç", "Kızartma yerine fırın veya haşlama tercih et", "Bugün yavaş ye, her lokmayı iyice çiğne"
 ],
}
items = []
prefix = {"physical": "ph", "mental": "me", "social": "so", "nutrition": "nu"}
for cat, texts in C.items():
    for i, t in enumerate(texts, 1):
        items.append({"id": f"{prefix[cat]}{i:02d}", "category": cat, "text": t})
out = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content', 'challenges.tr.json')
json.dump(items, open(out, 'w'), ensure_ascii=False, indent=2)
print(len(items), 'challenges')
