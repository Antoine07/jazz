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
vm.runInContext(fs.readFileSync('docs/assets/app.js','utf8')+'\nglobalThis.api={scale,pc,patterns,eventsOf,startRhythm,stopSound,cadenceOf,concertNote,writtenToConcertMidi,ascendingWrittenMidi,playScaleTool,playCadenceTool};',sandbox);
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
for(const [name,count,positions] of [['triplets',6,[0,2/3,4/3,2,8/3,10/3]],['tie',5,[0,2/3,4/3,8/3,10/3]],['doubletie',4,[0,4/3,8/3,10/3]],['variation1',4,[0,2/3,2,8/3]],['variation2',4,[0,4/3,2,10/3]]]){
 const p=a.patterns[name],events=a.eventsOf(p).filter(e=>e.on);assert.equal(events.length,count);
 assert.deepEqual(plain(events.map(e=>e.beat)),positions);
 for(const [from,to] of p.ties){assert.equal(p.mask[from],1);assert.equal(p.mask[to],0);}
 const lengths=events.map((e,i)=>(events[i+1]?.beat??4)-e.beat);assert(Math.abs(lengths.reduce((x,y)=>x+y,0)-4)<1e-10);
}
(async()=>{
 for(const [pattern,expectedCount] of [['triplets',6],['tie',5],['doubletie',4],['rests',4]]){
  scheduled.length=0;
  for(const [id,value] of [['#tempo','60'],['#rhythm-pattern',pattern],['#metro-mode','all']])elements.set(id,{value});
  elements.set('#rhythm-start',{textContent:'',setAttribute(){}});elements.set('#rhythm-status',{textContent:''});
  await a.startRhythm();const ctx=FakeAudioContext.instance;assert.equal(scheduled.length,4,'One measure of count-in');
  const scheduler=[...intervals.values()][0];ctx.currentTime=4.1;scheduler();
  const notes=scheduled.filter(x=>Math.abs(x.midi-58)<1e-8);assert.equal(notes.length,expectedCount);
  assert(Math.abs(notes[0].time-4.12)<1e-8,'Pattern starts after four beats');
  if(pattern==='doubletie')assert(Math.abs(notes[0].osc.end-notes[0].time-(4/3-.018+.02))<1e-8,'Tied note spans two triplet positions');
  if(pattern==='rests')assert(Math.abs(notes[0].osc.end-notes[0].time-(2/3-.018+.02))<1e-8,'Rest cuts the note after one position');
  a.stopSound();assert.equal(intervals.size,0,'Stop clears scheduler');ctx.currentTime=0;
 }
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
 console.log('OK : 84 gammes, 24 cadences, 32 mesures et audio ténor (−14 demi-tons), liaisons et silences.');
})().catch(e=>{console.error(e);process.exitCode=1;});
