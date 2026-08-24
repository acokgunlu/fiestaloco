/** .i18n-work/*.json parcalarini birlestirip src/i18n/en.ts ve tr.ts uretir. */
const fs=require('fs'),path=require('path');
const dir='.i18n-work';
const en={},tr={};
for(const f of fs.readdirSync(dir).sort()){
  if(!f.endsWith('.json'))continue;
  const o=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  Object.assign(f.startsWith('tr')?tr:en, o);
}
const all=JSON.parse(fs.readFileSync('strings_auto.json','utf8'));
const esc=s=>JSON.stringify(s);
const emit=(obj,name,header)=>
  header+`export const ${name}: Record<string, string> = {\n`+
  Object.entries(obj).map(([k,v])=>`  ${esc(k)}: ${esc(v)},`).join('\n')+
  `\n};\n`;
fs.writeFileSync('src/i18n/en.ts', emit(en,'EN',
`/**
 * Kaynak metin -> İngilizce.
 *
 * Anahtar = kaynak koddaki metnin kendisi (bkz. ./index.ts).
 * Karşılığı olmayan dize kaynağı neyse o görünür — eksik çeviri arayüzü BOZMAZ.
 * Zaten İngilizce olan kaynak dizeler burada YER ALMAZ (fallback yeterli).
 */
`));
fs.writeFileSync('src/i18n/tr.ts', emit(tr,'TR',
`/**
 * Kaynağı İNGİLİZCE olan dizelerin Türkçe karşılıkları.
 *
 * Uygulamada baştan beri İngilizce yazılmış metinler vardı ("Add Player",
 * "Game Rules"). "Tam Türkçe" modunda onların da Türkçe görünmesi için bu yön
 * gerekli. Kaynağı zaten Türkçe olan dize burada YER ALMAZ.
 */
`));
const miss=all.filter(s=>!en[s]&&!/^[\x00-\x7F\s]*$/.test(s));
console.log(`EN: ${Object.keys(en).length}/${all.length}  TR: ${Object.keys(tr).length}`);
console.log(`Ceviri bekleyen (Turkce karakterli): ${miss.length}`);
if(miss.length&&process.argv.includes('--list')) miss.slice(0,60).forEach(m=>console.log('  ',m));
