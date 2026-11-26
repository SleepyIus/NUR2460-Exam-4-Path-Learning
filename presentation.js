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
    if (correct) return {className:'answer-missed',label:'✓ Correct · Not selected'};
    return {className:'',label:''};
  }
  function choice(q,value,result,i,row=null) {
    const selected = row === null ? value.includes(i) : value[row]?.includes(i);
    const correct = row === null ? q.key.includes(i) : q.key[row].includes(i);
    const st = status(correct,selected,result);
    return `<label class="choice ${st.className}"><input type="${row !== null || ['A','S'].includes(q.fmt)?'checkbox':'radio'}" ${row === null?'name="answer"':`data-row="${row}"`} value="${i}" ${selected?'checked':''}><span><span class="choice-letter">${letter(i)}.</span> ${esc(q.choices[i])}${st.label?`<span class="choice-result">${st.label}</span>`:''}</span></label>`;
  }
  function questionFields(q,value,result) {
    if (q.fmt === 'X') return q.rows.map((row,i) => `<fieldset class="matrix-row"><legend>${i+1}. ${esc(row)}</legend>${q.choices.map((_,j) => choice(q,value,result,j,i)).join('')}</fieldset>`).join('');
    if (['M','O'].includes(q.fmt)) return `<div class="answer-bank" aria-label="Answer choices">${q.choices.map((c,i) => `<p><strong>${letter(i)}.</strong> ${esc(c)}</p>`).join('')}</div>${q.key.map((_,i) => {
      const correct = result && value[i] === q.key[i];
      const rowLabel = q.fmt === 'M' ? `Match ${i+1}: ${q.pairs[i][0]}` : `Position ${i+1}`;
      return `<label class="match-row ${result?(correct?'answer-correct':'answer-wrong'):''}"><span>${q.fmt==='M'?`${i+1}. ${esc(q.pairs[i][0])}`:`Position ${i+1}`}</span><select data-row="${i}" aria-label="${esc(rowLabel)}" ${result?'disabled':''}><option value="">Choose a letter</option>${q.choices.map((c,j) => `<option value="${j}" ${value[i]===j?'selected':''}>${letter(j)}. ${esc(c)}</option>`).join('')}</select>${result?`<span class="choice-result">${correct?'✓ Your choice · Correct':`✕ Your choice · Incorrect. Correct: ${letter(q.key[i])}.`}</span>`:''}</label>`;
    }).join('')}`;
    return `<div class="choices">${q.choices.map((_,i) => choice(q,value,result,i)).join('')}</div>`;
  }
  function chip(q,i,correct,label) {
    return `<span class="answer-chip ${correct?'chip-correct':'chip-wrong'}" aria-label="${esc(`${letter(i)}. ${q.choices[i]} — ${label}`)}"><span aria-hidden="true">${correct?'✓':'✕'}</span> ${letter(i)}</span>`;
  }
  function chips(q,values,key,selected=true) {
    return values.map(i => chip(q,i,key.includes(i),selected?(key.includes(i)?'your correct choice':'your incorrect choice'):'correct answer')).join('');
  }
  function summary(q,result,review) {
    let comparison = '';
    if (['M','O'].includes(q.fmt)) {
      if (result.correct) comparison = `<p>All ${q.key.length} ${q.fmt==='M'?'matches':'positions'} correct.</p>`;
      else comparison = `<div class="answer-comparison">${q.key.map((key,i) => `<div class="answer-comparison-row"><span>${q.fmt==='M'?'Match':'Position'} ${i+1}</span><span class="comparison-pair"><span>You chose ${chip(q,result.value[i],result.value[i]===key,'your choice')}</span>${result.value[i]===key?'':`<span>Correct ${chip(q,key,true,'correct answer')}</span>`}</span></div>`).join('')}</div>`;
    } else if (q.fmt === 'X') {
      if (result.correct) comparison = '<p>All rows correct.</p>';
      else comparison = `<div class="answer-comparison">${q.rows.map((_,i) => { const equal = result.value[i].length===q.key[i].length && q.key[i].every(x=>result.value[i].includes(x)); return `<div class="answer-comparison-row"><span>Row ${i+1}</span><span class="comparison-pair"><span>You chose ${chips(q,result.value[i],q.key[i])}</span>${equal?'':`<span>Correct ${chips(q,q.key[i],q.key[i],false)}</span>`}</span></div>`; }).join('')}</div>`;
    } else {
      comparison = `<div class="answer-summary-line"><strong>${result.correct?'Your answer':'You chose'}</strong><span class="answer-chips">${chips(q,result.value,q.key)}</span></div>${result.correct?'':`<div class="answer-summary-line"><strong>Correct answer</strong><span class="answer-chips">${chips(q,q.key,q.key,false)}</span></div>`}`;
    }
    return `<div class="feedback-banner ${result.correct?'':'incorrect'}"><h3>${result.correct?'Correct.':'Not quite.'}</h3>${comparison}${!result.correct?'<p class="feedback-note">Saved to missed checks.</p>':review?'<p class="feedback-note">Removed from missed checks.</p>':''}</div>`;
  }
  window.StudyPresentation = {text,title,body,definitions,questionFields,summary};
})();
