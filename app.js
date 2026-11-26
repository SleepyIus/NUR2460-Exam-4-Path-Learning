(function () {
  'use strict';
  const core = window.StudyCore;
  const presentation = window.StudyPresentation;
  const highYield=window.STUDY_DATA;
  highYield.lessons.forEach(l=>l.path='HY');
  const paths=[...window.FULL_PATHS.paths,{id:'HY',name:'Meat and potatoes',description:'Your separate high-yield review across all eight subjects.',lessonIds:highYield.lessons.map(l=>l.id)}];
  const data={...highYield,lessons:[...window.FULL_PATHS.lessons,...highYield.lessons],paths};
  const pathMap=new Map(paths.map(p=>[p.id,p]));
  // A versioned, site-specific key isolates this site's progress from other study apps.
  const STORAGE_KEY = 'nur2460-exam4-guided-v1';
  const main = document.querySelector('#main');
  const dialog = document.querySelector('#sources-dialog');
  const warning = document.querySelector('#storage-warning');
  const lessonMap = new Map(data.lessons.map(l => [l.id, l]));
  const questionMap = new Map(data.lessons.flatMap(l => l.checks.map(q => [q.id, {lesson:l, question:q}])));
  const subjectMap = new Map(data.subjects.map(s => [s.id, s]));
  let storageOK = true;
  let state = core.fresh();
  let current = null;
  let sourceContext = null;
  let activePath = null;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const letter = i => String.fromCharCode(65+i);
  const lessonHref = (id, index=0) => `#lesson/${id}/${index}`;
  function storageFailure(message) {
    storageOK = false;
    warning.hidden = false;
    warning.textContent = message;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = core.normalize(JSON.parse(raw), data);
  } catch (error) {
    storageFailure('Saved progress could not be loaded. You can study now, but this session may not survive a refresh. Allow site storage in your browser to keep your place.');
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageOK = true;
      warning.hidden = true;
    } catch (error) {
      storageFailure('This browser cannot save progress right now. Your work stays in this tab until it closes or refreshes. Allow site storage to keep your place.');
    }
  }
  function reconcile() {
    for (const l of data.lessons) if (core.lessonComplete(l, state)) state.completed[l.id] = true;
  }
  function go(hash) {
    if (location.hash === hash) render(); else location.hash = hash;
  }
  function resumeHref() {
    if (state.last?.mode === 'review' && state.review) return '#review/'+state.review.index;
    if (state.last?.mode === 'lesson') return lessonHref(state.last.lesson, state.last.index);
    const first = data.lessons.find(l => !state.completed[l.id]) || data.lessons[0];
    return lessonHref(first.id);
  }
  function resumeLabel() {
    if (state.last?.mode === 'review' && state.review) return `Missed-check review · Check ${state.review.index+1} of ${state.review.queue.length}`;
    if (state.last?.mode === 'lesson') {
      const l = lessonMap.get(state.last.lesson), i = state.last.index;
      const part = i < l.steps.length ? `Step ${i+1} of ${l.steps.length}` : i < l.steps.length+5 ? `Check ${i-l.steps.length+1} of 5` : 'Lesson recap';
      return `${l.title} · ${part}`;
    }
    return 'Choose a full subject path or the separate high-yield course.';
  }
  function pathLessons(p){return p.lessonIds.map(id=>lessonMap.get(id));}
  function pathHref(p){return '#path/'+p.id;}
  function pathResume(p){const saved=state.pathLast[p.id];if(saved)return lessonHref(saved.lesson,saved.index);const l=pathLessons(p).find(l=>!state.completed[l.id])||pathLessons(p)[0];return lessonHref(l.id,firstUnfinished(l));}
  function pathStats(p){const ls=pathLessons(p),stats=ls.map(l=>core.progress(l,state));return {lessons:ls.length,checks:ls.reduce((n,l)=>n+l.checks.length,0),complete:ls.filter(l=>state.completed[l.id]).length,done:stats.reduce((n,s)=>n+s.done,0),total:stats.reduce((n,s)=>n+s.total,0)};}
  function pathPercent(s){return s.done===s.total?100:Math.min(99,Math.round(s.done/s.total*100));}
  function pathCard(p){const s=pathStats(p);return `<article class="subject-card ${p.id==='HY'?'high-yield-card':''}" data-path="${p.id}"><p class="eyebrow">${p.id==='HY'?'Separate high-yield course':`${p.weight} exam items · Full subject path`}</p><h3><a href="${pathHref(p)}">${esc(p.name)}</a></h3><p class="muted">${s.lessons} lessons · ${s.checks} checks</p><div class="subject-progress"><div class="progress-label"><span>${s.complete} of ${s.lessons} lessons complete</span><span>${pathPercent(s)}%</span></div><progress value="${s.done}" max="${s.total}" aria-label="${esc(p.name)} progress"></progress></div><div class="button-row"><a class="primary" href="${pathHref(p)}">Open path</a>${s.done?`<a class="secondary" href="${pathResume(p)}">Resume path</a>`:''}</div></article>`;}
  function showHome(){
    current=null;sourceContext=null;activePath=null;
    main.innerHTML=`<section class="hero" aria-labelledby="home-title"><div><p class="eyebrow">NUR2460 · Meyers’ blueprint</p><h1 id="home-title">Choose your study path.</h1><p class="intro">Eight complete subject paths, plus a separate meat-and-potatoes review. Learn one idea at a time and return where you left off.</p><a class="primary" id="continue-studying" href="${resumeHref()}">Continue studying</a><span class="resume-detail">${esc(resumeLabel())}</span></div><div class="hero-progress"><strong>8 + 1</strong><p>Full subjects + high-yield review</p><p class="muted">Your progress is saved separately in every path.</p></div></section><div class="study-tools"><p class="muted">${storageOK?'Progress saves on this device and browser.':'Progress is currently kept in this tab.'}</p><a class="secondary" id="review-missed" href="#missed">Review missed checks${state.missed.length?` (${state.missed.length})`:''}</a></div><section aria-labelledby="high-yield-title"><div class="section-head"><h2 id="high-yield-title">Meat and potatoes</h2><p class="muted">The essentials across all eight subjects</p></div>${pathCard(pathMap.get('HY'))}</section><section aria-labelledby="subjects-title"><div class="section-head"><h2 id="subjects-title">Eight full subject paths</h2><p class="muted">Study-guide order · 80 exam items</p></div><div class="subject-grid">${paths.filter(p=>p.id!=='HY').map(pathCard).join('')}</div></section><section class="progress-tools" id="progress-transfer" aria-label="Move progress between devices"></section>`;
    transfer.mount(document.querySelector('#progress-transfer'));
  }
  function showPath(id){
    const p=pathMap.get(id);if(!p){go('#home');return;}current=null;sourceContext=null;activePath=p;
    const s=pathStats(p),ls=pathLessons(p);
    main.innerHTML=`<div class="path-heading"><a class="text-button" href="#home">All paths</a><p class="eyebrow">${p.id==='HY'?'Separate high-yield review':'Complete subject path'}</p><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p><p class="muted">${s.lessons} lessons · ${s.checks} checks · ${s.complete} lessons complete</p><progress value="${s.done}" max="${s.total}" aria-label="${esc(p.name)} progress"></progress><div class="button-row"><a class="primary" href="${pathResume(p)}">Continue this path</a><a class="secondary" href="#missed/${p.id}">Review missed checks in this path</a></div></div>${p.objectives?.length?`<details class="outline"><summary>What this path covers</summary>${p.objectives.map(o=>`<section class="source-entry"><h2>${esc(o.title)}</h2>${o.parts.map(([h,b])=>`<h3>${esc(h)}</h3><p>${esc(b)}</p>`).join('')}</section>`).join('')}</details>`:''}<section aria-label="Lessons in this path"><h2>Choose a lesson</h2><ul class="lesson-list path-lessons">${ls.map(l=>{const progress=core.progress(l,state);return `<li><a href="${lessonHref(l.id)}" data-lesson="${l.id}"><span><span class="lesson-number">${p.id==='HY'?esc(subjectMap.get(l.subject).name)+' · ':esc(l.topic)+' · '}LESSON ${String(l.number).padStart(2,'0')}</span><span class="lesson-name">${esc(l.title)}</span><span class="muted">${l.steps.length} short steps · 5 checks</span></span><span class="lesson-status ${state.completed[l.id]?'done':''}">${state.completed[l.id]?'Complete':progress.done?'In progress':'Start'}</span></a></li>`;}).join('')}</ul></section>${p.supplement?.length?`<details class="outline"><summary>Additional lecture context</summary>${p.supplement.map(x=>`<p>${esc(x)}</p>`).join('')}</details>`:''}`;
  }
  function lessonHeader(l, phase, index, total, review=false) {
    const s=subjectMap.get(l.subject);
    const p=pathMap.get(l.path), stats=pathStats(p);
    return `<div class="lesson-top"><div class="lesson-tools"><div class="lesson-path-navigation"><a class="lesson-back" href="${pathHref(p)}" aria-label="All lessons in ${esc(p.name)}">All lessons</a><span class="path-tracker" title="${stats.complete} of ${stats.lessons} lessons complete"><span class="sr-only">Whole </span>Path <strong>${pathPercent(stats)}%</strong></span></div><details class="lesson-context"><summary>Lesson details</summary><div class="lesson-context-body"><p class="eyebrow">${l.path==='HY'?'Meat and potatoes · ':'Full path · '}${esc(s.name)}</p>${l.topic?`<p class="topic-name">${esc(l.topic)}</p>`:''}<p class="focus-line">${esc(l.focus)}</p></div></details></div><h1 class="lesson-title">${esc(l.title)}</h1><div class="step-meta"><span class="phase">${review?'Missed-check review':phase==='Step'?'Learn the idea':'Check your understanding'}</span><span>${phase} ${index} of ${total}</span></div><progress value="${index}" max="${total}" aria-label="${phase} ${index} of ${total}"></progress></div>`;
  }
  function sourceButton() { return '<button type="button" class="text-button local-sources">Sources</button>'; }
  function sourceFooter() { return `<div class="card-bottom"><span class="save-status">${storageOK?'Your place is saved':'Session only · storage unavailable'}</span>${sourceButton()}</div>`; }
  function outline(l) {
    return `<details class="outline"><summary>Lesson outline</summary><ol>${l.steps.map((s,i)=>`<li><a href="${lessonHref(l.id,i)}">${esc(presentation.title(s))}${state.read[s.id]?' · Read':''}</a></li>`).join('')}</ol><a href="${lessonHref(l.id,l.steps.length)}">Five checks</a>${l.pre?.length?`<h3>Foundation lessons</h3><ul>${l.pre.map(n=>lessonMap.get(`${l.path==='E'&&n<18?'N':l.path}-L${String(n).padStart(2,'0')}`)).filter(Boolean).map(x=>`<li><a href="${lessonHref(x.id)}">${esc(x.title)}</a></li>`).join('')}</ul>`:''}</details>`;
  }
  function showLesson(id,index) {
    const l=lessonMap.get(id);
    if (!l || !Number.isInteger(index) || index<0 || index>l.steps.length+5) {go('#home');return;}
    current={mode:'lesson',lesson:l,index};sourceContext={lesson:l,index};activePath=pathMap.get(l.path);
    state.last={mode:'lesson',lesson:l.id,index};state.pathLast[l.path]=state.last;save();
    if(index===l.steps.length+5){showRecap(l);return;}
    if(index>=l.steps.length){showQuestion(l,l.checks[index-l.steps.length],false);return;}
    const s=l.steps[index];
    main.innerHTML=`<div class="lesson-shell">${lessonHeader(l,'Step',index+1,l.steps.length)}<article class="study-card" aria-labelledby="idea-title">${s.kind==='case'?'<div class="case-tag">Apply the idea</div>':''}<h2 id="idea-title">${esc(presentation.title(s))}</h2>${presentation.body(l,s)}${s.sequence?`<ol class="teaching-sequence">${s.sequence.map(x=>`<li>${presentation.text(l,x)}</li>`).join('')}</ol>`:''}${s.details?presentation.definitions(l,s.details,"teaching-details definition-list"):''}${s.terms?`<details class="terms"><summary>Explain the terms</summary>${presentation.definitions(l,s.terms)}</details>`:''}${s.note?`<aside class="source-note"><h3>${esc(s.note.title)}</h3><p>${presentation.text(l,s.note.body)}</p></aside>`:''}${s.more?`<div class="explain-wrap"><button class="explain-button" aria-expanded="false" aria-controls="explanation" id="explain-more" type="button">Explain more <span aria-hidden="true">+</span></button><div id="explanation" class="explanation" hidden><h3>${esc(s.more.title)}</h3><p>${presentation.text(l,s.more.body)}</p><p class="muted">From the matching full path · page ${s.more.page}</p></div></div>`:''}${s.related?`<p class="related"><a href="${lessonHref(s.related.lesson,s.related.step)}">${esc(s.related.label)}</a></p>`:''}${sourceFooter()}</article><nav class="lesson-nav" aria-label="Lesson navigation"><button class="secondary" id="back-step" type="button">Back</button><button class="primary" id="next-step" type="button">${index===l.steps.length-1?'Start checks':'Next'}</button></nav>${outline(l)}</div>`;
    document.querySelector('#back-step').onclick=()=>go(index?lessonHref(l.id,index-1):pathHref(pathMap.get(l.path)));
    document.querySelector('#next-step').onclick=()=>{state.read[s.id]=true;reconcile();save();go(lessonHref(l.id,index+1));};
    const explain=document.querySelector('#explain-more');
    if(explain) explain.onclick=()=>{
      const open=explain.getAttribute('aria-expanded')==='true';
      explain.setAttribute('aria-expanded',String(!open));document.querySelector('#explanation').hidden=open;
      explain.innerHTML=`${open?'Explain more':'Show less'} <span aria-hidden="true">${open?'+':'−'}</span>`;
    };
    bindSources();
  }
  function answerValue(q,review) {
    const answers=review?state.review.answers:state.attempts;
    const drafts=review?state.review.drafts:state.drafts;
    return answers[q.id]?.value || drafts[q.id] || (q.fmt==='X'?q.rows.map(()=>[]):['M','O'].includes(q.fmt)?Array(q.key.length).fill(null):[]);
  }
  function feedback(q,result){
    if(!result)return '';
    const review=current?.mode==='review';
    const explain = value => presentation.text(questionMap.get(q.id).lesson,value);
    let reasons='';
    if(q.fmt==='M'){
      reasons=q.pairs.map((pair,i)=>`<section class="rationale"><h4>${i+1}. ${esc(pair[0])}</h4>${presentation.optionVerdict(result.value[i]===q.key[i],true)}<p><strong>You chose ${letter(result.value[i])}:</strong> ${esc(q.choices[result.value[i]])}</p><p><strong>Correct match ${letter(q.key[i])}:</strong> ${esc(q.choices[q.key[i]])}</p><p>${explain(pair[2])}</p></section>`).join('');
      const meanings=q.meanings||q.choices.map((c,i)=>q.pairs.find((p,j)=>q.key[j]===i)?.[2]||'');
      reasons+=`<section class="rationale"><h4>Compare every label</h4>${q.choices.map((c,i)=>`<p><strong>${letter(i)}. ${esc(c)}:</strong> ${explain(meanings[i])}</p>`).join('')}</section>`;
    }else if(q.fmt==='X'){
      reasons=q.rows.map((r,i)=>`<section class="rationale"><h4>Row ${i+1}. ${esc(r)}</h4>${q.choices.map((c,j)=>`<div class="rationale-option">${presentation.optionVerdict(q.key[i].includes(j),result.value[i].includes(j))}<p><strong>${letter(j)}. ${esc(c)}:</strong> ${q.key[i].includes(j)?'Select':'Do not select'}${result.value[i].includes(j)?' · You selected this':''}</p></div>`).join('')}<p>${explain(q.reasons[i])}</p></section>`).join('');
    }else if(q.fmt==='O'){
      reasons=q.key.map((v,i)=>`<section class="rationale"><h4>Position ${i+1}: ${letter(v)}. ${esc(q.choices[v])}</h4>${presentation.optionVerdict(result.value[i]===v,true)}<p>You placed ${letter(result.value[i])}. ${esc(q.choices[result.value[i]])} here.</p><p>${explain(q.reasons[v])}</p></section>`).join('');
    }else{
      reasons=q.choices.map((opt,i)=>`<section class="rationale"><h4>${letter(i)}. ${esc(opt)}</h4>${presentation.optionVerdict(q.key.includes(i),result.value.includes(i))}<p>${explain(q.reasons[i])}</p></section>`).join('');
    }
    return `<div class="feedback" id="answer-feedback" tabindex="-1" aria-label="Answer feedback">${presentation.summary(q,result,review)}<h3 class="rationale-heading">Why each option fits or doesn’t</h3>${q.reason?`<p>${explain(q.reason)}</p>`:''}${reasons}</div>`;
  }
  function questionFields(q,value,result){
    return presentation.questionFields(q,value,result);
  }
  function showQuestion(l,q,review) {
    const answers=review?state.review.answers:state.attempts;
    const result=answers[q.id],value=answerValue(q,review);
    const n=review?state.review.index+1:l.checks.indexOf(q)+1,total=review?state.review.queue.length:5;
    current={...current,question:q};sourceContext={lesson:l,index:l.steps.length+l.checks.indexOf(q)};
    activePath=pathMap.get(l.path);
    const format={M:'Matching',S:'Select two',A:'Select all that apply',X:'Matrix — select all that apply in each row',O:'Ordered response',C:'Choose one'}[q.fmt]||'Choose one';
    const help={M:'Choose one letter for each row. Letters may be reused or unused.',S:'Select exactly two options, then check your answer.',A:'Select every correct option, then check your answer.',X:'Select every supported column in each row. More than one column may apply.',O:'Place every displayed action in order. Use each letter once.'}[q.fmt]||'Select one option, then check your answer.';
    const fields=questionFields(q,value,result);
    main.innerHTML=`<div class="lesson-shell">${lessonHeader(l,'Check',n,total,review)}<article class="study-card"><span class="check-format">${format}</span><h2 id="question-title" class="question-title">${esc(q.stem)}</h2><p class="answer-help">${help}</p><form id="answer-form"><fieldset ${result?'disabled':''}><legend class="sr-only">${esc(q.stem)}</legend>${fields}</fieldset><div class="check-actions" ${result?'hidden':''}><button class="primary" type="submit" id="check-answer" ${core.ready(q,value)?'':'disabled'}>Check answer</button><span class="selection-status" aria-live="polite" id="selection-status"></span></div></form>${feedback(q,result)}${sourceFooter()}</article><nav class="lesson-nav" aria-label="Check navigation"><button class="secondary" id="back-step" type="button">Back</button><button class="primary" id="next-step" type="button" ${result?'':'disabled'}>${n===total?(review?'Finish review':'Finish lesson'):'Next'}</button></nav>${review?'<p class="muted">Your lesson progress is kept while you review.</p>':outline(l)}</div>`;
    const form=document.querySelector('#answer-form');
    function readInputs(){if(q.fmt==='X')return q.rows.map((_,i)=>[...form.querySelectorAll(`input[data-row="${i}"]:checked`)].map(s=>Number(s.value)));if(['M','O'].includes(q.fmt))return [...form.querySelectorAll('select')].map(s=>s.value===''?null:Number(s.value));return [...form.querySelectorAll('input:checked')].map(s=>Number(s.value));}
    function updateSelection(){
      const val=readInputs(),drafts=review?state.review.drafts:state.drafts;
      drafts[q.id]=val;save();
      document.querySelector('#check-answer').disabled=!core.ready(q,val);
      document.querySelector('#selection-status').textContent=q.fmt==='S'?`${val.length} of 2 selected`:q.fmt==='A'?`${val.length} selected`:core.ready(q,val)?'Ready to check':q.fmt==='O'?'Fill each position with a different letter.':q.fmt==='X'?'Choose at least one column in every row.':'';
    }
    form.addEventListener('change',updateSelection);
    if(!result)updateSelection();
    form.onsubmit=event=>{
      event.preventDefault();const val=readInputs();
      if((review?state.review.answers:state.attempts)[q.id] || !core.ready(q,val))return;
      const correct=core.score(q,val),a={value:val,correct,count:(state.attempts[q.id]?.count||0)+1};
      state.attempts[q.id]=a;delete state.drafts[q.id];
      if(review){state.review.answers[q.id]=a;delete state.review.drafts[q.id];}
      if(correct)state.missed=state.missed.filter(id=>id!==q.id);else if(!state.missed.includes(q.id))state.missed.push(q.id);
      reconcile();save();showQuestion(l,q,review);
      document.querySelector('#answer-feedback').focus({preventScroll:true});
      document.querySelector('#answer-feedback').scrollIntoView({block:'start',behavior:'auto'});
    };
    document.querySelector('#back-step').onclick=()=>{
      if(review)go(state.review.index?'#review/'+(state.review.index-1):'#missed');
      else go(lessonHref(l.id,current.index-1));
    };
    document.querySelector('#next-step').onclick=()=>{
      if(!(review?state.review.answers:state.attempts)[q.id])return;
      if(review)go(n===total?'#review-done':'#review/'+n);else go(lessonHref(l.id,current.index+1));
    };
    bindSources();
  }
  function firstUnfinished(l){
    const s=l.steps.findIndex(s=>!state.read[s.id]);if(s>=0)return s;
    const q=l.checks.findIndex(q=>!state.attempts[q.id]);return q>=0?l.steps.length+q:l.steps.length+5;
  }
  function showRecap(l){
    reconcile();save();const complete=Boolean(state.completed[l.id]);
    const tried=l.checks.filter(q=>state.attempts[q.id]).length;
    const correct=l.checks.filter(q=>state.attempts[q.id]?.correct).length;
    const missed=l.checks.filter(q=>state.missed.includes(q.id)).length;
    const route=pathLessons(pathMap.get(l.path));const next=route[route.findIndex(x=>x.id===l.id)+1];
    main.innerHTML=`<div class="lesson-shell">${lessonHeader(l,'Step',l.steps.length,l.steps.length)}<section class="study-card complete-card"><div class="complete-symbol" aria-hidden="true">${complete?'✓':'·'}</div><p class="eyebrow">Lesson ${l.number} recap</p><h2>${complete?'A good place to pause.':'There’s a little more to explore.'}</h2><p>${complete?'You’ve read every step and tried all five checks.':`You’ve read ${core.progress(l,state).ideas} of ${l.steps.length} steps and tried ${tried} of 5 checks.`}</p><p class="muted">${correct} of 5 checks correct on your latest attempts.${missed?` ${missed} saved for review.`:''}</p><div class="button-row">${!complete?`<a class="primary" href="${lessonHref(l.id,firstUnfinished(l))}">Return to unfinished work</a>`:next?`<a class="primary" href="${lessonHref(next.id)}">Next lesson</a>`:'<a class="primary" href="#home">All paths</a>'}${missed?'<a class="secondary" href="#missed">Review missed checks</a>':''}${next||!complete?'<a class="secondary" href="#home">All paths</a>':''}</div>${sourceFooter()}</section><nav class="lesson-nav"><a class="secondary" href="${lessonHref(l.id,l.steps.length+4)}">Back</a></nav>${outline(l)}</div>`;
    bindSources();
  }
  function startReview(queue){
    const returnTo=state.last?.mode==='lesson'?state.last:state.review?.returnTo||null;
    state.review={queue:[...queue],index:0,drafts:{},answers:{},returnTo};state.last={mode:'review'};save();go('#review/0');
  }
  function showMissed(pathId){
    current=null;sourceContext=null;activePath=pathMap.get(pathId)||null;
    const ids=data.lessons.filter(l=>!activePath||l.path===activePath.id).flatMap(l=>l.checks.map(q=>q.id)).filter(id=>state.missed.includes(id));
    const active=state.review && state.review.queue.some(id=>!state.review.answers[id]);
    main.innerHTML=`<div class="review-heading"><p class="eyebrow">A second look</p><h1>Review missed checks</h1>${activePath?`<p>${esc(activePath.name)}</p>`:''}<p>${ids.length?`${ids.length} ${ids.length===1?'check is':'checks are'} waiting for another try. Feedback stays hidden until you check each answer. A correct retry removes it from this list.`:'No missed checks are waiting. Any check you miss will appear here for another try.'}</p><div class="button-row">${ids.length?'<button class="primary" id="start-review" type="button">Review all missed checks</button>':''}${active?`<a class="secondary" href="#review/${state.review.index}">Resume current review</a>`:''}<a class="secondary" href="#home">All paths</a></div><ul class="review-list">${ids.map(id=>{
      const {lesson:l,question:q}=questionMap.get(id);
      return `<li><p class="eyebrow">${esc(pathMap.get(l.path).name)} · Lesson ${l.number} · Check ${l.checks.indexOf(q)+1}</p><h3>${esc(q.stem)}</h3><button class="text-button retry-one" data-id="${id}" type="button">Try this check</button> <a href="${lessonHref(l.id)}">Revisit lesson</a></li>`;
    }).join('')}</ul></div>`;
    const start=document.querySelector('#start-review');if(start)start.onclick=()=>startReview(ids);
    document.querySelectorAll('.retry-one').forEach(b=>b.onclick=()=>startReview([b.dataset.id]));
  }
  function showReview(index){
    if(!state.review || !Number.isInteger(index) || index<0 || index>=state.review.queue.length){go('#missed');return;}
    state.review.index=index;state.last={mode:'review'};save();
    const {lesson:l,question:q}=questionMap.get(state.review.queue[index]);
    current={mode:'review',lesson:l,index};showQuestion(l,q,true);
  }
  function finishReview(){
    if(!state.review){go('#missed');return;}
    const unfinished=state.review.queue.findIndex(id=>!state.review.answers[id]);
    if(unfinished>=0){go('#review/'+unfinished);return;}
    const count=state.review.queue.length,correct=Object.values(state.review.answers).filter(a=>a.correct).length;
    const lastQ=questionMap.get(state.review.queue[state.review.queue.length-1]);
    const returnTo=state.review.returnTo;
    state.review=null;
    const l=data.lessons.find(l=>!state.completed[l.id])||lastQ.lesson;
    state.last=returnTo||{mode:'lesson',lesson:l.id,index:firstUnfinished(l)};save();current=null;sourceContext=null;
    main.innerHTML=`<div class="lesson-shell"><section class="study-card complete-card"><div class="complete-symbol" aria-hidden="true">✓</div><p class="eyebrow">Review complete</p><h1>Keep building on it.</h1><p>${correct} of ${count} ${count===1?'check':'checks'} correct this time.</p><p class="muted">${state.missed.length?`${state.missed.length} ${state.missed.length===1?'check remains':'checks remain'} in your review list.`:'Your missed-check list is clear.'}</p><div class="button-row"><a class="primary" href="${resumeHref()}">Continue studying</a><a class="secondary" href="#home">All paths</a>${state.missed.length?'<a class="secondary" href="#missed">Review missed checks</a>':''}</div></section></div>`;
  }
  function openSources(){
    const l=sourceContext?.lesson;
    const s=l?subjectMap.get(l.subject):null;
    const step=l&&sourceContext.index<l.steps.length?l.steps[sourceContext.index]:null;
    let body=`<p class="muted">Teaching follows the supplied learning paths and Meyers’ updated study guide and blueprint. Checks retain the original wording, option order, answer key, and rationale. Page numbers below are PDF viewer pages. Refer to your private copies; the PDFs are not hosted on this website.</p>`;
    if(activePath&&activePath.id!=='HY'){
      const p=activePath;
      body+=`<section class="source-entry"><h3>${esc(p.name)}</h3><p>${esc(p.sourceFile)}</p>${l?`<p>Teaching · page ${l.page}<br>Checks · page ${l.checkPage}<br>Answer key and rationales · page ${l.keyPage}</p>`:''}<p>${esc(p.references)}</p></section>`;
      const notes=l?(p.sourceNotes||[]).filter(n=>l.codes.includes(n.code)):p.sourceNotes||[];
      body+=notes.map(n=>`<section class="source-entry"><h3>${esc(n.title)} · page ${n.page}</h3>${n.parts.map(([h,b])=>`<h4>${esc(h)}</h4><p>${esc(b)}</p>`).join('')}</section>`).join('');
      body+=(p.appendix||[]).map(a=>`<details class="source-entry"><summary>${esc(a.title)} · page ${a.page}</summary><p class="source-transcript">${esc(a.text)}</p></details>`).join('');
      document.querySelector('#sources-body').innerHTML=body;dialog.showModal();return;
    }
    if(l){
      body+=`<section class="source-entry"><h3>This lesson · ${esc(l.title)}</h3><p>Topic codes: ${l.codes.join(', ')}.</p><p>NUR2460 Exam 4 – High-Yield Guided Learning Path.pdf</p><p>Teaching and checks · page ${l.page}<br>Original answer key · page ${l.keyPage}</p></section>`;
      body+=`<section class="source-entry"><h3>Matching full path</h3><p>${esc(s.sourceFile)}</p>${step?.more?`<p>This step’s optional explanation: page ${step.more.page}.</p>`:''}<p>${esc(s.references)}</p></section>`;
      if(l.number===7)body+=`<section class="source-entry"><h3>Scarlet fever return to school</h3><p>${esc(data.sourceNotes[4][1])}</p><p>Retained from the high-yield PDF’s supplemental source note, page 29.</p></section>`;
      if(l.number===2)body+='<section class="source-entry"><h3>Postpartum source qualification</h3><p>The full depression path, page 45, describes differences in postpartum blues and depression timing across supplied sources. This qualification is also visible in the lesson.</p></section>';
    }else{
      body+=`<section class="source-entry"><h3>High-yield backbone</h3><p>NUR2460 Exam 4 – High-Yield Guided Learning Path.pdf</p><p>Teaching and checks · pages 2–27<br>Values and source differences · page 29</p></section>`;
      body+=data.subjects.map(s=>`<section class="source-entry"><h3>${esc(s.name)}</h3><p>${esc(s.sourceFile)}</p><p>${esc(s.references)}</p></section>`).join('');
    }
    body+='<section class="source-entry"><h3>About progress</h3><p>Progress belongs to this website on this device and browser. A lesson is complete after every teaching step is read and all five checks are attempted. Matching and select-two checks require the exact complete answer. Source PDF progress marks are separate from website progress.</p></section>';
    document.querySelector('#sources-body').innerHTML=body;dialog.showModal();
  }
  function bindSources(){
    document.querySelectorAll('.local-sources').forEach(b=>b.onclick=openSources);
    const id=current?.question?.id||current?.lesson?.steps[current.index]?.id;
    highlighter.mount(main.querySelector('.study-card'),id);
  }
  function render(route){
    highlighter.unmount();
    const parts=(typeof route==='string'?route:location.hash).slice(1).split('/');
    if(parts[0]==='lesson')showLesson(parts[1],/^\d+$/.test(parts[2]||'')?Number(parts[2]):0);
    else if(parts[0]==='path')showPath(parts[1]);
    else if(parts[0]==='missed')showMissed(parts[1]);
    else if(parts[0]==='review')showReview(/^\d+$/.test(parts[1]||'')?Number(parts[1]):0);
    else if(parts[0]==='review-done')finishReview();
    else showHome();
    document.body.classList.toggle('study-mode',Boolean(main.querySelector('.lesson-shell')));
    main.focus({preventScroll:true});window.scrollTo(0,0);
    document.title=current?`${current.lesson.title} · NUR2460 Exam 4`:activePath?`${activePath.name} · NUR2460 Exam 4`:'NUR2460 · Exam 4 study paths';
  }
  document.querySelector('#global-sources').onclick=openSources;
  document.querySelector('.skip').onclick=event=>{event.preventDefault();main.focus();};
  document.querySelector('#close-sources').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  window.addEventListener('hashchange',render);
  window.addEventListener('storage',event=>{
    if(event.key===STORAGE_KEY){try{state=core.normalize(JSON.parse(event.newValue),data);render();}catch(error){/* Keep this tab's valid state if another writer is malformed. */}}
  });
  const highlighter=window.StudyHighlights.create({getState:()=>state,onChange:highlights=>{state.highlights=highlights;save();return storageOK;}});
  const transfer=window.StudyTransfer.create({data,key:STORAGE_KEY,getState:()=>state,onChange:next=>{state=next;storageOK=true;warning.hidden=true;render('#home');}});
  window.StudyApp={render};
  save();render();
})();
