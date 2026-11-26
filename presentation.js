/* Shared presentation for every path and check format. Scoring stays in core.js. */
(function () {
  'use strict';
  const config = window.STUDY_PRESENTATION_DATA;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const letter = i => String.fromCharCode(65 + i);
  const escapePattern = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Sentence case for display labels; keep clinical acronyms and names intact.
  function label(value) {
    const clean = String(value).trim().replace(/[.,;:]+$/, '');
    const corrections = {
      'ect': 'ECT', 'es e': 'ESE', 'NDRI)': 'NDRI',
      'GAS/GABHS)': 'GAS/GABHS', 'CNS) stimulant': 'CNS stimulant'
    };
    return corrections[clean] || clean.replace(/^[a-z]/, c => c.toUpperCase());
  }
  const phraseCache = new Map();
  function phrases(l) {
    if (phraseCache.has(l.id)) return phraseCache.get(l.id);
    const related = l.path === 'HY' ? window.FULL_PATHS.lessons.filter(x => x.subject === l.subject) : [l];
    const list = [...related.flatMap(x => x.steps.flatMap(s => (s.terms || []).map(t => label(t[0])))), ...related.flatMap(x => config.emphasis[x.id] || [])];
    const unique = [...new Set(list.map(x => x.trim()).filter(x => x.length > 2))];
    phraseCache.set(l.id, unique);
    return unique;
  }
  function emphasize(text, values) {
    text = String(text);
    const terms = [...new Set(values)].filter(Boolean).sort((a,b) => b.length-a.length);
    if (!terms.length) return esc(text);
    const pattern = new RegExp(terms.map(escapePattern).join('|'), 'giu');
    let out = '', end = 0;
    for (const m of text.matchAll(pattern)) {
      const start = m.index, stop = start + m[0].length;
      if (/[\p{L}\p{N}]/u.test(text[start-1] || '') || /[\p{L}\p{N}]/u.test(text[stop] || '')) continue;
      out += esc(text.slice(end,start)) + '<strong class="key-term">' + esc(m[0]) + '</strong>';
      end = stop;
    }
    return out + esc(text.slice(end));
  }
  const text = (l, value, extra=[]) => emphasize(value,[...phrases(l),...extra]);
  const title = s => label(config.titles[s.id] || s.title);
  function body(l,s) {
    if (!s.body) return '';
    const f = config.steps[s.id] || {};
    let paragraphs = f.paragraphs?.join(' ') === s.body ? f.paragraphs : [s.body];
    if (paragraphs.length === 1 && s.body.split(/\s+/).length > 65) {
      const sentences = s.body.split(/(?<=[.!?])\s+(?=[A-Z])/);
      let group = []; paragraphs = [];
      for (const sentence of sentences) {
        if (group.join(' ').split(/\s+/).length >= 35) { paragraphs.push(group.join(' ')); group=[]; }
        group.push(sentence);
      }
      if (group.length) paragraphs.push(group.join(' '));
    }
    return paragraphs.map(p => `<p class="idea-body">${text(l,p,f.emphasis || [])}</p>`).join('');
  }
  function definitions(l, pairs, className='definition-list') {
    return `<dl class="${className}">${pairs.map(([name,meaning]) => `<div class="definition-card"><dt>${esc(label(name))}</dt><dd>${text(l,meaning)}</dd></div>`).join('')}</dl>`;
  }
  function status(correct,selected,result) {
    if (!result) return {className:'',label:''};
    if (correct && selected) return {className:'answer-correct',label:'✓ Your choice · Correct'};
    if (selected) return {className:'answer-wrong',label:'✕ Your choice · Incorrect'};
    if (correct) return {className:'answer-missed',label:'! You missed this · Correct answer'};
    return {className:'',label:''};
  }
  function differences(value,key) {
    return {wrong:value.filter(i=>!key.includes(i)),missed:key.filter(i=>!value.includes(i))};
  }
  function rowStatus(value,key) {
    const {wrong,missed}=differences(value,key);
    const parts=[];
    if(wrong.length)parts.push(`${wrong.length} wrong selection${wrong.length===1?'':'s'}`);
    if(missed.length)parts.push(`${missed.length} missed answer${missed.length===1?'':'s'}`);
    return {kind:wrong.length?'wrong':missed.length?'missed':'correct',label:parts.length?`${wrong.length?'✕':'!'} ${parts.join(' · ')}`:'✓ Correct'};
  }
  function choice(q,value,result,i,row=null) {
    const selected = row === null ? value.includes(i) : value[row]?.includes(i);
    const correct = row === null ? q.key.includes(i) : q.key[row].includes(i);
    const st = status(correct,selected,result);
    return `<label class="choice ${st.className}"><input type="${row !== null || ['A','S'].includes(q.fmt)?'checkbox':'radio'}" ${row === null?'name="answer"':`data-row="${row}"`} value="${i}" ${selected?'checked':''}><span><span class="choice-letter">${letter(i)}.</span> ${esc(q.choices[i])}${st.label?`<span class="choice-result">${st.label}</span>`:''}</span></label>`;
  }
  function questionFields(q,value,result) {
    if (q.fmt === 'X') return q.rows.map((row,i) => {const st=result?rowStatus(value[i],q.key[i]):null;return `<fieldset class="matrix-row ${st?'matrix-'+st.kind:''}"><legend>${i+1}. ${esc(row)}${st?`<span class="row-status status-${st.kind}">${st.label}</span>`:''}</legend>${q.choices.map((_,j) => choice(q,value,result,j,i)).join('')}</fieldset>`;}).join('');
    if (['M','O'].includes(q.fmt)) return `<div class="answer-bank" aria-label="Answer choices">${q.choices.map((c,i) => `<p><strong>${letter(i)}.</strong> ${esc(c)}</p>`).join('')}</div>${q.key.map((_,i) => {
      const correct = result && value[i] === q.key[i];
      const rowLabel = q.fmt === 'M' ? `Match ${i+1}: ${q.pairs[i][0]}` : `Position ${i+1}`;
      return `<label class="match-row ${result?(correct?'answer-correct':'answer-wrong'):''}"><span>${q.fmt==='M'?`${i+1}. ${esc(q.pairs[i][0])}`:`Position ${i+1}`}</span><select data-row="${i}" aria-label="${esc(rowLabel)}" ${result?'disabled':''}><option value="">Choose a letter</option>${q.choices.map((c,j) => `<option value="${j}" ${value[i]===j?'selected':''}>${letter(j)}. ${esc(c)}</option>`).join('')}</select>${result?`<span class="choice-result">${correct?'✓ Your choice · Correct':`✕ Your choice · Incorrect. Correct: ${letter(q.key[i])}.`}</span>`:''}</label>`;
    }).join('')}`;
    return `<div class="choices">${q.choices.map((_,i) => choice(q,value,result,i)).join('')}</div>`;
  }
  function chip(q,i,kind,label) {
    return `<span class="answer-chip chip-${kind}" aria-label="${esc(`${letter(i)}. ${q.choices[i]} — ${label}`)}"><span aria-hidden="true">${kind==='correct'?'✓':kind==='missed'?'!':'✕'}</span> ${letter(i)}</span>`;
  }
  function chips(q,values,key) {
    return values.map(i => chip(q,i,key.includes(i)?'correct':'wrong',key.includes(i)?'your correct choice':'your incorrect choice')).join('');
  }
  function selectionSummary(q,value,key) {
    const {wrong,missed}=differences(value,key);
    const right=value.filter(i=>key.includes(i));
    const detail=(values,kind,label)=>values.map(i=>`<div class="answer-difference difference-${kind}"><strong>${label}</strong><span>${chip(q,i,kind,label)} ${esc(q.choices[i])}</span></div>`).join('');
    return `${right.length?`<div class="answer-summary-line"><strong>You got right</strong><span class="answer-chips">${chips(q,right,key)}</span></div>`:''}${detail(wrong,'wrong','Wrong selection')}${detail(missed,'missed','You missed')}`;
  }
  function summary(q,result,review) {
    let comparison = '';
    if (['M','O'].includes(q.fmt)) {
      if (result.correct) comparison = `<p>All ${q.key.length} ${q.fmt==='M'?'matches':'positions'} correct.</p>`;
      else comparison = `<div class="answer-comparison">${q.key.map((key,i) => {const correct=result.value[i]===key;return `<div class="answer-comparison-row comparison-${correct?'correct':'wrong'}"><div class="row-result-title"><strong>${q.fmt==='M'?'Match':'Position'} ${i+1}</strong><span class="status-${correct?'correct':'wrong'}">${correct?'✓ Correct':'✕ Incorrect'}</span></div>${correct?'':selectionSummary(q,[result.value[i]],[key])}</div>`;}).join('')}</div>`;
    } else if (q.fmt === 'X') {
      if (result.correct) comparison = '<p>All rows correct.</p>';
      else {const rows=q.rows.map((_,i)=>rowStatus(result.value[i],q.key[i]));comparison=`<p class="matrix-result-count">${rows.filter(s=>s.kind==='correct').length} of ${rows.length} rows correct.</p><div class="answer-comparison">${rows.map((st,i)=>`<div class="answer-comparison-row comparison-${st.kind}"><div class="row-result-title"><strong>Row ${i+1}</strong><span class="status-${st.kind}">${st.label}</span></div>${st.kind==='correct'?'':selectionSummary(q,result.value[i],q.key[i])}</div>`).join('')}</div>`;}
    } else {
      comparison = result.correct?`<div class="answer-summary-line"><strong>Your answer</strong><span class="answer-chips">${chips(q,result.value,q.key)}</span></div>`:selectionSummary(q,result.value,q.key);
    }
    return `<div class="feedback-banner ${result.correct?'':'incorrect'}"><h3>${result.correct?'Correct.':'Not quite.'}</h3>${comparison}${!result.correct?'<p class="feedback-note">Saved to missed checks.</p>':review?'<p class="feedback-note">Removed from missed checks.</p>':''}</div>`;
  }
  function optionVerdict(correct,selected) {
    const st=status(correct,selected,true);
    return `<span class="verdict ${st.className||'answer-neutral'}">${st.label||'Not selected · Not required'}</span>`;
  }
  window.StudyPresentation = {text,title,body,definitions,questionFields,summary,optionVerdict};
})();
