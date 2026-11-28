(function () {
  'use strict';
  function create(toggle) {
    const wide = matchMedia('(min-width:1024px) and (min-height:600px)');
    const guide = document.createElement('div');
    guide.id = 'reading-bar';
    guide.className = 'reading-bar';
    guide.hidden = true;
    guide.innerHTML = '<div class="reading-bar-handle" role="slider" tabindex="0" aria-label="Reading bar position" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-describedby="reading-bar-help" title="Drag to move the reading bar"><span aria-hidden="true">⠿</span></div><button class="reading-bar-close" type="button" aria-label="Turn off reading bar" title="Turn off reading bar">×</button><span id="reading-bar-help" class="sr-only">Drag up or down to follow the text. Use the arrow keys to move one line, or Escape to turn off.</span>';
    document.body.append(guide);
    const handle = guide.querySelector('.reading-bar-handle');
    let card = null, enabled = false, center = null, frame = 0, drag = null;
    let bounds = {min:0,max:0,line:36};
    const observer = new ResizeObserver(schedule);
    const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

    // This is a temporary reading aid, never saved in progress or annotations.
    function turnOff(returnFocus = false) {
      enabled = false;
      center = null;
      stopDrag();
      guide.hidden = true;
      toggle.setAttribute('aria-pressed','false');
      if(returnFocus && !toggle.hidden)toggle.focus({preventScroll:true});
    }
    function stopDrag() {
      const pointer = drag?.id;
      drag = null;
      guide.classList.remove('is-dragging');
      if(pointer !== undefined && handle.hasPointerCapture(pointer))handle.releasePointerCapture(pointer);
    }
    function schedule() {
      if(!frame)frame = requestAnimationFrame(layout);
    }
    function layout() {
      frame = 0;
      const available = Boolean(card?.isConnected && wide.matches);
      toggle.hidden = !available;
      if(!available){turnOff();return;}
      if(!enabled)return;
      const rect = card.getBoundingClientRect(), style = getComputedStyle(card);
      const text = card.querySelector('.idea-body, .choice, .answer-help, p') || card;
      const textStyle = getComputedStyle(text);
      const line = clamp(parseFloat(textStyle.lineHeight) || parseFloat(textStyle.fontSize)*1.6,28,60);
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0, bottom = top + (viewport?.height || innerHeight);
      // Keep the entire line and both 44px controls inside the visible card.
      const half = Math.max(22,line/2);
      bounds = {min:Math.max(top+half+8,rect.top+half+8),max:Math.min(bottom-half-8,rect.bottom-half-8),line};
      if(bounds.max < bounds.min){guide.hidden=true;stopDrag();return;}
      if(center === null){const r=text.getBoundingClientRect();center=r.top+line/2;}
      center = clamp(center,bounds.min,bounds.max);
      const left = rect.left + parseFloat(style.paddingLeft), right = rect.right - parseFloat(style.paddingRight);
      Object.assign(guide.style,{left:left+'px',top:(center-line/2)+'px',width:(right-left)+'px',height:line+'px'});
      handle.setAttribute('aria-valuenow',String(Math.round((center-bounds.min)/Math.max(1,bounds.max-bounds.min)*100)));
      handle.setAttribute('aria-valuetext',`${handle.getAttribute('aria-valuenow')}% down the visible text`);
      guide.hidden = false;
    }
    toggle.addEventListener('click',() => {
      if(enabled){turnOff();return;}
      if(!wide.matches || !card?.isConnected)return;
      enabled = true;
      toggle.setAttribute('aria-pressed','true');
      layout();
      handle.focus({preventScroll:true});
    });
    guide.querySelector('.reading-bar-close').addEventListener('click',()=>turnOff(true));
    handle.addEventListener('pointerdown',event => {
      if(event.button !== 0 || drag)return;
      event.preventDefault();
      handle.focus({preventScroll:true});
      drag = {id:event.pointerId,offset:event.clientY-center};
      handle.setPointerCapture(event.pointerId);
      guide.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove',event => {
      if(drag?.id !== event.pointerId)return;
      center = event.clientY-drag.offset;
      schedule();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,stopDrag);
    handle.addEventListener('keydown',event => {
      const moves = {ArrowDown:bounds.line,ArrowRight:bounds.line,ArrowUp:-bounds.line,ArrowLeft:-bounds.line,PageDown:bounds.line*5,PageUp:-bounds.line*5};
      if(event.key==='Escape'){event.preventDefault();turnOff(true);return;}
      if(event.key==='Home')center=bounds.min;
      else if(event.key==='End')center=bounds.max;
      else if(event.key in moves)center+=moves[event.key];
      else return;
      event.preventDefault();layout();
    });
    // Narrowing the window ends the opt-in; widening it does not reopen the bar.
    wide.addEventListener('change',()=>{if(!wide.matches)turnOff();schedule();});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('scroll',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
    function mount(root) {
      if(card!==root){observer.disconnect();stopDrag();card=root;if(card)observer.observe(card);}
      layout();
    }
    return {mount};
  }
  window.StudyReadingBar = {create};
})();
