import { ContentLang } from './contentLang';
import { INITIAL_TRIVIA_QUESTIONS_EN, INITIAL_TRIVIA_QUESTIONS_TR } from './triviaPursuitQuestions';
import type { TriviaCategory } from '../types/triviaPursuit';

/**
 * ORTAK SORU BANKASI — Kale Kuşatması ve Cihan Fatihi
 * ==================================================
 * Her turun başında oyunculara 3 kategori sunuluyor, en çok oyu alan
 * kategoriden soru geliyor. Bilgi Kalesi'nin 6 kategorisi olduğu gibi
 * kullanılıyor (sorular TEK kaynaktan geliyor, kopyalanmıyor); üzerine dört
 * yeni kategori ekleniyor.
 *
 * Doğru cevap istemciye soru sırasında GİTMİYOR: sunucu soruyu çekerken
 * şıkları karıştırıyor, doğru şıkkın sırasını kendinde tutuyor ve yalnızca
 * açıklama anında yayınlıyor.
 */

export type QuizCategoryId =
  | 'genel'
  | 'film'
  | 'seksenler'
  | 'sanattarihi'
  | 'cografya'
  | 'tarih'
  | 'bilim'
  | 'edebiyat'
  | 'spor'
  | 'popkultur';

export interface QuizCategoryMeta {
  id: QuizCategoryId;
  tr: string;
  en: string;
  /** Kategori çipinin rengi (Sticker paleti). */
  color: string;
}

export const QUIZ_CATEGORIES: QuizCategoryMeta[] = [
  { id: 'genel',       tr: 'Genel Kültür',     en: 'General Knowledge',  color: '#ffd93d' },
  { id: 'film',        tr: 'Film Yıldızları',  en: 'Movie Stars',        color: '#ff6b6b' },
  { id: 'seksenler',   tr: "80'ler",           en: "The '80s",           color: '#ff5d8f' },
  { id: 'sanattarihi', tr: 'Sanat Tarihi',     en: 'Art History',        color: '#b892ff' },
  { id: 'cografya',    tr: 'Coğrafya',         en: 'Geography',          color: '#4cc9f0' },
  { id: 'tarih',       tr: 'Tarih',            en: 'History',            color: '#ff9f43' },
  { id: 'bilim',       tr: 'Bilim',            en: 'Science',            color: '#7bd389' },
  { id: 'edebiyat',    tr: 'Sanat & Edebiyat', en: 'Arts & Literature',  color: '#ff8fab' },
  { id: 'spor',        tr: 'Spor',             en: 'Sports',             color: '#a3e635' },
  { id: 'popkultur',   tr: 'Pop Kültür',       en: 'Pop Culture',        color: '#7ad7f0' },
];

const CATEGORY_IDS = QUIZ_CATEGORIES.map((c) => c.id);

export function isQuizCategory(value: unknown): value is QuizCategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as string[]).includes(value);
}

export function quizCategoryMeta(id: QuizCategoryId): QuizCategoryMeta {
  return QUIZ_CATEGORIES.find((c) => c.id === id) ?? QUIZ_CATEGORIES[0];
}

export function quizCategoryLabel(id: QuizCategoryId, lang: ContentLang): string {
  const meta = quizCategoryMeta(id);
  return lang === 'en' ? meta.en : meta.tr;
}

/** Oyuna giden soru: şıklar karıştırılmış, `c` doğru şıkkın sırası. */
export interface QuizQuestion {
  id: string;
  category: QuizCategoryId;
  q: string;
  o: string[];
  c: number;
  fact?: string;
}

/** [soru, doğru, yanlış, yanlış, yanlış, ilginç bilgi?] — doğru cevap HEP ikinci sırada yazılıyor, çekilirken karışıyor. */
type Row = [string, string, string, string, string, string?];

const NEW_TR: Record<'genel' | 'film' | 'seksenler' | 'sanattarihi', Row[]> = {
  genel: [
    ["Periyodik tabloda 'Fe' simgesi hangi elementi gösterir?", 'Demir', 'Flor', 'Fosfor', 'Fermiyum', "Latince 'ferrum' kelimesinden geliyor."],
    ['Bir günde kaç saniye vardır?', '86.400', '64.800', '72.000', '96.400', '24 × 60 × 60 = 86.400.'],
    ['Olimpiyat bayrağında kaç halka vardır?', '5', '4', '6', '7', 'Beş halka beş kıtayı temsil ediyor.'],
    ["İstiklal Marşı'nın şairi kimdir?", 'Mehmet Akif Ersoy', 'Namık Kemal', 'Yahya Kemal Beyatlı', 'Tevfik Fikret', 'Marş 12 Mart 1921’de kabul edildi.'],
    ['Nobel Barış Ödülü hangi şehirde verilir?', 'Oslo', 'Stockholm', 'Kopenhag', 'Helsinki', 'Diğer Nobel ödülleri Stockholm’de veriliyor; Barış ödülü Oslo’da.'],
    ["Wolfgang Amadeus Mozart hangi şehirde doğmuştur?", 'Salzburg', 'Viyana', 'Münih', 'Prag', 'Mozart 1756’da Salzburg’da doğdu.'],
    ['Bir yılda kaç hafta vardır?', '52', '48', '50', '54', '365 gün yaklaşık 52 hafta 1 gün ediyor.'],
    ['Gökkuşağında geleneksel olarak kaç renk sayılır?', '7', '5', '6', '8', 'Kırmızıdan mora yedi renk sayma geleneği Newton’dan kalıyor.'],
    ['Devenin hörgücünde ne depolanır?', 'Yağ', 'Su', 'Kan', 'Hava', 'Hörgüç su değil yağ deposu; gerekince enerjiye çevriliyor.'],
    ['İnsan kalbinde kaç odacık vardır?', '4', '2', '3', '6', 'İki kulakçık, iki karıncık.'],
    ['Deniz seviyesinde saf su kaç derecede kaynar?', '100 °C', '90 °C', '110 °C', '120 °C', 'Yükseklere çıktıkça kaynama noktası düşüyor.'],
    ["Hangi gezegen 'Kızıl Gezegen' olarak bilinir?", 'Mars', 'Venüs', 'Merkür', 'Satürn', 'Rengini yüzeydeki demir oksitten alıyor.'],
    ['Ana dil olarak en çok konuşulan dil hangisidir?', 'Çince (Mandarin)', 'İngilizce', 'İspanyolca', 'Hintçe', 'İngilizce toplam konuşurda öne geçse de ana dil sıralamasında Mandarin önde.'],
    ['Maraton koşusu yaklaşık kaç kilometredir?', '42', '38', '45', '50', 'Resmi mesafe 42,195 km.'],
    ['Standart bir piyanoda kaç tuş bulunur?', '88', '76', '96', '104', '52 beyaz, 36 siyah tuş.'],
    ["Dünya'ya en yakın yıldız hangisidir?", 'Güneş', 'Proxima Centauri', 'Sirius', 'Vega', 'Güneş’ten sonra en yakını Proxima Centauri.'],
  ],
  film: [
    ["'Titanik' (1997) filminde Jack'i kim canlandırmıştır?", 'Leonardo DiCaprio', 'Brad Pitt', 'Matt Damon', 'Johnny Depp'],
    ["'Terminatör' filmlerindeki T-800 robotunu kim canlandırmıştır?", 'Arnold Schwarzenegger', 'Sylvester Stallone', 'Bruce Willis', 'Jean-Claude Van Damme'],
    ["Kemal Sunal'ın 'Hababam Sınıfı' filmlerinde canlandırdığı karakter kimdir?", 'İnek Şaban', 'Güdük Necmi', 'Tulum Hayri', 'Hayta İsmail'],
    ["'Babam ve Oğlum' (2005) filminde baba Hüseyin Efendi'yi kim canlandırmıştır?", 'Çetin Tekindor', 'Fikret Kuşkan', 'Haluk Bilginer', 'Tarık Akan'],
    ["'Kara Şövalye' (2008) filmindeki Joker rolüyle ölümünden sonra Oscar kazanan oyuncu kimdir?", 'Heath Ledger', 'Jack Nicholson', 'Joaquin Phoenix', 'Jared Leto'],
    ["'G.O.R.A.' filminde halı satıcısı Arif'i kim canlandırmıştır?", 'Cem Yılmaz', 'Şahan Gökbakar', 'Tolga Çevik', 'Ata Demirer'],
    ["Yeşilçam'ın 'Kara Murat' filmlerinde başrolü kim oynamıştır?", 'Cüneyt Arkın', 'Kartal Tibet', 'Tarık Akan', 'Serdar Gökhan'],
    ["Yeşilçam'da 'Karaoğlan' karakterini canlandıran oyuncu kimdir?", 'Kartal Tibet', 'Cüneyt Arkın', 'Yılmaz Güney', 'Ekrem Bora'],
    ["'Sultan' lakabıyla anılan Yeşilçam yıldızı kimdir?", 'Türkan Şoray', 'Hülya Koçyiğit', 'Fatma Girik', 'Filiz Akın'],
    ["'Forrest Gump' (1994) filminin başrol oyuncusu kimdir?", 'Tom Hanks', 'Kevin Costner', 'Robin Williams', 'Tom Cruise'],
    ["'Kuzuların Sessizliği' filminde Hannibal Lecter'ı kim canlandırmıştır?", 'Anthony Hopkins', 'Gary Oldman', 'Ralph Fiennes', 'Christopher Walken'],
    ["'Pretty Woman' (1990) filminin kadın başrol oyuncusu kimdir?", 'Julia Roberts', 'Meg Ryan', 'Sandra Bullock', 'Demi Moore'],
    ["'Indiana Jones' karakterini kim canlandırmıştır?", 'Harrison Ford', 'Kevin Costner', 'Mel Gibson', 'Michael Douglas'],
    ['En çok başrol Oscarı kazanan oyuncu kimdir (4 ödül)?', 'Katharine Hepburn', 'Meryl Streep', 'Bette Davis', 'Ingrid Bergman', 'Meryl Streep 3 oyunculuk Oscarı ile onu takip ediyor.'],
    ["'Eşkıya' (1996) filminde Baran'ı kim canlandırmıştır?", 'Şener Şen', 'Uğur Yücel', 'Tuncel Kurtiz', 'Kadir İnanır'],
    ["'Gladyatör' (2000) filminde Maximus'u kim canlandırmıştır?", 'Russell Crowe', 'Joaquin Phoenix', 'Gerard Butler', 'Hugh Jackman'],
  ],
  seksenler: [
    ['Pac-Man oyunu ilk kez hangi yıl çıktı?', '1980', '1978', '1983', '1985', 'Japonya’da Namco imzasıyla çıktı.'],
    ['Çernobil nükleer kazası hangi yıl yaşandı?', '1986', '1984', '1988', '1982'],
    ["1985'teki 'Live Aid' konserlerini düzenleyen müzisyen kimdir?", 'Bob Geldof', 'Bono', 'Sting', 'Freddie Mercury', 'Midge Ure ile birlikte düzenledi.'],
    ["'Geleceğe Dönüş' serisinin ilk filmi hangi yıl vizyona girdi?", '1985', '1983', '1987', '1989'],
    ["80'lerin simgesi taşınabilir kaset çalar 'Walkman' hangi markanındır?", 'Sony', 'Panasonic', 'Philips', 'Toshiba'],
    ['Challenger uzay mekiği faciası hangi yıl yaşandı?', '1986', '1984', '1988', '1990'],
    ["Barış Manço'nun '7'den 77'ye' programı hangi yıl yayına başladı?", '1988', '1982', '1992', '1985'],
    ["MFÖ 1985 Eurovision'da hangi şarkıyla yarıştı?", 'Diday Diday Day', 'Sufi', 'Ele Güne Karşı', 'Bodrum Bodrum', "MFÖ 1988'de de 'Sufi' ile katıldı."],
    ['MTV müzik kanalı yayına hangi yıl başladı?', '1981', '1979', '1984', '1986', "İlk yayınlanan klip: 'Video Killed the Radio Star'."],
    ["Tetris'i tasarlayan kişi kimdir?", 'Alexey Pajitnov', 'Shigeru Miyamoto', 'Hideo Kojima', 'Nolan Bushnell', '1984’te Moskova’da tasarlandı.'],
    ["'E.T.' (1982) filminin yönetmeni kimdir?", 'Steven Spielberg', 'George Lucas', 'James Cameron', 'Ridley Scott'],
    ["Rubik Küpü'nü icat eden Ernő Rubik hangi ülkedendir?", 'Macaristan', 'Çekya', 'Polonya', 'Avusturya', "Küp 80'lerde dünya çapında çılgınlığa dönüştü."],
    ["Nintendo'nun 1989'da çıkardığı el konsolu hangisidir?", 'Game Boy', 'Game Gear', 'Atari Lynx', 'Neo Geo Pocket'],
    ["'Hayalet Avcıları' (Ghostbusters) filmi hangi yıl vizyona girdi?", '1984', '1982', '1986', '1988'],
    ["Maradona 'Tanrı'nın Eli' golünü hangi Dünya Kupası'nda attı?", '1986 Meksika', '1982 İspanya', '1990 İtalya', '1978 Arjantin', 'Aynı maçta "yüzyılın golü"nü de attı.'],
  ],
  sanattarihi: [
    ['Sistine Şapeli’nin tavan fresklerini kim yapmıştır?', 'Michelangelo', 'Raffaello', 'Leonardo da Vinci', 'Botticelli', 'Tavanı 1508–1512 arasında boyadı.'],
    ["'Guernica' tablosu kimin eseridir?", 'Pablo Picasso', 'Salvador Dalí', 'Joan Miró', 'Francisco Goya', 'İspanya İç Savaşı’ndaki bombardımanı anlatıyor.'],
    ['Picasso ile birlikte Kübizm akımının kurucusu sayılan ressam kimdir?', 'Georges Braque', 'Henri Matisse', 'Paul Cézanne', 'Marcel Duchamp'],
    ["'Kaplumbağa Terbiyecisi' tablosunun ressamı kimdir?", 'Osman Hamdi Bey', 'Şeker Ahmet Paşa', 'İbrahim Çallı', 'Fikret Mualla', 'Tablo Pera Müzesi’nde sergileniyor.'],
    ["Empresyonizme adını veren 'İzlenim, Gün Doğumu' tablosu kimindir?", 'Claude Monet', 'Édouard Manet', 'Edgar Degas', 'Pierre-Auguste Renoir'],
    ["'Çığlık' tablosunun ressamı kimdir?", 'Edvard Munch', 'Gustav Klimt', 'Egon Schiele', 'Wassily Kandinsky'],
    ["'İnci Küpeli Kız' tablosu kimin eseridir?", 'Johannes Vermeer', 'Rembrandt', 'Frans Hals', 'Jan van Eyck'],
    ["'Venüs'ün Doğuşu' tablosunun ressamı kimdir?", 'Sandro Botticelli', 'Tiziano', 'Caravaggio', 'Raffaello'],
    ['Campbell çorba kutularıyla Pop Art’ın simgesi olan sanatçı kimdir?', 'Andy Warhol', 'Roy Lichtenstein', 'Keith Haring', 'Jean-Michel Basquiat'],
    ["Mimar Sinan'ın 'ustalık eserim' dediği cami hangisidir?", 'Selimiye Camii', 'Süleymaniye Camii', 'Şehzade Camii', 'Sultanahmet Camii', "Süleymaniye'yi 'kalfalık', Şehzade'yi 'çıraklık' eseri sayar."],
    ['Rönesans hangi şehirde doğmuştur?', 'Floransa', 'Venedik', 'Roma', 'Paris'],
    ['Ressam Frida Kahlo hangi ülkedendir?', 'Meksika', 'İspanya', 'Arjantin', 'Küba'],
    ["'Gece Devriyesi' tablosu kimin eseridir?", 'Rembrandt', 'Johannes Vermeer', 'Peter Paul Rubens', 'Anthony van Dyck'],
    ["Altın varaklı 'Öpücük' tablosunun ressamı kimdir?", 'Gustav Klimt', 'Egon Schiele', 'Edvard Munch', 'Alfons Mucha'],
    ["'Dünyevi Zevkler Bahçesi' triptiği kimin eseridir?", 'Hieronymus Bosch', 'Pieter Bruegel', 'Albrecht Dürer', 'Jan van Eyck'],
    ["Barselona'daki Sagrada Família'nın mimarı kimdir?", 'Antoni Gaudí', 'Le Corbusier', 'Frank Gehry', 'Santiago Calatrava', 'İnşaatı 1882’den beri sürüyor.'],
  ],
};

const NEW_EN: Record<'genel' | 'film' | 'seksenler' | 'sanattarihi', Row[]> = {
  genel: [
    ["Which element has the chemical symbol 'Fe'?", 'Iron', 'Fluorine', 'Phosphorus', 'Fermium', "It comes from the Latin 'ferrum'."],
    ['How many seconds are there in a day?', '86,400', '64,800', '72,000', '96,400', '24 × 60 × 60 = 86,400.'],
    ['How many rings are on the Olympic flag?', '5', '4', '6', '7', 'The five rings stand for five continents.'],
    ["Which country's national anthem is 'La Marseillaise'?", 'France', 'Belgium', 'Canada', 'Switzerland'],
    ['In which city is the Nobel Peace Prize awarded?', 'Oslo', 'Stockholm', 'Copenhagen', 'Helsinki', 'The other Nobel Prizes are awarded in Stockholm.'],
    ['In which city was Wolfgang Amadeus Mozart born?', 'Salzburg', 'Vienna', 'Munich', 'Prague', 'He was born there in 1756.'],
    ['How many weeks are there in a year?', '52', '48', '50', '54', '365 days is about 52 weeks and 1 day.'],
    ['How many colours are traditionally counted in a rainbow?', '7', '5', '6', '8', 'The seven-colour tradition goes back to Newton.'],
    ["What does a camel store in its hump?", 'Fat', 'Water', 'Blood', 'Air', 'The hump is a fat store that can be turned into energy.'],
    ['How many chambers does the human heart have?', '4', '2', '3', '6', 'Two atria and two ventricles.'],
    ['At sea level, pure water boils at what temperature?', '100 °C', '90 °C', '110 °C', '120 °C', 'The boiling point drops at higher altitudes.'],
    ["Which planet is known as the 'Red Planet'?", 'Mars', 'Venus', 'Mercury', 'Saturn', 'Iron oxide on its surface gives it the colour.'],
    ['Which language has the most native speakers?', 'Mandarin Chinese', 'English', 'Spanish', 'Hindi', 'English leads in total speakers, Mandarin in native speakers.'],
    ['Roughly how many kilometres is a marathon?', '42', '38', '45', '50', 'The official distance is 42.195 km.'],
    ['How many keys does a standard piano have?', '88', '76', '96', '104', '52 white keys and 36 black keys.'],
    ['What is the closest star to Earth?', 'The Sun', 'Proxima Centauri', 'Sirius', 'Vega', 'After the Sun, the closest is Proxima Centauri.'],
  ],
  film: [
    ["Who played Jack in 'Titanic' (1997)?", 'Leonardo DiCaprio', 'Brad Pitt', 'Matt Damon', 'Johnny Depp'],
    ["Who played the T-800 in the 'Terminator' films?", 'Arnold Schwarzenegger', 'Sylvester Stallone', 'Bruce Willis', 'Jean-Claude Van Damme'],
    ["Who played Holly Golightly in 'Breakfast at Tiffany's'?", 'Audrey Hepburn', 'Grace Kelly', 'Marilyn Monroe', 'Elizabeth Taylor'],
    ["Who played Vito Corleone in 'The Godfather' (1972)?", 'Marlon Brando', 'Al Pacino', 'Robert De Niro', 'James Caan'],
    ["Who won a posthumous Oscar for playing the Joker in 'The Dark Knight' (2008)?", 'Heath Ledger', 'Jack Nicholson', 'Joaquin Phoenix', 'Jared Leto'],
    ["Who starred as Neo in 'The Matrix'?", 'Keanu Reeves', 'Tom Cruise', 'Will Smith', 'Brad Pitt'],
    ["Who played Captain Jack Sparrow in 'Pirates of the Caribbean'?", 'Johnny Depp', 'Orlando Bloom', 'Jude Law', 'Hugh Grant'],
    ['Who was the first actor to play James Bond in the official film series?', 'Sean Connery', 'Roger Moore', 'George Lazenby', 'David Niven'],
    ['Who played Rocky Balboa?', 'Sylvester Stallone', 'Dolph Lundgren', 'Mickey Rourke', 'Kurt Russell'],
    ["Who played the title role in 'Forrest Gump' (1994)?", 'Tom Hanks', 'Kevin Costner', 'Robin Williams', 'Tom Cruise'],
    ["Who played Hannibal Lecter in 'The Silence of the Lambs'?", 'Anthony Hopkins', 'Gary Oldman', 'Ralph Fiennes', 'Christopher Walken'],
    ["Who played the female lead in 'Pretty Woman' (1990)?", 'Julia Roberts', 'Meg Ryan', 'Sandra Bullock', 'Demi Moore'],
    ['Who played Indiana Jones?', 'Harrison Ford', 'Kevin Costner', 'Mel Gibson', 'Michael Douglas'],
    ['Who has won the most Best Actress Oscars (4)?', 'Katharine Hepburn', 'Meryl Streep', 'Bette Davis', 'Ingrid Bergman', 'Meryl Streep follows with 3 acting Oscars.'],
    ["Who played Maximus in 'Gladiator' (2000)?", 'Russell Crowe', 'Joaquin Phoenix', 'Gerard Butler', 'Hugh Jackman'],
  ],
  seksenler: [
    ['In which year was Pac-Man first released?', '1980', '1978', '1983', '1985', 'Namco released it in Japan.'],
    ['In which year did the Chernobyl disaster happen?', '1986', '1984', '1988', '1982'],
    ["Which musician organised the 1985 'Live Aid' concerts?", 'Bob Geldof', 'Bono', 'Sting', 'Freddie Mercury', 'He organised it together with Midge Ure.'],
    ["In which year was the first 'Back to the Future' released?", '1985', '1983', '1987', '1989'],
    ["Which company made the iconic 'Walkman' cassette player?", 'Sony', 'Panasonic', 'Philips', 'Toshiba'],
    ['In which year did the Space Shuttle Challenger disaster happen?', '1986', '1984', '1988', '1990'],
    ["Which band released 'The Joshua Tree' in 1987?", 'U2', 'R.E.M.', 'Queen', 'The Police'],
    ['Launched in 1982, which is the best-selling single home computer model ever?', 'Commodore 64', 'ZX Spectrum', 'Apple II', 'Amstrad CPC'],
    ['In which year did MTV start broadcasting?', '1981', '1979', '1984', '1986', "The first video it aired was 'Video Killed the Radio Star'."],
    ['Who designed Tetris?', 'Alexey Pajitnov', 'Shigeru Miyamoto', 'Hideo Kojima', 'Nolan Bushnell', 'He designed it in Moscow in 1984.'],
    ["Who directed 'E.T.' (1982)?", 'Steven Spielberg', 'George Lucas', 'James Cameron', 'Ridley Scott'],
    ["Rubik's Cube inventor Ernő Rubik is from which country?", 'Hungary', 'Czechia', 'Poland', 'Austria', 'The cube became a worldwide craze in the 1980s.'],
    ['Which handheld console did Nintendo release in 1989?', 'Game Boy', 'Game Gear', 'Atari Lynx', 'Neo Geo Pocket'],
    ["In which year was 'Ghostbusters' released?", '1984', '1982', '1986', '1988'],
    ["At which World Cup did Maradona score the 'Hand of God' goal?", '1986 Mexico', '1982 Spain', '1990 Italy', '1978 Argentina', "He scored the 'Goal of the Century' in the same match."],
  ],
  sanattarihi: [
    ['Who painted the ceiling of the Sistine Chapel?', 'Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Botticelli', 'He painted it between 1508 and 1512.'],
    ["Who painted 'Guernica'?", 'Pablo Picasso', 'Salvador Dalí', 'Joan Miró', 'Francisco Goya', 'It depicts a bombing in the Spanish Civil War.'],
    ['Which painter is considered the co-founder of Cubism with Picasso?', 'Georges Braque', 'Henri Matisse', 'Paul Cézanne', 'Marcel Duchamp'],
    ["Who painted 'American Gothic'?", 'Grant Wood', 'Edward Hopper', 'Norman Rockwell', 'Andrew Wyeth'],
    ["Impressionism is named after 'Impression, Sunrise'. Who painted it?", 'Claude Monet', 'Édouard Manet', 'Edgar Degas', 'Pierre-Auguste Renoir'],
    ["Who painted 'The Scream'?", 'Edvard Munch', 'Gustav Klimt', 'Egon Schiele', 'Wassily Kandinsky'],
    ["Who painted 'Girl with a Pearl Earring'?", 'Johannes Vermeer', 'Rembrandt', 'Frans Hals', 'Jan van Eyck'],
    ["Who painted 'The Birth of Venus'?", 'Sandro Botticelli', 'Titian', 'Caravaggio', 'Raphael'],
    ["Which artist's Campbell's Soup Cans became a Pop Art icon?", 'Andy Warhol', 'Roy Lichtenstein', 'Keith Haring', 'Jean-Michel Basquiat'],
    ["Who painted 'Nighthawks' (1942)?", 'Edward Hopper', 'Grant Wood', 'Jackson Pollock', 'Mark Rothko'],
    ['In which city did the Renaissance begin?', 'Florence', 'Venice', 'Rome', 'Paris'],
    ['Which country was the painter Frida Kahlo from?', 'Mexico', 'Spain', 'Argentina', 'Cuba'],
    ["Who painted 'The Night Watch'?", 'Rembrandt', 'Johannes Vermeer', 'Peter Paul Rubens', 'Anthony van Dyck'],
    ["Who painted the gold-leaf masterpiece 'The Kiss'?", 'Gustav Klimt', 'Egon Schiele', 'Edvard Munch', 'Alphonse Mucha'],
    ["Who painted the triptych 'The Garden of Earthly Delights'?", 'Hieronymus Bosch', 'Pieter Bruegel', 'Albrecht Dürer', 'Jan van Eyck'],
    ['Who designed the Sagrada Família in Barcelona?', 'Antoni Gaudí', 'Le Corbusier', 'Frank Gehry', 'Santiago Calatrava', 'Construction has been going on since 1882.'],
  ],
};

/** Bilgi Kalesi kategorisi → ortak banka kategorisi. */
const TRIVIA_MAP: Record<TriviaCategory, QuizCategoryId> = {
  geography: 'cografya',
  history: 'tarih',
  science: 'bilim',
  arts: 'edebiyat',
  sports: 'spor',
  popculture: 'popkultur',
};

/** Karıştırılmamış soru: `o[0]` her zaman doğru cevap. */
interface RawQuestion {
  id: string;
  category: QuizCategoryId;
  q: string;
  o: string[];
  fact?: string;
}

function buildBank(lang: ContentLang): Map<QuizCategoryId, RawQuestion[]> {
  const bank = new Map<QuizCategoryId, RawQuestion[]>();
  for (const id of CATEGORY_IDS) bank.set(id, []);

  const trivia = lang === 'en' ? INITIAL_TRIVIA_QUESTIONS_EN : INITIAL_TRIVIA_QUESTIONS_TR;
  for (const t of trivia) {
    const category = TRIVIA_MAP[t.category];
    if (!category || !t.options.includes(t.correctAnswer)) continue;
    bank.get(category)!.push({
      id: `tp-${t.id}`,
      category,
      q: t.question,
      o: [t.correctAnswer, ...t.options.filter((o) => o !== t.correctAnswer)],
      fact: t.explanation,
    });
  }

  const fresh = lang === 'en' ? NEW_EN : NEW_TR;
  for (const [category, rows] of Object.entries(fresh) as Array<[QuizCategoryId, Row[]]>) {
    rows.forEach(([q, correct, w1, w2, w3, fact], i) => {
      bank.get(category)!.push({ id: `${category}-${i + 1}`, category, q, o: [correct, w1, w2, w3], fact });
    });
  }
  return bank;
}

const BANKS: Record<ContentLang, Map<QuizCategoryId, RawQuestion[]>> = {
  tr: buildBank('tr'),
  en: buildBank('en'),
};

export function quizBankSize(lang: ContentLang, category: QuizCategoryId): number {
  return BANKS[lang].get(category)?.length ?? 0;
}

type Rand = () => number;

function shuffle<T>(arr: T[], rand: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Kategoriden daha önce sorulmamış bir soru çeker ve şıkları karıştırır.
 * Kategori tükenirse (uzun oyunda aynı kategori defalarca seçilirse) o
 * kategorinin kullanılmış soruları serbest bırakılıyor — oyun hiçbir zaman
 * "soru kalmadı" diye takılmamalı.
 */
export function drawQuizQuestion(
  lang: ContentLang,
  category: QuizCategoryId,
  usedIds: string[],
  rand: Rand = Math.random,
): QuizQuestion {
  const pool = BANKS[lang].get(category) ?? BANKS[lang].get('genel')!;
  const used = new Set(usedIds);
  let candidates = pool.filter((q) => !used.has(q.id));
  if (candidates.length === 0) candidates = pool;
  const raw = candidates[Math.floor(rand() * candidates.length)];
  const correct = raw.o[0];
  const o = shuffle(raw.o, rand);
  return { id: raw.id, category: raw.category, q: raw.q, o, c: o.indexOf(correct), fact: raw.fact };
}

/** Oylamada sunulacak 3 farklı kategori. Bir önceki turun kategorisi tekrar sunulmuyor. */
export function pickCategoryChoices(exclude: QuizCategoryId | null, rand: Rand = Math.random): QuizCategoryId[] {
  const pool = CATEGORY_IDS.filter((id) => id !== exclude);
  return shuffle(pool, rand).slice(0, 3);
}

/**
 * Oyları sayar. En çok oyu alan kazanır; eşitlikte berabere kalanlar
 * arasından kura çekiliyor. Kimse oy vermezse seçeneklerden rastgele biri.
 */
export function tallyCategoryVote(
  options: QuizCategoryId[],
  votes: Record<string, QuizCategoryId>,
  rand: Rand = Math.random,
): QuizCategoryId {
  const counts = new Map<QuizCategoryId, number>(options.map((o) => [o, 0]));
  for (const v of Object.values(votes)) {
    if (counts.has(v)) counts.set(v, counts.get(v)! + 1);
  }
  const best = Math.max(...counts.values());
  const top = options.filter((o) => counts.get(o) === best);
  return top[Math.floor(rand() * top.length)];
}
