/* Personal text markings. Anchors store exact text and offsets, never HTML. */
(function () {
  'use strict';
  function create({getState,onChange}) {
    const core=window.StudyCore,colors=['yellow','green','blue','pink'];
    let card=null,screen=null,pending=null,records=[],timer=0,noticeTimer=0,lastColor='yellow';
    const bar=document.createElement('div');
    bar.className='highlight-toolbar';bar.hidden=true;
    bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Text formatting');
    bar.innerHTML=`<div class="highlight-colors" role="group" aria-label="Color">${colors.map(color=>`<button type="button" class="highlight-swatch" data-color="${color}" data-highlight-color="${color}" aria-label="${color[0].toUpperCase()+color.slice(1)}" title="${color[0].toUpperCase()+color.slice(1)}" aria-pressed="false"><span aria-hidden="true">✓</span></button>`).join('')}<button type="button" class="highlight-cancel" aria-label="Dismiss formatting controls">Done</button></div><div class="highlight-formats" role="group" aria-label="Apply style in selected color"><button type="button" data-style="solid" aria-label="Solid highlight" aria-pressed="false">Solid</button><button type="button" data-style="underline" aria-pressed="false"><span class="underline-label">Underline</span></button><button type="button" data-style="strike" aria-label="Strikethrough" title="Strikethrough" aria-pressed="false"><span class="strike-label">Strike</span></button><button type="button" class="highlight-remove" aria-label="Remove formatting">Remove</button></div>`;
    const notice=document.createElement('div');notice.className='highlight-notice';notice.setAttribute('role','status');notice.hidden=true;
    document.body.append(bar,notice);
    const isControl=node=>bar.contains(node)||Boolean(node?.closest?.('.highlight-trigger'));
    const overlaps=(a,b)=>a.block===b.block&&a.start<b.end&&b.start<a.end;
    function dismiss(clear=false){pending=null;bar.hidden=true;if(clear)window.getSelection()?.removeAllRanges();}
    function message(text){clearTimeout(noticeTimer);notice.textContent=text;notice.hidden=false;noticeTimer=setTimeout(()=>{notice.hidden=true;},2500);}
    function hasStyle(items,style,color){
      return items.every(item=>{
        let covered=item.start;
        for(const h of records.filter(h=>h.block===item.block&&core.highlightStyle(h)===style&&(color===undefined||core.highlightColor(h)===color)).sort((a,b)=>a.start-b.start)){
          if(h.start>covered)break;
          if(h.end>covered)covered=h.end;
          if(covered>=item.end)return true;
        }
        return false;
      });
    }
    function updatePalette(){
      if(!pending)return;
      const {items,color}=pending;bar.dataset.lineColor=color;
      for(const button of bar.querySelectorAll('[data-color]'))button.setAttribute('aria-pressed',String(button.dataset.color===color));
      for(const button of bar.querySelectorAll('[data-style]')){
        const style=button.dataset.style==='solid'?color:button.dataset.style;
        button.setAttribute('aria-pressed',String(hasStyle(items,style,color)));
      }
      bar.querySelector('.highlight-remove').disabled=!records.some(h=>items.some(item=>overlaps(h,item)));
    }
    function controls(items,locked=false){
      // Repeated selection events must not reset a color the learner just chose.
      const same=pending?.screen===screen&&JSON.stringify(pending.items)===JSON.stringify(items);
      const existing=colors.find(color=>hasStyle(items,color))||records.filter(h=>items.some(item=>overlaps(h,item))).map(core.highlightColor).find(color=>colors.includes(color));
      pending={items,screen,locked:locked||Boolean(same&&pending.locked),color:same?pending.color:(existing||lastColor)};
      updatePalette();
      bar.hidden=false;notice.hidden=true;
    }
    function blocks(){return card?[...card.querySelectorAll('[data-highlight-block]')]:[];}
    function selected(){
      const selection=window.getSelection();
      if(!card||!screen||!selection||selection.isCollapsed||selection.rangeCount!==1)return[];
      const range=selection.getRangeAt(0);
      // Native selections may end on a paragraph's parent rather than its text.
      if(!card.contains(range.startContainer)||!card.contains(range.endContainer)||range.toString().length>10000)return[];
      const entries=[];
      for(const block of blocks()){
        if(!block.getClientRects().length||!range.intersectsNode(block))continue;
        const text=block.textContent;
        let start=0,end=text.length;
        if(block.contains(range.startContainer)){const before=document.createRange();before.selectNodeContents(block);before.setEnd(range.startContainer,range.startOffset);start=before.toString().length;}
        if(block.contains(range.endContainer)){const before=document.createRange();before.selectNodeContents(block);before.setEnd(range.endContainer,range.endOffset);end=before.toString().length;}
        const quote=text.slice(start,end);
        if(quote.trim())entries.push({block:block.dataset.highlightBlock,start,end,quote});
      }
      return entries;
    }
    function selectionChanged(){
      clearTimeout(timer);timer=setTimeout(()=>{
        const entries=selected();
        if(entries.length)controls(entries,Boolean(pending?.locked));
        else if(!pending?.locked&&!isControl(document.activeElement))dismiss();
      },80);
    }
    function paint(){
      if(!card)return;
      for(const mark of card.querySelectorAll('mark.user-highlight')){const parent=mark.parentNode;mark.replaceWith(document.createTextNode(mark.textContent));parent.normalize();}
      records=core.highlightRanges(getState().highlights?.[screen]||[]);
      for(const block of blocks()){
        const text=block.textContent;
        const matches=records.filter(h=>h.block===block.dataset.highlightBlock&&text.slice(h.start,h.end)===h.quote);
        // Render disjoint segments so overlapping styles never split an already
        // shortened text node or create deeply nested mark elements.
        const boundaries=[...new Set(matches.flatMap(h=>[h.start,h.end]))].sort((a,b)=>a-b);
        const segments=[];
        for(let i=0;i<boundaries.length-1;i++){
          const start=boundaries[i],end=boundaries[i+1],active=matches.filter(h=>h.start<=start&&h.end>=end);
          if(active.length)segments.push({start,end,active,styles:active.map(core.highlightStyle)});
        }
        const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT),nodes=[];
        let node,offset=0;
        while((node=walker.nextNode())){nodes.push({node,start:offset,end:offset+node.length});offset+=node.length;}
        for(const segment of segments.reverse()){
          let firstMark=null;
          for(const part of [...nodes].reverse()){
            const start=Math.max(segment.start,part.start)-part.start,end=Math.min(segment.end,part.end)-part.start;
            if(end<=start)continue;
            if(end<part.node.length)part.node.splitText(end);
            const piece=start?part.node.splitText(start):part.node;
            const mark=document.createElement('mark');mark.className='user-highlight';
            const color=segment.styles.find(style=>colors.includes(style));if(color)mark.dataset.highlightColor=color;
            mark.classList.toggle('has-underline',segment.styles.includes('underline'));
            mark.classList.toggle('has-strike',segment.styles.includes('strike'));
            mark.dataset.markBlock=block.dataset.highlightBlock;mark.dataset.markStart=segment.start;mark.dataset.markEnd=segment.end;
            piece.replaceWith(mark);
            let container=mark;
            for(const style of ['underline','strike']){
              const h=segment.active.find(h=>core.highlightStyle(h)===style);if(!h)continue;
              const line=document.createElement('span');line.className='user-'+style;
              if(h.color)line.dataset.lineColor=h.color;
              container.append(line);container=line;
            }
            container.append(piece);firstMark=mark;
          }
          if(firstMark){
            firstMark.tabIndex=0;firstMark.setAttribute('role','button');
            const label=segment.active.map(h=>{const style=core.highlightStyle(h);return colors.includes(style)?style+' highlight':(h.color?h.color+' ':'')+(style==='strike'?'strikethrough':style);}).join(', ');
            firstMark.setAttribute('aria-label',label+': '+text.slice(segment.start,segment.end)+'. Edit formatting.');
          }
        }
      }
    }
    function saveStyle(style){
      if(!pending||pending.screen!==screen)return;
      const {items,color}=pending;
      if(style==='solid')style=color;
      const remove=style===null||hasStyle(items,style,color);
      const all={...(getState().highlights||{})};
      const next=core.formatHighlights(all[screen]||[],items,style,remove,color);
      if(next.length)all[screen]=next;else delete all[screen];
      const saved=onChange(all);
      dismiss(true);paint();
      message(saved===false?'Formatting kept for this session. Storage is unavailable.':remove?'Formatting removed':'Formatting saved');
    }
    function editMark(mark){
      const block=blocks().find(b=>b.dataset.highlightBlock===mark.dataset.markBlock);
      if(!block)return;
      const start=Number(mark.dataset.markStart),end=Number(mark.dataset.markEnd);
      controls([{block:block.dataset.highlightBlock,start,end,quote:block.textContent.slice(start,end)}],true);
    }
    function keepSelection(event){const entries=selected();if(entries.length)controls(entries,true);event.preventDefault();}
    function openPalette(){
      const entries=selected();
      if(entries.length)controls(entries,true);
      else if(pending?.screen===screen)controls(pending.items,true);
      else message('Select some lesson text, then tap Highlight.');
    }
    // Capture native selection before touching either set of controls.
    for(const event of ['pointerdown','mousedown'])bar.addEventListener(event,e=>{if(pending)pending.locked=true;e.preventDefault();});
    for(const button of bar.querySelectorAll('[data-color]'))button.addEventListener('click',()=>{
      if(!pending)return;lastColor=button.dataset.color;pending.color=lastColor;updatePalette();
    });
    for(const button of bar.querySelectorAll('[data-style]'))button.addEventListener('click',()=>saveStyle(button.dataset.style));
    bar.querySelector('.highlight-remove').addEventListener('click',()=>saveStyle(null));
    bar.querySelector('.highlight-cancel').addEventListener('click',()=>dismiss(true));
    document.addEventListener('selectionchange',selectionChanged);
    for(const event of ['pointerup','touchend','keyup'])document.addEventListener(event,selectionChanged,{passive:true});
    window.addEventListener('pageshow',selectionChanged);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)selectionChanged();});
    document.addEventListener('pointerdown',event=>{if(!isControl(event.target)&&!event.target.closest?.('mark.user-highlight'))dismiss();});
    document.addEventListener('click',event=>{
      if(!card||isControl(event.target))return;
      const entries=selected();
      if(entries.length){if(event.target.closest?.('.choice'))event.preventDefault();controls(entries);return;}
      const mark=event.target.closest?.('mark.user-highlight');
      if(mark&&card.contains(mark)){event.preventDefault();editMark(mark);}
    },true);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!bar.hidden){event.preventDefault();dismiss(true);}
      const mark=event.target.closest?.('mark.user-highlight');
      if(mark&&card?.contains(mark)&&['Enter',' '].includes(event.key)){event.preventDefault();editMark(mark);bar.querySelector('[data-style]').focus();}
    });
    function unmount(){clearTimeout(timer);dismiss();card=null;screen=null;records=[];notice.hidden=true;}
    function mount(root,id){
      unmount();if(!root||!id)return;card=root;screen=id;
      for(const choice of card.querySelectorAll('.choice')){
        const input=choice.querySelector('input'),label=choice.querySelector(':scope > span');
        if(input&&label&&!input.hasAttribute('aria-label'))input.setAttribute('aria-label',label.textContent);
      }
      const assign=(selector,prefix)=>card.querySelectorAll(selector).forEach((node,i)=>{node.dataset.highlightBlock=prefix+'-'+i;});
      assign('#idea-title','title');assign('.idea-body','body');assign('.teaching-sequence li','sequence');
      assign('.definition-card dt','term');assign('.definition-card dd','definition');
      assign('.source-note h3','note-title');assign('.source-note p','note-body');
      assign('.explanation h3','explanation-title');assign('.explanation p:not(.muted)','explanation-body');
      assign('#question-title','question');assign('.choice > span','option');assign('.matrix-row legend','matrix-row');
      assign('.answer-bank p','answer-bank');assign('.match-row > span:first-child','match-prompt');
      assign('.rationale h4','rationale-heading');assign('.rationale p','rationale-body');assign('.feedback > p','rationale-summary');
      const trigger=card.querySelector('.highlight-trigger');
      if(trigger){trigger.hidden=false;trigger.onpointerdown=keepSelection;trigger.onmousedown=keepSelection;trigger.onclick=openPalette;}
      paint();
    }
    return {mount,unmount};
  }
  window.StudyHighlights={create};
})();
