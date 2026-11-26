/* Pure scoring and progress helpers. Existing version-1 high-yield progress stays valid. */
(function (root) {
  'use strict';
  const fresh = () => ({version:1,last:null,pathLast:{},read:{},attempts:{},drafts:{},completed:{},missed:[],review:null,highlights:{}});
  const highlightColors=['yellow','green','blue','pink'];
  const highlightStyles=[...highlightColors,'underline','strike'];
  const highlightStyle=h=>h.style||'yellow';
  const highlightKind=h=>['underline','strike'].includes(highlightStyle(h))?highlightStyle(h):'color';
  const highlightColor=h=>highlightKind(h)==='color'?highlightStyle(h):(h.color||null);
  const highlightVariant=h=>highlightStyle(h)+':'+(h.color||'');
  const validHighlight = h => h && typeof h==='object' && typeof h.block==='string' && /^[a-z][a-z0-9:-]{0,80}$/.test(h.block) && Number.isInteger(h.start) && Number.isInteger(h.end) && h.start>=0 && h.end>h.start && h.end<=100000 && typeof h.quote==='string' && h.quote.length===h.end-h.start && h.quote.length<=10000 && (h.style===undefined||highlightStyles.includes(h.style)) && (h.color===undefined||(highlightKind(h)!=='color'&&highlightColors.includes(h.color)));
  const sliceHighlight=(h,start,end)=>({...h,start,end,quote:h.quote.slice(start-h.start,end-h.start)});
  function subtractHighlight(h,cut){
    const start=Math.max(h.start,cut.start),end=Math.min(h.end,cut.end);
    if(h.block!==cut.block||end<=start||h.quote.slice(start-h.start,end-h.start)!==cut.quote.slice(start-cut.start,end-cut.start))return[h];
    return [...(h.start<start?[sliceHighlight(h,h.start,start)]:[]),...(h.end>end?[sliceHighlight(h,end,h.end)]:[])];
  }
  function highlightRanges(entries){
    let resolved=[];
    for(const {block,start,end,quote,style,color} of (Array.isArray(entries)?entries:[]).filter(validHighlight)){
      const h={block,start,end,quote,...(style&&style!=='yellow'?{style}:{}),...(color?{color}:{})};
      // Later color choices replace only their overlap. Underline and strike
      // are independent layers, so they can coexist with a colored highlight.
      resolved=resolved.flatMap(previous=>highlightKind(previous)===highlightKind(h)&&highlightVariant(previous)!==highlightVariant(h)?subtractHighlight(previous,h):[previous]);
      resolved.push(h);
    }
    const sorted=resolved.sort((a,b)=>a.block.localeCompare(b.block)||highlightVariant(a).localeCompare(highlightVariant(b))||a.start-b.start||a.end-b.end);
    const merged=[];
    for(const h of sorted){
      const previous=merged[merged.length-1];
      const overlap=previous?Math.min(previous.end,h.end)-h.start:-1;
      if(previous && previous.block===h.block && highlightVariant(previous)===highlightVariant(h) && overlap>=0 && previous.quote.slice(h.start-previous.start,h.start-previous.start+overlap)===h.quote.slice(0,overlap)){
        if(h.end>previous.end){previous.quote+=h.quote.slice(previous.end-h.start);previous.end=h.end;}
      }else merged.push(h);
    }
    return merged.sort((a,b)=>a.block.localeCompare(b.block)||a.start-b.start||a.end-b.end||highlightStyle(a).localeCompare(highlightStyle(b)));
  }
  function formatHighlights(entries,items,style,remove=false,color){
    if((style!==null&&!highlightStyles.includes(style))||(color!==undefined&&!highlightColors.includes(color)))return highlightRanges(entries);
    let next=highlightRanges(entries);
    for(const item of (Array.isArray(items)?items:[]).filter(validHighlight)){
      const h={block:item.block,start:item.start,end:item.end,quote:item.quote,...(style&&style!=='yellow'?{style}:{}),...(['underline','strike'].includes(style)&&color?{color}:{})};
      next=next.flatMap(previous=>style===null||highlightKind(previous)===highlightKind(h)?subtractHighlight(previous,h):[previous]);
      if(style!==null&&!remove)next.push(h);
    }
    return highlightRanges(next);
  }
  function reanchorHighlight(h,text){
    if(text.slice(h.start,h.end)===h.quote)return h;
    // Comma or word-spacing copyedits can shift a saved range. Reattach only
    // when the same characters identify one unambiguous passage in its block.
    const quote=h.quote.replace(/[,\s]/g,'');
    if(!quote.trim())return h;
    const offsets=[],characters=[];
    for(let i=0;i<text.length;i++)if(!/[,\s]/.test(text[i])){offsets.push(i);characters.push(text[i]);}
    const plain=characters.join(''),at=plain.indexOf(quote);
    if(at<0||plain.indexOf(quote,at+1)!==-1)return h;
    let start=offsets[at],end=offsets[at+quote.length-1]+1;
    if(h.quote.startsWith(',')&&text[start-1]===',')start--;
    if(h.quote.endsWith(',')&&text[end]===',')end++;
    return {...h,start,end,quote:text.slice(start,end)};
  }
  function mergeHighlights(a={},b={}){
    const merged={};
    for(const id of new Set([...Object.keys(a),...Object.keys(b)])){
      const ranges=highlightRanges([...(Array.isArray(a[id])?a[id]:[]),...(Array.isArray(b[id])?b[id]:[])]);
      if(ranges.length)merged[id]=ranges;
    }
    return merged;
  }
  const validIndex=(v,q)=>Number.isInteger(v)&&v>=0&&v<q.choices.length;
  const uniqueValid=(v,q)=>Array.isArray(v)&&new Set(v).size===v.length&&v.every(x=>validIndex(x,q));
  function ready(q,value){
    if(!Array.isArray(value))return false;
    if(q.fmt==='X')return value.length===q.rows.length&&value.every(row=>uniqueValid(row,q)&&row.length>0);
    if(q.fmt==='M')return value.length===q.pairs.length&&value.every(v=>validIndex(v,q));
    if(q.fmt==='O')return value.length===q.choices.length&&uniqueValid(value,q);
    if(!uniqueValid(value,q))return false;
    return q.fmt==='A'?value.length>0:value.length===q.key.length;
  }
  const sameSet=(a,b)=>a.length===b.length&&b.every(v=>a.includes(v));
  function score(q,value){
    if(!ready(q,value))return false;
    if(q.fmt==='X')return q.key.every((row,i)=>sameSet(value[i],row));
    return ['M','O'].includes(q.fmt)?q.key.every((v,i)=>v===value[i]):sameSet(value,q.key);
  }
  function progress(lesson,state){const ideas=lesson.steps.filter(s=>state.read[s.id]).length,checks=lesson.checks.filter(q=>state.attempts[q.id]).length;return {ideas,checks,done:ideas+checks,total:lesson.steps.length+lesson.checks.length};}
  function lessonComplete(lesson,state){const p=progress(lesson,state);return p.done===p.total;}
  function normalize(raw,data){
    if(!raw||raw.version!==1)return fresh();
    const state=fresh(),lessons=new Map(data.lessons.map(l=>[l.id,l])),steps=new Set(data.lessons.flatMap(l=>l.steps.map(s=>s.id))),questions=new Map(data.lessons.flatMap(l=>l.checks.map(q=>[q.id,q])));
    for(const [id,entries] of Object.entries(raw.highlights||{})){
      if(steps.has(id)||questions.has(id)){const ranges=highlightRanges(entries);if(ranges.length)state.highlights[id]=ranges;}
    }
    const validLocation=x=>x?.mode==='lesson'&&lessons.has(x.lesson)&&Number.isInteger(x.index)&&x.index>=0&&x.index<=lessons.get(x.lesson).steps.length+lessons.get(x.lesson).checks.length;
    function draft(q,v){
      if(!Array.isArray(v))return false;
      if(q.fmt==='X')return v.length===q.rows.length&&v.every(r=>uniqueValid(r,q));
      return v.length<=(['M','O'].includes(q.fmt)?q.key.length:q.choices.length)&&v.every(x=>x===null||validIndex(x,q));
    }
    for(const id of steps)if(raw.read?.[id]===true)state.read[id]=true;
    for(const [id,q] of questions){
      const a=raw.attempts?.[id];if(a&&ready(q,a.value))state.attempts[id]={value:a.value,correct:score(q,a.value),count:Math.max(1,Number(a.count)||1)};
      if(draft(q,raw.drafts?.[id]))state.drafts[id]=raw.drafts[id];
    }
    state.missed=[...new Set(Array.isArray(raw.missed)?raw.missed:[])].filter(id=>questions.has(id));
    const rv=raw.review;
    if(rv&&Array.isArray(rv.queue)){
      const queue=[...new Set(rv.queue)].filter(id=>questions.has(id));
      if(queue.length&&Number.isInteger(rv.index)&&rv.index>=0&&rv.index<queue.length){
        state.review={queue,index:rv.index,drafts:{},answers:{}};
        if(validLocation(rv.returnTo))state.review.returnTo=rv.returnTo;
        for(const id of queue){const q=questions.get(id);if(draft(q,rv.drafts?.[id]))state.review.drafts[id]=rv.drafts[id];const a=rv.answers?.[id];if(a&&ready(q,a.value))state.review.answers[id]={value:a.value,correct:score(q,a.value)};}
      }
    }
    for(const l of data.lessons)if(lessonComplete(l,state))state.completed[l.id]=true;
    if(validLocation(raw.last))state.last=raw.last;else if(raw.last?.mode==='review'&&state.review)state.last={mode:'review'};
    for(const [id,loc] of Object.entries(raw.pathLast||{}))if(validLocation(loc)&&lessons.get(loc.lesson).path===id)state.pathLast[id]=loc;
    if(state.last?.mode==='lesson'){const p=lessons.get(state.last.lesson).path;if(p)state.pathLast[p]=state.last;}
    return state;
  }
  root.StudyCore={fresh,ready,score,progress,lessonComplete,normalize,validHighlight,highlightStyle,highlightColor,highlightRanges,formatHighlights,reanchorHighlight,mergeHighlights};
  if(typeof module!=='undefined')module.exports=root.StudyCore;
})(typeof window!=='undefined'?window:globalThis);
