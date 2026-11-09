const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const elements=new Map(), scheduled=[],intervals=new Map();let timerId=0;
class FakeAudioContext{
 constructor(){this.currentTime=0;this.destination={};FakeAudioContext.instance=this;}
 resume(){return Promise.resolve();}
 createOscillator(){const o={frequency:{value:0},connect(){},disconnect(){},start(time){scheduled.push({midi:69+12*Math.log2(o.frequency.value/440),time,osc:o});},stop(time){if(time!==undefined)o.end=time;}};return o;}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
}
const sandbox={console,document:{querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[],addEventListener(){}},window:{AudioContext:FakeAudioContext,addEventListener(){}},setTimeout:()=>++timerId,clearTimeout(){},setInterval:f=>{const id=++timerId;intervals.set(id,f);return id;},clearInterval:id=>intervals.delete(id)};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('docs/assets/rhythms.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('docs/assets/app.js','utf8')+'\nglobalThis.api={scale,pc,patterns,eventsOf,startRhythm,stopSound,cadenceOf,concertNote,writtenToConcertMidi,ascendingWrittenMidi,playScaleTool,playCadenceTool,rhythmSVG,updateRhythm};',sandbox);
const a=sandbox.api,plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(a.scale('Db')),['Db','Eb','F','Gb','Ab','Bb','C']);
assert.deepEqual(plain(a.scale('F#')),['F#','G#','A#','B','C#','D#','E#']);
assert.deepEqual(plain(a.scale('C','minorBlues')),['C','Eb','F','Gb','G','Bb']);
assert.deepEqual(plain(a.scale('Eb','minorBlues')),['Eb','Gb','Ab','Bbb','Bb','Db']);
assert.deepEqual(plain(a.scale('Db','majorBlues')),['Db','Eb','Fb','F','Ab','Bb']);
for(const key of ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']){
 for(const [type,expected] of [['major',[0,2,4,5,7,9,11]],['minorBlues',[0,3,5,6,7,10]],['majorBlues',[0,2,3,4,7,9]]]){
  const notes=a.scale(key,type);assert.deepEqual(plain(notes.map(n=>(a.pc(n)-a.pc(key)+12)%12)),expected,`${key} ${type}`);
 }
}
const reference=JSON.parse(fs.readFileSync('docs/assets/harmony.json','utf8'));
for(const [root,scales] of Object.entries(reference.scales)){
 for(const [kind,notes] of Object.entries(scales))assert.deepEqual(plain(a.scale(root,kind)),notes,root+' '+kind);
 for(const mode of ['major','minor'])assert.deepEqual(plain(a.cadenceOf(root,mode)),reference.cadences[root][mode],root+' '+mode);
}
assert.deepEqual(plain(a.cadenceOf('C','minor')).map(c=>c.notes),[['D','F','Ab','C'],['G','B','D','F'],['C','Eb','G','Bb']]);
assert.deepEqual(plain(a.scale('D','harmonicMinor')),['D','E','F','G','A','Bb','C#']);
assert.deepEqual(plain(a.scale('D','melodicMinor')),['D','E','F','G','A','B','C#']);
assert.equal(a.concertNote('C'),'Bb');assert.equal(a.concertNote('Eb'),'Db');
assert.equal(a.concertNote('B#'),'A#');assert.equal(a.writtenToConcertMidi(60),46);
assert.equal(reference.study.length,32);
for(const measure of reference.study){assert.equal(measure.chords.reduce((n,c)=>n+c.beats,0),4,'Every measure has four beats');}
assert.deepEqual(reference.study.filter(m=>[1,9,17,25].includes(m.number)).map(m=>m.section),['A₁','A₂','B','A₃']);
for(const [name,p] of Object.entries(a.patterns)){
 const total=p.events.reduce((sum,e)=>sum+e.ticks,0);assert.equal(total,p.barTicks*p.bars,name+' total duration');
 assert.equal(p.barTicks/p.pulseTicks,p.pulses,name+' pulse grouping');
 const events=a.eventsOf(p);assert.equal(events.length,p.events.length);
 p.events.forEach((event,i)=>{if(event.tieNext){assert(p.events[i+1]&&!p.events[i+1].rest,name+' tie target');assert(!event.rest,name+' tie source');}});
 const svg=a.rhythmSVG(p);assert(svg.startsWith('<svg'));assert(!/NaN|undefined/.test(svg),name+' valid drawing');
}
for(const [name,positions] of [['whole',[0]],['halves',[0,2]],['quarters',[0,1,2,3]],['eighths',[0,.5,1,1.5,2]],['dotted-quarter',[0,1.5,2,3]],['dotted-eighths',[0,.75,1,1.75,2,2.75,3,3.75]],['ties',[0,.5,2,3]],['untied',[0,.5,1,2,3]],['crossbar',[0,1,1.5,2,3,5.5,6,6.75,7]],['waltz',[0,2]],['compound',[0,1/3,2/3,1]]]){
 const events=a.eventsOf(a.patterns[name]).filter(e=>e.on);assert.deepEqual(plain(events.map(e=>e.beat)),positions,name+' attacks');
}
assert.equal(a.eventsOf(a.patterns['whole-rest']).filter(e=>e.on).length,0);
assert.equal(a.eventsOf(a.patterns.ties)[1].soundingDuration,1.5);
assert.equal(a.eventsOf(a.patterns.crossbar).find(e=>e.beat===3).soundingDuration,2);
assert.equal(a.patterns.compound.pulses,2);assert.equal(a.patterns.waltz.pulses,3);
assert(a.rhythmSVG(a.patterns.whole).includes('fill="#fff"'),'Whole note has an open head');
assert(!a.rhythmSVG(a.patterns.quarters).includes('fill="#fff"'),'Quarter notes have filled heads');
(async()=>{
 for(const [pattern,expectedCount] of [['whole',1],['halves',2],['dotted-quarter',4],['dotted-eighths',8],['ties',4],['untied',5],['rests',1],['whole-rest',0],['crossbar',9],['waltz',2],['compound',4]]){
  scheduled.length=0;const p=a.patterns[pattern];
  for(const [id,value] of [['#tempo','60'],['#rhythm-pattern',pattern],['#metro-mode','all']])elements.set(id,{value});
  elements.set('#rhythm-start',{textContent:'',setAttribute(){}});elements.set('#rhythm-status',{textContent:''});
  await a.startRhythm();const ctx=FakeAudioContext.instance;assert.equal(scheduled.length,p.pulses,'One measure of count-in: '+pattern);
  const scheduler=[...intervals.values()][0];ctx.currentTime=p.pulses+.1;scheduler();
  const notes=scheduled.filter(x=>Math.abs(x.midi-58)<1e-8);assert.equal(notes.length,expectedCount,pattern+' audible attacks');
  if(notes.length&&pattern!=='rests')assert(Math.abs(notes[0].time-(p.pulses+.12))<1e-8,'Pattern starts after count-in');
  if(pattern==='ties')assert(Math.abs(notes[1].osc.end-notes[1].time-(1.5-.018+.02))<1e-8,'Eighth tied to quarter lasts 1.5 beats');
  if(pattern==='crossbar')assert(Math.abs(notes[4].osc.end-notes[4].time-(2-.018+.02))<1e-8,'Tie sustains across the bar');
  if(pattern==='compound')assert(Math.abs(notes[3].osc.end-notes[3].time-(1-.018+.02))<1e-8,'Dotted quarter is one compound pulse');
  a.stopSound();assert.equal(intervals.size,0,'Stop clears scheduler');ctx.currentTime=0;
 }
 const metroOption={disabled:false};
 for(const id of ['#rhythm-description','#tempo-unit','#attack-count'])elements.set(id,{textContent:''});
 elements.set('#rhythm-drawing',{innerHTML:''});elements.set('#rhythm-beats',{style:{},innerHTML:''});
 elements.set('#metro-mode',{value:'24',querySelector:()=>metroOption});elements.set('#rhythm-pattern',{value:'compound'});
 a.updateRhythm();assert.equal(elements.get('#metro-mode').value,'all');assert.equal(metroOption.disabled,true);
 assert.equal(elements.get('#tempo-unit').textContent,'♩. =');assert.equal(elements.get('#rhythm-beats').style.gridTemplateColumns,'repeat(2,1fr)');
 elements.get('#rhythm-pattern').value='quarters';a.updateRhythm();assert.equal(metroOption.disabled,false);assert.equal(elements.get('#tempo-unit').textContent,'♩ =');
 scheduled.length=0;
 elements.delete('#rhythm-start');elements.delete('#rhythm-status');
 for(const [id,value] of [['#scale-key','C'],['#scale-type','harmonicMinor']])elements.set(id,{value});
 elements.set('#scale-status',{textContent:''});
 await a.playScaleTool();
 assert.equal(scheduled.length,15,'Seven-note scale and octave, then descent');
 assert.equal(Math.round(scheduled[0].midi),46,'Written C4 sounds concert Bb2');
 assert.equal(Math.round(scheduled[7].midi),58,'Octave sounds concert Bb3');a.stopSound();
 scheduled.length=0;
 for(const [id,value] of [['#cadence-key','C'],['#cadence-mode','minor']])elements.set(id,{value});
 elements.set('#cadence-status',{textContent:''});await a.playCadenceTool();
 assert.equal(scheduled.length,13,'Twelve arpeggio notes and final tonic');
 assert.deepEqual(scheduled.slice(0,4).map(n=>Math.round(n.midi)),[48,51,54,58]);a.stopSound();
 console.log('OK : 84 gammes, 24 cadences, 32 mesures, 20 lectures rythmiques et audio ténor : durées, points, liaisons, silences, 3/4 et 6/8.');
})().catch(e=>{console.error(e);process.exitCode=1;});
