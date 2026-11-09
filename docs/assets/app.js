'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const letters=['C','D','E','F','G','A','B'];
const keys=['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
const frLetters={C:'Do',D:'Ré',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Si'};
const pretty=s=>s.replaceAll('bb','♭♭').replaceAll('##','♯♯').replaceAll('b','♭').replaceAll('#','♯');
const french=s=>frLetters[s[0]]+pretty(s.slice(1));
function pc(s){return (natural[s[0]]+[...s.slice(1)].reduce((a,c)=>a+(c==='#'?1:c==='b'?-1:0),0)+24)%12;}
function spell(root,degree,interval){let l=letters[(letters.indexOf(root[0])+degree)%7];let d=(pc(root)+interval-natural[l]+24)%12;if(d>6)d-=12;return l+(d>0?'#'.repeat(d):'b'.repeat(-d));}
const scaleSteps={major:[0,2,4,5,7,9,11],naturalMinor:[0,2,3,5,7,8,10],harmonicMinor:[0,2,3,5,7,8,11],melodicMinor:[0,2,3,5,7,9,11]};
function scale(root,type='major'){
 const ds=type==='minorBlues'?[0,2,3,4,4,6]:type==='majorBlues'?[0,1,2,2,4,5]:[0,1,2,3,4,5,6];
 const ins=type==='minorBlues'?[0,3,5,6,7,10]:type==='majorBlues'?[0,2,3,4,7,9]:scaleSteps[type];
 return ds.map((d,i)=>spell(root,d,ins[i]));
}
function concertNote(note){return spell(note,6,-2);}
function writtenToConcertMidi(midi){return midi-14;}
function chordOf(root,quality){
 const spec={maj7:[0,4,7,11],'7':[0,4,7,10],m7:[0,3,7,10],m7b5:[0,3,6,10]}[quality];
 const suffix={m7b5:'m7♭5'}[quality]||quality;
 return {root,quality,symbol:pretty(root)+suffix,notes:[0,2,4,6].map((d,i)=>spell(root,d,spec[i]))};
}
function cadenceOf(root,mode='major'){
 return [chordOf(spell(root,1,2),mode==='minor'?'m7b5':'m7'),chordOf(spell(root,4,7),'7'),chordOf(root,mode==='minor'?'m7':'maj7')];
}
function ascendingWrittenMidi(notes){let last=-1;return notes.map(n=>{let midi=60+pc(n);while(midi<=last)midi+=12;last=midi;return midi;});}

function chips(notes,degrees,blue=-1){return notes.map((n,i)=>`<div class="note-chip ${i===blue?'blue':''}"><small>${degrees[i]}</small><strong>${pretty(n)}</strong><small>${french(n)}</small></div>`).join('');}
function piano(notes){const active=notes.map(pc);let whites=[0,2,4,5,7,9,11,12], blacks=[1,3,6,8,10], positions=[32,76,164,208,252];let svg='<svg class="piano" viewBox="0 0 352 145" role="img" aria-label="Clavier de repérage des notes écrites pour ténor : les points indiquent les noms de notes">';whites.forEach((p,i)=>{let on=active.includes(p%12);svg+=`<rect x="${i*44}" y="0" width="43" height="140" rx="5" fill="${on?'#e6f0cc':'#fff'}" stroke="#bcc8b8"/>`;if(on)svg+=`<circle cx="${i*44+21}" cy="115" r="5" fill="#275c47"/>`;});blacks.forEach((p,i)=>{svg+=`<rect x="${positions[i]}" y="0" width="25" height="86" rx="4" fill="#203b36"/>`;if(active.includes(p))svg+=`<circle cx="${positions[i]+12.5}" cy="65" r="5" fill="#ddf18a"/>`;});return svg+'</svg>';}
let audioCtx,activeNodes=[],audioTimeouts=[],rhythmTimer=null;
function soundContext(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();return audioCtx.resume().then(()=>audioCtx);}
function tone(midi,time,duration=.22,volume=.08,type='triangle',sustain=false){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.008);if(sustain)g.gain.setValueAtTime(volume,time+Math.max(.009,duration-.012));g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(audioCtx.destination);o.start(time);o.stop(time+duration+.02);activeNodes.push(o);o.onended=()=>{activeNodes=activeNodes.filter(n=>n!==o);o.disconnect();g.disconnect();};}
function stopSound(){if(rhythmTimer)clearInterval(rhythmTimer);rhythmTimer=null;activeNodes.forEach(o=>{try{o.stop();}catch{}});activeNodes=[];audioTimeouts.forEach(clearTimeout);audioTimeouts=[];$$('.beat-light.active').forEach(x=>x.classList.remove('active'));if($('#rhythm-start')){$('#rhythm-start').textContent='Écouter en boucle';$('#rhythm-start').setAttribute('aria-pressed','false');}if($('#rhythm-status'))$('#rhythm-status').textContent='Lecture arrêtée.';}
async function playScale(){try{await soundContext();stopSound();const root=$('#blues-key').value,type=$('#blues-type').value;const offsets=type==='minorBlues'?[0,3,5,6,7,10,12]:[0,2,3,4,7,9,12];const base=writtenToConcertMidi(60+pc(root));let t=audioCtx.currentTime+.07;[...offsets,...offsets.slice(0,-1).reverse()].forEach((n,i)=>tone(base+n,t+i*.36,.31));$('#blues-status').textContent='Ténor : '+french(root)+' écrit, '+french(concertNote(root))+' concert. Montée puis descente.';}catch{$('#blues-status').textContent='Audio indisponible dans ce navigateur.';}}
function updateBlues(){let root=$('#blues-key').value,type=$('#blues-type').value,notes=scale(root,type);$('#blues-notes').innerHTML=chips(notes,type==='minorBlues'?['1','♭3','4','♭5','5','♭7']:['1','2','♭3','3','5','6'],type==='minorBlues'?3:2);$('#blues-piano').innerHTML=piano(notes);$('#blues-name').textContent=french(root)+' blues '+(type==='minorBlues'?'mineure':'majeure');$('#blues-spelling').textContent=notes.some(n=>n.includes('bb'))?'Une double altération respecte le degré : '+notes.filter(n=>n.includes('bb')).map(n=>pretty(n)+' = '+french(n)).join(', ')+'. Deux bémols abaissent de deux demi-tons.':'La note orangée est la note de passage ajoutée à la pentatonique.';}
if($('#blues-key')){$('#blues-key').addEventListener('change',()=>{stopSound();updateBlues();});$('#blues-type').addEventListener('change',()=>{stopSound();updateBlues();});$('#blues-play').addEventListener('click',playScale);$('#blues-stop').addEventListener('click',stopSound);updateBlues();}
const keyMeta=['0 altération','1 dièse','2 dièses','3 dièses','4 dièses','5 dièses','6 dièses','5 bémols','4 bémols','3 bémols','2 bémols','1 bémol'];
function updateCircle(root){const i=keys.indexOf(root),notes=scale(root),ii=notes[1],v=notes[4];$('#circle-title').textContent=french(root)+' majeur';$('#circle-armure').textContent=keyMeta[i];$('#circle-notes').innerHTML=chips(notes,['I','II','III','IV','V','VI','VII']);$('#circle-cadence').textContent=pretty(ii)+'m7 → '+pretty(v)+'7 → '+pretty(root)+'maj7';$('#circle-roots').textContent='Écrit ténor : '+french(ii)+' → '+french(v)+' → '+french(root);$('#circle-chords').innerHTML=[1,4,0].map((d,j)=>{let ns=[0,2,4,6].map(k=>notes[(d+k)%7]);return `<p><b>${pretty(notes[d])}${['m7','7','maj7'][j]}</b> : ${ns.map(french).join(' · ')}</p>`;}).join('');if($('#circle-minor-cadence')){const minor=cadenceOf(root,'minor');$('#circle-minor-cadence').textContent=minor.map(c=>c.symbol).join(' → ');$('#circle-minor-chords').innerHTML=minor.map(c=>'<p><b>'+c.symbol+'</b> : '+c.notes.map(french).join(' · ')+'</p>').join('');}$$('.circle .key').forEach(g=>{let chosen=g.dataset.key===root;g.setAttribute('aria-pressed',chosen?'true':'false');g.querySelector('circle').setAttribute('fill',chosen?'#ddf18a':'#ffffff');});}
if($('#fifths-circle')){let s='<svg class="circle" viewBox="0 0 460 460" role="group" aria-label="Cycle des quintes interactif. Choisir une tonalité avec Tab puis Entrée."><circle cx="230" cy="230" r="162" fill="none" stroke="#dce2d9" stroke-width="1"/><circle cx="230" cy="230" r="111" fill="#edf2e7"/><text x="230" y="217" text-anchor="middle" font-size="12" letter-spacing="2" fill="#65746b">CYCLE DES</text><text x="230" y="245" text-anchor="middle" font-size="26" fill="#203b36">QUINTES</text><text x="230" y="271" text-anchor="middle" font-size="11" fill="#65746b">↻ + 7 demi-tons</text>';keys.forEach((k,i)=>{let a=i*Math.PI/6-Math.PI/2,x=230+162*Math.cos(a),y=230+162*Math.sin(a);s+=`<g class="key" data-key="${k}" role="button" tabindex="0" aria-label="${french(k)} majeur, ${keyMeta[i]}" aria-pressed="false"><circle cx="${x}" cy="${y}" r="30" fill="white" stroke="#cdd8c5"/><text class="circle-label" x="${x}" y="${y+7}" text-anchor="middle">${pretty(k)}</text></g>`;});$('#fifths-circle').innerHTML=s+'</svg>';$$('.circle .key').forEach(g=>{const choose=()=>updateCircle(g.dataset.key);g.addEventListener('click',choose);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});});updateCircle('Eb');}
const patterns=window.JAZZ_RHYTHMS||{};
function eventsOf(p){
 let ticks=0;const result=p.events.map((e,i)=>{const event={...e,index:i,ticksAt:ticks,beat:ticks/p.pulseTicks,duration:e.ticks/p.pulseTicks,bar:Math.floor(ticks/p.barTicks),on:!e.rest&&!(i>0&&p.events[i-1].tieNext)};ticks+=e.ticks;return event;});
 result.forEach((event,i)=>{if(!event.on)return;let length=event.ticks,j=i;while(p.events[j].tieNext&&p.events[j+1]){j++;length+=p.events[j].ticks;}event.soundingDuration=length/p.pulseTicks;});
 return result;
}
function rhythmSVG(p){
 const width=900,left=65,right=865,span=right-left,row=190,events=eventsOf(p);
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" class="rhythm-svg" viewBox="0 0 ${width} ${p.bars*row}" role="img" aria-label="${p.name}, ${p.meter}, ${p.bars} mesure${p.bars>1?'s':''}. ${p.description}"><title>${p.name}</title>`;
 const xOf=e=>e.rest&&e.value==='w'?left+span/2:left+((e.ticksAt%p.barTicks)/p.barTicks)*span;
 for(let bar=0;bar<p.bars;bar++){
  const offset=bar*row,baseline=offset+104,top=offset+69,group=events.filter(e=>e.bar===bar);
  svg+=`<text x="16" y="${offset+18}" font-size="11" fill="#65746b">Mesure ${bar+1}</text><line x1="${left-18}" x2="${right}" y1="${baseline}" y2="${baseline}" stroke="#b8c5b1"/><line x1="${right}" x2="${right}" y1="${baseline-32}" y2="${baseline+12}" stroke="#65746b"/>`;
  const signature=p.meter.split('/');svg+=`<text x="24" y="${baseline-8}" font-size="21" fill="#203b36">${signature[0]}</text><text x="24" y="${baseline+14}" font-size="21" fill="#203b36">${signature[1]}</text>`;
  for(let beat=0;beat<p.pulses;beat++){
   const x=left+beat*span/p.pulses;
   svg+=`<line x1="${x}" x2="${x}" y1="${offset+44}" y2="${offset+151}" stroke="#dce2d9" stroke-dasharray="3 6"/><text x="${x}" y="${offset+173}" text-anchor="middle" font-size="14" fill="#a25330">${beat+1}</text>`;
  }
  // Grouper les croches et doubles croches à l'intérieur d'une pulsation.
  const beamed=new Set(),runs=[];let run=[];
  function finishRun(){if(run.length>1){runs.push(run);run.forEach(e=>beamed.add(e.index));}run=[];}
  group.forEach(e=>{const eligible=!e.rest&&['e','s'].includes(e.value);if(!eligible){finishRun();return;}const previous=run[run.length-1];if(previous&&Math.floor((previous.ticksAt%p.barTicks)/p.pulseTicks)!==Math.floor((e.ticksAt%p.barTicks)/p.pulseTicks))finishRun();run.push(e);});finishRun();
  group.forEach(e=>{
   const x=xOf(e),y=baseline;
   if(e.rest){
    if(e.value==='w'||e.value==='h'){const yy=e.value==='w'?y:y-6;svg+=`<rect x="${x-8}" y="${yy}" width="17" height="6" fill="#203b36"/><line x1="${x-12}" x2="${x+13}" y1="${y}" y2="${y}" stroke="#203b36"/>`;}
    else if(e.value==='q')svg+=`<path d="M${x-4} ${y-26} l9 13 -10 8 9 9 q-16 -8 -7 12" fill="none" stroke="#203b36" stroke-width="3"/>`;
    else{svg+=`<circle cx="${x-4}" cy="${y-15}" r="4" fill="#203b36"/><path d="M${x-4} ${y-15} q12 6 15 -6 l-12 36" fill="none" stroke="#203b36" stroke-width="2.5"/>`;if(e.value==='s')svg+=`<circle cx="${x-7}" cy="${y-3}" r="4" fill="#203b36"/><path d="M${x-7} ${y-3} q10 5 15 -5" fill="none" stroke="#203b36" stroke-width="2.5"/>`;}
   }else{
    const open=e.value==='w'||e.value==='h';svg+=`<ellipse cx="${x}" cy="${y}" rx="${e.value==='w'?10:8}" ry="5.5" transform="rotate(-18 ${x} ${y})" fill="${open?'#fff':'#275c47'}" stroke="#275c47" stroke-width="2"/>`;
    if(e.value!=='w')svg+=`<line x1="${x+7}" x2="${x+7}" y1="${y-1}" y2="${top}" stroke="#275c47" stroke-width="2"/>`;
    if(['e','s'].includes(e.value)&&!beamed.has(e.index)){
     const flags=e.value==='s'?2:1;for(let f=0;f<flags;f++){const yy=top+f*8;svg+=`<path d="M${x+7} ${yy} q20 8 11 23 q4 -13 -11 -16Z" fill="#275c47"/>`;}
    }
   }
   for(let dot=0;dot<e.dots;dot++)svg+=`<circle cx="${x+16+dot*7}" cy="${y-5}" r="2.5" fill="#275c47"/>`;
  });
  runs.forEach(r=>{
   const first=xOf(r[0])+7,last=xOf(r[r.length-1])+7;svg+=`<path d="M${first} ${top} H${last}" stroke="#275c47" stroke-width="4"/>`;
   r.forEach((e,i)=>{if(e.value!=='s')return;const x=xOf(e)+7;if(r[i+1]?.value==='s')svg+=`<path d="M${x} ${top+8} H${xOf(r[i+1])+7}" stroke="#275c47" stroke-width="4"/>`;else if(r[i-1]?.value!=='s'){const dir=i===r.length-1?-1:1;svg+=`<path d="M${x} ${top+8} h${dir*12}" stroke="#275c47" stroke-width="4"/>`;}});
  });
  const tuplets=new Map();group.forEach(e=>{if(e.tuplet){if(!tuplets.has(e.tuplet))tuplets.set(e.tuplet,[]);tuplets.get(e.tuplet).push(e);}});
  tuplets.forEach(r=>{const x1=xOf(r[0]),x2=xOf(r[r.length-1])+10,mid=(x1+x2)/2,yy=offset+42;svg+=`<path d="M${x1} ${yy+5} v-6 H${mid-9} M${mid+9} ${yy-1} H${x2} v6" fill="none" stroke="#65746b"/><text x="${mid}" y="${yy+4}" text-anchor="middle" font-size="16" fill="#203b36">3</text>`;});
  if(p.swing)svg+=`<text x="240" y="${offset+19}" font-size="12" fill="#65746b">Croches interprétées : modèle 2:1</text>`;
 }
 // Les liaisons sont dessinées entre têtes, même lorsqu'elles traversent une mesure.
 events.forEach((e,i)=>{if(!e.tieNext||!events[i+1])return;const next=events[i+1],x1=xOf(e)+5,x2=xOf(next)-5,y=e.bar*row+119;if(next.bar===e.bar)svg+=`<path d="M${x1} ${y} Q${(x1+x2)/2} ${y+25} ${x2} ${y}" fill="none" stroke="#275c47" stroke-width="2.5"/>`;else{svg+=`<path d="M${x1} ${y} Q${(x1+right)/2} ${y+24} ${right-3} ${y+9}" fill="none" stroke="#275c47" stroke-width="2.5"/>`;const yy=next.bar*row+119;svg+=`<path d="M${left-15} ${yy+9} Q${left-3} ${yy+21} ${x2} ${yy}" fill="none" stroke="#275c47" stroke-width="2.5"/>`;}});
 return svg+'</svg>';
}
function updateRhythm(){
 stopSound();const p=patterns[$('#rhythm-pattern').value];$('#rhythm-drawing').innerHTML=rhythmSVG(p);
 $('#rhythm-description').textContent=p.description;$('#tempo-unit').textContent=p.meter==='6/8'?'♩. =':'♩ =';
 $('#rhythm-beats').style.gridTemplateColumns=`repeat(${p.pulses},1fr)`;$('#rhythm-beats').innerHTML=Array.from({length:p.pulses},(_,i)=>`<span class="beat-light">${i+1}</span>`).join('');
 const option=$('#metro-mode').querySelector('option[value="24"]');if(option)option.disabled=p.meter!=='4/4';if(p.meter!=='4/4'&&$('#metro-mode').value==='24')$('#metro-mode').value='all';
 $('#attack-count').textContent=eventsOf(p).filter(e=>e.on).length+' attaque(s) · '+p.bars+' mesure(s) en '+p.meter+' · '+p.pulses+' pulsations par mesure'+(p.meter==='6/8'?' à la noire pointée':' à la noire');
}
async function startRhythm(){
 if(rhythmTimer){stopSound();return;}
 try{
  await soundContext();stopSound();const p=patterns[$('#rhythm-pattern').value],events=eventsOf(p),seconds=60/Number($('#tempo').value);let nextBlock=audioCtx.currentTime+.12,block=-1;
  $('#rhythm-start').textContent='Arrêter la boucle';$('#rhythm-start').setAttribute('aria-pressed','true');$('#rhythm-status').textContent='Une mesure de décompte, puis lecture en boucle.';
  function schedule(){
   while(nextBlock<audioCtx.currentTime+.15){
    const countin=block<0,pulses=p.pulses*(countin?1:p.bars);
    for(let b=0;b<pulses;b++){
     const when=nextBlock+b*seconds,beat=b%p.pulses,mode=$('#metro-mode').value;
     if(countin||mode==='all'||(mode==='24'&&p.meter==='4/4'&&(beat===1||beat===3)))tone(beat===0?88:82,when,.045,.045,'sine');
     audioTimeouts.push(setTimeout(()=>{$$('.beat-light').forEach((el,i)=>el.classList.toggle('active',i===beat));if(!countin)$('#rhythm-status').textContent='En boucle · '+p.name;},Math.max(0,(when-audioCtx.currentTime)*1000)));
    }
    if(!countin)events.filter(e=>e.on).forEach(e=>tone(writtenToConcertMidi(72),nextBlock+e.beat*seconds,Math.max(.025,e.soundingDuration*seconds-.018),.065,'triangle',true));
    nextBlock+=pulses*seconds;block++;
   }
  }
  schedule();rhythmTimer=setInterval(schedule,25);
 }catch{$('#rhythm-status').textContent='Audio indisponible dans ce navigateur.';}
}
$$('[data-rhythm-score]').forEach(el=>{const p=patterns[el.dataset.rhythmScore];if(p)el.innerHTML=rhythmSVG(p);});
if($('#rhythm-pattern')){
 $('#rhythm-pattern').addEventListener('change',updateRhythm);$('#tempo').addEventListener('input',()=>{$('#tempo-value').textContent=$('#tempo').value;stopSound();});$('#rhythm-start').addEventListener('click',startRhythm);updateRhythm();
}
function storageRead(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback;}catch{return fallback;}}
const completed=storageRead('labo-jazz-progress',[]);$$('[data-chapter]').forEach(el=>{if(completed.includes(el.dataset.chapter)){if(el.matches('button')){el.setAttribute('aria-pressed','true');el.textContent='Chapitre terminé ✓';}else{const marker=document.createElement('span');marker.className='completion';marker.setAttribute('aria-label','Terminé');el.querySelector('.num')?.prepend(marker);}}});$$('button[data-chapter]').forEach(b=>b.addEventListener('click',()=>{let id=b.dataset.chapter,on=b.getAttribute('aria-pressed')!=='true',list=storageRead('labo-jazz-progress',[]).filter(x=>x!==id);if(on)list.push(id);try{localStorage.setItem('labo-jazz-progress',JSON.stringify(list));}catch{}b.setAttribute('aria-pressed',String(on));b.textContent=on?'Chapitre terminé ✓':'Marquer comme étudié';}));
const sectionList=$$('.article>section');let slideIndex=0,slideMode=false;
function slideRender(){sectionList.forEach((s,i)=>s.classList.toggle('current-slide',i===slideIndex));if($('#slide-count'))$('#slide-count').textContent=(slideIndex+1)+' / '+sectionList.length;if($('#slide-prev'))$('#slide-prev').disabled=slideIndex===0;if($('#slide-next'))$('#slide-next').disabled=slideIndex===sectionList.length-1;}
if($('#view-toggle')){$('#view-toggle').addEventListener('click',()=>{slideMode=!slideMode;document.body.classList.toggle('slide-mode',slideMode);$('#view-toggle').textContent=slideMode?'Lecture continue':'Mode présentation';$('#view-toggle').setAttribute('aria-pressed',String(slideMode));$('#slide-controls').hidden=!slideMode;slideRender();});$('#slide-prev').addEventListener('click',()=>{slideIndex=Math.max(0,slideIndex-1);slideRender();});$('#slide-next').addEventListener('click',()=>{slideIndex=Math.min(sectionList.length-1,slideIndex+1);slideRender();});$$('.toc a').forEach(a=>a.addEventListener('click',()=>{let i=sectionList.findIndex(s=>'#'+s.id===a.hash);if(i>=0){slideIndex=i;slideRender();}}));document.addEventListener('keydown',e=>{if(!slideMode||e.target.closest('input,select,textarea,[role=button]'))return;if(e.key==='ArrowRight')$('#slide-next').click();if(e.key==='ArrowLeft')$('#slide-prev').click();});if(location.hash){const i=sectionList.findIndex(s=>'#'+s.id===location.hash);if(i>=0)slideIndex=i;}}
let openDetails=[];window.addEventListener('beforeprint',()=>{openDetails=$$('details').map(d=>[d,d.open]);$$('details').forEach(d=>d.open=true);});window.addEventListener('afterprint',()=>openDetails.forEach(([d,o])=>d.open=o));$('#print')?.addEventListener('click',()=>window.print());
$('#quiz-submit')?.addEventListener('click',()=>{let score=0,total=$$('.quiz fieldset').length;$$('.quiz fieldset').forEach(f=>{let answer=f.querySelector('input:checked'),right=f.dataset.answer,ok=answer?.value===right;if(ok)score++;let feedback=f.querySelector('.feedback');feedback.hidden=false;feedback.textContent=(ok?'Correct. ':answer?'À revoir. ':'Sans réponse. ')+f.dataset.explanation;});$('#quiz-result').hidden=false;$('#quiz-result').textContent=score+' / '+total+' réponses correctes. Relisez les explications avant de recommencer.';});
const scaleNames={major:'majeure',naturalMinor:'mineure naturelle',harmonicMinor:'mineure harmonique',melodicMinor:'mineure mélodique jazz'};
function updateScaleTool(){const root=$('#scale-key').value,kind=$('#scale-type').value;$('#scale-name').textContent=french(root)+' '+scaleNames[kind]+' · écrit ténor';$('#scale-notes').innerHTML=chips(scale(root,kind),['I','II','III','IV','V','VI','VII']);$('#scale-concert').textContent='Tonique concert : '+french(concertNote(root))+'. Les notes affichées restent les notes à lire au ténor.';}
async function playScaleTool(){try{await soundContext();stopSound();const root=$('#scale-key').value,kind=$('#scale-type').value;const mids=ascendingWrittenMidi([...scale(root,kind),root]);const sequence=[...mids,...mids.slice(0,-1).reverse()];const t=audioCtx.currentTime+.07;sequence.forEach((m,i)=>tone(writtenToConcertMidi(m),t+i*.4,.36));$('#scale-status').textContent='Montée et descente : '+french(root)+' '+scaleNames[kind]+' écrit ; '+french(concertNote(root))+' concert.';}catch{$('#scale-status').textContent='Audio indisponible dans ce navigateur.';}}
if($('#scale-key')){['#scale-key','#scale-type'].forEach(id=>$(id).addEventListener('change',()=>{stopSound();updateScaleTool();}));$('#scale-play').addEventListener('click',playScaleTool);$('#scale-stop').addEventListener('click',()=>{stopSound();$('#scale-status').textContent='Lecture arrêtée.';});updateScaleTool();}
function updateCadenceTool(){const root=$('#cadence-key').value,mode=$('#cadence-mode').value,chords=cadenceOf(root,mode);$('#cadence-heading').textContent=french(root)+' '+(mode==='minor'?'mineur':'majeur')+' · écrit ténor';$('#cadence-cards').innerHTML=chords.map((c,i)=>'<div class="chord '+(i===2?'target':'')+'"><small>'+['II','V',mode==='minor'?'i':'I'][i]+'</small><strong>'+c.symbol+'</strong><span>'+c.notes.map(french).join(' · ')+'</span></div>').join('');$('#cadence-details').innerHTML='<div class="table-wrap"><table><thead><tr><th>Accord écrit</th><th>Notes écrites</th><th>Tierce / septième</th></tr></thead><tbody>'+chords.map(c=>'<tr><td>'+c.symbol+'</td><td>'+c.notes.map(n=>french(n)+' ('+pretty(n)+')').join(' · ')+'</td><td>'+french(c.notes[1])+' / '+french(c.notes[3])+'</td></tr>').join('')+'</tbody></table></div>';$('#cadence-concert').textContent='Correspondance concert : '+chords.map(c=>pretty(concertNote(c.root))+(c.quality==='m7b5'?'m7♭5':c.quality)).join(' → ')+'.';}
async function playCadenceTool(){try{await soundContext();stopSound();const root=$('#cadence-key').value,mode=$('#cadence-mode').value,chords=cadenceOf(root,mode),t=audioCtx.currentTime+.08;chords.forEach((c,i)=>ascendingWrittenMidi(c.notes).forEach((m,j)=>tone(writtenToConcertMidi(m),t+i*4+j,.88)));tone(writtenToConcertMidi(60+pc(root)),t+12,1.6);$('#cadence-status').textContent='Trois arpèges, une mesure par accord à 60 à la noire, puis la tonique. Audio transposé pour le ténor.';}catch{$('#cadence-status').textContent='Audio indisponible dans ce navigateur.';}}
if($('#cadence-key')){['#cadence-key','#cadence-mode'].forEach(id=>$(id).addEventListener('change',()=>{stopSound();updateCadenceTool();}));$('#cadence-play').addEventListener('click',playCadenceTool);$('#cadence-stop').addEventListener('click',()=>{stopSound();$('#cadence-status').textContent='Lecture arrêtée.';});updateCadenceTool();}
window.addEventListener('pagehide',stopSound);
