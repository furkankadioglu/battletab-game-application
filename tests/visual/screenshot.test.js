const puppeteer=require('puppeteer'),path=require('path'),fs=require('fs');
async function run(task,url='http://localhost:5173'){
  const dir=path.join(__dirname,'../../progress/screenshots');
  fs.mkdirSync(dir,{recursive:true});
  const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const p=await b.newPage();await p.setViewport({width:1920,height:1080});
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  try{await p.goto(url,{waitUntil:'networkidle2',timeout:20000});
    await new Promise(r=>setTimeout(r,3000));
    const ts=new Date().toISOString().slice(0,19).replace(/[:.]/g,'-');
    const fp=path.join(dir,`${ts}-${task}.png`);
    await p.screenshot({path:fp,fullPage:true});
    console.log(`✅ Screenshot: ${fp}`);
    errs.length?console.log('⚠️ Hatalar:',errs):console.log('✅ Hata yok');
  }catch(e){console.error(`❌ ${e.message}`)}finally{await b.close()}}
const t=(process.argv.find(a=>a.startsWith('--task='))||'').split('=')[1]||'unknown';
const u=(process.argv.find(a=>a.startsWith('--url='))||'').split('=')[1]||'http://localhost:5173';
run(t,u);
