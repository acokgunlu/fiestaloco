/**
 * KAPSAMLI DENETIM: t() DISINDA kalan Turkce metinler.
 * AST ile — yorum satirlari, className, import yollari haric.
 */
const ts=require('typescript'),fs=require('fs'),path=require('path');
const TRCH=/[çğıöşüÇĞİÖŞÜ]/;
const LETTERS=/[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/;
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){ if(e.name==='i18n')continue; walk(p,out);}
  else if(/\.tsx?$/.test(e.name)) out.push(p);} return out;}
const byFile={};let total=0;
for(const file of walk('src')){
  const text=fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const hits=[];
  const visit=(node)=>{
    const isStr=ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node);
    if((isStr||ts.isJsxText(node))){
      const v=isStr?node.text:node.text;
      if(TRCH.test(v)&&LETTERS.test(v.trim())){
        // t(...) / T k= icinde mi?
        let p=node.parent,inT=false;
        for(let i=0;i<4&&p;i++,p=p.parent){
          if(ts.isCallExpression(p)&&p.expression.getText()==='t'){inT=true;break;}
          if(ts.isJsxAttribute(p)&&p.name.getText()==='k'){inT=true;break;}
        }
        // import yolu / obje anahtari degilse
        const par=node.parent;
        const isKey=ts.isPropertyAssignment(par)&&par.name===node;
        const isImport=ts.isImportDeclaration(par);
        if(!inT&&!isKey&&!isImport){
          hits.push({line:sf.getLineAndCharacterOfPosition(node.getStart()).line+1,v:v.trim().slice(0,70)});
        }
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(sf);
  if(hits.length){byFile[file]=hits;total+=hits.length;}
}
console.log(`t() DISINDA kalan Turkce metin: ${total}\n`);
Object.entries(byFile).sort((a,b)=>b[1].length-a[1].length).slice(0,18)
  .forEach(([f,h])=>console.log(`  ${String(h.length).padStart(4)}  ${f}`));
fs.writeFileSync('audit.json',JSON.stringify(byFile,null,1));
