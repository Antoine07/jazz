/* Lecture, notation et écoute partagées : écrit ténor, audio en sons réels. */
(function(){
 'use strict';
 const tools=new Map();let timer=null,generation=0,activePrefix=null;
 const get=(prefix,field,fallback)=>document.querySelector('#'+prefix+'-'+field)?.value??fallback;
 const checked=(prefix,field)=>Boolean(document.querySelector('#'+prefix+'-'+field)?.checked);
 function resetVisuals(){document.querySelectorAll('.score-playing,.note-playing').forEach(el=>el.classList.remove('score-playing','note-playing'));document.querySelectorAll('[data-listening-active]').forEach(el=>{el.removeAttribute('data-listening-active');el.setAttribute('aria-pressed','false');});}
 function stop(){generation++;if(activePrefix){const status=document.querySelector('#'+activePrefix+'-status');if(status)status.textContent='Lecture arrêtée.';activePrefix=null;}if(timer)clearInterval(timer);timer=null;resetVisuals();}
 function event(note,midi,beat,duration=1,extra={}){return {note,midi,beat,duration,...extra};}
 function sequenceOf(notes,contour='both',start=0,step=1){const mids=ascendingWrittenMidi(notes),base=notes.map((note,i)=>({note,midi:mids[i]}));let seq=contour==='down'?[...base].reverse():contour==='both'?[...base,...base.slice(0,-1).reverse()]:base;return seq.map((n,i)=>event(n.note,n.midi,start+i*step,step));}
 function voiceMidis(notes){let last=null;return notes.map(n=>{let m=60+pc(n);if(last!==null){while(m-last>6)m-=12;while(last-m>6)m+=12;}last=m;return m;});}
 function scalePlan(prefix){const root=get(prefix,'key','C'),kind=get(prefix,prefix==='blues'?'type':'type','major'),notes=scale(root,kind),events=sequenceOf([...notes,root],get(prefix,'contour','both'));return {events,total:events.length,label:french(root)+' '+(scaleNames[kind]||(kind==='minorBlues'?'blues mineure':'blues majeure'))+' · écrit ténor'};}
 function cadencePlan(root,mode,reading='arpeggio'){
  const chords=cadenceOf(root,mode),events=[],guideNotes=chords.map((c,i)=>c.notes[i===1?1:3]),guideMidi=voiceMidis(guideNotes);
  chords.forEach((c,i)=>{const midis=ascendingWrittenMidi(c.notes);if(reading==='chords')c.notes.forEach((n,j)=>events.push(event(n,midis[j],i*4,4,{label:c.symbol})));else if(reading==='guides')events.push(event(guideNotes[i],guideMidi[i],i*4,4,{label:c.symbol}));else c.notes.forEach((n,j)=>events.push(event(n,midis[j],i*4+j,1,{label:c.symbol})));});
  events.push(event(root,60+pc(root),12,2,{label:'Tonique'}));return {events,total:14,label:chords.map(c=>c.symbol).join(' → ')};
 }
 function makePlan(prefix){
  if(prefix==='scale'||prefix==='blues')return scalePlan(prefix);
  if(prefix==='cycle')return cadencePlan(selectedCircleRoot,get(prefix,'mode','major'),get(prefix,'reading','arpeggio'));
  if(prefix==='cadence')return cadencePlan(get(prefix,'key','Eb'),get(prefix,'mode','major'),get(prefix,'reading','arpeggio'));
  if(prefix==='interval'){
   const root=get(prefix,'key','Eb'),kind=get(prefix,'kind','major3'),spec={minor3:[2,3],major3:[2,4],fifth:[4,7],octave:[7,12]}[kind],target=spell(root,spec[0],spec[1]),base=60+pc(root),events=[event(root,base,0,2),event(target,base+spec[1],2,2)];
   if(get(prefix,'reading','successive')==='together'){events.push(event(root,base,4,3),event(target,base+spec[1],4,3));}return {events,total:events.length>2?8:4,label:french(root)+' → '+french(target)};
  }
  if(prefix==='chord'){
   const c=chordOf(get(prefix,'key','F'),get(prefix,'quality','m7')),mids=ascendingWrittenMidi(c.notes),reading=get(prefix,'reading','arpeggio');let events=[];
   if(reading==='compare')events=c.notes.map((n,i)=>event(n,mids[i],0,3,{label:c.symbol}));
   const order=reading==='down'?c.notes.map((n,i)=>({note:n,midi:mids[i]})).reverse():c.notes.map((n,i)=>({note:n,midi:mids[i]}));const start=reading==='compare'?4:0;events.push(...order.map((n,i)=>event(n.note,n.midi,start+i,1,{label:c.symbol})));return {events,total:start+4,label:c.symbol};
  }
  if(prefix==='guide'){
   const chords=cadenceOf(get(prefix,'key','Eb'),get(prefix,'mode','major')),line=get(prefix,'line','third'),events=[];
   for(const role of (line==='both'?['seventh','third']:[line])){
    const indices=role==='seventh'?[3,1,3]:[1,3,1],notes=chords.map((c,i)=>c.notes[indices[i]]),mids=voiceMidis(notes);notes.forEach((n,i)=>events.push(event(n,mids[i],i*4,4,{label:chords[i].symbol})));
   }
   return {events,total:12,label:chords.map(c=>c.symbol).join(' → ')};
  }
  if(prefix==='form'||prefix==='body'){
   let bars=window.JAZZ_WORKSHOPS[prefix],selection=get(prefix,'section','A1'),reading=get(prefix,'reading','roots');if(prefix==='form'&&selection!=='all'){const offset={A1:0,A2:8,B:16,A3:24}[selection];bars=bars.slice(offset,offset+8);}
   const events=[];let beat=0,lastGuide=null;
   bars.forEach(bar=>bar.chords.forEach(raw=>{const c=chordOf(raw.root,raw.quality),mids=ascendingWrittenMidi(c.notes),extra={label:c.symbol,measure:bar.number,section:bar.section};
    if(reading==='roots')events.push(event(c.root,mids[0],beat,raw.beats,extra));
    else if(reading==='chords')c.notes.forEach((n,i)=>events.push(event(n,mids[i],beat,raw.beats,extra)));
    else if(reading==='guides'){const choices=[1,3].map(i=>({note:c.notes[i],midi:mids[i]}));if(lastGuide!==null)choices.sort((a,b)=>Math.abs(a.midi-lastGuide)-Math.abs(b.midi-lastGuide));const n=choices[0];events.push(event(n.note,n.midi,beat,raw.beats,extra));lastGuide=n.midi;}
    else c.notes.slice(0,4).forEach((n,i)=>events.push(event(n,mids[i],beat+i*raw.beats/4,raw.beats/4,extra)));
    beat+=raw.beats;
   }));return {events,total:beat,label:prefix==='body'?'Body and Soul · réduction de travail de A':'Étude AABA originale · '+(selection==='all'?'forme entière':selection)};
  }
  throw new Error('Atelier inconnu');
 }
 function noteY(note,midi,baseY){const unwrapped=natural[note[0]]+[...note.slice(1)].reduce((sum,a)=>sum+(a==='#'?1:a==='b'?-1:0),0),octave=Math.floor((midi-unwrapped)/12)-1;return baseY-((octave-4)*7+letters.indexOf(note[0])-2)*6;}
 function notationSVG(plan){
  const bars=Math.max(1,Math.ceil(plan.total/4)),rows=Math.ceil(bars/2),height=rows*190,left=80,unit=105;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" class="melody-svg" viewBox="0 0 980 ${height}" role="img" aria-label="Portée en clé de sol : notes écrites pour saxophone ténor. ${plan.label}"><title>${plan.label}</title>`;
  const groups=new Map();plan.events.forEach(e=>{const key=String(e.beat);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);});
  for(let row=0;row<rows;row++){
   const y=row*190+116;for(let line=0;line<5;line++)svg+=`<line x1="45" x2="950" y1="${y-line*12}" y2="${y-line*12}" stroke="#bcc9b5"/>`;
   svg+=`<text x="47" y="${y-8}" font-family="serif" font-size="49" fill="#275c47">𝄞</text>`;
   for(let b=0;b<2&&row*2+b<bars;b++){const x=left+b*4*unit,relativeBar=row*2+b,source=plan.events.find(e=>Math.floor(e.beat/4)===relativeBar&&e.measure),measure=source?.measure??relativeBar+1;svg+=`<text x="${x}" y="${row*190+25}" font-size="11" fill="#65746b">Mesure ${measure}</text><path d="M${x+4*unit-20} ${y-48} V${y}" stroke="#8fa185"/>`;}
  }
  for(const [key,events] of groups){
   const beat=Number(key),row=Math.floor(beat/8),y=row*190+116,x=left+(beat%8)*unit,event0=events[0];
   svg+=`<g data-score-beat="${key}"><rect class="score-highlight" x="${x-22}" y="${row*190+31}" width="55" height="138" rx="10" fill="transparent"/>`;
   if(event0.label)svg+=`<text x="${x}" y="${row*190+47}" text-anchor="middle" font-size="11" fill="#65746b">${event0.label}</text>`;
   events.forEach(e=>{
    const yy=noteY(e.note,e.midi,y),duration=e.duration,open=duration>=2;let glyphDuration=duration===1.5?1:duration===.75?.5:duration;
    for(let ledger=y+12;ledger<=yy;ledger+=12)svg+=`<line x1="${x-12}" x2="${x+13}" y1="${ledger}" y2="${ledger}" stroke="#6a805e"/>`;
    for(let ledger=y-60;ledger>=yy;ledger-=12)svg+=`<line x1="${x-12}" x2="${x+13}" y1="${ledger}" y2="${ledger}" stroke="#6a805e"/>`;
    const accidental=pretty(e.note.slice(1));if(accidental)svg+=`<text x="${x-22}" y="${yy+5}" text-anchor="middle" font-size="18" fill="#203b36">${accidental}</text>`;
    svg+=`<ellipse cx="${x}" cy="${yy}" rx="8" ry="5.5" transform="rotate(-18 ${x} ${yy})" fill="${open?'white':'#275c47'}" stroke="#275c47" stroke-width="1.5"/>`;
    if(glyphDuration<4)svg+=`<path d="M${x+7} ${yy} V${yy-33}" stroke="#275c47" stroke-width="1.8"/>`;
    if(glyphDuration<1)for(let flag=0;flag<(glyphDuration<=.25?2:1);flag++)svg+=`<path d="M${x+7} ${yy-33+flag*7} q18 7 10 20 q4 -12 -10 -14Z" fill="#275c47"/>`;
    if(duration===1.5||duration===.75)svg+=`<circle cx="${x+14}" cy="${yy-5}" r="2.5" fill="#275c47"/>`;
   });
   const caption=events.length===1?french(event0.note):event0.label||'Accord';svg+=`<text x="${x}" y="${row*190+166}" text-anchor="middle" font-size="11" fill="#203b36">${caption}</text></g>`;
  }
  const rest=bars*4-plan.total;if(rest>0){const row=Math.floor(plan.total/8),x=left+(plan.total%8)*unit,y=row*190+116;if(rest>=2)svg+=`<rect x="${x-7}" y="${y-18}" width="16" height="6" fill="#203b36"/>`;else svg+=`<path d="M${x-4} ${y-29} l9 13 -10 8 9 9 q-16 -8 -7 12" fill="none" stroke="#203b36" stroke-width="3"/>`;svg+=`<text x="${x}" y="${row*190+166}" text-anchor="middle" font-size="11" fill="#65746b">Silence</text>`;}
  return svg+'</svg>';
 }
 function render(prefix){
  const plan=makePlan(prefix),score=document.querySelector('#'+prefix+'-score');if(score)score.innerHTML=notationSVG(plan);
  const notesEl=document.querySelector('#'+prefix+'-notes');if(notesEl&&['interval','chord','guide'].includes(prefix)){const notes=[...new Set(plan.events.map(e=>e.note))];notesEl.innerHTML=chips(notes,notes.map(()=>''));}
  return plan;
 }
 function illuminate(prefix,events){
  const score=document.querySelector('#'+prefix+'-score');if(score){score.querySelectorAll('.score-playing').forEach(el=>el.classList.remove('score-playing'));score.querySelectorAll('[data-score-beat="'+events[0].beat+'"]').forEach(el=>el.classList.add('score-playing'));}
  const notes=document.querySelector('#'+prefix+'-notes');if(notes)notes.querySelectorAll('[data-note-name]').forEach(el=>el.classList.toggle('note-playing',events.some(e=>e.note===el.dataset.noteName)));
  const now=document.querySelector('#'+prefix+'-now');if(now){const first=events[0],location=first.measure?'Mesure '+first.measure+' · '+first.section+' · ':'';now.textContent=location+(first.label?first.label+' · ':'')+events.map(e=>french(e.note)+' ('+pretty(e.note)+')').join(' / ');}
 }
 async function play(prefix){
  const request=++generation;
  try{
   await soundContext();if(request!==generation)return;stopSound();window.JazzSound.warm(audioCtx);const session=++generation,plan=render(prefix),seconds=60/Number(get(prefix,'tempo',80)),loop=checked(prefix,'loop'),click=checked(prefix,'click'),total=Math.ceil(plan.total/4)*4;let next=audioCtx.currentTime+.1,first=true;
   activePrefix=prefix;const status=document.querySelector('#'+prefix+'-status'),button=document.querySelector('#'+prefix+'-play');if(status)status.textContent='Lecture · '+plan.label+' · notes écrites, son réel du ténor.';if(button){button.setAttribute('aria-pressed','true');button.setAttribute('data-listening-active','true');}
   function schedule(){
    if(session!==generation)return;
    if(next>audioCtx.currentTime+.2&&!first)return;
    first=false;const start=next;
    plan.events.forEach(e=>{trackSound(window.JazzSound.note(audioCtx,writtenToConcertMidi(e.midi),start+e.beat*seconds,Math.max(.04,e.duration*seconds-.025),{velocity:e.velocity??.34}));});
    if(click)for(let b=0;b<total;b++)metronomeClick(b%4===0,start+b*seconds);
    const groups=new Map();plan.events.forEach(e=>{if(!groups.has(e.beat))groups.set(e.beat,[]);groups.get(e.beat).push(e);});groups.forEach((group,beat)=>audioTimeouts.push(setTimeout(()=>{if(session===generation)illuminate(prefix,group);},Math.max(0,(start+beat*seconds-audioCtx.currentTime)*1000))));
    next+=total*seconds;
    if(!loop){if(timer)clearInterval(timer);timer=null;audioTimeouts.push(setTimeout(()=>{if(session!==generation)return;resetVisuals();activePrefix=null;if(status)status.textContent='Lecture terminée. Chantez les notes puis rejouez au ténor.';},Math.max(0,(start+total*seconds+.2-audioCtx.currentTime)*1000)));}
   }
   schedule();if(loop)timer=setInterval(schedule,40);
  }catch{const status=document.querySelector('#'+prefix+'-status');if(status)status.textContent='Lecture audio indisponible dans ce navigateur.';}
 }
 function syncSettings(){const settings=window.JazzSound.preferences();document.querySelectorAll('[data-sound-setting]').forEach(input=>{const key=input.dataset.soundSetting,value=settings[key];input.value=typeof value==='number'?Math.round(value*100):value;const output=input.closest('label')?.querySelector('output');if(output)output.textContent=Math.round(value*100)+' %';});}
 document.querySelectorAll('[data-sound-setting]').forEach(input=>input.addEventListener('input',()=>{const key=input.dataset.soundSetting,value=input.type==='range'?Number(input.value)/100:input.value;window.JazzSound.setting(key,value);if(key==='timbre'||key==='clickStyle')stopSound();if(audioCtx)window.JazzSound.apply(audioCtx);syncSettings();}));
 document.querySelectorAll('[data-sound-preview]').forEach(button=>button.addEventListener('click',async()=>{await soundContext();stopSound();const t=audioCtx.currentTime+.05;for(let i=0;i<4;i++)metronomeClick(i===0,t+i*.5);}));syncSettings();
 function bind(prefix,existing=false){
  if(!document.querySelector('#'+prefix+'-play'))return;tools.set(prefix,true);
  if(!existing)document.querySelector('#'+prefix+'-play').addEventListener('click',()=>play(prefix));
  if(!existing)document.querySelector('#'+prefix+'-stop').addEventListener('click',()=>{stopSound();const status=document.querySelector('#'+prefix+'-status');if(status)status.textContent='Lecture arrêtée.';});
  const parent=document.querySelector('#'+prefix+'-play').closest('.tool');parent?.querySelectorAll('select,input').forEach(input=>{if(input.dataset.soundSetting)return;input.addEventListener('change',()=>{stopSound();render(prefix);});});
  const tempo=document.querySelector('#'+prefix+'-tempo');tempo?.addEventListener('input',()=>{const output=document.querySelector('#'+prefix+'-tempo-value');if(output)output.textContent=tempo.value;stopSound();});render(prefix);
 }
 window.JazzListening={stop,playScale:()=>play('scale'),playBlues:()=>play('blues'),playCadence:()=>play('cadence'),makePlan,notationSVG,render};
 ['scale','blues','cadence'].forEach(prefix=>bind(prefix,true));['interval','chord','guide','form','body','cycle'].forEach(prefix=>bind(prefix));
})();
