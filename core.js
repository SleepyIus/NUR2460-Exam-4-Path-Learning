/* Pure scoring and progress helpers. Existing version-1 high-yield progress stays valid. */
(function (root) {
  'use strict';
  const fresh = () => ({version:1,last:null,pathLast:{},read:{},attempts:{},drafts:{},completed:{},missed:[],review:null});
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
  root.StudyCore={fresh,ready,score,progress,lessonComplete,normalize};
  if(typeof module!=='undefined')module.exports=root.StudyCore;
})(typeof window!=='undefined'?window:globalThis);
