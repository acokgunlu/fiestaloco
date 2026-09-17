/* OTOMATİK ÜRETİLDİ — scripts/buildWorldMap.ts. Elle düzenleme; betiği değiştirip yeniden çalıştır. */

export interface WorldTerritory {
  id: number;
  key: string;
  tr: string;
  en: string;
}

export const WORLD_TERRITORIES: WorldTerritory[] = [
  {
    "id": 1,
    "key": "kanada",
    "tr": "Kanada",
    "en": "Canada"
  },
  {
    "id": 2,
    "key": "abd",
    "tr": "ABD",
    "en": "USA"
  },
  {
    "id": 3,
    "key": "meksika",
    "tr": "Meksika",
    "en": "Mexico"
  },
  {
    "id": 4,
    "key": "gronland",
    "tr": "Grönland",
    "en": "Greenland"
  },
  {
    "id": 5,
    "key": "ortaamerika",
    "tr": "Orta Amerika",
    "en": "Central America"
  },
  {
    "id": 6,
    "key": "karayipler",
    "tr": "Karayipler",
    "en": "Caribbean"
  },
  {
    "id": 7,
    "key": "kolombiya",
    "tr": "Kolombiya–Ekvador",
    "en": "Colombia & Ecuador"
  },
  {
    "id": 8,
    "key": "venezuela",
    "tr": "Venezuela",
    "en": "Venezuela"
  },
  {
    "id": 9,
    "key": "guyanalar",
    "tr": "Guyanalar",
    "en": "The Guianas"
  },
  {
    "id": 10,
    "key": "peru",
    "tr": "Peru",
    "en": "Peru"
  },
  {
    "id": 11,
    "key": "bolivya",
    "tr": "Bolivya–Paraguay",
    "en": "Bolivia & Paraguay"
  },
  {
    "id": 12,
    "key": "brezilya",
    "tr": "Brezilya",
    "en": "Brazil"
  },
  {
    "id": 13,
    "key": "uruguay",
    "tr": "Uruguay",
    "en": "Uruguay"
  },
  {
    "id": 14,
    "key": "arjantin",
    "tr": "Arjantin",
    "en": "Argentina"
  },
  {
    "id": 15,
    "key": "sili",
    "tr": "Şili",
    "en": "Chile"
  },
  {
    "id": 16,
    "key": "izlanda",
    "tr": "İzlanda",
    "en": "Iceland"
  },
  {
    "id": 17,
    "key": "britanya",
    "tr": "Britanya ve İrlanda",
    "en": "UK & Ireland"
  },
  {
    "id": 18,
    "key": "iskandinavya",
    "tr": "İskandinavya",
    "en": "Nordics"
  },
  {
    "id": 19,
    "key": "baltik",
    "tr": "Baltık",
    "en": "Baltics"
  },
  {
    "id": 20,
    "key": "polonya",
    "tr": "Polonya",
    "en": "Poland"
  },
  {
    "id": 21,
    "key": "almanya",
    "tr": "Almanya",
    "en": "Germany"
  },
  {
    "id": 22,
    "key": "benelux",
    "tr": "Benelüks",
    "en": "Benelux"
  },
  {
    "id": 23,
    "key": "fransa",
    "tr": "Fransa",
    "en": "France"
  },
  {
    "id": 24,
    "key": "iberya",
    "tr": "İber Yarımadası",
    "en": "Iberia"
  },
  {
    "id": 25,
    "key": "italya",
    "tr": "İtalya",
    "en": "Italy"
  },
  {
    "id": 26,
    "key": "ortaavrupa",
    "tr": "Orta Avrupa",
    "en": "Central Europe"
  },
  {
    "id": 27,
    "key": "balkanlar",
    "tr": "Balkanlar",
    "en": "Balkans"
  },
  {
    "id": 28,
    "key": "yunanistan",
    "tr": "Yunanistan",
    "en": "Greece"
  },
  {
    "id": 29,
    "key": "romanya",
    "tr": "Romanya–Moldova",
    "en": "Romania & Moldova"
  },
  {
    "id": 30,
    "key": "ukrayna",
    "tr": "Ukrayna",
    "en": "Ukraine"
  },
  {
    "id": 31,
    "key": "belarus",
    "tr": "Belarus",
    "en": "Belarus"
  },
  {
    "id": 32,
    "key": "rusya",
    "tr": "Rusya",
    "en": "Russia"
  },
  {
    "id": 33,
    "key": "turkiye",
    "tr": "Türkiye",
    "en": "Türkiye"
  },
  {
    "id": 34,
    "key": "kafkasya",
    "tr": "Kafkasya",
    "en": "Caucasus"
  },
  {
    "id": 35,
    "key": "doguakdeniz",
    "tr": "Doğu Akdeniz",
    "en": "Levant"
  },
  {
    "id": 36,
    "key": "irak",
    "tr": "Irak",
    "en": "Iraq"
  },
  {
    "id": 37,
    "key": "iran",
    "tr": "İran",
    "en": "Iran"
  },
  {
    "id": 38,
    "key": "arabistan",
    "tr": "Arap Yarımadası",
    "en": "Arabia"
  },
  {
    "id": 39,
    "key": "yemen",
    "tr": "Yemen–Umman",
    "en": "Yemen & Oman"
  },
  {
    "id": 40,
    "key": "kazakistan",
    "tr": "Kazakistan",
    "en": "Kazakhstan"
  },
  {
    "id": 41,
    "key": "ortaasya",
    "tr": "Orta Asya",
    "en": "Central Asia"
  },
  {
    "id": 42,
    "key": "afganistan",
    "tr": "Afganistan",
    "en": "Afghanistan"
  },
  {
    "id": 43,
    "key": "pakistan",
    "tr": "Pakistan",
    "en": "Pakistan"
  },
  {
    "id": 44,
    "key": "hindistan",
    "tr": "Hindistan",
    "en": "India"
  },
  {
    "id": 45,
    "key": "nepal",
    "tr": "Nepal",
    "en": "Nepal"
  },
  {
    "id": 46,
    "key": "banglades",
    "tr": "Bangladeş",
    "en": "Bangladesh"
  },
  {
    "id": 47,
    "key": "cin",
    "tr": "Çin",
    "en": "China"
  },
  {
    "id": 48,
    "key": "mogolistan",
    "tr": "Moğolistan",
    "en": "Mongolia"
  },
  {
    "id": 49,
    "key": "kore",
    "tr": "Kore Yarımadası",
    "en": "Korea"
  },
  {
    "id": 50,
    "key": "japonya",
    "tr": "Japonya",
    "en": "Japan"
  },
  {
    "id": 51,
    "key": "myanmar",
    "tr": "Myanmar",
    "en": "Myanmar"
  },
  {
    "id": 52,
    "key": "tayland",
    "tr": "Tayland",
    "en": "Thailand"
  },
  {
    "id": 53,
    "key": "hindicini",
    "tr": "Hindiçini",
    "en": "Indochina"
  },
  {
    "id": 54,
    "key": "malezya",
    "tr": "Malezya",
    "en": "Malaysia"
  },
  {
    "id": 55,
    "key": "endonezya",
    "tr": "Endonezya",
    "en": "Indonesia"
  },
  {
    "id": 56,
    "key": "filipinler",
    "tr": "Filipinler",
    "en": "Philippines"
  },
  {
    "id": 57,
    "key": "avustralya",
    "tr": "Avustralya",
    "en": "Australia"
  },
  {
    "id": 58,
    "key": "yenizelanda",
    "tr": "Yeni Zelanda",
    "en": "New Zealand"
  },
  {
    "id": 59,
    "key": "papua",
    "tr": "Papua Yeni Gine",
    "en": "Papua New Guinea"
  },
  {
    "id": 60,
    "key": "fas",
    "tr": "Fas",
    "en": "Morocco"
  },
  {
    "id": 61,
    "key": "moritanya",
    "tr": "Batı Sahra–Moritanya",
    "en": "W. Sahara & Mauritania"
  },
  {
    "id": 62,
    "key": "cezayir",
    "tr": "Cezayir",
    "en": "Algeria"
  },
  {
    "id": 63,
    "key": "libya",
    "tr": "Libya–Tunus",
    "en": "Libya & Tunisia"
  },
  {
    "id": 64,
    "key": "misir",
    "tr": "Mısır",
    "en": "Egypt"
  },
  {
    "id": 65,
    "key": "mali",
    "tr": "Mali",
    "en": "Mali"
  },
  {
    "id": 66,
    "key": "nijer",
    "tr": "Nijer",
    "en": "Niger"
  },
  {
    "id": 67,
    "key": "cad",
    "tr": "Çad",
    "en": "Chad"
  },
  {
    "id": 68,
    "key": "sudan",
    "tr": "Sudan",
    "en": "Sudan"
  },
  {
    "id": 69,
    "key": "ortaafrika",
    "tr": "Orta Afrika",
    "en": "Central Africa"
  },
  {
    "id": 70,
    "key": "batiafrika",
    "tr": "Batı Afrika",
    "en": "West Africa"
  },
  {
    "id": 71,
    "key": "ginekorfezi",
    "tr": "Gine Körfezi",
    "en": "Gulf of Guinea"
  },
  {
    "id": 72,
    "key": "nijerya",
    "tr": "Nijerya",
    "en": "Nigeria"
  },
  {
    "id": 73,
    "key": "kamerun",
    "tr": "Kamerun–Gabon",
    "en": "Cameroon & Gabon"
  },
  {
    "id": 74,
    "key": "kongo",
    "tr": "Kongo DC",
    "en": "DR Congo"
  },
  {
    "id": 75,
    "key": "boynuz",
    "tr": "Afrika Boynuzu",
    "en": "Horn of Africa"
  },
  {
    "id": 76,
    "key": "doguafrika",
    "tr": "Doğu Afrika",
    "en": "East Africa"
  },
  {
    "id": 77,
    "key": "angola",
    "tr": "Angola",
    "en": "Angola"
  },
  {
    "id": 78,
    "key": "zambiya",
    "tr": "Zambiya–Zimbabve",
    "en": "Zambia & Zimbabwe"
  },
  {
    "id": 79,
    "key": "mozambik",
    "tr": "Mozambik–Malavi",
    "en": "Mozambique & Malawi"
  },
  {
    "id": 80,
    "key": "namibya",
    "tr": "Namibya–Botsvana",
    "en": "Namibia & Botswana"
  },
  {
    "id": 81,
    "key": "guneyafrika",
    "tr": "Güney Afrika",
    "en": "South Africa"
  },
  {
    "id": 82,
    "key": "madagaskar",
    "tr": "Madagaskar",
    "en": "Madagascar"
  }
];

/** Komşuluk: kara sınırı ya da deniz geçidi. Başka hiçbir bölgeye gidilemez. */
export const WORLD_NEIGHBORS: Record<number, number[]> = {"1":[2,4],"2":[1,3,6,32],"3":[2,5,6],"4":[1,16],"5":[3,7],"6":[2,3,8],"7":[5,8,10,12],"8":[6,7,9,12],"9":[8,12],"10":[7,11,12,15],"11":[10,12,14,15],"12":[7,8,9,10,11,13,14],"13":[12,14],"14":[11,12,13,15],"15":[10,11,14],"16":[4,17],"17":[16,18,23],"18":[17,19,21,32],"19":[18,20,31,32],"20":[19,21,26,30,31,32],"21":[18,20,22,23,26],"22":[21,23],"23":[17,21,22,24,25,26],"24":[23,60],"25":[23,26,28,63],"26":[20,21,23,25,27,29,30],"27":[26,28,29,33],"28":[25,27,33],"29":[26,27,30],"30":[20,26,29,31,32],"31":[19,20,30,32],"32":[2,18,19,20,30,31,34,40,47,48,49,50],"33":[27,28,34,35,36,37],"34":[32,33,37],"35":[33,36,38,64],"36":[33,35,37,38],"37":[33,34,36,38,41,42,43],"38":[35,36,37,39,64],"39":[38,75],"40":[32,41,47],"41":[37,40,42,47],"42":[37,41,43,47],"43":[37,42,44,47],"44":[43,45,46,47,51],"45":[44,47],"46":[44,51],"47":[32,40,41,42,43,44,45,48,49,51,53],"48":[32,47],"49":[32,47,50],"50":[32,49],"51":[44,46,47,52,53],"52":[51,53,54],"53":[47,51,52],"54":[52,55,56],"55":[54,56,57,59],"56":[54,55],"57":[55,58,59],"58":[57],"59":[55,57],"60":[24,61,62],"61":[60,62,65,70],"62":[60,61,63,65,66],"63":[25,62,64,66,67,68],"64":[35,38,63,68],"65":[61,62,66,70,71],"66":[62,63,65,67,71,72,73],"67":[63,66,68,69,73],"68":[63,64,67,69,75],"69":[67,68,73,74,75,76],"70":[61,65,71],"71":[65,66,70,72],"72":[66,71,73],"73":[66,67,69,72,74,77],"74":[69,73,76,77,78],"75":[39,68,69,76],"76":[69,74,75,78,79],"77":[73,74,78,80],"78":[74,76,77,79,80,81],"79":[76,78,81,82],"80":[77,78,81],"81":[78,79,80],"82":[79]};

/** Kara sınırı olmayan, deniz geçidiyle bağlı çiftler (haritada kesik çizgi). */
export const WORLD_SEA_LINKS: Array<[number, number]> = [[1,4],[4,16],[16,17],[17,23],[17,18],[18,19],[2,32],[2,6],[3,6],[6,8],[24,60],[25,63],[25,28],[64,38],[39,75],[38,37],[82,79],[50,49],[50,32],[56,54],[56,55],[55,57],[59,57],[57,58]];
