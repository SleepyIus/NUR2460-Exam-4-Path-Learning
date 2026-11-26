(function () {
  'use strict';
  const data = window.STUDY_DATA, core = window.StudyCore;
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
    return 'Begin with depression and immediate safety.';
  }
  function showHome() {
    current = null; sourceContext = null;
    const complete = Object.keys(state.completed).length;
    const attempted = Object.keys(state.attempts).length;
    main.innerHTML = `<section class="hero" aria-labelledby="home-title"><div><p class="eyebrow">Your guided review · Meyers’ blueprint</p><h1 id="home-title">A little at a time.</h1><p class="intro">Learn one idea, connect it to care, then check your understanding. Your next step is saved here.</p><a class="primary" id="continue-studying" href="${resumeHref()}">Continue studying</a><span class="resume-detail">${esc(resumeLabel())}</span></div><div class="hero-progress"><div><strong>${complete}<span style="font-size:.42em;letter-spacing:0"> / 13</span></strong><p class="muted">lessons completed</p></div><div class="progress-track"><progress value="${complete}" max="13" aria-label="Lessons completed"></progress><p class="muted" style="margin-top:12px">${attempted} of 65 checks tried</p></div></div></section>
      <div class="study-tools"><p class="muted">${storageOK?'Progress saves on this device and browser.':'Progress is currently kept in this tab.'}<br>Take a break whenever you need.</p><a class="secondary" id="review-missed" href="#missed">Review missed checks${state.missed.length ? ` (${state.missed.length})` : ''}</a></div>
      <section aria-labelledby="subjects-title"><div class="section-head"><h2 id="subjects-title">Your eight subjects</h2><p class="muted">Study-guide order · 80 exam items</p></div><div class="subject-grid">${data.subjects.map((s,i)=>{
        const lessons = data.lessons.filter(l=>l.subject===s.id);
        const p = lessons.map(l=>core.progress(l,state));
        const done = p.reduce((v,p)=>v+p.done,0), total = p.reduce((v,p)=>v+p.total,0);
        const count = lessons.filter(l=>state.completed[l.id]).length;
        return `<article class="subject-card" data-subject="${s.id}"><div class="subject-meta"><span class="weight">${s.weight} exam items</span><span>${s.weight/80*100}% of blueprint</span></div><h3>${esc(s.name)}</h3><div class="subject-progress"><div class="progress-label"><span>${count} of ${lessons.length} ${lessons.length===1?'lesson':'lessons'} complete</span><span>${Math.round(done/total*100)}%</span></div><progress value="${done}" max="${total}" aria-label="${esc(s.name)} progress"></progress></div><ul class="lesson-list">${lessons.map(l=>{
          const p=core.progress(l,state), done=state.completed[l.id];
          return `<li><a href="${lessonHref(l.id)}" data-lesson="${l.id}"><span><span class="lesson-number">LESSON ${String(l.number).padStart(2,'0')}</span><span class="lesson-name">${esc(l.title)}</span></span><span class="lesson-status ${done?'done':''}">${done?'Complete':p.done?'In progress':'Start'}</span></a></li>`;
        }).join('')}</ul></article>`;
      }).join('')}</div></section>`;
  }
  function lessonHeader(l, phase, index, total, review=false) {
    const s=subjectMap.get(l.subject);
    return `<div class="lesson-top"><p class="eyebrow">${esc(s.name)}</p><h1 class="lesson-title">${esc(l.title)}</h1><p class="focus-line">${esc(l.focus)}</p><div class="step-meta"><span class="phase">${review?'Missed-check review':phase==='Step'?'Learn the idea':'Check your understanding'}</span><span>${phase} ${index} of ${total}</span></div><progress value="${index}" max="${total}" aria-label="${phase} ${index} of ${total}"></progress></div>`;
  }
  function sourceButton() { return '<button type="button" class="text-button local-sources">Sources</button>'; }
  function sourceFooter() { return `<div class="card-bottom"><span class="save-status">${storageOK?'Your place is saved':'Session only · storage unavailable'}</span>${sourceButton()}</div>`; }
  function outline(l) {
    return `<details class="outline"><summary>Lesson outline</summary><ol>${l.steps.map((s,i)=>`<li><a href="${lessonHref(l.id,i)}">${esc(s.title)}${state.read[s.id]?' · Read':''}</a></li>`).join('')}</ol><a href="${lessonHref(l.id,l.steps.length)}">Five checks</a></details>`;
  }
  function showLesson(id,index) {
    const l=lessonMap.get(id);
    if (!l || !Number.isInteger(index) || index<0 || index>l.steps.length+5) {go('#home');return;}
    current={mode:'lesson',lesson:l,index};sourceContext={lesson:l,index};
    state.last={mode:'lesson',lesson:l.id,index};save();
    if(index===l.steps.length+5){showRecap(l);return;}
    if(index>=l.steps.length){showQuestion(l,l.checks[index-l.steps.length],false);return;}
    const s=l.steps[index];
    main.innerHTML=`<div class="lesson-shell">${lessonHeader(l,'Step',index+1,l.steps.length)}<article class="study-card" aria-labelledby="idea-title">${s.kind==='case'?'<div class="case-tag">Apply the idea</div>':''}<h2 id="idea-title">${esc(s.title)}</h2><p class="idea-body">${esc(s.body)}</p>${s.note?`<aside class="source-note"><h3>${esc(s.note.title)}</h3><p>${esc(s.note.body)}</p></aside>`:''}${s.more?`<div class="explain-wrap"><button class="explain-button" aria-expanded="false" aria-controls="explanation" id="explain-more" type="button">Explain more <span aria-hidden="true">+</span></button><div id="explanation" class="explanation" hidden><h3>${esc(s.more.title)}</h3><p>${esc(s.more.body)}</p><p class="muted">From the matching full path · page ${s.more.page}</p></div></div>`:''}${s.related?`<p class="related"><a href="${lessonHref(s.related.lesson,s.related.step)}">${esc(s.related.label)}</a></p>`:''}${sourceFooter()}</article><nav class="lesson-nav" aria-label="Lesson navigation"><button class="secondary" id="back-step" type="button">Back</button><button class="primary" id="next-step" type="button">${index===l.steps.length-1?'Start checks':'Next'}</button></nav>${outline(l)}</div>`;
    document.querySelector('#back-step').onclick=()=>go(index?lessonHref(l.id,index-1):'#home');
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
    return answers[q.id]?.value || drafts[q.id] || (q.fmt==='M'?Array(q.pairs.length).fill(null):[]);
  }
  function answerText(q,value) {
    if(q.fmt==='M')return value.map((v,i)=>`${i+1}–${letter(v)}`).join(', ');
    return value.map(v=>`${letter(v)}. ${q.choices[v]}`).join(' · ');
  }
  function feedback(q,result) {
    if(!result)return '';
    const review=current?.mode==='review';
    return `<div class="feedback" id="answer-feedback" tabindex="-1" aria-label="Answer feedback"><div class="feedback-banner ${result.correct?'':'incorrect'}"><h3>${result.correct?'Correct.':'Keep this one for review.'}</h3><p><strong>Your answer:</strong> ${esc(answerText(q,result.value))}</p><p><strong>Correct answer:</strong> ${esc(answerText(q,q.key))}</p><p>${result.correct?(review?'Removed from your missed checks.':'Take a moment with the reasoning, then continue when you’re ready.'):'Saved to your missed checks. Read the reasoning, then continue when you’re ready.'}</p></div><h3 class="rationale-heading">Why each option fits or doesn’t</h3>${q.fmt==='M'?q.pairs.map((pair,i)=>{
      const chosen=result.value[i],right=q.key[i];
      return `<section class="rationale"><h4>${i+1}. ${esc(pair[0])}</h4><p><strong>You chose ${letter(chosen)}:</strong> ${esc(q.choices[chosen])}</p><p><strong>Correct match ${letter(right)}:</strong> ${esc(q.choices[right])}</p><p>${esc(pair[2])}</p>${chosen!==right?`<p>${letter(chosen)} belongs with “${esc(q.pairs[q.key.indexOf(chosen)][0])}”: ${esc(q.pairs[q.key.indexOf(chosen)][2])}</p>`:''}</section>`;
    }).join(''):q.choices.map((opt,i)=>`<section class="rationale"><h4>${letter(i)}. ${esc(opt)}</h4><span class="verdict ${q.key.includes(i)?'':'wrong'}">${q.key.includes(i)?'Correct option':'Incorrect option'}</span>${result.value.includes(i)?'<span class="muted">You selected this</span>':''}<p>${esc(q.reasons[i])}</p></section>`).join('')}</div>`;
  }
  function showQuestion(l,q,review) {
    const answers=review?state.review.answers:state.attempts;
    const result=answers[q.id],value=answerValue(q,review);
    const n=review?state.review.index+1:l.checks.indexOf(q)+1,total=review?state.review.queue.length:5;
    current={...current,question:q};sourceContext={lesson:l,index:l.steps.length+l.checks.indexOf(q)};
    const format=q.fmt==='M'?'Matching':q.fmt==='S'?'Select two':'Choose one';
    const help=q.fmt==='M'?'Choose one letter for each row.':q.fmt==='S'?'Select exactly two options, then check your answer.':'Select one option, then check your answer.';
    const fields=q.fmt==='M'?`<div class="answer-bank" aria-label="Answer choices">${q.choices.map((c,i)=>`<p><strong>${letter(i)}.</strong> ${esc(c)}</p>`).join('')}</div>${q.pairs.map((p,i)=>`<label class="match-row"><span>${i+1}. ${esc(p[0])}</span><select data-row="${i}" aria-label="Match ${i+1}: ${esc(p[0])}" ${result?'disabled':''}><option value="">Choose a letter</option>${q.choices.map((c,j)=>`<option value="${j}" ${value[i]===j?'selected':''}>${letter(j)}. ${esc(c)}</option>`).join('')}</select></label>`).join('')}`:`<div class="choices">${q.choices.map((c,i)=>`<label class="choice"><input type="${q.fmt==='S'?'checkbox':'radio'}" name="answer" value="${i}" ${value.includes(i)?'checked':''} ${result?'disabled':''}><span><span class="choice-letter">${letter(i)}.</span> ${esc(c)}</span></label>`).join('')}</div>`;
    main.innerHTML=`<div class="lesson-shell">${lessonHeader(l,'Check',n,total,review)}<article class="study-card"><span class="check-format">${format}</span><h2 id="question-title" class="question-title">${esc(q.stem)}</h2><p class="answer-help">${help}</p><form id="answer-form"><fieldset ${result?'disabled':''}><legend class="sr-only">${esc(q.stem)}</legend>${fields}</fieldset><div class="check-actions" ${result?'hidden':''}><button class="primary" type="submit" id="check-answer" ${core.ready(q,value)?'':'disabled'}>Check answer</button><span class="selection-status" aria-live="polite" id="selection-status"></span></div></form>${feedback(q,result)}${sourceFooter()}</article><nav class="lesson-nav" aria-label="Check navigation"><button class="secondary" id="back-step" type="button">Back</button><button class="primary" id="next-step" type="button" ${result?'':'disabled'}>${n===total?(review?'Finish review':'Finish lesson'):'Next'}</button></nav>${review?'<p class="muted">Your lesson progress is kept while you review.</p>':outline(l)}</div>`;
    const form=document.querySelector('#answer-form');
    function readInputs(){return q.fmt==='M'?[...form.querySelectorAll('select')].map(s=>s.value===''?null:Number(s.value)):[...form.querySelectorAll('input:checked')].map(s=>Number(s.value));}
    function updateSelection(){
      const val=readInputs(),drafts=review?state.review.drafts:state.drafts;
      drafts[q.id]=val;save();
      document.querySelector('#check-answer').disabled=!core.ready(q,val);
      document.querySelector('#selection-status').textContent=q.fmt==='S'?`${val.length} of 2 selected`:q.fmt==='M'?`${val.filter(v=>v!==null).length} of ${q.pairs.length} matched`:val.length?'Ready to check':'';
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
    const next=data.lessons[l.number];
    main.innerHTML=`<div class="lesson-shell">${lessonHeader(l,'Step',l.steps.length,l.steps.length)}<section class="study-card complete-card"><div class="complete-symbol" aria-hidden="true">${complete?'✓':'·'}</div><p class="eyebrow">Lesson ${l.number} recap</p><h2>${complete?'A good place to pause.':'There’s a little more to explore.'}</h2><p>${complete?'You’ve read every step and tried all five checks.':`You’ve read ${core.progress(l,state).ideas} of ${l.steps.length} steps and tried ${tried} of 5 checks.`}</p><p class="muted">${correct} of 5 checks correct on your latest attempts.${missed?` ${missed} saved for review.`:''}</p><div class="button-row">${!complete?`<a class="primary" href="${lessonHref(l.id,firstUnfinished(l))}">Return to unfinished work</a>`:next?`<a class="primary" href="${lessonHref(next.id)}">Next lesson</a>`:'<a class="primary" href="#home">All subjects</a>'}${missed?'<a class="secondary" href="#missed">Review missed checks</a>':''}${next||!complete?'<a class="secondary" href="#home">All subjects</a>':''}</div>${sourceFooter()}</section><nav class="lesson-nav"><a class="secondary" href="${lessonHref(l.id,l.steps.length+4)}">Back</a></nav>${outline(l)}</div>`;
    bindSources();
  }
  function startReview(queue){
    const returnTo=state.last?.mode==='lesson'?state.last:state.review?.returnTo||null;
    state.review={queue:[...queue],index:0,drafts:{},answers:{},returnTo};state.last={mode:'review'};save();go('#review/0');
  }
  function showMissed(){
    current=null;sourceContext=null;
    const ids=data.lessons.flatMap(l=>l.checks.map(q=>q.id)).filter(id=>state.missed.includes(id));
    const active=state.review && state.review.queue.some(id=>!state.review.answers[id]);
    main.innerHTML=`<div class="review-heading"><p class="eyebrow">A second look</p><h1>Review missed checks</h1><p>${ids.length?`${ids.length} ${ids.length===1?'check is':'checks are'} waiting for another try. Feedback stays hidden until you check each answer. A correct retry removes it from this list.`:'No missed checks are waiting. Any check you miss will appear here for another try.'}</p><div class="button-row">${ids.length?'<button class="primary" id="start-review" type="button">Review all missed checks</button>':''}${active?`<a class="secondary" href="#review/${state.review.index}">Resume current review</a>`:''}<a class="secondary" href="#home">All subjects</a></div><ul class="review-list">${ids.map(id=>{
      const {lesson:l,question:q}=questionMap.get(id);
      return `<li><p class="eyebrow">Lesson ${l.number} · Check ${l.checks.indexOf(q)+1}</p><h3>${esc(q.stem)}</h3><button class="text-button retry-one" data-id="${id}" type="button">Try this check</button> <a href="${lessonHref(l.id)}">Revisit lesson</a></li>`;
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
    main.innerHTML=`<div class="lesson-shell"><section class="study-card complete-card"><div class="complete-symbol" aria-hidden="true">✓</div><p class="eyebrow">Review complete</p><h1>Keep building on it.</h1><p>${correct} of ${count} ${count===1?'check':'checks'} correct this time.</p><p class="muted">${state.missed.length?`${state.missed.length} ${state.missed.length===1?'check remains':'checks remain'} in your review list.`:'Your missed-check list is clear.'}</p><div class="button-row"><a class="primary" href="${resumeHref()}">Continue studying</a><a class="secondary" href="#home">All subjects</a>${state.missed.length?'<a class="secondary" href="#missed">Review missed checks</a>':''}</div></section></div>`;
  }
  function openSources(){
    const l=sourceContext?.lesson;
    const s=l?subjectMap.get(l.subject):null;
    const step=l&&sourceContext.index<l.steps.length?l.steps[sourceContext.index]:null;
    let body=`<p class="muted">Teaching follows the supplied high-yield PDF and Meyers’ updated study guide and blueprint. Checks retain the original wording, option order, answer key, and rationale. Page numbers below are PDF viewer pages. Refer to your private copies; the PDFs are not hosted on this website.</p>`;
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
  function bindSources(){document.querySelectorAll('.local-sources').forEach(b=>b.onclick=openSources);}
  function render(){
    const parts=location.hash.slice(1).split('/');
    if(parts[0]==='lesson')showLesson(parts[1],/^\d+$/.test(parts[2]||'')?Number(parts[2]):0);
    else if(parts[0]==='missed')showMissed();
    else if(parts[0]==='review')showReview(/^\d+$/.test(parts[1]||'')?Number(parts[1]):0);
    else if(parts[0]==='review-done')finishReview();
    else showHome();
    main.focus({preventScroll:true});window.scrollTo(0,0);
    document.title=current?`${current.lesson.title} · NUR2460 Exam 4`:'NUR2460 · Exam 4 study path';
  }
  document.querySelector('#global-sources').onclick=openSources;
  document.querySelector('.skip').onclick=event=>{event.preventDefault();main.focus();};
  document.querySelector('#close-sources').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  window.addEventListener('hashchange',render);
  window.addEventListener('storage',event=>{
    if(event.key===STORAGE_KEY){try{state=core.normalize(JSON.parse(event.newValue),data);render();}catch(error){/* Keep this tab's valid state if another writer is malformed. */}}
  });
  save();render();
})();
