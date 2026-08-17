import { WordPair } from '../types';

export interface CategoryInfo {
  id: string;
  name: string;
  iconName: string;
  description: string;
  color: string;
  pairs: WordPair[];
}

export const VOCABULARY_LIST: WordPair[] = [
  // Animals & Creatures (Hayvanlar)
  { category: 'General', crewWord: 'Kedi (Cat)', imposterWord: '', hint: 'Evcil hayvan' },
  { category: 'General', crewWord: 'Köpek (Dog)', imposterWord: '', hint: 'Sadık dost' },
  { category: 'General', crewWord: 'Fil (Elephant)', imposterWord: '', hint: 'Hortumlu dev' },
  { category: 'General', crewWord: 'Zürafa (Giraffe)', imposterWord: '', hint: 'Uzun boyunlu' },
  { category: 'General', crewWord: 'Penguen (Penguin)', imposterWord: '', hint: 'Kutup kuşu' },
  { category: 'General', crewWord: 'Aslan (Lion)', imposterWord: '', hint: 'Ormanlar kralı' },
  { category: 'General', crewWord: 'Kaplan (Tiger)', imposterWord: '', hint: 'Çizgili yırtıcı' },
  { category: 'General', crewWord: 'Kartal (Eagle)', imposterWord: '', hint: 'Yükseklerde uçan avcı' },
  { category: 'General', crewWord: 'Baykuş (Owl)', imposterWord: '', hint: 'Gece kuşu' },
  { category: 'General', crewWord: 'Kurbağa (Frog)', imposterWord: '', hint: 'Zıplayan amfibi' },
  { category: 'General', crewWord: 'Kelebek (Butterfly)', imposterWord: '', hint: 'Renkli kanatlı' },
  { category: 'General', crewWord: 'Yunus (Dolphin)', imposterWord: '', hint: 'Sevimli deniz memelisi' },
  { category: 'General', crewWord: 'Köpekbalığı (Shark)', imposterWord: '', hint: 'Keskin dişli yüzgeç' },
  { category: 'General', crewWord: 'Ahtapot (Octopus)', imposterWord: '', hint: 'Sekiz kollu' },
  { category: 'General', crewWord: 'Kaplumbağa (Turtle)', imposterWord: '', hint: 'Kabuklu yavaş' },
  { category: 'General', crewWord: 'Yılan (Snake)', imposterWord: '', hint: 'Sürünen sürüngen' },
  { category: 'General', crewWord: 'Kanguru (Kangaroo)', imposterWord: '', hint: 'Keseli zıplayan' },
  { category: 'General', crewWord: 'Ayı (Bear)', imposterWord: '', hint: 'Büyük orman hayvanı' },
  { category: 'General', crewWord: 'Panda (Panda)', imposterWord: '', hint: 'Bambu seven siyah-beyaz' },
  { category: 'General', crewWord: 'Timsah (Crocodile)', imposterWord: '', hint: 'Nehir yırtıcısı' },
  { category: 'General', crewWord: 'At (Horse)', imposterWord: '', hint: 'Dört nala koşan' },
  { category: 'General', crewWord: 'Tavşan (Rabbit)', imposterWord: '', hint: 'Uzun kulaklı havuç seven' },
  { category: 'General', crewWord: 'Arı (Bee)', imposterWord: '', hint: 'Bal yapan iğneli' },
  { category: 'General', crewWord: 'Yarasa (Bat)', imposterWord: '', hint: 'Mağara uçucusu' },
  { category: 'General', crewWord: 'Deve (Camel)', imposterWord: '', hint: 'Hörgüçlü çöl hayvanı' },
  { category: 'General', crewWord: 'Örümcek (Spider)', imposterWord: '', hint: 'Sekiz bacaklı ağ ören' },
  { category: 'General', crewWord: 'Flamingo (Flamingo)', imposterWord: '', hint: 'Pembe uzun bacaklı' },
  { category: 'General', crewWord: 'Salyangoz (Snail)', imposterWord: '', hint: 'Sırtında evi olan' },
  { category: 'General', crewWord: 'Papağan (Parrot)', imposterWord: '', hint: 'Konuşan renkli kuş' },
  { category: 'General', crewWord: 'Sincap (Squirrel)', imposterWord: '', hint: 'Fındık toplayan' },

  // Food & Drinks (Yiyecek & İçecek)
  { category: 'General', crewWord: 'Pizza', imposterWord: '', hint: 'Dilimli İtalyan lezzeti' },
  { category: 'General', crewWord: 'Hamburger', imposterWord: '', hint: 'Köfteli ekmek' },
  { category: 'General', crewWord: 'Dondurma (Ice Cream)', imposterWord: '', hint: 'Külahlı soğuk tatlı' },
  { category: 'General', crewWord: 'Kahve (Coffee)', imposterWord: '', hint: 'Fincanda sıcak içecek' },
  { category: 'General', crewWord: 'Çay (Tea)', imposterWord: '', hint: 'İnce belli bardakta' },
  { category: 'General', crewWord: 'Karpuz (Watermelon)', imposterWord: '', hint: 'Kırmızı çekirdekli yaz meyvesi' },
  { category: 'General', crewWord: 'Muz (Banana)', imposterWord: '', hint: 'Sarı meyve' },
  { category: 'General', crewWord: 'Elma (Apple)', imposterWord: '', hint: 'Kırmızı veya yeşil meyve' },
  { category: 'General', crewWord: 'Çilek (Strawberry)', imposterWord: '', hint: 'Küçük kırmızı tatlı' },
  { category: 'General', crewWord: 'Makarna (Pasta)', imposterWord: '', hint: 'Soslu hamur yemeği' },
  { category: 'General', crewWord: 'Donut', imposterWord: '', hint: 'Ortası delik tatlı çörek' },
  { category: 'General', crewWord: 'Kruvasan (Croissant)', imposterWord: '', hint: 'Hilal şeklinde tereyağlı' },
  { category: 'General', crewWord: 'Patates Kızartması (Fries)', imposterWord: '', hint: 'Çıtır sarı dilimler' },
  { category: 'General', crewWord: 'Limon (Lemon)', imposterWord: '', hint: 'Ekşi sarı narenciye' },
  { category: 'General', crewWord: 'Sushi', imposterWord: '', hint: 'Yosuna sarılı pirinç' },
  { category: 'General', crewWord: 'Taco', imposterWord: '', hint: 'Meksika dürümü' },
  { category: 'General', crewWord: 'Çikolata (Chocolate)', imposterWord: '', hint: 'Kakaolu tatlı' },
  { category: 'General', crewWord: 'Pasta (Cake)', imposterWord: '', hint: 'Doğum günü tatlısı' },
  { category: 'General', crewWord: 'Mantar (Mushroom)', imposterWord: '', hint: 'Şapkalı bitki' },
  { category: 'General', crewWord: 'Peynir (Cheese)', imposterWord: '', hint: 'Delikli süt ürünü' },
  { category: 'General', crewWord: 'Yumurta (Egg)', imposterWord: '', hint: 'Tavuk ürünü kabuklu' },
  { category: 'General', crewWord: 'Avokado (Avocado)', imposterWord: '', hint: 'Yeşil çekirdekli meyve' },
  { category: 'General', crewWord: 'Havuç (Carrot)', imposterWord: '', hint: 'Turuncu kök sebze' },
  { category: 'General', crewWord: 'Mısır (Corn)', imposterWord: '', hint: 'Koçanlı sarı taneler' },
  { category: 'General', crewWord: 'Simit', imposterWord: '', hint: 'Susamlı çıtır halka' },

  // Everyday Objects & Tools (Günlük Eşyalar)
  { category: 'General', crewWord: 'Şemsiye (Umbrella)', imposterWord: '', hint: 'Yağmurdan koruyan' },
  { category: 'General', crewWord: 'Gözlük (Glasses)', imposterWord: '', hint: 'Göze takılan çerçeve' },
  { category: 'General', crewWord: 'Kol Saati (Watch)', imposterWord: '', hint: 'Bilekteki zaman göstergesi' },
  { category: 'General', crewWord: 'Anahtar (Key)', imposterWord: '', hint: 'Kilidi açan metal' },
  { category: 'General', crewWord: 'Makas (Scissors)', imposterWord: '', hint: 'İki bıçaklı kesici' },
  { category: 'General', crewWord: 'Diş Fırçası (Toothbrush)', imposterWord: '', hint: 'Ağız bakımı fırçası' },
  { category: 'General', crewWord: 'Mum (Candle)', imposterWord: '', hint: 'Fitilli aydınlatma' },
  { category: 'General', crewWord: 'Gitar (Guitar)', imposterWord: '', hint: 'Telli müzik aleti' },
  { category: 'General', crewWord: 'Sırt Çantası (Backpack)', imposterWord: '', hint: 'Sırta takılan çanta' },
  { category: 'General', crewWord: 'Çekiç (Hammer)', imposterWord: '', hint: 'Çivi çakan alet' },
  { category: 'General', crewWord: 'Akıllı Telefon (Smartphone)', imposterWord: '', hint: 'Dokunmatik ekranlı cihaz' },
  { category: 'General', crewWord: 'Kulaklık (Headphones)', imposterWord: '', hint: 'Müzik dinleme aleti' },
  { category: 'General', crewWord: 'Kitap (Book)', imposterWord: '', hint: 'Sayfalı okuma nesnesi' },
  { category: 'General', crewWord: 'Sandalye (Chair)', imposterWord: '', hint: 'Oturak' },
  { category: 'General', crewWord: 'Süpürge (Broom)', imposterWord: '', hint: 'Temizlik sapı' },
  { category: 'General', crewWord: 'Ayna (Mirror)', imposterWord: '', hint: 'Yansıma gösteren cam' },
  { category: 'General', crewWord: 'Şapka (Hat)', imposterWord: '', hint: 'Başa takılan giysi' },
  { category: 'General', crewWord: 'Tarak (Comb)', imposterWord: '', hint: 'Saç düzeltici' },
  { category: 'General', crewWord: 'Lamba (Lamp)', imposterWord: '', hint: 'Işık yayan abajur' },
  { category: 'General', crewWord: 'Bavul (Suitcase)', imposterWord: '', hint: 'Seyahat çantası tekerlekli' },
  { category: 'General', crewWord: 'Pusula (Compass)', imposterWord: '', hint: 'Yön gösteren ibre' },
  { category: 'General', crewWord: 'Teleskop (Telescope)', imposterWord: '', hint: 'Yıldızlara bakan tüp' },
  { category: 'General', crewWord: 'Tava (Frying Pan)', imposterWord: '', hint: 'Yemek pişirme kabı' },
  { category: 'General', crewWord: 'Kum Saati (Hourglass)', imposterWord: '', hint: 'Akan kum taneli sayaç' },
  { category: 'General', crewWord: 'Mikrofon (Microphone)', imposterWord: '', hint: 'Ses yükseltici' },

  // Vehicles & Transportation (Araçlar)
  { category: 'General', crewWord: 'Uçak (Airplane)', imposterWord: '', hint: 'Gökyüzü taşıtı kanatlı' },
  { category: 'General', crewWord: 'Bisiklet (Bicycle)', imposterWord: '', hint: 'Pedallı iki tekerlek' },
  { category: 'General', crewWord: 'Helikopter (Helicopter)', imposterWord: '', hint: 'Pervaneli uçan araç' },
  { category: 'General', crewWord: 'Gemi (Ship)', imposterWord: '', hint: 'Büyük deniz aracı' },
  { category: 'General', crewWord: 'Tren (Train)', imposterWord: '', hint: 'Raylarda giden vagonlar' },
  { category: 'General', crewWord: 'Roket (Rocket)', imposterWord: '', hint: 'Uzaya fırlatılan araç' },
  { category: 'General', crewWord: 'Kaykay (Skateboard)', imposterWord: '', hint: 'Tekerlekli tahta' },
  { category: 'General', crewWord: 'Sıcak Hava Balonu (Hot Air Balloon)', imposterWord: '', hint: 'Sepetli uçan dev balon' },
  { category: 'General', crewWord: 'Denizaltı (Submarine)', imposterWord: '', hint: 'Su altında giden araç' },
  { category: 'General', crewWord: 'Ambulans (Ambulance)', imposterWord: '', hint: 'Sirenli acil yardım aracı' },
  { category: 'General', crewWord: 'İtfaiye Aracı (Fire Truck)', imposterWord: '', hint: 'Merdivenli kırmızı yangın aracı' },
  { category: 'General', crewWord: 'Traktör (Tractor)', imposterWord: '', hint: 'Büyük tekerlekli tarla aracı' },
  { category: 'General', crewWord: 'Motosiklet (Motorcycle)', imposterWord: '', hint: 'Motorlu iki tekerlek' },
  { category: 'General', crewWord: 'Teleferik (Cable Car)', imposterWord: '', hint: 'Halatla dağa çıkan kabin' },

  // Places, Landmarks & Nature (Yerler & Doğa)
  { category: 'General', crewWord: 'Yanardağ (Volcano)', imposterWord: '', hint: 'Lav püskürten dağ' },
  { category: 'General', crewWord: 'Şelale (Waterfall)', imposterWord: '', hint: 'Yüksekten dökülen su' },
  { category: 'General', crewWord: 'Deniz Feneri (Lighthouse)', imposterWord: '', hint: 'Kıyıdaki ışıklı kule' },
  { category: 'General', crewWord: 'Piramit (Pyramid)', imposterWord: '', hint: 'Mısır anıtı üçgen taş' },
  { category: 'General', crewWord: 'Eyfel Kulesi (Eiffel Tower)', imposterWord: '', hint: 'Paris simgesi metal kule' },
  { category: 'General', crewWord: 'Ada (Island)', imposterWord: '', hint: 'Etrafı suyla çevrili kara' },
  { category: 'General', crewWord: 'Çöl (Desert)', imposterWord: '', hint: 'Kaktüslü kum tepeleri' },
  { category: 'General', crewWord: 'Kale (Castle)', imposterWord: '', hint: 'Burçlu taş surlar' },
  { category: 'General', crewWord: 'Rüzgar Gülü (Windmill)', imposterWord: '', hint: 'Dönen kanatlı değirmen' },
  { category: 'General', crewWord: 'Köprü (Bridge)', imposterWord: '', hint: 'İki yakayı bağlayan yol' },
  { category: 'General', crewWord: 'Çadır (Tent)', imposterWord: '', hint: 'Kamp barınağı' },
  { category: 'General', crewWord: 'Gökkuşağı (Rainbow)', imposterWord: '', hint: 'Yedi renkli gök kuşağı' },
  { category: 'General', crewWord: 'Kutup Işıkları (Aurora)', imposterWord: '', hint: 'Gökyüzü ışık dansı' },
  { category: 'General', crewWord: 'Mağara (Cave)', imposterWord: '', hint: 'Karanlık kaya oyuğu' },
  { category: 'General', crewWord: 'Buzdağı (Iceberg)', imposterWord: '', hint: 'Suda yüzen dev buz' },

  // Roles, Characters & Fantasy (Karakterler & Meslekler)
  { category: 'General', crewWord: 'Astronot (Astronaut)', imposterWord: '', hint: 'Kasklı uzay insanı' },
  { category: 'General', crewWord: 'Korsan (Pirate)', imposterWord: '', hint: 'Göz bantlı deniz haydudu' },
  { category: 'General', crewWord: 'Ejderha (Dragon)', imposterWord: '', hint: 'Ateş püskürten kanatlı canavar' },
  { category: 'General', crewWord: 'Sihirbaz (Wizard)', imposterWord: '', hint: 'Asalı şapkalı büyücü' },
  { category: 'General', crewWord: 'Robot (Robot)', imposterWord: '', hint: 'Metalik mekanik varlık' },
  { category: 'General', crewWord: 'Süper Kahraman (Superhero)', imposterWord: '', hint: 'Pelerinli maskeli kurtarıcı' },
  { category: 'General', crewWord: 'Hayalet (Ghost)', imposterWord: '', hint: 'Beyaz uçuşan varlık' },
  { category: 'General', crewWord: 'Uzaylı (Alien)', imposterWord: '', hint: 'UFO kullanan yeşil varlık' },
  { category: 'General', crewWord: 'Şövalye (Knight)', imposterWord: '', hint: 'Zırhlı kılıçlı savaşçı' },
  { category: 'General', crewWord: 'Denizkızı (Mermaid)', imposterWord: '', hint: 'Balık kuyruklu kadın' },
  { category: 'General', crewWord: 'Aşçı (Chef)', imposterWord: '', hint: 'Beyaz kasketli yemek ustası' },
  { category: 'General', crewWord: 'Kardan Adam (Snowman)', imposterWord: '', hint: 'Havuç burunlu kış figürü' },
  { category: 'General', crewWord: 'Dedektif (Detective)', imposterWord: '', hint: 'Büyüteçli gizem çözen' },
  { category: 'General', crewWord: 'Mumya (Mummy)', imposterWord: '', hint: 'Sargılı antik figür' },
  { category: 'General', crewWord: 'Vampir (Vampire)', imposterWord: '', hint: 'Sivri dişli pelerinli' },
  { category: 'General', crewWord: 'Kral / Kraliçe (Crown)', imposterWord: '', hint: 'Taç takan hükümdar' },

  // Sports & Fun (Spor & Eğlence)
  { category: 'General', crewWord: 'Futbol Topu (Soccer Ball)', imposterWord: '', hint: 'Siyah beyaz benekli meşin yuvarlak' },
  { category: 'General', crewWord: 'Basketbol Potası (Basketball)', imposterWord: '', hint: 'Fileli çember' },
  { category: 'General', crewWord: 'Tenis Raketi (Tennis Racket)', imposterWord: '', hint: 'Fileli vuruş aleti' },
  { category: 'General', crewWord: 'Boks Eldiveni (Boxing Glove)', imposterWord: '', hint: 'Kırmızı dolgulu yumruk eldiveni' },
  { category: 'General', crewWord: 'Uçurtma (Kite)', imposterWord: '', hint: 'Rüzgarda uçan kuyruklu nesne' },
  { category: 'General', crewWord: 'Bowling Lobutu (Bowling)', imposterWord: '', hint: 'Topla devrilen beyaz kuklalar' },
  { category: 'General', crewWord: 'Satranç Atı (Chess Knight)', imposterWord: '', hint: 'L şeklinde hareket eden taş' },
  { category: 'General', crewWord: 'Oyun Konsolu Kolu (Gamepad)', imposterWord: '', hint: 'Tuşlu oyun kumandası' },
  { category: 'General', crewWord: 'Dönme Dolap (Ferris Wheel)', imposterWord: '', hint: 'Lunapark çemberi kabinli' },
  { category: 'General', crewWord: 'Hazine Sandığı (Treasure Chest)', imposterWord: '', hint: 'Altın dolu kilitli sandık' },
];

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'general',
    name: 'Geniş Kelime Havuzu (All Words)',
    iconName: 'Sparkles',
    description: 'Tüm kategorilerden karışık zengin kelime havuzu',
    color: '#6366F1',
    pairs: VOCABULARY_LIST,
  },
];

export function getRandomWordPair(categoryId?: string): WordPair {
  const randomIndex = Math.floor(Math.random() * VOCABULARY_LIST.length);
  const selected = VOCABULARY_LIST[randomIndex] || VOCABULARY_LIST[0];

  // The imposter receives NO word and NO category clue (blind imposter),
  // ensuring no category leakage or misleading same-category clues!
  return {
    category: 'Gizli Kelime',
    crewWord: selected.crewWord,
    imposterWord: '',
    hint: selected.hint,
  };
}

export const DEFAULT_PLAYER_PALETTE = [
  { color: '#EF4444', name: 'Crimson Red', avatar: '🔴' },
  { color: '#3B82F6', name: 'Ocean Blue', avatar: '🔵' },
  { color: '#10B981', name: 'Emerald Green', avatar: '🟢' },
  { color: '#F59E0B', name: 'Amber Gold', avatar: '🟡' },
  { color: '#8B5CF6', name: 'Royal Purple', avatar: '🟣' },
  { color: '#EC4899', name: 'Neon Pink', avatar: '🌸' },
  { color: '#06B6D4', name: 'Cyan Aqua', avatar: '💎' },
  { color: '#F97316', name: 'Tangerine', avatar: '🟠' },
];
