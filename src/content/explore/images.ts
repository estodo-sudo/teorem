/**
 * Keşfet image registry (SPEC_KESFET_V2 §5, §8): item key → bundled image, blurhash and Turkish alt text.
 * Keys are "<section>/<item id>". Images are trial photos (CC0 / public domain, see assets/images/explore/CREDITS.md);
 * every card falls back to a tone gradient with an icon when an item has no entry here.
 */
export interface ExploreImage {
  image: number;
  blurhash: string;
  alt: string;
  /** File size in bytes (for the size report / tests). */
  bytes: number;
}

export const EXPLORE_IMAGES: Record<string, ExploreImage> = {
  'stories/pf-basics': { image: require('../../../assets/images/explore/stories/pf-basics.webp'), blurhash: "LaRpg@O?xa%2%2f6R*bH}Z,@R*bb", alt: "Beyaz zeminde rulo yapılmış turkuaz bir yoga matı", bytes: 9712 },
  'stories/kegel-mistakes': { image: require('../../../assets/images/explore/stories/kegel-mistakes.webp'), blurhash: "L7E{kN~qWB_39Ft7Rjt7009FRj9F", alt: "Masada açık bir defter ve kalem", bytes: 10390 },
  'stories/erection-blood': { image: require('../../../assets/images/explore/stories/erection-blood.webp'), blurhash: "LAIX]Y8^TJ?G}]D+4nwJ00.8kW9G", alt: "Ahşap masada sebzeli bir salata kâsesi", bytes: 31576 },
  'stories/bladder-control': { image: require('../../../assets/images/explore/stories/bladder-control.webp'), blurhash: "L7I}@eV?-;~q90IT_3xv00D%-;Mx", alt: "Ağaçların arasından görünen sakin bir göl", bytes: 52546 },
  'stories/talk-partner': { image: require('../../../assets/images/explore/stories/talk-partner.webp'), blurhash: "LLK1g*W=4mxZ_4R*xva~9Gn~-;t8", alt: "Ahşap masada bir fincan kahve, not kâğıtları ve kalem", bytes: 51660 },
  'stories/performance-anxiety': { image: require('../../../assets/images/explore/stories/performance-anxiety.webp'), blurhash: "L3DT3F_ND*?b00D%xtM|00N_i_Rk", alt: "Akşam ışığında durgun deniz ve dalgakıran", bytes: 24266 },
  'stories/intimacy-beyond': { image: require('../../../assets/images/explore/stories/intimacy-beyond.webp'), blurhash: "LULp8OwJxGS~.AXPW.i_9]58I:t7", alt: "Gün batımında çiçek tutan bir elin silueti", bytes: 12342 },
  'stories/water': { image: require('../../../assets/images/explore/stories/water.webp'), blurhash: "LpGSMcaeRjoe~Bofazay$*jsj@j[", alt: "Bir yaprağın ucunda su damlası", bytes: 9076 },
  'stories/plate': { image: require('../../../assets/images/explore/stories/plate.webp'), blurhash: "LCL3rt07*0uO-StkV[i}.Tn356ai", alt: "Domates, salatalık ve brokoliyle hazırlanmış bir tabak", bytes: 40294 },
  'stories/alcohol': { image: require('../../../assets/images/explore/stories/alcohol.webp'), blurhash: "LbL4slM{-:xu~qj]V@oeD%j[RjWB", alt: "Desenli cam bir sürahide su", bytes: 19530 },
  'stories/sleep-hormones': { image: require('../../../assets/images/explore/stories/sleep-hormones.webp'), blurhash: "LEQS}5ozDh%L_3RiM|WA*0R4o#x]", alt: "Gün ışığı alan sade, beyaz bir yatak odası", bytes: 9252 },
  'stories/sleep-routine': { image: require('../../../assets/images/explore/stories/sleep-routine.webp'), blurhash: "LSNw1eo#4m?b~Wt6%MRj%M~Wt7jF", alt: "Masada bir fincan çay ve açık bir kitap", bytes: 9782 },
  'stories/night-bathroom': { image: require('../../../assets/images/explore/stories/night-bathroom.webp'), blurhash: "L6Ch$RR+03%1s.NH0#%00hs.}?NH", alt: "Karanlıkta yanan bir başucu lambası", bytes: 37940 },
  'stories/stress-body': { image: require('../../../assets/images/explore/stories/stress-body.webp'), blurhash: "LMG+K:0KRP-:00~pt6D*Mdxt%Moe", alt: "Üst üste dengelenmiş taşlar", bytes: 46528 },
  'stories/worry-time': { image: require('../../../assets/images/explore/stories/worry-time.webp'), blurhash: "LNHBo0-n4;0Mu6Ng$vawt7-ow[xu", alt: "Ahşap üzerine boyanmış bir kum saati", bytes: 68924 },
  'stories/mindfulness': { image: require('../../../assets/images/explore/stories/mindfulness.webp'), blurhash: "L$HLk|t8IUt7_NozRjog%hogayWV", alt: "Sonbaharda ağaçlarla çevrili bir park göleti", bytes: 81074 },
  'stories/move-more': { image: require('../../../assets/images/explore/stories/move-more.webp'), blurhash: "L38XFBD%00%M00%M~qWB4nxu-;IU", alt: "Ormandaki bir patikada sırtı dönük yürüyen iki kişi", bytes: 77836 },
  'stories/core-hips': { image: require('../../../assets/images/explore/stories/core-hips.webp'), blurhash: "LoK_E^9YD%a__4IUInWCWTogRkWB", alt: "Kıyıda kayaların üstünde yoga yapan bir kişi, uzaktan", bytes: 43680 },
  'stories/cycling': { image: require('../../../assets/images/explore/stories/cycling.webp'), blurhash: "LnHLo8adWBa}?wayWBfk5AbFoeoL", alt: "Tepelerin arasındaki yolda bisiklet süren biri, uzaktan", bytes: 22010 },
  'stories/smoking': { image: require('../../../assets/images/explore/stories/smoking.webp'), blurhash: "LsF%3=NIoLoglCR+oLbI58jFf6ay", alt: "Gün doğumunda geniş bir tarla ve açık gökyüzü", bytes: 41464 },
  'camps/smoking': { image: require('../../../assets/images/explore/camps/smoking.webp'), blurhash: "LnG*~MRjRkbI~qRjWBof~qM|WVof", alt: "Şafakta dağların ve sazlıkların yansıdığı bir göl", bytes: 34008 },
  'camps/odak': { image: require('../../../assets/images/explore/camps/odak.webp'), blurhash: "LjKLRC%N9ZM__4WCM|ozxuRjRjxu", alt: "Sisli bir gölün kıyısında iki çam ağacı", bytes: 20866 },
  'camps/alcohol': { image: require('../../../assets/images/explore/camps/alcohol.webp'), blurhash: "LWP@91$_-p-;~qt8-sD~xctTR:xu", alt: "Buzlu ve limonlu su dolu cam kavanozlar", bytes: 20252 },
  'programs/neck': { image: require('../../../assets/images/explore/programs/neck.webp'), blurhash: "LLGuq0o#~qj]?bozo#NID%WBt8NH", alt: "Pencere önünde ergonomik bir ofis koltuğu", bytes: 23458 },
  'programs/feet': { image: require('../../../assets/images/explore/programs/feet.webp'), blurhash: "L5I#Pr~VIr?a~VoeWXj[Ipayt7jZ", alt: "Kumda çıplak ayak izleri", bytes: 49340 },
  'programs/pf101': { image: require('../../../assets/images/explore/programs/pf101.webp'), blurhash: "LJSigW-;^~?b~qfkRkt5^}od9cRn", alt: "Beyaz zeminde iki lila yoga bloğu", bytes: 1842 },
  'programs/sexual-health': { image: require('../../../assets/images/explore/programs/sexual-health.webp'), blurhash: "L57-NRpI00-9XnjEi^X900xa~C9a", alt: "Koyu zeminde döküm bir çaydanlık ve fincan", bytes: 8274 },
  'programs/stress-sleep': { image: require('../../../assets/images/explore/programs/stress-sleep.webp'), blurhash: "LI854b8_Di_M%MRQRPx[Di%MxtD*", alt: "Bulutların arasında dolunay", bytes: 6106 },
  'programs/lifestyle': { image: require('../../../assets/images/explore/programs/lifestyle.webp'), blurhash: "LDH-_S004TxHE3~VRPIoMwD+?aaz", alt: "Meyve kâsesi olan aydınlık bir mutfak", bytes: 21168 },
  'programs/daily-life': { image: require('../../../assets/images/explore/programs/daily-life.webp'), blurhash: "LQI5A6~q%Log?c%Ms:IU_3oft7oL", alt: "Masada bir fincan kahve ve dizüstü bilgisayar", bytes: 16206 },
  'glossary/kegel': { image: require('../../../assets/images/explore/glossary/kegel.webp'), blurhash: "LUNw7YM{^*-:-:WB-pt6~p%LkCWB", alt: "Eski bir anatomi çiziminde leğen kemiği", bytes: 17480 },
  'glossary/premature-ejaculation': { image: require('../../../assets/images/explore/glossary/premature-ejaculation.webp'), blurhash: "LEDl+U~prw_2MyM|tQ%1IBaytQoe", alt: "Yeşil kumlu bir kum saati", bytes: 5294 },
  'glossary/erectile-dysfunction': { image: require('../../../assets/images/explore/glossary/erectile-dysfunction.webp'), blurhash: "LJOzMf%M-.%M~pj]Rlj[xZa#Rnof", alt: "Beyaz masada bir stetoskop", bytes: 4128 },
  'glossary/masturbation': { image: require('../../../assets/images/explore/glossary/masturbation.webp'), blurhash: "LBOyb5MH4Tvy_O%Ng*%LD4kXu5xu", alt: "Sarı duvarda beyaz, kapalı bir kapı", bytes: 3850 },
  'glossary/lasting-longer': { image: require('../../../assets/images/explore/glossary/lasting-longer.webp'), blurhash: "L9FN#T,.5Ro~}SAHE*Riwvs:-Us8", alt: "Bir saatin iç dişlileri", bytes: 21158 },
  'glossary/partner-satisfaction': { image: require('../../../assets/images/explore/glossary/partner-satisfaction.webp'), blurhash: "L8Hn]J}r00bv_34.x^$y8_EME1-;", alt: "Ahşap masada gri bir kupa", bytes: 6360 },
  'glossary/morning-erection': { image: require('../../../assets/images/explore/glossary/morning-erection.webp'), blurhash: "LnJkTCxC9FM|yZWCaJjEE1j[xuRj", alt: "Perdeden süzülen sabah güneşi", bytes: 7968 },
  'glossary/low-desire': { image: require('../../../assets/images/explore/glossary/low-desire.webp'), blurhash: "LjCZ|tIUMxae.TRiRiWAx^aKaeax", alt: "Yağmurlu bir pencere camı", bytes: 18486 },
  'glossary/dribble': { image: require('../../../assets/images/explore/glossary/dribble.webp'), blurhash: "LINA#QIn~W_2n#x[t6j[%2j?-;t7", alt: "Krom bir lavabo musluğu", bytes: 4226 },
  'glossary/tight-pelvic-floor': { image: require('../../../assets/images/explore/glossary/tight-pelvic-floor.webp'), blurhash: "L8CQiC},D$#S_4-SMzwJ4pM|xHRk", alt: "Asılı duran renkli halatlar", bytes: 34970 },
  'glossary/after-prostate-surgery': { image: require('../../../assets/images/explore/glossary/after-prostate-surgery.webp'), blurhash: "LFPsk205-;_204IW?Zxt03tA~p%M", alt: "Sarı bir not defteri ve kalem", bytes: 9588 },
  'glossary/level': { image: require('../../../assets/images/explore/glossary/level.webp'), blurhash: "L5FFsk%f_JNZ^zS[.7IoI-ajE0RS", alt: "Ormanda yukarı çıkan taş basamaklar", bytes: 39076 },
  'glossary/plan': { image: require('../../../assets/images/explore/glossary/plan.webp'), blurhash: "LQMtgg~qRjIT00%MWBIU00Rjf6kC", alt: "Masada beyaz bir saat, kalem ve defter", bytes: 2752 },
  'glossary/exercises': { image: require('../../../assets/images/explore/glossary/exercises.webp'), blurhash: "LlR3A-s.x]%f_Nf+RjWC%LWWMxM|", alt: "Ahşap zeminde mor spor ayakkabılar", bytes: 3564 },
  'glossary/vibration': { image: require('../../../assets/images/explore/glossary/vibration.webp'), blurhash: "LmG9Hv_4xuV?D$V?n$f6MxM{NGkC", alt: "Ahşap masada duran bir akıllı telefon", bytes: 7430 },
  'glossary/streak': { image: require('../../../assets/images/explore/glossary/streak.webp'), blurhash: "LOB3Wrt6E1Rk~Vs:IVR*ohn%R%j[", alt: "Karanlıkta yan yana yanan mumlar", bytes: 5870 },
  'glossary/strength-test': { image: require('../../../assets/images/explore/glossary/strength-test.webp'), blurhash: "LQEC,y2;?GX-xNOtr=S%GrrZnONa", alt: "Renkli mezuralar", bytes: 26912 },
  'glossary/discreet': { image: require('../../../assets/images/explore/glossary/discreet.webp'), blurhash: "LVCtB|oaIToy?^V@Mxt7R;ogjDoy", alt: "Pencereden görünen bahçe ve şemsiye", bytes: 20228 },
  'glossary/privacy': { image: require('../../../assets/images/explore/glossary/privacy.webp'), blurhash: "L8JREf8yE1u3lU.8D*Di?w~ow^n4", alt: "Bir çite takılmış asma kilitler", bytes: 10566 },
};

export const exploreImage = (section: 'stories' | 'camps' | 'programs' | 'glossary', id: string): ExploreImage | undefined => EXPLORE_IMAGES[`${section}/${id}`];
