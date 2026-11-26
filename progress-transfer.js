/* Device-to-device progress codes, including personal text highlights. No server or account. */
(function (root) {
  'use strict';
  const core = root.StudyCore;
  const PREFIX = 'NUR2460-1';
  const LIMIT = 1024 * 1024;
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const fail = message => { throw new Error(message); };
  const invalid = () => fail('This progress code is incomplete or invalid. Copy the entire code again.');
  const crc = bytes => {
    let c = 0xffffffff;
    for (const b of bytes) { c ^= b; for (let i=0;i<8;i++) c = (c>>>1) ^ ((c&1) ? 0xedb88320 : 0); }
    return ((c ^ 0xffffffff)>>>0).toString(16).padStart(8,'0');
  };
  async function streamBytes(stream) {
    const reader=stream.getReader(),chunks=[];let length=0;
    try {
      while (true) { const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>LIMIT){await reader.cancel();fail('This progress code is too large.');}chunks.push(value); }
    } finally { reader.releaseLock(); }
    const result=new Uint8Array(length);let offset=0;
    for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
  }
  function validate(raw,data) {
    if(!object(raw)||raw.version!==1)invalid();
    const lessons=new Map(data.lessons.map(l=>[l.id,l])),steps=new Set(data.lessons.flatMap(l=>l.steps.map(s=>s.id))),questions=new Map(data.lessons.flatMap(l=>l.checks.map(q=>[q.id,q])));
    const location=x=>object(x)&&x.mode==='lesson'&&lessons.has(x.lesson)&&Number.isInteger(x.index)&&x.index>=0&&x.index<=lessons.get(x.lesson).steps.length+5;
    for(const key of ['read','completed','attempts','drafts','pathLast'])if(!object(raw[key]))invalid();
    for(const [id,value] of Object.entries(raw.read))if(!steps.has(id)||value!==true)invalid();
    for(const [id,value] of Object.entries(raw.completed))if(!lessons.has(id)||value!==true)invalid();
    for(const [id,loc] of Object.entries(raw.pathLast))if(!location(loc)||lessons.get(loc.lesson).path!==id)invalid();
    if(!Array.isArray(raw.missed)||raw.missed.some(id=>!questions.has(id)))invalid();
    if(raw.highlights!==undefined){
      if(!object(raw.highlights))invalid();
      for(const [id,entries] of Object.entries(raw.highlights))if((!steps.has(id)&&!questions.has(id))||!Array.isArray(entries)||entries.some(h=>!core.validHighlight(h)))invalid();
    }
    const normalized=core.normalize(raw,data);
    const answers=(map,target)=>{
      if(!object(map))invalid();
      for(const [id,a] of Object.entries(map))if(!questions.has(id)||!object(a)||!core.ready(questions.get(id),a.value)||!target[id]||(a.count!==undefined&&(!Number.isSafeInteger(a.count)||a.count<1)))invalid();
    };
    const drafts=(map,target)=>{
      if(!object(map))invalid();
      for(const [id,value] of Object.entries(map))if(!questions.has(id)||!Object.hasOwn(target,id)||JSON.stringify(value)!==JSON.stringify(target[id]))invalid();
    };
    answers(raw.attempts,normalized.attempts);drafts(raw.drafts,normalized.drafts);
    if(raw.review!==null){
      const r=raw.review,n=normalized.review;
      if(!object(r)||!n||!Array.isArray(r.queue)||new Set(r.queue).size!==r.queue.length||r.queue.some(id=>!questions.has(id))||r.queue.length!==n.queue.length)invalid();
      if(r.returnTo!==undefined&&r.returnTo!==null&&!location(r.returnTo))invalid();
      if(Object.keys(r.answers||{}).some(id=>!r.queue.includes(id))||Object.keys(r.drafts||{}).some(id=>!r.queue.includes(id)))invalid();
      answers(r.answers,n.answers);drafts(r.drafts,n.drafts);
    }
    if(raw.last!==null&&!location(raw.last)&&!(raw.last?.mode==='review'&&normalized.review))invalid();
    return normalized;
  }
  async function encode(state,data,compatible=false) {
    const progress=core.normalize(state,data);
    const bytes=new TextEncoder().encode(JSON.stringify({app:'nur2460-exam4',exportedAt:new Date().toISOString(),progress}));
    let encoded=bytes,mode='U';
    if(!compatible&&typeof CompressionStream!=='undefined'&&typeof DecompressionStream!=='undefined'){
      encoded=await streamBytes(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));mode='G';
    }
    let binary='';for(let i=0;i<encoded.length;i+=8192)binary+=String.fromCharCode(...encoded.subarray(i,i+8192));
    return `${PREFIX}.${mode}.${btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}.${crc(encoded)}`;
  }
  async function decode(input,data) {
    if(typeof input!=='string'||input.length>LIMIT*2)invalid();
    const code=input.replace(/\s/g,''),parts=code.split('.');
    if(parts.length!==4||parts[0]!==PREFIX||!['G','U'].includes(parts[1])||!/^[-_A-Za-z0-9]+$/.test(parts[2])||!/^[a-f0-9]{8}$/.test(parts[3]))invalid();
    let bytes;
    try { bytes=Uint8Array.from(atob(parts[2].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)); } catch { invalid(); }
    if(bytes.length>LIMIT||crc(bytes)!==parts[3])invalid();
    if(parts[1]==='G'){
      if(typeof DecompressionStream==='undefined')fail('Use a current browser, or copy a compatibility code from the original device.');
      try { bytes=await streamBytes(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))); } catch { invalid(); }
    }
    let payload;try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{invalid();}
    if(!object(payload)||payload.app!=='nur2460-exam4'||typeof payload.exportedAt!=='string'||!Number.isFinite(Date.parse(payload.exportedAt)))invalid();
    return {progress:validate(payload.progress,data),exportedAt:payload.exportedAt};
  }
  function merge(current,incoming,data) {
    const a=core.normalize(current,data),b=core.normalize(incoming,data);
    const next={...a,read:{...a.read,...b.read},attempts:{...a.attempts,...b.attempts},drafts:{...a.drafts,...b.drafts},pathLast:{...a.pathLast,...b.pathLast},last:b.last||a.last,review:b.last?b.review:(b.review||a.review),highlights:core.mergeHighlights(a.highlights,b.highlights)};
    for(const id of Object.keys(next.attempts))delete next.drafts[id];
    next.missed=[...new Set([...a.missed,...b.missed,...Object.keys(next.attempts)])].filter(id=>next.attempts[id]?!next.attempts[id].correct:true);
    return core.normalize(next,data);
  }
  const stats = state => ({lessons:Object.keys(state.completed).length,steps:Object.keys(state.read).length,checks:Object.keys(state.attempts).length,missed:state.missed.length,highlights:Object.values(state.highlights||{}).reduce((n,entries)=>n+entries.length,0)});
  function persist(storage,key,current,next,undo=false) {
    const backupKey=key+'-before-import';let previous;
    try {
      previous=storage.getItem(backupKey);
      if(!undo)storage.setItem(backupKey,JSON.stringify({savedAt:new Date().toISOString(),progress:current}));
      storage.setItem(key,JSON.stringify(next));
    } catch {
      if(!undo){try{if(previous===null)storage.removeItem(backupKey);else if(previous!==undefined)storage.setItem(backupKey,previous);}catch{/* The active progress record was not replaced. */}}
      fail('Progress could not be saved. Your current progress is unchanged. Allow browser storage, then try again.');
    }
    if(undo){try{storage.removeItem(backupKey);}catch{/* A redundant backup is harmless. */}}
  }
  function create({data,key,getState,onChange}) {
    const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const modal=document.createElement('dialog');modal.id='progress-dialog';modal.setAttribute('aria-labelledby','progress-dialog-title');document.body.append(modal);
    let status='',generation=0;
    function backup(){try{const b=JSON.parse(localStorage.getItem(key+'-before-import'));return b?{...b,progress:validate(b.progress,data)}:null;}catch{return null;}}
    function shell(title,body){
      generation++;modal.innerHTML=`<div class="dialog-head"><h2 id="progress-dialog-title">${title}</h2><button type="button" class="secondary" id="close-progress">Close</button></div>${body}<p id="progress-message" class="transfer-message" role="status" aria-live="polite"></p>`;
      modal.querySelector('#close-progress').onclick=()=>modal.close();if(!modal.open)modal.showModal();
    }
    modal.addEventListener('close',()=>{generation++;});
    const message=(value,error=false)=>{const el=modal.querySelector('#progress-message');el.textContent=value;el.classList.toggle('transfer-error',error);};
    function counts(s){const n=stats(s);return `${n.lessons} lesson${n.lessons===1?'':'s'} complete · ${n.steps} step${n.steps===1?'':'s'} read · ${n.checks} check${n.checks===1?'':'s'} answered · ${n.missed} missed check${n.missed===1?'':'s'}${n.highlights?` · ${n.highlights} highlight${n.highlights===1?'':'s'}`:''}`;}
    function place(s){
      if(s.last?.mode==='review')return `Missed-check review · Check ${s.review.index+1} of ${s.review.queue.length}`;
      const l=data.lessons.find(l=>l.id===s.last?.lesson);if(!l)return 'No saved position yet.';
      const i=s.last.index,part=i<l.steps.length?`Step ${i+1} of ${l.steps.length}`:i<l.steps.length+5?`Check ${i-l.steps.length+1} of 5`:'Lesson recap';return `${l.title} · ${part}`;
    }
    function preview(s,label){return `<section class="transfer-preview"><h3>${label}</h3><p>${counts(s)}</p><p class="muted">Continue at: ${esc(place(s))}</p></section>`;}
    async function exportCode(compatible=false){
      const snapshot=core.normalize(getState(),data);
      shell('Export progress',`<p>Copy this code, then open <strong>Import progress</strong> on your other device and paste it there.</p>${preview(snapshot,'Included in this code')}<label class="transfer-label" for="export-code">Your progress code</label><textarea id="export-code" class="progress-code" rows="4" readonly spellcheck="false" aria-describedby="export-help"></textarea><p id="export-help" class="muted">Copy the entire code. It includes progress and highlights for all eight paths and Meat and potatoes.</p><div class="button-row"><button class="primary" id="copy-progress" type="button" disabled>Copy progress code</button><button class="secondary" id="select-progress" type="button" disabled>Select code</button></div><details class="compatibility"><summary>Older browser?</summary><p>Use a longer code that does not need browser compression support.</p><button class="secondary" id="compatible-progress" type="button">Create compatibility code</button></details>`);
      const token=generation;message('Preparing your progress code…');
      modal.querySelector('#compatible-progress').onclick=()=>exportCode(true);
      try{
        const code=await encode(snapshot,data,compatible);if(token!==generation)return;
        const field=modal.querySelector('#export-code'),copy=modal.querySelector('#copy-progress'),select=modal.querySelector('#select-progress');field.value=code;copy.disabled=select.disabled=false;message('Ready to copy.');
        const selectCode=()=>{field.focus();field.select();field.setSelectionRange(0,field.value.length);};
        select.onclick=()=>{selectCode();message('Code selected. Use Copy in your device’s text menu or press ⌘C / Ctrl+C.');};
        copy.onclick=async()=>{
          try{await navigator.clipboard.writeText(code);if(token===generation)message('Copied. Paste this code into Import progress on your other device.');}
          catch{if(token===generation){selectCode();message('Automatic copying is unavailable. The code is selected—use Copy in your device’s text menu or press ⌘C / Ctrl+C.');}}
        };
      }catch{if(token===generation)message('The code could not be created. Try Create compatibility code below.',true);}
    }
    function importCode(){
      shell('Import progress','<p>Paste the complete code from your other device. Preview it before changing your progress here.</p><label class="transfer-label" for="import-code">Progress code</label><textarea id="import-code" class="progress-code" rows="5" placeholder="Paste your NUR2460-1… code here" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" maxlength="2097152"></textarea><button class="primary" id="preview-progress" type="button">Preview progress</button><div id="import-preview" hidden></div>');
      const field=modal.querySelector('#import-code'),button=modal.querySelector('#preview-progress'),panel=modal.querySelector('#import-preview');let request=0;
      field.addEventListener('input',()=>{request++;panel.hidden=true;panel.innerHTML='';button.disabled=false;message('');});
      field.focus();
      button.onclick=async()=>{
        const token=generation,seq=++request;button.disabled=true;panel.hidden=true;message('Checking the code…');
        try{
          const imported=await decode(field.value,data);if(token!==generation||seq!==request)return;
          panel.innerHTML=`<p class="muted">Copied ${esc(new Date(imported.exportedAt).toLocaleString())}</p>${preview(imported.progress,'Progress from the code')}<fieldset class="import-options"><legend>How should it be imported?</legend><label class="choice"><input type="radio" name="import-mode" value="merge" checked><span><strong>Merge progress (recommended)</strong><small>Keeps completed work and highlights from both devices. Where answers overlap, the code’s answers take priority. Continue from the code’s saved position.</small></span></label><label class="choice"><input type="radio" name="import-mode" value="replace"><span><strong>Replace this device’s progress</strong><small>Makes this device match the code. You can undo the import.</small></span></label></fieldset><button class="primary" id="confirm-import" type="button">Import this progress</button>`;panel.hidden=false;message('Preview ready. Your progress has not changed.');
          modal.querySelector('#confirm-import').onclick=()=>{
            const next=modal.querySelector('input[name="import-mode"]:checked').value==='merge'?merge(getState(),imported.progress,data):imported.progress;
            try{persist(localStorage,key,getState(),next);status='Progress imported. Continue studying to resume. Undo last import is available here.';modal.close();onChange(next);}
            catch(error){message(error.message,true);}
          };
          panel.querySelector('#confirm-import').focus({preventScroll:true});panel.scrollIntoView({block:'nearest'});
        }catch(error){if(token===generation&&seq===request)message(error.message,true);}
        finally{if(token===generation&&seq===request)button.disabled=false;}
      };
    }
    function undoImport(){
      const saved=backup();if(!saved)return;
      shell('Undo last import',`<p>Restore this device’s progress from before the last import. Work done here since that import will be removed.</p>${preview(saved.progress,'Progress to restore')}<button class="primary" id="confirm-undo" type="button">Restore previous progress</button>`);
      modal.querySelector('#confirm-undo').onclick=()=>{
        try{persist(localStorage,key,getState(),saved.progress,true);status='Previous progress restored.';modal.close();onChange(saved.progress);}
        catch(error){message(error.message,true);}
      };
    }
    function mount(container){
      container.innerHTML=`<h2>Move progress between devices</h2><p>Export a code here, then copy and paste it into Import progress on another device. No files or account needed.</p><div class="button-row"><button type="button" class="secondary" id="export-progress">Export progress</button><button type="button" class="secondary" id="import-progress">Import progress</button>${backup()?'<button type="button" class="text-button" id="undo-import">Undo last import</button>':''}</div><p class="transfer-status" role="status">${esc(status)}</p><p class="muted transfer-hint">This is a snapshot. Export a new code after studying to update your other device.</p>`;
      container.querySelector('#export-progress').onclick=()=>exportCode();container.querySelector('#import-progress').onclick=importCode;
      const undo=container.querySelector('#undo-import');if(undo)undo.onclick=undoImport;
    }
    return {mount};
  }
  root.StudyTransfer={encode,decode,validate,merge,stats,persist,create};
  if(typeof module!=='undefined')module.exports=root.StudyTransfer;
})(typeof window!=='undefined'?window:globalThis);
