/**
 * Oyun İÇERİĞİNİN dili (sorular, kelimeler, heceler).
 *
 * Arayüz dilinden ayrı bir kavram gibi görünse de aynı şey: bir oda ya
 * tamamen Türkçe ya tamamen İngilizce. Ayrı tutulmasının sebebi teknik —
 * içeriği SUNUCU seçiyor (soruyu, kelimeyi, heceyi o dağıtıyor) ve sunucu
 * istemcinin `src/i18n` durumuna erişemez. Bu yüzden dil, oda kurulurken
 * sunucuya gönderilip odada saklanıyor ve seçicilere parametre olarak
 * geçiyor.
 *
 * Bunun güzel bir yan etkisi var: odanın dili tek bir yerde tutulduğu için
 * aynı odadaki herkes ZORUNLU olarak aynı dildeki içeriği görüyor.
 */
export type ContentLang = 'tr' | 'en';

/** Güvenli okuma — istemciden gelen değere doğrudan güvenme. */
export function asContentLang(value: unknown): ContentLang {
  return value === 'en' ? 'en' : 'tr';
}
