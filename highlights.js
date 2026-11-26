/* Personal text highlights. Anchors use exact text and offsets, never saved HTML. */
(function () {
  'use strict';
  function create({getState,onChange}) {
    let card=null,screen=null,pending=null,records=[],timer=0,noticeTimer=0;
    const bar=document.createElement('div');
    bar.className='highlight-toolbar';bar.hidden=true;
    bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Text highlighting');
    bar.innerHTML='<button type="button" class="highlight-action">Highlight</button><button type="button" class="highlight-cancel" aria-label="Dismiss highlighting controls">Cancel</button>';
    const action=bar.querySelector('.highlight-action');
    const notice=document.createElement('div');notice.className='highlight-notice';notice.setAttribute('role','status');notice.hidden=true;
    document.body.append(bar,notice);
    const equal=(a,b)=>a.block===b.block&&a.start===b.start&&a.end===b.end&&a.quote===b.quote;
    const blockFor=node=>(node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement)?.closest('[data-highlight-block]');
    function dismiss(clear=false){pending=null;bar.hidden=true;if(clear)window.getSelection()?.removeAllRanges();}
    function message(text){clearTimeout(noticeTimer);notice.textContent=text;notice.hidden=false;noticeTimer=setTimeout(()=>{notice.hidden=true;},2500);}
    function controls(mode,items){pending={mode,items,screen};action.textContent=mode==='remove'?'Remove highlight':'Highlight';bar.hidden=false;notice.hidden=true;}
    function blocks(){return card?[...card.querySelectorAll('[data-highlight-block]')]:[];}
    function selected(){
      const selection=window.getSelection();
      if(!card||!screen||!selection||selection.isCollapsed||selection.rangeCount!==1)return[];
      const range=selection.getRangeAt(0),first=blockFor(range.startContainer),last=blockFor(range.endContainer);
      if(!first||!last||!card.contains(first)||!card.contains(last)||range.toString().length>10000)return[];
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
        if(entries.length)controls('add',entries);
        else if(pending?.mode!=='remove'&&!bar.contains(document.activeElement))dismiss();
      },80);
    }
    function paint(){
      if(!card)return;
      for(const mark of card.querySelectorAll('mark.user-highlight')){const parent=mark.parentNode;mark.replaceWith(...mark.childNodes);parent.normalize();}
      records=window.StudyCore.highlightRanges(getState().highlights?.[screen]||[]);
      for(const block of blocks()){
        const text=block.textContent;
        const matches=records.map((record,index)=>({record,index})).filter(({record:h})=>h.block===block.dataset.highlightBlock&&text.slice(h.start,h.end)===h.quote);
        const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT),nodes=[];
        let node,offset=0;
        while((node=walker.nextNode())){nodes.push({node,start:offset,end:offset+node.length});offset+=node.length;}
        for(const {record:h,index} of matches.reverse()){
          let firstMark=null;
          for(const part of [...nodes].reverse()){
            const start=Math.max(h.start,part.start)-part.start,end=Math.min(h.end,part.end)-part.start;
            if(end<=start)continue;
            if(end<part.node.length)part.node.splitText(end);
            const piece=start?part.node.splitText(start):part.node;
            const mark=document.createElement('mark');mark.className='user-highlight';mark.dataset.highlightIndex=String(index);
            piece.replaceWith(mark);mark.append(piece);firstMark=mark;
          }
          if(firstMark){firstMark.tabIndex=0;firstMark.setAttribute('role','button');firstMark.setAttribute('aria-label','Highlight: '+h.quote+'. Open removal controls.');}
        }
      }
    }
    function saveSelection(){
      if(!pending||pending.screen!==screen)return;
      const {mode,items}=pending;
      const all={...(getState().highlights||{})},existing=all[screen]||[];
      const next=mode==='remove'?existing.filter(h=>!items.some(item=>equal(h,item))):window.StudyCore.highlightRanges([...existing,...items]);
      if(next.length)all[screen]=next;else delete all[screen];
      const saved=onChange(all);
      dismiss(true);paint();
      message(saved===false?'Highlight kept for this session. Storage is unavailable.':mode==='remove'?'Highlight removed':'Highlight saved');
    }
    // Keep the native selection alive while tapping the small action bar.
    bar.addEventListener('pointerdown',event=>event.preventDefault());
    action.addEventListener('click',saveSelection);
    bar.querySelector('.highlight-cancel').addEventListener('click',()=>dismiss(true));
    document.addEventListener('selectionchange',selectionChanged);
    document.addEventListener('pointerdown',event=>{
      if(!bar.contains(event.target)&&!event.target.closest?.('mark.user-highlight'))dismiss();
    });
    document.addEventListener('click',event=>{
      if(!card||bar.contains(event.target))return;
      const entries=selected();
      if(entries.length){
        // Selecting option text must not also toggle its radio/checkbox.
        if(event.target.closest?.('.choice'))event.preventDefault();
        controls('add',entries);return;
      }
      const mark=event.target.closest?.('mark.user-highlight');
      if(mark&&card.contains(mark)){
        event.preventDefault();const item=records[Number(mark.dataset.highlightIndex)];
        if(item)controls('remove',[item]);
      }
    },true);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!bar.hidden){event.preventDefault();dismiss(true);}
      const mark=event.target.closest?.('mark.user-highlight');
      if(mark&&card?.contains(mark)&&['Enter',' '].includes(event.key)){
        event.preventDefault();const item=records[Number(mark.dataset.highlightIndex)];
        if(item){controls('remove',[item]);action.focus();}
      }
    });
    function unmount(){clearTimeout(timer);dismiss();card=null;screen=null;records=[];notice.hidden=true;}
    function mount(root,id){
      unmount();if(!root||!id)return;card=root;screen=id;
      // A removable mark has its own accessible name; keep answer labels intact.
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
      paint();
    }
    return {mount,unmount};
  }
  window.StudyHighlights={create};
})();
