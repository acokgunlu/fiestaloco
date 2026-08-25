/**
 * Modul seviyesindeki sabitleri KULLANIM YERINDE t()'den gecirir.
 *
 * Renk adlari, rozetler, kategori adlari gibi diziler modul seviyesinde
 * tanimli; orada t() cagirmak dili YUKLEME ANINDA dondururdu (dil degisince
 * guncellenmezdi). Cozum: veri Turkce kalsin, GORUNTULENIRKEN cevrilsin.
 */
const ts=require('typescript'),fs=require('fs'),path=require('path');
// {ifade} seklinde render edilen, sozlukten cevrilmesi gereken alanlar
const FIELDS=/^(.*\.)?(colorName|badge|label|categoryName)$/;
const EXTRA=[
  // dosya, aranan ifade, yerine
  ['src/components/leaderboard/UnifiedLeaderboardModal.tsx','{badge}','{t(badge)}'],
];
let n=0;
for(const file of process.argv.filter(a=>a.endsWith('.tsx'))){
  const text=fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const edits=[];
  const visit=nd=>{
    if(ts.isJsxExpression(nd)&&nd.expression){
      const src=nd.expression.getText();
      if(FIELDS.test(src.replace(/\?\./g,'.'))&&!src.startsWith('t(')){
        edits.push({s:nd.expression.getStart(),e:nd.expression.getEnd(),t:`t(${src} || '')`});
      }
    }
    ts.forEachChild(nd,visit);
  };
  visit(sf);
  if(edits.length){
    let out=text; edits.sort((a,b)=>b.s-a.s);
    for(const ed of edits) out=out.slice(0,ed.s)+ed.t+out.slice(ed.e);
    if(!/from '[^']*i18n'/.test(out)){
      let rel=path.relative(path.dirname(file),'src/i18n').split(path.sep).join('/');
      if(!rel.startsWith('.')) rel='./'+rel;
      const im=[...out.matchAll(/^import .*?;\s*$/gm)];const l=im[im.length-1];
      out=out.slice(0,l.index+l[0].length)+`\nimport { t } from '${rel}';`+out.slice(l.index+l[0].length);
    }
    fs.writeFileSync(file,out,'utf8'); n+=edits.length;
    console.log(`  ${edits.length}  ${file}`);
  }
}
for(const [f,from,to] of EXTRA){
  let s=fs.readFileSync(f,'utf8');
  if(s.includes(from)&&!s.includes(to)){ s=s.split(from).join(to); fs.writeFileSync(f,s,'utf8'); n++; console.log('  1 ',f,from); }
}
console.log('sarilan kullanim:',n);
