/* Instruments et pulsations synthétisés localement : aucun téléchargement audio. */
(function(){
 'use strict';
 const defaults={timbre:'piano',noteVolume:.7,clickVolume:.75,clickStyle:'wood'};
 let preferences={...defaults};try{preferences={...defaults,...JSON.parse(localStorage.getItem('jazz-sound')||'{}')};}catch{}
 const contexts=new WeakMap();
 function pianoSamples(rate=22050){
  const duration=3.6,data=new Float32Array(Math.ceil(rate*duration)),frequency=261.6255653;
  const amplitudes=[1,.43,.21,.105,.055,.028,.013,.007];let seed=41,lowNoise=0,peak=0;
  for(let i=0;i<data.length;i++){
   const t=i/rate;let value=0;
   for(let h=1;h<=amplitudes.length;h++){
    const partial=frequency*h*Math.sqrt(1+.000055*h*h),decay=2.1/(1+.46*(h-1));
    value+=amplitudes[h-1]*Math.exp(-t/decay)*Math.sin(2*Math.PI*partial*t);
   }
   value+=.12*Math.exp(-t/1.45)*Math.sin(2*Math.PI*frequency*1.0008*t);
   seed=(1664525*seed+1013904223)>>>0;lowNoise=.72*lowNoise+.28*(seed/2147483648-1);
   value+=.07*lowNoise*Math.exp(-t/.012);
   value*=Math.min(1,t/.005)*Math.min(1,(duration-t)/.15);
   data[i]=value;peak=Math.max(peak,Math.abs(value));
  }
  const gain=.72/Math.max(peak,.001);for(let i=0;i<data.length;i++)data[i]*=gain;
  return data;
 }
 function clickSamples(accent=false,style='wood',rate=22050){
  const duration=style==='felt'?.09:.075,data=new Float32Array(Math.ceil(rate*duration));
  const frequency=style==='felt'?(accent?480:360):(accent?760:570);let seed=accent?117:71,noise=0;
  for(let i=0;i<data.length;i++){
   const t=i/rate;seed=(1664525*seed+1013904223)>>>0;noise=.8*noise+.2*(seed/2147483648-1);
   const body=Math.sin(2*Math.PI*frequency*t)+.29*Math.sin(2*Math.PI*frequency*1.47*t);
   const attack=Math.min(1,t/.0025),decay=Math.exp(-t/(style==='felt'?.017:.012));
   data[i]=.48*attack*decay*(body+.09*noise)*Math.min(1,(duration-t)/.006);
  }
  return data;
 }
 function bufferFrom(ctx,data){const buffer=ctx.createBuffer(1,data.length,22050);buffer.getChannelData(0).set(data);return buffer;}
 function attach(ctx){
  if(contexts.has(ctx))return contexts.get(ctx);
  const music=ctx.createGain(),clicks=ctx.createGain(),master=ctx.createGain();master.gain.value=.86;
  const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-15;limiter.knee.value=20;limiter.ratio.value=3;limiter.attack.value=.006;limiter.release.value=.18;
  music.connect(limiter);clicks.connect(limiter);limiter.connect(master);master.connect(ctx.destination);
  const state={music,clicks,master,piano:null,clickBuffers:new Map(),wave:null};contexts.set(ctx,state);apply(ctx);return state;
 }
 function apply(ctx){const s=contexts.get(ctx);if(!s)return;const now=ctx.currentTime;s.music.gain.setTargetAtTime(Number(preferences.noteVolume),now,.02);s.clicks.gain.setTargetAtTime(Number(preferences.clickVolume),now,.02);}
 function setting(key,value){if(!(key in defaults))return;preferences[key]=typeof defaults[key]==='number'?Math.max(0,Math.min(1,Number(value))):value;try{localStorage.setItem('jazz-sound',JSON.stringify(preferences));}catch{}return preferences[key];}
 function warm(ctx){const state=attach(ctx);if(!state.piano)state.piano=bufferFrom(ctx,pianoSamples());}
 function note(ctx,midi,time,duration,options={}){
  const state=attach(ctx),gain=ctx.createGain(),voice=options.voice||preferences.timbre,velocity=options.velocity??.32;
  let source,release;
  if(voice==='piano'){
   if(!state.piano)state.piano=bufferFrom(ctx,pianoSamples());source=ctx.createBufferSource();source.buffer=state.piano;source.playbackRate.value=2**((midi-60)/12);release=.12;
   gain.gain.setValueAtTime(velocity,time);gain.gain.setValueAtTime(velocity,time+Math.max(.01,duration-.018));gain.gain.exponentialRampToValueAtTime(.0001,time+duration+release);
  }else{
   source=ctx.createOscillator();source.frequency.value=440*2**((midi-69)/12);
   if(!state.wave){const real=new Float32Array(10),imag=new Float32Array([0,1,.18,.11,.035,.025,.008,.006,0,0]);state.wave=ctx.createPeriodicWave(real,imag);}
   source.setPeriodicWave(state.wave);release=.045;gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(velocity*.68,time+.018);gain.gain.setValueAtTime(velocity*.68,time+Math.max(.019,duration-.018));gain.gain.exponentialRampToValueAtTime(.0001,time+duration+release);
  }
  source.connect(gain);gain.connect(state.music);source.start(time);source.stop(time+duration+release+.01);
  return {source,cleanup(){source.disconnect();gain.disconnect();}};
 }
 function click(ctx,accent,time){
  const state=attach(ctx),key=preferences.clickStyle+':'+accent;
  if(!state.clickBuffers.has(key))state.clickBuffers.set(key,bufferFrom(ctx,clickSamples(accent,preferences.clickStyle)));
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=state.clickBuffers.get(key);gain.gain.value=accent?.48:.4;source.connect(gain);gain.connect(state.clicks);source.start(time);source.stop(time+source.buffer.duration+.01);
  return {source,cleanup(){source.disconnect();gain.disconnect();}};
 }
 window.JazzSound={attach,apply,warm,note,click,setting,preferences:()=>({...preferences}),pianoSamples,clickSamples};
})();
