/** t() DISINDA kalan Turkce metinler (icerik paketleri haric — onlar iki dilli). */
const ts=require('typescript'),fs=require('fs'),path=require('path');
const TRCH=/[ığşİĞŞ]/;
const LET=/[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/;
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,e.name);
  if(e.isDirectory()){ if(e.name==='i18n'||e.name==='data')continue; walk(p,out);} else if(/\.tsx?$/.test(e.name)) out.push(p);} return out;}
const byFile={};let total=0;
for(const file of walk('src')){
  const text=fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const hits=[];
  const visit=n=>{
    const isStr=ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n);
    if(isStr||ts.isJsxText(n)){
      const v=n.text;
      if(TRCH.test(v)&&LET.test(v.trim())){
        let p=n.parent,inT=false;
        for(let i=0;i<4&&p;i++,p=p.parent){
          if(ts.isCallExpression(p)&&p.expression.getText()==='t'){inT=true;break;}
          if(ts.isJsxAttribute(p)&&p.name.getText()==='k'){inT=true;break;}
        }
        const par=n.parent;
        if(!inT && !(ts.isPropertyAssignment(par)&&par.name===n) && !ts.isImportDeclaration(par)){
          hits.push({line:sf.getLineAndCharacterOfPosition(n.getStart()).line+1,v:v.trim().slice(0,64)});
        }
      }
    }
    ts.forEachChild(n,visit);
  };
  visit(sf);
  if(hits.length){byFile[file]=hits;total+=hits.length;}
}
// Bu dizeler kaynak veride Turkce TANIMLI olmak ZORUNDA (sozluk anahtari).
// Onemli olan: sozlukte Ingilizce karsiligi VAR MI? Yoksa render'da t()'den
// gecse bile Turkce gorunur.
const ensrc=fs.readFileSync('src/i18n/en.ts','utf8');
const EN=eval('('+ensrc.slice(ensrc.indexOf('{'),ensrc.lastIndexOf('}')+1)+')');
const noTrans=[];
Object.entries(byFile).forEach(([f,h])=>h.forEach(x=>{ if(!EN[x.v]&&x.v.length>2) noTrans.push([f,x.line,x.v]); }));
console.log(`t() DISINDA Turkce metin: ${total}`);
console.log(`bunlardan SOZLUKTE KARSILIGI OLMAYAN: ${noTrans.length}`);
noTrans.slice(0,40).forEach(([f,l,v])=>console.log(`   ${f}:${l}  ${v}`));
Object.entries(byFile).sort((a,b)=>b[1].length-a[1].length).slice(0,12).forEach(([f,h])=>{
  console.log(`\n  ${f}  (${h.length})`);
  h.slice(0,6).forEach(x=>console.log(`     ${x.line}: ${x.v}`));
});
