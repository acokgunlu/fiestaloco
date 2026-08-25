/**
 * Satir-ici etiketle BOLUNMUS cumleleri <T> bilesenine cevirir.
 *
 *   <p>Eger masada <strong>{x}</strong> varsa ipucu verilemez.</p>
 *   -> <p><T k="Eğer masada {a} varsa ipucu verilemez."
 *           v={{ a: <strong>{x}</strong> }} /></p>
 *
 * Neden: bu parcalari ayri ayri cevirmek imkansiz — "Eger masada" ile
 * "varsa ipucu verilemez" ayri cevrilince Ingilizce'de kelime sirasi tutmaz.
 * <T> cevrilmis metni yer tutuculardan bolup JSX parcalarini yerine oturtur,
 * boylece cevirmen sirayi serbestce degistirebilir.
 *
 * GUVENLIK: yalnizca cocuklari metin + SATIR ICI etiket (strong/span/b/em/
 * i/code) + basit {ifade} olan elemanlara dokunur. Blok yapisi, map, kosullu
 * render varsa ELLENMEZ.
 */
const ts=require('typescript'),fs=require('fs'),path=require('path');
const APPLY=process.argv.includes('--apply');
const INLINE=new Set(['strong','span','b','em','i','code','u','small','mark']);
const LET=/[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/;
const TRCH=/[ığşİĞŞçöüÇÖÜ]/;
const NAMES='abcdefghijkl';
const found=new Set(); let total=0,skipped=0;

for(const file of process.argv.filter(a=>a.endsWith('.tsx'))){
  const text=fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const edits=[];
  const visit=node=>{
    if(ts.isJsxElement(node)){
      const kids=node.children;
      const texts=kids.filter(k=>ts.isJsxText(k)&&LET.test(k.text)&&TRCH.test(k.text));
      const inlines=kids.filter(k=>(ts.isJsxElement(k)&&INLINE.has(k.openingElement.tagName.getText()))
                                 ||(ts.isJsxSelfClosingElement(k)&&INLINE.has(k.tagName.getText())));
      const others=kids.filter(k=>!ts.isJsxText(k)&&!ts.isJsxExpression(k)&&!inlines.includes(k));
      if(texts.length&&inlines.length&&!others.length){
        const srcs=kids.filter(k=>ts.isJsxExpression(k)&&k.expression).map(k=>k.expression.getText());
        if(srcs.some(x=>/=>|\bmap\(|&&\s*[<(]/.test(x))){ skipped++; }
        else{
          let pat='',vars=[],i=0,okAll=true;
          for(const k of kids){
            if(ts.isJsxText(k)){
              let v=k.text;
              if(!/\S/.test(v)){ pat += v.includes('\n')?'':' '; continue; }
              pat += v.replace(/\s*\n\s*/g,' ');
            } else if(ts.isJsxExpression(k)){
              if(!k.expression){ okAll=false; break; }
              const n=NAMES[i++]; vars.push(`${n}: ${k.expression.getText()}`); pat+=`{${n}}`;
            } else {
              const n=NAMES[i++]; vars.push(`${n}: ${k.getText().replace(/\s*\n\s*/g,' ')}`); pat+=`{${n}}`;
            }
          }
          pat=pat.replace(/\s+/g,' ').trim();
          if(okAll&&pat&&i>0&&TRCH.test(pat)){
            found.add(pat);
            const q=pat.includes('"')?`{${JSON.stringify(pat)}}`:`"${pat}"`;
            edits.push({s:kids[0].getStart(),e:kids[kids.length-1].getEnd(),
              t:`<T k=${q} v={{ ${vars.join(', ')} }} />`});
            total++;
          }
        }
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(sf);
  if(edits.length){
    console.log(`  ${edits.length}  ${file}`);
    if(APPLY){
      let out=text; edits.sort((a,b)=>b.s-a.s);
      for(const e of edits) out=out.slice(0,e.s)+e.t+out.slice(e.e);
      if(!/\{ T \}|, T \}|\bT \} from '[^']*i18n\/T'/.test(out)){
        let rel=path.relative(path.dirname(file),'src/i18n').split(path.sep).join('/');
        if(!rel.startsWith('.')) rel='./'+rel;
        const im=[...out.matchAll(/^import .*?;\s*$/gm)];const l=im[im.length-1];
        out=out.slice(0,l.index+l[0].length)+`\nimport { T } from '${rel}/T';`+out.slice(l.index+l[0].length);
      }
      fs.writeFileSync(file,out,'utf8');
    }
  }
}
console.log(`${APPLY?'UYGULANDI':'KURU'}: ${total} bolunmus cumle | atlanan: ${skipped}`);
fs.writeFileSync('strings_inline.json',JSON.stringify([...found].sort(),null,1));
