/** Kaynaktaki HER t()/<T k=> anahtarinin Ingilizce karsiligi var mi? */
const ts=require('typescript'),fs=require('fs'),path=require('path');
const TRCH=/[ığşİĞŞçöüÇÖÜ]/;
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,e.name);
  if(e.isDirectory()){ if(e.name==='i18n')continue; walk(p,out);} else if(/\.tsx?$/.test(e.name)) out.push(p);} return out;}
const keys=new Set();
for(const file of walk('src')){
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const visit=n=>{
    if(ts.isCallExpression(n)&&n.expression.getText()==='t'&&n.arguments.length){
      const a=n.arguments[0];
      if(ts.isStringLiteral(a)||ts.isNoSubstitutionTemplateLiteral(a)) keys.add(a.text);
    }
    if(ts.isJsxAttribute(n)&&n.name.getText()==='k'&&n.initializer){
      const i=n.initializer;
      if(ts.isStringLiteral(i)) keys.add(i.text);
      else if(ts.isJsxExpression(i)&&i.expression&&ts.isStringLiteral(i.expression)) keys.add(i.expression.text);
    }
    ts.forEachChild(n,visit);
  };
  visit(sf);
}
const src=fs.readFileSync('src/i18n/en.ts','utf8');
const EN=eval('('+src.slice(src.indexOf('{'),src.lastIndexOf('}')+1)+')');
const all=[...keys].sort();
const missing=all.filter(k=>TRCH.test(k)&&!EN[k]);
console.log(`kaynaktaki t() anahtari: ${all.length}`);
console.log(`Ingilizce karsiligi OLMAYAN: ${missing.length}`);
missing.forEach(k=>console.log('  ',JSON.stringify(k)));
