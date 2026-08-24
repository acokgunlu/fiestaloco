/**
 * FiestaLoco i18n codemod — TypeScript derleyici API'siyle (regex DEGIL).
 *
 * Regex denemesi `useState<Foo>(...)` gibi generic sozdizimini JSX etiketi
 * sanip koca kod bloklarini yakaladi. AST ile calisiyoruz: JsxText dugumleri
 * ve JSX oznitelik dizeleri kesin olarak bulunuyor.
 *
 *   >Metin<              -> >{t('Metin')}<
 *   placeholder="Metin"  -> placeholder={t('Metin')}
 *
 * BOLUNMUS CUMLE: bir JSX elemani hem metin hem {ifade} tasiyorsa parcalari
 * ayri cevirmek Ingilizce'de kelime salatasi uretir -> sarilmaz, RAPOR edilir.
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const ROOT = 'src';
const ATTRS = new Set(['placeholder', 'title', 'aria-label', 'alt']);
const LETTERS = /[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/;
const SKIP = new Set(['FiestaLoco', 'Fiesta', 'Loco', 'QR', 'TV', 'ID', 'OK', 'vs', 'VS', 'px', 'rem']);

function worth(s) {
  s = s.trim();
  if (!s || SKIP.has(s)) return false;
  return LETTERS.test(s);
}
function qt(s) {
  if (!s.includes("'")) return `'${s}'`;
  if (!s.includes('"')) return `"${s}"`;
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
function walkFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'i18n' || e.name === 'data') continue;
      walkFiles(p, out);
    } else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const files = walkFiles(ROOT).sort();
const allStrings = new Set();
const report = {};
let changed = 0;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const found = new Set();
  const splits = [];

  const visit = (node) => {
    // --- bolunmus cumle tespiti: metin + {ifade} ayni elemanin cocuklari
    if (ts.isJsxElement(node)) {
      const kids = node.children;
      const hasText = kids.some((k) => ts.isJsxText(k) && worth(k.text));
      const hasExpr = kids.some((k) => ts.isJsxExpression(k) && k.expression);
      const hasElem = kids.some((k) => ts.isJsxElement(k) || ts.isJsxSelfClosingElement(k));
      if (hasText && (hasExpr || hasElem)) {
        // Yalnizca ikon + metin kalibi (<Icon/> Metin) zararsiz: ifade yok, tek metin
        const textKids = kids.filter((k) => ts.isJsxText(k) && worth(k.text));
        if (hasExpr || textKids.length > 1) {
          const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          splits.push([line, textKids.map((k) => k.text.trim()).join(' ⟂ ').slice(0, 110)]);
          // bu elemanin DOGRUDAN metin cocuklarini sarma
          textKids.forEach((k) => { k.__skip = true; });
        }
      }
    }
    if (ts.isJsxText(node) && !node.__skip) {
      const raw = node.text;
      const s = raw.trim();
      if (worth(s)) {
        const lead = raw.slice(0, raw.length - raw.trimStart().length);
        const trail = raw.slice(raw.trimEnd().length);
        const keepLead = lead.includes('\n') ? '' : lead;
        const keepTrail = trail.includes('\n') ? '' : trail;
        found.add(s);
        edits.push({ start: node.getStart(), end: node.getEnd(), text: `${keepLead}{t(${qt(s)})}${keepTrail}` });
      }
    }
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText();
      const val = node.initializer.text;
      if (ATTRS.has(name) && worth(val)) {
        found.add(val);
        edits.push({ start: node.initializer.getStart(), end: node.initializer.getEnd(), text: `{t(${qt(val)})}` });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (found.size || splits.length) {
    report[file] = { auto: found.size, split: splits.length, split_list: splits.slice(0, 25) };
  }
  found.forEach((s) => allStrings.add(s));

  if (edits.length) {
    changed++;
    if (APPLY) {
      let out = text;
      edits.sort((a, b) => b.start - a.start);
      for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
      if (!/from '[^']*i18n'/.test(out)) {
        let rel = path.relative(path.dirname(file), 'src/i18n').split(path.sep).join('/');
        if (!rel.startsWith('.')) rel = './' + rel;
        const imports = [...out.matchAll(/^import .*?;\s*$/gm)];
        const imp = `import { t } from '${rel}';\n`;
        if (imports.length) {
          const last = imports[imports.length - 1];
          const pos = last.index + last[0].length;
          out = out.slice(0, pos) + '\n' + imp.trimEnd() + out.slice(pos);
        } else out = imp + out;
      }
      fs.writeFileSync(file, out, 'utf8');
    }
  }
}

const a = Object.values(report).reduce((s, v) => s + v.auto, 0);
const sp = Object.values(report).reduce((s, v) => s + v.split, 0);
console.log(`${APPLY ? 'UYGULANDI' : 'KURU CALISMA'}: ${changed} dosya | otomatik ${a} benzersiz | bolunmus cumle ${sp}`);
console.log(`benzersiz dize havuzu: ${allStrings.size}`);
console.log('\nBOLUNMUS CUMLE OLAN DOSYALAR (elle duzeltilecek):');
Object.entries(report).filter(([, v]) => v.split).sort((x, y) => y[1].split - x[1].split).slice(0, 20)
  .forEach(([f, v]) => console.log(`  ${String(v.split).padStart(3)}  ${f}`));

const d = path.dirname(path.resolve(process.argv[1]));
fs.writeFileSync(path.join(d, 'strings_auto.json'), JSON.stringify([...allStrings].sort(), null, 1));
fs.writeFileSync(path.join(d, 'report.json'), JSON.stringify(report, null, 1));
