const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function audioContextFactory(records){
 return class AudioContext{
  constructor(){this.currentTime=0;this.destination={};}
  resume(){return Promise.resolve();}
  createGain(){return {gain:{value:1,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createDynamicsCompressor(){return {threshold:{},knee:{},ratio:{},attack:{},release:{},connect(){}};}
  createPeriodicWave(){return {};}
  createBuffer(channels,length,rate){const arrays=Array.from({length:channels},()=>new Float32Array(length));return {duration:length/rate,getChannelData:i=>arrays[i]};}
  createBufferSource(){const node={buffer:null,playbackRate:{value:1},connect(){},disconnect(){},start(time){records.push({kind:node.buffer.duration>1?'note':'click',midi:60+12*Math.log2(node.playbackRate.value),time,node});},stop(time){node.end=time;}};return node;}
  createOscillator(){const node={frequency:{value:440},setPeriodicWave(){},connect(){},disconnect(){},start(time){records.push({kind:'note',midi:69+12*Math.log2(node.frequency.value/440),time,node});},stop(time){node.end=time;}};return node;}
 };
}
function fakeElement(attrs){
 const a=Object.fromEntries([...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 return {value:a.value??'',checked:/\bchecked\b/.test(attrs),textContent:'',innerHTML:'',style:{},dataset:Object.fromEntries(Object.entries(a).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),events:{},classList:{add(){},remove(){},toggle(){}},addEventListener(name,fn){this.events[name]=fn;},setAttribute(k,v){a[k]=v;},removeAttribute(k){delete a[k];},querySelector:()=>({disabled:false}),querySelectorAll:()=>[],closest:()=>null};
}
function pageContext(file){
 const html=fs.readFileSync('docs/'+file,'utf8'),elements=new Map(),records=[],intervals=new Map(),timeouts=new Map();let id=0;
 for(const match of html.matchAll(/<([\w-]+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){
  const el=fakeElement(match[2]);
  if(match[1]==='select'){
   const tail=html.slice(match.index+match[0].length),inside=tail.slice(0,tail.indexOf('</select>')),options=[...inside.matchAll(/<option\b([^>]*)>/g)];
   const selected=options.find(o=>/\bselected\b/.test(o[1]))||options[0];if(selected)el.value=/\bvalue="([^"]*)"/.exec(selected[1])?.[1]??'';
  }
  elements.set('#'+match[3],el);
 }
 const sandbox={console,location:{hash:''},document:{querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){}}}},window:{AudioContext:audioContextFactory(records),addEventListener(){}},setTimeout:(fn,delay)=>{const next=++id;timeouts.set(next,{fn,delay});return next;},clearTimeout:key=>timeouts.delete(key),setInterval:fn=>{const next=++id;intervals.set(next,fn);return next;},clearInterval:key=>intervals.delete(key)};
 vm.createContext(sandbox);for(const script of ['rhythms.js','audio.js','workshops.js','app.js','listening.js'])vm.runInContext(fs.readFileSync('docs/assets/'+script,'utf8'),sandbox,{filename:script});
 vm.runInContext('globalThis.api={stopSound,updateCircle};',sandbox);
 return {sandbox,elements,records,intervals,timeouts};
}
(async()=>{
 const scenarios=[['bases.html','interval',2],['accords.html','chord',4],['gammes.html','scale',15],['ii-v-i-majeur.html','cadence',13],['ii-v-i-mineur.html','cadence',13],['notes-guides.html','guide',3],['structure.html','form',8],['body-and-soul.html','body',15],['cycle.html','cycle',13],['blues.html','blues',13]];
 for(const [page,prefix,count] of scenarios){
  const ctx=pageContext(page),api=ctx.sandbox.window.JazzListening,plan=api.makePlan(prefix);
  assert.equal(plan.events.length,count,page+' default exercise');assert(ctx.elements.get('#'+prefix+'-score').innerHTML.includes('<svg'),page+' score renders on load');
  if(prefix==='scale')await api.playScale();else if(prefix==='blues')await api.playBlues();else if(prefix==='cadence')await api.playCadence();else await ctx.elements.get('#'+prefix+'-play').events.click();
  assert.equal(ctx.records.filter(r=>r.kind==='note').length,count,page+' audible notes');ctx.sandbox.api.stopSound();assert.equal(ctx.intervals.size,0,page+' stops all loops');
 }
 const ctx=pageContext('gammes.html'),audio=ctx.sandbox.window.JazzListening;
 ctx.elements.get('#scale-loop').checked=true;ctx.elements.get('#scale-click').checked=true;await audio.playScale();assert.equal(ctx.intervals.size,1,'Loop is scheduled');assert(ctx.records.some(r=>r.kind==='click'),'Optional click is audible');ctx.sandbox.api.stopSound();assert.equal(ctx.intervals.size,0);
 ctx.records.length=0;const pending=audio.playScale();ctx.sandbox.api.stopSound();await pending;assert.equal(ctx.records.length,0,'Stop cancels a playback waiting for audio resume');
 const form=pageContext('structure.html');form.elements.get('#form-section').value='A2';const passage=form.sandbox.window.JazzListening.makePlan('form');assert(form.sandbox.window.JazzListening.notationSVG(passage).includes('Mesure 9'),'Selected section retains source measure numbers');
 const minor=pageContext('ii-v-i-mineur.html');minor.elements.get('#cadence-reading').value='guides';minor.elements.get('#cadence-key').value='F#';const line=minor.sandbox.window.JazzListening.makePlan('cadence').events.slice(0,3);assert(line.slice(1).every((e,i)=>Math.abs(e.midi-line[i].midi)<=2),'Guide line uses close voice leading');
 console.log('OK : 10 ateliers initialisés et joués, portées, boucle, clic, arrêt immédiat et voix conjointes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
