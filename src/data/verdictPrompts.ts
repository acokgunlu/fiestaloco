import { VerdictQuestion } from '../types/partyGames';

export const VERDICT_QUESTIONS: VerdictQuestion[] = [
  {
    id: 'verdict_1',
    category: 'Vahşi Yaşam',
    question: "Issız bir adaya düşsek hayatta kalmak için aramızdan ilk kimi feda ederiz?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_2',
    category: 'Sosyal Skandallar',
    question: "Grupta yanlışlıkla bir tarikatın veya gizli bir örgütün lideri olma ihtimali en yüksek kişi kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_3',
    category: 'Aşk & Kaos',
    question: "Gece saat 03:00'te sarhoş olup eski sevgilisine 14 dakikalık ağlamaklı ses kaydı atacak kişi kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_4',
    category: 'Zenginlik & Para',
    question: "Piyangodan 100 milyon TL kazansa ertesi gün kimseye tek kelime etmeden ülkeyi terk edecek kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_5',
    category: 'Günlük Hayat',
    question: "Sırf bir tartışmayı haklı çıkarmak için Wikipedia'da sahte sayfa düzenleyecek kadar inatçı olan kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_6',
    category: 'Kaotik Enerji',
    question: "Gözaltına alınsa polisi de ikna edip kendini serbest bıraktıracak kadar şeytan tüyü olan kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_7',
    category: 'Dram & Gizem',
    question: "Kendi cenazesine gizlice kılık değiştirip katılıp insanların arkasından ne dediğini dinleyecek kişi kim?",
    spiceLevel: 'insane',
  },
  {
    id: 'verdict_8',
    category: 'Gelecek Planı',
    question: "10 yıl sonra bir sahil kasabasında yoga eğitmeni veya zeytinyağı üreticisi olarak karşımıza çıkacak kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_9',
    category: 'Panik Butonu',
    question: "Zombi kıyameti kopsa ilk 10 dakikada marketteki tüm abur cuburları yağmalayıp saklanacak kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_10',
    category: 'Dürüstlük Testi',
    question: "Bir sırrı 'asla kimseye söylemem' dedikten tam 4 dakika sonra başka birine fısıldayacak kişi kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_11',
    category: 'Sosyal Medya',
    question: "Gizli 'stalker' sahte hesabı olup herkesin eski sevgilisini 7/24 takip eden kişi kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_12',
    category: 'Aşk & Flört',
    question: "İlk buluşmada karşısındakini düğün hayallerine inandırıp ertesi gün ortadan kaybolacak kişi kim?",
    spiceLevel: 'insane',
  },
  {
    id: 'verdict_13',
    category: 'Para & Hesap',
    question: "Restoranda hesap gelince birden 'tuvalete gidiyorum' veya 'telefon çalıyor' numarası yapacak kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_14',
    category: 'Ego & Şöhret',
    question: "Survivor veya reality show'a katılsa adada ilk haftadan herkesle kavga edip konseyi birbirine katacak kişi kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_15',
    category: 'Grup Dedikodusu',
    question: "Grup mesajlaşmasını yanlışlıkla dedikodusu yapılan kişinin olduğu gruba atma potansiyeli en yüksek kim?",
    spiceLevel: 'insane',
  },
  {
    id: 'verdict_16',
    category: 'Arkadaşlık',
    question: "Acil bir durumda gece 04:00'te aransa telefonu açıp arabayla yardıma koşacak EN güvenilir kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_17',
    category: 'Kaotik Enerji',
    question: "Bir düğünde pastayı yanlışlıkla devirip suçu garsonun üstüne atacak kişi kim?",
    spiceLevel: 'spicy',
  },
  {
    id: 'verdict_18',
    category: 'Alışveriş Çılgınlığı',
    question: "Maaşının tamamını tek bir günde hiç ihtiyacı olmayan saçma bir teknolojik alete yatıracak kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_19',
    category: 'Aşk & İlişkiler',
    question: "Aşık olduğu kişinin burcuna ve doğum haritasına bakıp ayrılmaya karar verecek kişi kim?",
    spiceLevel: 'mild',
  },
  {
    id: 'verdict_20',
    category: 'Gizli Ajan',
    question: "Aslında aramızda çift taraflı ajan olup hepimizin sırlarını bir günah defterine yazan kişi kim?",
    spiceLevel: 'spicy',
  },
];

export function getRandomVerdictQuestion(excludeIds: string[] = []): VerdictQuestion {
  const available = VERDICT_QUESTIONS.filter((q) => !excludeIds.includes(q.id));
  if (available.length === 0) {
    return VERDICT_QUESTIONS[Math.floor(Math.random() * VERDICT_QUESTIONS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

