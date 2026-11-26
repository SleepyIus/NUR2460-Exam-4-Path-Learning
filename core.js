/* Pure scoring and progress helpers, shared by the UI and verification tests. */
(function (root) {
  'use strict';
  const fresh = () => ({version: 1, last: null, read: {}, attempts: {}, drafts: {}, completed: {}, missed: [], review: null});
  function ready(q, value) {
    if (!Array.isArray(value)) return false;
    if (q.fmt === 'M') return value.length === q.pairs.length && value.every(v => Number.isInteger(v) && v >= 0 && v < q.choices.length);
    return value.length === q.key.length && new Set(value).size === value.length && value.every(v => Number.isInteger(v) && v >= 0 && v < q.choices.length);
  }
  function score(q, value) {
    if (!ready(q, value)) return false;
    return q.fmt === 'M' ? q.key.every((v, i) => v === value[i]) : q.key.every(v => value.includes(v));
  }
  function progress(lesson, state) {
    const ideas = lesson.steps.filter(s => state.read[s.id]).length;
    const checks = lesson.checks.filter(q => state.attempts[q.id]).length;
    return {ideas, checks, done: ideas + checks, total: lesson.steps.length + lesson.checks.length};
  }
  function lessonComplete(lesson, state) {
    const p = progress(lesson, state);
    return p.done === p.total;
  }
  function normalize(raw, data) {
    if (!raw || raw.version !== 1) return fresh();
    const state = fresh();
    const lessons = new Map(data.lessons.map(l => [l.id, l]));
    const steps = new Set(data.lessons.flatMap(l => l.steps.map(s => s.id)));
    const questions = new Map(data.lessons.flatMap(l => l.checks.map(q => [q.id, q])));
    if (raw.read && typeof raw.read === 'object') for (const id of steps) if (raw.read[id] === true) state.read[id] = true;
    if (raw.attempts && typeof raw.attempts === 'object') for (const [id, q] of questions) {
      const a = raw.attempts[id];
      if (a && ready(q, a.value)) state.attempts[id] = {value: a.value, correct: score(q, a.value), count: Math.max(1, Number(a.count) || 1)};
    }
    function draft(q, value) {
      return Array.isArray(value) && value.length <= (q.fmt === 'M' ? q.pairs.length : q.choices.length) && value.every(v => v === null || Number.isInteger(v) && v >= 0 && v < q.choices.length);
    }
    if (raw.drafts && typeof raw.drafts === 'object') for (const [id, q] of questions) if (draft(q, raw.drafts[id])) state.drafts[id] = raw.drafts[id];
    state.missed = [...new Set(Array.isArray(raw.missed) ? raw.missed : [])].filter(id => questions.has(id));
    const rv = raw.review;
    if (rv && Array.isArray(rv.queue)) {
      const queue = [...new Set(rv.queue)].filter(id => questions.has(id));
      if (queue.length && Number.isInteger(rv.index) && rv.index >= 0 && rv.index < queue.length) {
        state.review = {queue, index: rv.index, drafts: {}, answers: {}};
        const returnTo = rv.returnTo;
        if (returnTo?.mode === 'lesson' && lessons.has(returnTo.lesson)) {
          const l = lessons.get(returnTo.lesson);
          if (Number.isInteger(returnTo.index) && returnTo.index >= 0 && returnTo.index <= l.steps.length + l.checks.length) state.review.returnTo = returnTo;
        }
        for (const id of queue) {
          const q = questions.get(id);
          if (rv.drafts && draft(q, rv.drafts[id])) state.review.drafts[id] = rv.drafts[id];
          if (rv.answers && rv.answers[id] && ready(q, rv.answers[id].value)) state.review.answers[id] = {value: rv.answers[id].value, correct: score(q, rv.answers[id].value)};
        }
      }
    }
    for (const l of data.lessons) if (lessonComplete(l, state)) state.completed[l.id] = true;
    const last = raw.last;
    if (last && last.mode === 'lesson' && lessons.has(last.lesson)) {
      const l = lessons.get(last.lesson);
      if (Number.isInteger(last.index) && last.index >= 0 && last.index <= l.steps.length + l.checks.length) state.last = last;
    } else if (last && last.mode === 'review' && state.review) state.last = {mode:'review'};
    return state;
  }
  root.StudyCore = {fresh, ready, score, progress, lessonComplete, normalize};
  if (typeof module !== 'undefined') module.exports = root.StudyCore;
})(typeof window !== 'undefined' ? window : globalThis);
