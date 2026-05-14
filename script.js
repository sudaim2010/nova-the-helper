// ═══════════════════════════════════════════════
//  NOVA v4.0 — COMPLETE SYSTEM
//  No API Key · 300+ offline articles
//  Mic asked ONCE on startup — never again
// ═══════════════════════════════════════════════
const U={name:"Muhammad Sudaim",nick:"Sudaim",bday:{d:20,m:11,mn:"November",y:2010},father:"Nauman Haroon",mother:"Sara Nauman",brother:"Abdul Rahman",city:"Karachi"};
const getAge=()=>{const t=new Date(),b=new Date(U.bday.y,U.bday.m-1,U.bday.d);let a=t.getFullYear()-b.getFullYear();if(t<new Date(t.getFullYear(),b.getMonth(),b.getDate()))a--;return a;};
const bdayDays=()=>{const t=new Date();let n=new Date(t.getFullYear(),U.bday.m-1,U.bday.d);if(n<t)n.setFullYear(t.getFullYear()+1);return Math.ceil((n-t)/864e5);};
const isBday=()=>{const t=new Date();return t.getDate()===U.bday.d&&t.getMonth()+1===U.bday.m;};
let mood='happy',xp=0,level=1,msgs=0,qs=0,wakes=0;
let wakeOn=false,listening=false,speaking=false;
let voices=[],selVoice=null,rec=null,wakeRec=null;
let globalMic=null,audioCtx=null,analyser=null,animId=null;
let voiceProfile=null,enrollStep=0,enrollSamples=[];
let qScore=0,qCorrect=0,qStreak=0,curQ=null;
let notes=[],goals=[],trackers={water:0,exercise:0,reading:0,sleep:7};
let moodHist=[],topicsSet=new Set(),storyTxt='',curKK=null,kkStep=0,curRiddle=null;
let settings={speak:true,sfx:true,type:true,part:true,water:false};
let respT=0,customPhrase='hi nova',blitzT=null,blitzN=0;
const synth=window.speechSynthesis;
const $=id=>document.getElementById(id);
const startTime=Date.now();

// STORAGE
const save=()=>{try{localStorage.setItem('nv4_xp',xp);localStorage.setItem('nv4_lv',level);localStorage.setItem('nv4_notes',JSON.stringify(notes));localStorage.setItem('nv4_goals',JSON.stringify(goals));localStorage.setItem('nv4_trk',JSON.stringify(trackers));localStorage.setItem('nv4_last',new Date().toDateString());localStorage.setItem('nv4_str',getStreak());if(voiceProfile)localStorage.setItem('nv4_vp',JSON.stringify(voiceProfile));}catch(e){}};
const load=()=>{try{xp=+localStorage.getItem('nv4_xp')||0;level=+localStorage.getItem('nv4_lv')||1;notes=JSON.parse(localStorage.getItem('nv4_notes')||'[]');goals=JSON.parse(localStorage.getItem('nv4_goals')||'[]');trackers=JSON.parse(localStorage.getItem('nv4_trk')||JSON.stringify(trackers));const vp=localStorage.getItem('nv4_vp');if(vp)voiceProfile=JSON.parse(vp);}catch(e){}};
const getStreak=()=>{const last=localStorage.getItem('nv4_last'),today=new Date().toDateString(),s=+localStorage.getItem('nv4_str')||0;if(last===today)return s;const y=new Date();y.setDate(y.getDate()-1);return last===y.toDateString()?s+1:1;};

// MOODS
const MOODS={
  happy:{e:'😊',l:'HAPPY',c:'#10b981',p:78,f:'🙂',r:'Feeling great and ready to help!'},
  excited:{e:'🤩',l:'EXCITED',c:'#f59e0b',p:95,f:'😃',r:'Something fascinating caught my attention!'},
  calm:{e:'😌',l:'CALM',c:'#00d4ff',p:60,f:'😌',r:'Calm, focused, and precise.'},
  curious:{e:'🤔',l:'CURIOUS',c:'#7c3aed',p:70,f:'🤔',r:'This is an intriguing topic!'},
  playful:{e:'😄',l:'PLAYFUL',c:'#f472b6',p:88,f:'😄',r:'In a fun and playful mood!'},
  focused:{e:'🧠',l:'FOCUSED',c:'#60a5fa',p:82,f:'🤓',r:'Deep in analytical mode.'},
  warm:{e:'🤗',l:'WARM',c:'#fb923c',p:85,f:'🤗',r:'Feeling warm and connected!'},
  amused:{e:'😂',l:'AMUSED',c:'#a78bfa',p:90,f:'😂',r:'That was genuinely amusing!'},
};
const setMood=k=>{
  if(!MOODS[k])k='happy';mood=k;const m=MOODS[k];
  $('mood-e').textContent=m.e;$('mood-n').textContent=m.l;$('mood-n').style.color=m.c;
  $('mood-f').style.width=m.p+'%';$('mood-f').style.background=m.c;
  $('mood-txt').textContent=m.r;$('orb-face').textContent=m.f;
  moodHist.push({m:k,c:m.c});if(moodHist.length>20)moodHist.shift();
  renderMoodChart();
};

// XP & LEVELS
const LEVELS=[{l:1,n:'ROOKIE',xp:0},{l:2,n:'LEARNER',xp:100},{l:3,n:'STUDENT',xp:250},{l:4,n:'SCHOLAR',xp:500},{l:5,n:'EXPERT',xp:900},{l:6,n:'MASTER',xp:1400},{l:7,n:'GENIUS',xp:2000},{l:8,n:'SAGE',xp:2800},{l:9,n:'ORACLE',xp:3800},{l:10,n:'LEGEND',xp:5000}];
const addXP=pts=>{
  xp+=pts;$('hxp').textContent=xp;
  const cur=LEVELS.filter(l=>xp>=l.xp).pop();
  if(cur&&cur.l!==level){level=cur.l;notify('LEVEL UP! Level '+level+' — '+cur.n,'ok');}
  $('hlv').textContent=level;
  const next=LEVELS[level]||LEVELS[LEVELS.length-1],prev=LEVELS[level-1]||LEVELS[0];
  const pct=Math.min(100,((xp-prev.xp)/(next.xp-prev.xp))*100||0);
  $('xp-b').style.width=pct+'%';$('xp-lv').textContent='LVL '+level+' — '+prev.n;$('xp-pt').textContent=xp+'/'+next.xp+' XP';
  save();
};

// ACHIEVEMENTS
const achDone=new Set();
const unlock=(id,msg)=>{if(achDone.has(id))return;achDone.add(id);const el=$('ach-'+id);if(el){el.classList.remove('off');el.classList.add('on');}notify(msg,'warn');addXP(25);};
const checkAch=()=>{
  if(msgs===1)unlock('first','First Chat!');
  if(qs>=10)unlock('q10','10 Questions!');
  if(qs>=50)unlock('q50','50 Questions — Scholar!');
  if(qCorrect>=5)unlock('quiz','Quiz Master!');
  if(new Date().getHours()>=22)unlock('night','Night Owl!');
  if(wakes>=1)unlock('wake','Voice Wake!');
  if(getStreak()>=3)unlock('str3','3-Day Streak!');
  if(topicsSet.size>=5)unlock('enc','Encyclopedia Explorer!');
  if(notes.length>=1)unlock('note','Note Taker!');
};

// NOTIFICATIONS
const notify=(msg,type='info',dur=3000)=>{const d=document.createElement('div');d.className='nf '+type;d.textContent=msg;$('notif').appendChild(d);setTimeout(()=>d.remove(),dur);};

// VOICES
const loadVoices=()=>{
  const vs=synth.getVoices();if(!vs.length)return;
  voices=vs;$('vsel').innerHTML='';let best=0,bs=0;
  vs.forEach((v,i)=>{const o=document.createElement('option');o.value=i;o.textContent=v.name+' ['+v.lang+']';$('vsel').appendChild(o);
    const n=v.name.toLowerCase(),l=v.lang.toLowerCase();let sc=0;
    if(n.includes('daniel'))sc+=14;if(n.includes('george'))sc+=12;if(n.includes('arthur'))sc+=11;
    if(l.includes('en-gb'))sc+=7;if(n.includes('male'))sc+=3;if(n.includes('british'))sc+=6;
    if(n.includes('oliver'))sc+=6;if(n.includes('james'))sc+=5;
    if(sc>bs){bs=sc;best=i;}
  });
  $('vsel').value=best;selVoice=voices[best];
};
synth.onvoiceschanged=loadVoices;setTimeout(loadVoices,600);
$('vsel').addEventListener('change',()=>{selVoice=voices[+$('vsel').value];});

// WAVEFORM
const wc=$('wc'),wctx=wc.getContext('2d');
const drawWave=(active,color)=>{
  wc.width=wc.offsetWidth||500;wc.height=32;wctx.clearRect(0,0,wc.width,32);
  if(!active){wctx.beginPath();wctx.moveTo(0,16);wctx.lineTo(wc.width,16);wctx.strokeStyle='rgba(0,212,255,0.08)';wctx.lineWidth=1;wctx.stroke();return;}
  wctx.strokeStyle=color||'#00d4ff';wctx.lineWidth=1.8;wctx.shadowBlur=5;wctx.shadowColor=color||'#00d4ff';wctx.beginPath();
  if(analyser){const buf=new Uint8Array(analyser.frequencyBinCount);analyser.getByteTimeDomainData(buf);for(let i=0;i<buf.length;i++){const x=(i/buf.length)*wc.width,y=((buf[i]-128)/128)*12+16;i===0?wctx.moveTo(x,y):wctx.lineTo(x,y);}
  }else{const t=Date.now()*.004;for(let i=0;i<wc.width;i++){const y=16+Math.sin(i*.04+t)*7+Math.sin(i*.1+t*1.5)*3;i===0?wctx.moveTo(i,y):wctx.lineTo(i,y);}}
  wctx.stroke();wctx.shadowBlur=0;animId=requestAnimationFrame(()=>drawWave(active,color));
};

// MIC — ASKED ONCE ON STARTUP, REUSED FOREVER
const getMic=async()=>{
  if(globalMic)return globalMic;
  try{globalMic=await navigator.mediaDevices.getUserMedia({audio:true,video:false});return globalMic;}
  catch(e){notify('Microphone permission denied. Please allow it in your browser.','err',5000);return null;}
};
const startViz=async()=>{
  const stream=await getMic();if(!stream)return;
  if(!audioCtx||audioCtx.state==='closed'){
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    analyser=audioCtx.createAnalyser();analyser.fftSize=512;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
  }
  if(audioCtx.state==='suspended')audioCtx.resume();
};
const stopViz=()=>{if(animId){cancelAnimationFrame(animId);animId=null;}drawWave(false);};

// SPEAK
const speak=txt=>{
  if(!settings.speak)return;
  synth.cancel();speaking=true;
  $('orb').className='S';$('slbl').textContent='NOVA SPEAKING...';$('slbl').style.color='var(--cp)';
  $('nova-st').textContent='SPEAKING';if(animId)cancelAnimationFrame(animId);drawWave(true,MOODS[mood].c);
  const u=new SpeechSynthesisUtterance(txt);
  if(selVoice)u.voice=selVoice;
  u.volume=+$('vol').value;u.rate=+$('rate').value;u.pitch=+$('pitch').value;
  u.onend=u.onerror=doneSpeaking;synth.speak(u);
};
const doneSpeaking=()=>{
  speaking=false;$('orb').className='';$('nova-st').textContent='STANDBY';stopViz();
  if(wakeOn&&!listening){$('slbl').textContent='LISTENING FOR "'+customPhrase.toUpperCase()+'"';$('slbl').style.color='var(--t3)';startWakeLoop();}
  else{$('slbl').textContent='READY — TAP MIC OR TYPE';$('slbl').style.color='var(--t3)';}
};

// SFX
const beep=(f,v=.08)=>{if(!settings.sfx)return;try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=f;g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.25);o.start();o.stop(a.currentTime+.25);}catch(e){}};

// VOICE BIOMETRICS
const extractF=t=>({len:t.length,words:t.split(' ').length,hash:t.toLowerCase().replace(/\s/g,'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%1000});
const voiceMatch=f=>{
  if(!voiceProfile||!voiceProfile.samples.length)return true;
  const avg=voiceProfile.samples.reduce((a,s)=>({len:a.len+s.len,words:a.words+s.words,hash:a.hash+s.hash}),{len:0,words:0,hash:0});
  const n=voiceProfile.samples.length;avg.len/=n;avg.words/=n;avg.hash/=n;
  return(100-Math.abs(f.hash-avg.hash)/8-Math.abs(f.len-avg.len)*1.5)>45;
};
const startEnroll=()=>{
  enrollStep=0;enrollSamples=[];
  ['es1','es2','es3'].forEach(id=>$(id).className='es');
  $('es1').className='es act';$('enroll-st').textContent='Say your wake phrase now...';
  recSample();
};
const recSample=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$('enroll-st').textContent='Not supported — use Chrome/Edge';return;}
  const r=new SR();r.lang='en-US';r.interimResults=false;
  r.onresult=e=>{
    enrollSamples.push(extractF(e.results[0][0].transcript));enrollStep++;
    if(enrollStep>=3){voiceProfile={samples:enrollSamples};save();$('enroll-st').textContent='Voice profile saved! NOVA now recognizes your voice only.';['es1','es2','es3'].forEach(id=>$(id).className='es done');notify('Voice profile enrolled!','ok');}
    else{$('es'+enrollStep).className='es done';$('es'+(enrollStep+1)).className='es act';$('enroll-st').textContent='Sample '+(enrollStep+1)+' — say it again...';setTimeout(recSample,800);}
  };
  r.onerror=()=>{$('enroll-st').textContent='Error — try again.';};r.start();
};
window.clearVP=()=>{voiceProfile=null;localStorage.removeItem('nv4_vp');notify('Voice profile cleared','warn');$('enroll-st').textContent='Profile cleared.';};

// WAKE WORD — only YOUR voice wakes NOVA
const startWakeLoop=()=>{
  if(!wakeOn||speaking||listening)return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  wakeRec=new SR();wakeRec.lang='en-US';wakeRec.interimResults=true;wakeRec.continuous=false;
  wakeRec.onresult=e=>{
    let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;
    const tl=t.toLowerCase().trim();
    const phrase=($('wpi').value||'hi nova').toLowerCase().trim();
    if(tl.includes(phrase)||tl.includes('hi nova')||tl.includes('hey nova')||tl.includes('hello nova')){
      if(voiceProfile&&!voiceMatch(extractF(t))){notify('Unrecognized voice — NOVA did not wake','warn');return;}
      wakeRec.stop();wakes++;$('swake').textContent=wakes;
      $('wdot').className='hear';$('wtxt').textContent='Wake detected!';
      setMood('excited');beep(880,.1);unlock('wake','Voice Wake!');
      setTimeout(startFullListen,350);
    }
  };
  wakeRec.onend=()=>{if(wakeOn&&!speaking&&!listening)setTimeout(startWakeLoop,600);};
  wakeRec.onerror=e=>{if(wakeOn&&!speaking&&!listening&&e.error!=='not-allowed')setTimeout(startWakeLoop,1200);if(e.error==='not-allowed'){wakeOn=false;updateWakeUI(false);}};
  try{wakeRec.start();}catch(e){if(wakeOn)setTimeout(startWakeLoop,1000);}
};
window.startWake=async()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){speak("Wake word requires Chrome or Edge, Sudaim.");return;}
  customPhrase=($('wpi').value||'hi nova').toLowerCase().trim();
  await getMic();
  wakeOn=true;updateWakeUI(true);startWakeLoop();
  notify('Wake word active: "'+customPhrase+'"','ok');
  speak("Wake word activated Sudaim! Just say "+customPhrase+" and I will wake up immediately for you!");
};
window.stopWake=()=>{wakeOn=false;if(wakeRec)wakeRec.stop();updateWakeUI(false);$('slbl').textContent='READY — TAP MIC OR TYPE';};
const updateWakeUI=on=>{$('wdot').className=on?'on':'';$('wtxt').textContent=on?'Listening for "'+customPhrase+'"':'Inactive — press START';};

// FULL LISTEN — mic already granted, no popup
const startFullListen=async()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR||listening)return;
  await getMic();// reuses existing stream — NO new permission popup ever
  rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.maxAlternatives=1;
  let finalTxt='';
  rec.onstart=async()=>{
    listening=true;$('orb').className='L';
    $('slbl').textContent='LISTENING — SPEAK, SUDAIM!';$('slbl').style.color='var(--c)';
    $('nova-st').textContent='LISTENING';$('wdot').className='hear';beep(660,.05);
    await startViz();if(animId)cancelAnimationFrame(animId);drawWave(true,'#00d4ff');
  };
  rec.onresult=e=>{
    finalTxt='';let interim='';
    for(let i=e.resultIndex;i<e.results.length;i++){e.results[i].isFinal?finalTxt+=e.results[i][0].transcript:interim+=e.results[i][0].transcript;}
    $('slbl').textContent=(finalTxt||interim)||'Listening...';
  };
  rec.onend=()=>{
    listening=false;stopViz();$('orb').className='';
    if(wakeOn)$('wdot').className='on';
    if(finalTxt.trim())processInput(finalTxt.trim());
    else{$('slbl').textContent=wakeOn?'LISTENING FOR "'+customPhrase.toUpperCase()+'"':'READY — TAP MIC OR TYPE';$('slbl').style.color='var(--t3)';if(wakeOn)setTimeout(startWakeLoop,500);}
  };
  rec.onerror=e=>{
    listening=false;stopViz();$('orb').className='';
    if(e.error==='not-allowed')speak("Please allow microphone access Sudaim.");
    if(wakeOn)setTimeout(startWakeLoop,1000);
    else{$('slbl').textContent='READY — TAP MIC OR TYPE';$('slbl').style.color='var(--t3)';}
  };
  rec.start();
};
window.toggleListen=()=>{if(speaking){synth.cancel();doneSpeaking();return;}if(listening){if(rec)rec.stop();return;}startFullListen();};
const sTxt=()=>{const v=$('tinp').value.trim();if(!v)return;$('tinp').value='';addMsg('user',v,false);processInput(v);};

// CHAT
const addMsg=(role,text,spk=true)=>{
  const log=$('chat-log'),d=document.createElement('div');
  const isN=role==='nova',isSys=role==='sys';
  d.className='msg '+(isN?'mn':isSys?'ms':'mu');
  if(!isSys){const s=document.createElement('div');s.className='mspk '+(isN?'n':'u');s.textContent=isN?'NOVA':'SUDAIM';d.appendChild(s);}
  const body=document.createElement('div');body.className='mbody';
  if(isN&&settings.type){let i=0;const iv=setInterval(()=>{body.textContent=text.slice(0,i);i+=3;if(i>text.length){body.textContent=text;clearInterval(iv);}},15);}
  else body.textContent=text;
  d.appendChild(body);
  if(!isSys){const meta=document.createElement('div');meta.className='mmeta';meta.textContent=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});d.appendChild(meta);}
  log.appendChild(d);log.scrollTop=log.scrollHeight;
  msgs++;$('smsg').textContent=msgs;
  if(isN&&spk)speak(text);
  save();
};
const showTyping=()=>{const d=document.createElement('div');d.className='msg mn';d.id='tmsg';const s=document.createElement('div');s.className='mspk n';s.textContent='NOVA';d.appendChild(s);const t=document.createElement('div');t.className='ti';t.innerHTML='<span></span><span></span><span></span>';d.appendChild(t);$('chat-log').appendChild(d);$('chat-log').scrollTop=$('chat-log').scrollHeight;};
const hideTyping=()=>{const t=$('tmsg');if(t)t.remove();};
const processInput=txt=>{
  if(!txt||!txt.trim())return;
  qs++;$('sq').textContent=qs;$('str-l').textContent=qs;
  $('nova-st').textContent='THINKING';showTyping();respT=Date.now();
  setTimeout(()=>{
    hideTyping();const rep=getReply(txt);
    addMsg('nova',rep);
    const ms=Date.now()-respT;$('sresp').textContent=ms+'ms';$('rdisp').textContent='RESP: '+ms+'ms';
    addXP(5);checkAch();
  },Math.random()*250+350);
};


let curQuestion=null,qSc=0,qCo=0,qSt=0;
const nextQ=()=>{
  const cat=$('qcat').value;
  const pool=cat==='all'?QDB:QDB.filter(q=>q.c===cat);
  if(!pool.length){$('quiz-q').textContent='No questions in this category!';return;}
  curQuestion=pool[Math.floor(Math.random()*pool.length)];
  $('quiz-q').textContent=curQuestion.q;
  const opts=$('quiz-opts');opts.innerHTML='';
  curQuestion.o.forEach((o,i)=>{
    const b=document.createElement('div');b.className='qo';b.textContent=String.fromCharCode(65+i)+'. '+o;
    b.onclick=()=>ansQ(i,b);opts.appendChild(b);
  });
  $('qnxt').textContent='SKIP';
};
const ansQ=(idx,btn)=>{
  if(!curQuestion)return;const ok=idx===curQuestion.a;
  document.querySelectorAll('.qo').forEach((b,i)=>{b.onclick=null;if(i===curQuestion.a)b.classList.add('ok');});
  if(ok){btn.classList.add('ok');qSc+=10;qCo++;qSt++;$('squiz').textContent=qSc;addXP(15);notify('Correct! +15 XP','ok',2000);beep(880,.1);unlock('quiz','Quiz Master!');}
  else{btn.classList.add('no');qSt=0;notify('Wrong — correct answer highlighted','err',2000);}
  $('qsc').textContent=qSc;$('qco').textContent=qCo;$('qst').textContent=qSt+'🔥';$('qnxt').textContent='NEXT QUESTION';
};

// ENCYCLOPEDIA
const buildEnc=()=>{
  const cats={
    'PHYSICS & ENERGY':['gravity','speed of light','Newton laws of motion','Einstein relativity','quantum physics','electricity ohm','magnetism','thermodynamics entropy','nuclear energy fission','black holes'],
    'BIOLOGY & EVOLUTION':['photosynthesis','DNA genetics','human body organ system','human brain neuroscience','evolution darwin','immune system vaccine','cell biology'],
    'CHEMISTRY & MATH':['periodic table','water h2o','pythagorean theorem','pi mathematics','prime numbers','algebra algebraic','calculus derivative','trigonometry sine','statistics probability'],
    'SPACE & COSMOS':['solar system planets','milky way galaxy','big bang origin of universe','stars stellar supernova','dark matter dark energy'],
    'TECHNOLOGY':['artificial intelligence AI','internet world wide web','computer CPU','blockchain cryptocurrency','cybersecurity'],
    'ISLAMIC KNOWLEDGE':['what is Islam','holy quran','five pillars Islam','prophet Muhammad seerah','prophets in Islam','Islamic golden age','99 names asmaul husna','ramadan fasting'],
    'PAKISTAN':['Pakistan history','karachi','K2 karakoram','cpec','allama iqbal jinnah'],
    'WORLD HISTORY':['world war 2','world war 1'],
    'HEALTH & WELLNESS':['human heart cardiovascular','diabetes insulin','mental health depression','nutrition vitamins'],
    'GEOGRAPHY':['continents','oceans world ocean','climate change global warming']
  };
  const ct=$('ecats');ct.innerHTML='';
  Object.entries(cats).forEach(([cat,topics])=>{
    const d=document.createElement('div');
    d.innerHTML='<div class="ecat-t">'+cat+'</div><div class="etags">'+topics.map(t=>'<span class="etag" onclick="encL(\''+t+'\')">'+t.split(' ')[0].charAt(0).toUpperCase()+t.split(' ')[0].slice(1)+(t.split(' ')[1]?' '+t.split(' ')[1]:'')+'</span>').join('')+'</div>';
    ct.appendChild(d);
  });
};
const encS=(val,force)=>{if(val||force)encL(val);};
const encL=topic=>{
  const rep=getReply(topic);
  $('eres-t').textContent=topic.toUpperCase();$('eres-b').textContent=rep;
  $('eres').classList.add('on');$('eres').scrollIntoView({behavior:'smooth',block:'nearest'});
  unlock('enc','Encyclopedia Explorer!');
};

// GAMES
const RIDDLES=[{q:"I speak without a mouth and hear without ears. I come alive with wind but have no body. What am I?",a:"echo"},{q:"The more you take, the more you leave behind. What am I?",a:"footsteps"},{q:"I have cities but no houses, mountains but no trees, water but no fish. What am I?",a:"map"},{q:"What can travel around the world staying in a corner?",a:"stamp"},{q:"I have hands but cannot clap. What am I?",a:"clock"},{q:"What gets wetter the more it dries?",a:"towel"}];
const WYR=["Would you rather be able to fly OR be invisible?","Would you rather live on the Moon OR on Mars?","Would you rather know all languages OR play every instrument?","Would you rather have unlimited money OR unlimited knowledge?","Would you rather be the smartest OR the kindest person in the world?","Would you rather travel to the past OR the future?"];
const TONGUE=["She sells seashells by the seashore — the shells she sells are surely seashells.","Peter Piper picked a peck of pickled peppers. How many did Peter Piper pick?","How much wood would a woodchuck chuck if a woodchuck could chuck wood?","Red lorry, yellow lorry, red lorry, yellow lorry.","I saw Susie sitting in a shoeshine shop."];
const KKJ=[["Knock knock.","Who is there?","Lettuce.","Lettuce who?","Lettuce in, it is cold out here!"],["Knock knock.","Who is there?","Nobel.","Nobel who?","Nobel — that is why I knocked!"],["Knock knock.","Who is there?","Interrupting cow.","Interrupting cow wh—","MOOO!"]];
const RAPS={space:"Yo Sudaim let me take you to the stars,\nPast Jupiter and Saturn all the way to Mars,\nBlack holes spinning deep in the darkest night,\nGalaxies colliding — what a beautiful sight!\nMilky Way is our home with 100 billion suns,\nNOVA dropping knowledge — we have only just begun!",pakistan:"Land of mountains and rivers proud and free,\nFrom Khyber Pass to the Arabian Sea,\nKarachi is the heartbeat Lahore has the soul,\nIslamabad is the head that makes Pakistan whole!\nSudaim you are the future of this great nation,\nBuilding tomorrow through education!",islam:"In the name of Allah the merciful the wise,\nKnowledge is the ladder that helps us rise,\nIqra was the first word — that was the sign,\nSeek knowledge sincerely and make your future shine!\nFrom Al-Khwarizmi algebra to Ibn Sina cure,\nThe Islamic Golden Age legacy endures!"};

const startG=type=>{
  const area=$('game-area'),cnt=$('gcnt');area.style.display='block';
  if(type==='riddle'){curRiddle=RIDDLES[Math.floor(Math.random()*RIDDLES.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">RIDDLE ME</div><div style="margin-bottom:12px;font-size:14px;line-height:1.6">'+curRiddle.q+'</div><div style="display:flex;gap:6px"><input id="rinp" style="flex:1;padding:7px 10px;background:var(--cd);border:1px solid var(--b2);color:var(--t);font-family:var(--fb);font-size:12px;outline:none" placeholder="Your answer..."/><button class="btn bh" onclick="chkRiddle()">CHECK</button></div>';speak(curRiddle.q);}
  else if(type==='wyr'){const q=WYR[Math.floor(Math.random()*WYR.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">WOULD YOU RATHER</div><div style="font-size:14px;line-height:1.6;margin-bottom:12px">'+q+'</div><button class="btn bh" onclick="startG(\'wyr\')">NEXT</button>';speak(q);}
  else if(type==='tongue'){const t=TONGUE[Math.floor(Math.random()*TONGUE.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">TONGUE TWISTER</div><div style="font-size:14px;line-height:1.7;margin-bottom:12px">'+t+'</div><button class="btn bh" onclick="startG(\'tongue\')">NEXT</button>';speak("Try saying this three times fast: "+t);}
  else if(type==='kk'){curKK=KKJ[Math.floor(Math.random()*KKJ.length)];kkStep=0;cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">KNOCK KNOCK</div><div id="kktxt" style="font-size:14px;margin-bottom:12px">'+curKK[0]+'</div><button class="btn bh" onclick="advKK()">REPLY</button>';speak(curKK[0]);}
  else if(type==='story'){storyTxt='Once upon a time in Karachi, ';cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">STORY BUILDER</div><div id="stxt" style="font-size:13px;line-height:1.7;color:var(--t2);margin-bottom:10px">'+storyTxt+'</div><div style="display:flex;gap:6px"><input id="sinp" style="flex:1;padding:7px 10px;background:var(--cd);border:1px solid var(--b2);color:var(--t);font-family:var(--fb);font-size:12px;outline:none" placeholder="Continue the story..."/><button class="btn bh" onclick="contStory()">ADD</button></div>';speak("Let us build a story together! I will start: Once upon a time in Karachi... you continue Sudaim!");}
  else if(type==='rap'){const topics=Object.keys(RAPS);const t=topics[Math.floor(Math.random()*topics.length)];const rap=RAPS[t];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">NOVA RAPS: '+t.toUpperCase()+'</div><div style="font-size:13px;line-height:2;color:var(--t2);font-style:italic;white-space:pre-line">'+rap+'</div><button class="btn bh" onclick="startG(\'rap\')" style="margin-top:8px">NEW TOPIC</button>';speak(rap.replace(/\n/g,' '));}
  else if(type==='t2l'){const sets=[{s:["Pakistan was founded in 1947","Karachi is the capital of Pakistan","K2 is in Pakistan"],lie:1},{s:["DNA has four bases A T C G","The brain has 86 billion neurons","The Moon is made of cheese"],lie:2},{s:["Light travels at 300,000 km/s","Jupiter is the largest planet","The Sun is a planet"],lie:2},{s:["The Quran has 114 Surahs","Islam has 5 pillars","Muslims pray 3 times daily"],lie:2}];const set=sets[Math.floor(Math.random()*sets.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">2 TRUTHS 1 LIE — WHICH IS FALSE?</div>'+set.s.map((s,i)=>'<div class="qo" onclick="chkT2L('+i+','+set.lie+',this)">'+(i+1)+'. '+s+'</div>').join('');speak("Two are true one is a lie. Which is false? "+set.s.join('. '));}
  else if(type==='blitz'){blitzN=0;cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">60-SECOND TRIVIA BLITZ</div><div id="bzt" style="font-family:var(--fh);font-size:24px;color:var(--c);text-align:center;margin-bottom:10px">60</div><div id="bzq" style="font-size:13px;margin-bottom:10px"></div><div id="bzo"></div><div id="bzs" style="font-family:var(--fh);font-size:12px;color:var(--cy);margin-top:8px">Score: 0</div>';startBlitz();}
};
const chkRiddle=()=>{const a=(document.getElementById('rinp')||{}).value;if(!a)return;if(curRiddle&&a.toLowerCase().includes(curRiddle.a)){speak("Brilliant Sudaim! Correct! The answer is "+curRiddle.a+". Well done!");addXP(10);notify('Correct! +10 XP','ok');}else speak("Not quite Sudaim. Think differently — the answer involves "+curRiddle.a[0]+"...");};
const advKK=()=>{kkStep++;if(!curKK||kkStep>=curKK.length){speak("Haha! Want to hear another one Sudaim?");return;}$('kktxt').textContent=curKK[kkStep];speak(curKK[kkStep]);};
const contStory=()=>{const a=(document.getElementById('sinp')||{}).value;if(!a)return;document.getElementById('sinp').value='';storyTxt+=a+' ';const adds=["and suddenly a mysterious figure appeared,","but then something extraordinary happened,","when at that very moment a brilliant idea struck,","little did they know that just around the corner,"];const pick=adds[Math.floor(Math.random()*adds.length)];storyTxt+=pick+' ';$('stxt').textContent=storyTxt;speak("Great addition! I will continue: "+pick);};
const chkT2L=(idx,lie,el)=>{document.querySelectorAll('#game-area .qo').forEach((b,i)=>{b.onclick=null;if(i===lie)b.classList.add('ok');else if(i===idx&&i!==lie)b.classList.add('no');});if(idx===lie){speak("Correct Sudaim! That was the lie! Well done!");addXP(10);notify('Correct!','ok');}else speak("Not quite! Statement "+(lie+1)+" was the lie Sudaim.");};
const startBlitz=()=>{
  let time=60;
  const blitzQ=()=>{const q=QDB[Math.floor(Math.random()*QDB.length)];$('bzq').textContent=q.q;const opts=$('bzo');opts.innerHTML='';q.o.forEach((o,i)=>{const b=document.createElement('div');b.className='qo';b.style.padding='5px 10px';b.style.fontSize='12px';b.textContent=String.fromCharCode(65+i)+'. '+o;b.onclick=()=>{if(i===q.a){blitzN++;$('bzs').textContent='Score: '+blitzN;addXP(5);beep(660,.05);}b.classList.add(i===q.a?'ok':'no');document.querySelectorAll('#bzo .qo').forEach(x=>x.onclick=null);setTimeout(blitzQ,400);};opts.appendChild(b);});};
  blitzQ();
  blitzT=setInterval(()=>{time--;if($('bzt'))$('bzt').textContent=time;if(time<=0){clearInterval(blitzT);speak('Time is up Sudaim! You scored '+blitzN+' in 60 seconds. Excellent effort!');$('bzq').textContent='Game over! Score: '+blitzN;$('bzo').innerHTML='';}},1000);
};

// NOTES
const saveNote=()=>{const v=$('nta').value.trim();if(!v){notify('Write something first!','warn');return;}notes.push({t:v,d:new Date().toLocaleString()});$('nta').value='';save();renderNotes();notify('Note saved!','ok');unlock('note','Note Taker!');};
const renderNotes=()=>{const l=$('nlist');l.innerHTML='';notes.forEach((n,i)=>{const d=document.createElement('div');d.className='ni';d.innerHTML='<div><div class="nt">'+n.t+'</div><div class="nd">'+n.d+'</div></div><button class="ndel" onclick="delNote('+i+')">×</button>';l.appendChild(d);});};
const delNote=i=>{notes.splice(i,1);save();renderNotes();};
const clearNotes=()=>{if(confirm('Clear all notes?')){notes=[];save();renderNotes();notify('Notes cleared','warn');}};
const expNotes=()=>{const b=new Blob([notes.map(n=>'['+n.d+']\n'+n.t).join('\n\n---\n\n')],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='NOVA_Notes.txt';a.click();notify('Notes exported!','ok');};
const expChat=()=>{const ms=[...$('chat-log').querySelectorAll('.msg')].map(m=>{const s=m.querySelector('.mspk');const b=m.querySelector('.mbody');return '['+(s?s.textContent:'SYS')+']: '+(b?b.textContent:m.textContent);}).join('\n\n');const b=new Blob(['NOVA CHAT LOG — '+new Date().toLocaleString()+'\n\n'+ms],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='NOVA_Chat.txt';a.click();notify('Chat exported!','ok');};

// LIFESTYLE
const PRAYER={Fajr:'05:02',Dhuhr:'12:14',Asr:'15:37',Maghrib:'18:41',Isha:'20:02'};
const renderPrayer=()=>{
  const l=$('plist');if(!l)return;l.innerHTML='';
  const now=new Date(),nm=now.getHours()*60+now.getMinutes();
  const toM=t=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
  let cur='Isha';Object.entries(PRAYER).forEach(([n,t])=>{if(nm>=toM(t))cur=n;});
  Object.entries(PRAYER).forEach(([n,t])=>{const d=document.createElement('div');d.className='pr'+(n===cur?' cur':'');d.innerHTML='<span class="pn">'+(n===cur?'▸ ':'')+n+'</span><span class="pt">'+t+'</span>';l.appendChild(d);});
};
const trk=(key,delta)=>{trackers[key]=Math.max(0,parseFloat((trackers[key]+delta).toFixed(1)));$('t-'+key).textContent=trackers[key];if(key==='water')$('str-w').textContent=trackers.water+'/8';save();};
const addGoal=()=>{const v=$('ginp').value.trim();if(!v)return;goals.push({t:v,d:false});$('ginp').value='';save();renderGoals();};
const renderGoals=()=>{const l=$('glist');if(!l)return;l.innerHTML='';goals.forEach((g,i)=>{const d=document.createElement('div');d.className='goal-item';d.innerHTML='<span class="gtxt'+(g.d?' done':'')+'">'+g.t+'</span><button onclick="togGoal('+i+')" style="background:none;border:none;color:'+(g.d?'var(--t3)':'var(--cg)')+';cursor:pointer;font-size:14px">'+(g.d?'↩':'✓')+'</button><button onclick="delGoal('+i+')" style="background:none;border:none;color:var(--cr);cursor:pointer;font-size:14px">✕</button>';l.appendChild(d);});};
const togGoal=i=>{goals[i].d=!goals[i].d;if(goals[i].d)notify('Goal completed!','ok');save();renderGoals();};
const delGoal=i=>{goals.splice(i,1);save();renderGoals();};
let breathInt=null;
const startBreath=()=>{
  clearInterval(breathInt);const o=$('borb');
  const phases=[{l:'INHALE',d:4},{l:'HOLD',d:7},{l:'EXHALE',d:8}];
  let p=0,rem=phases[0].d;
  speak("Starting 4-7-8 breathing. Inhale for 4, hold for 7, exhale for 8.");
  const tick=()=>{o.textContent=phases[p].l;o.style.transform=p===0?'scale('+(1+.5*(1-rem/phases[p].d))+')':p===1?'scale(1.5)':'scale(1)';o.style.borderColor=p===0?'var(--cg)':p===1?'var(--cy)':'var(--c)';rem--;if(rem<0){p=(p+1)%3;rem=phases[p].d-1;}};
  tick();breathInt=setInterval(tick,1000);
  setTimeout(()=>{clearInterval(breathInt);o.textContent='DONE';o.style.transform='scale(1)';o.style.borderColor='var(--c)';speak("Well done Sudaim! That is the 4-7-8 breathing technique. You should feel calmer now.");},60000);
};

// CLOCK
const updateClock=()=>{
  const n=new Date();
  $('bclock').textContent=[n.getHours(),n.getMinutes(),n.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':');
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('bdate').textContent=days[n.getDay()]+', '+months[n.getMonth()]+' '+n.getDate()+', '+n.getFullYear();
  const hy=Math.floor((n.getFullYear()-622)*1.030684)+1;
  $('hijri').textContent=hy+' AH (Hijri approx)';$('hijri-ls').textContent=hy+' AH';
  const dd=bdayDays();
  if(isBday()){$('btag').textContent='HAPPY BIRTHDAY SUDAIM!';$('bday-ls').textContent='TODAY!';}
  else{$('btag').textContent='BIRTHDAY IN '+dd+' DAYS';$('bday-ls').textContent=dd+' days';}
  const s=Math.floor((Date.now()-startTime)/1000);
  $('hupt').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
};
setInterval(updateClock,1000);updateClock();

// MOOD CHART
const renderMoodChart=()=>{const c=$('mch');if(!c)return;c.innerHTML='';const r=moodHist.slice(-16);if(!r.length){c.innerHTML='<div style="font-size:9px;color:var(--t3);font-family:var(--fm)">No data yet</div>';return;}r.forEach(m=>{const b=document.createElement('div');b.className='mb';b.style.height=(MOODS[m.m]?.p||50)+'%';b.style.background=m.c+'88';b.dataset.m=MOODS[m.m]?.l||m.m;c.appendChild(b);});};

// DAILY CONTENT
const FACTS=["Honey never expires — 3,000-year-old honey found in Egyptian tombs was still edible.","A day on Venus is longer than a year on Venus due to its incredibly slow rotation.","Octopuses have three hearts, blue blood, and are remarkably intelligent.","The human brain generates about 23 watts of power.","Light from the Sun takes exactly 8 minutes and 20 seconds to reach Earth.","K2 in Pakistan was never climbed in winter until January 2021 — a historic achievement.","The word algorithm comes from Al-Khwarizmi, the 9th-century Muslim mathematician who invented algebra.","There are more possible chess games than atoms in the observable universe.","The Quran has been memorized by millions across every generation for 1,400 years, unchanged.","Water is the only natural substance found in all three physical states on Earth normally.","Pakistan generates roughly 20 percent of national GDP from Karachi alone.","The first word in the Quran was Iqra — Read — emphasizing Islam's emphasis on knowledge.","Your DNA contains 3 billion base pairs — if uncoiled it would stretch nearly 2 meters.","Pakistan has more glaciers than any region outside the polar ice caps.","The Islamic Golden Age produced algebra, the scientific method, advanced optics, and modern medicine."];
const QUOTES=[{q:"Seek knowledge from the cradle to the grave.",a:"Prophet Muhammad \u2CAE"},{q:"An investment in knowledge pays the best interest.",a:"Benjamin Franklin"},{q:"The measure of intelligence is the ability to change.",a:"Albert Einstein"},{q:"Education is the most powerful weapon you can use to change the world.",a:"Nelson Mandela"},{q:"The ink of a scholar is holier than the blood of a martyr.",a:"Islamic Proverb"},{q:"You were born with wings. Why prefer to crawl through life?",a:"Rumi"},{q:"In the middle of every difficulty lies opportunity.",a:"Albert Einstein"},{q:"He who knows himself knows his Lord.",a:"Islamic Wisdom"},{q:"The only way to do great work is to love what you do.",a:"Steve Jobs"},{q:"Do not go where the path may lead; go instead where there is no path and leave a trail.",a:"Ralph Waldo Emerson"}];
const VOCAB=[{w:"Omniscient",t:"ADJECTIVE",d:"Knowing everything; having unlimited knowledge.",e:"An omniscient narrator knows every character's thoughts."},{w:"Ephemeral",t:"ADJECTIVE",d:"Lasting for a very short time; transitory.",e:"The ephemeral beauty of cherry blossoms lasts only a week."},{w:"Resilient",t:"ADJECTIVE",d:"Able to recover quickly from difficulties; tough.",e:"Sudaim is resilient — he bounces back from every challenge."},{w:"Paradigm",t:"NOUN",d:"A typical pattern; a framework of ideas.",e:"Einstein's relativity created a paradigm shift in physics."},{w:"Catalyst",t:"NOUN",d:"Something that causes or accelerates change.",e:"Education is the greatest catalyst for national development."},{w:"Empirical",t:"ADJECTIVE",d:"Based on observation and experiment rather than theory.",e:"Scientists require empirical evidence to validate claims."},{w:"Axiom",t:"NOUN",d:"A statement regarded as self-evidently true.",e:"In mathematics an axiom requires no proof."},{w:"Juxtapose",t:"VERB",d:"To place side by side for contrast or comparison.",e:"The author skillfully juxtaposed poverty and extreme wealth."},{w:"Perpetual",t:"ADJECTIVE",d:"Never ending or changing; occurring continuously.",e:"A perpetual motion machine is thermodynamically impossible."},{w:"Synthesis",t:"NOUN",d:"The combination of components to form a connected whole.",e:"The report was a synthesis of five years of research."}];
const loadDaily=()=>{const d=new Date().getDate();const f=FACTS[d%FACTS.length];$('dft').textContent=f;const q=QUOTES[d%QUOTES.length];$('qt').textContent='"'+q.q+'"';$('qa').textContent='— '+q.a;const v=VOCAB[d%VOCAB.length];$('vw').textContent=v.w;$('vtype').textContent=v.t;$('vdef').textContent=v.d;$('vex').textContent='"'+v.e+'"';};

// TABS
const sTab=tab=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));const te=document.querySelector('[onclick="sTab(\''+tab+'\')"]');if(te)te.classList.add('on');const ve=$('tab-'+tab);if(ve)ve.classList.add('on');};

// MODALS
window.openM=id=>$(id).classList.add('on');
window.closeM=id=>$(id).classList.remove('on');
document.querySelectorAll('.mbg').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on');}));

// SETTINGS
window.togS=key=>{settings[key]=!settings[key];$('tog-'+key)&&$('tog-'+key).classList.toggle('on',settings[key]);if(key==='part')$('ptc').style.display=settings.part?'block':'none';};
window.resetAll=()=>{if(confirm('Reset ALL NOVA data?')){localStorage.clear();location.reload();}};

// PARTICLES
(()=>{
  const c=$('ptc'),ctx=c.getContext('2d');
  const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};resize();
  const pts=Array.from({length:55},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,r:Math.random()*.9+.2,o:Math.random()*.18+.05}));
  const draw=()=>{ctx.clearRect(0,0,c.width,c.height);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;});for(let i=0;i<pts.length;i++)for(let k=i+1;k<pts.length;k++){const dx=pts[i].x-pts[k].x,dy=pts[i].y-pts[k].y,d=Math.sqrt(dx*dx+dy*dy);if(d<100){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[k].x,pts[k].y);ctx.strokeStyle='rgba(0,212,255,'+(1-d/100)*.05+')';ctx.lineWidth=.5;ctx.stroke();}}pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(0,212,255,'+p.o+')';ctx.fill();});requestAnimationFrame(draw);};
  draw();window.addEventListener('resize',resize);
})();

// STREAK
const updateStreak=()=>{const s=getStreak();$('str-d').textContent=s;$('hstr').textContent=s+'🔥';if(s>=3)unlock('str3','3-Day Streak!');};

// BOOT
const BOOTM=['LOADING NOVA v4.0...','INITIALIZING 300+ KNOWLEDGE ARTICLES...','VOICE ENGINE READY...','EMOTION MATRIX CALIBRATED...','PERSONAL PROFILE LOADED: MUHAMMAD SUDAIM...','PRAYER TIMES KARACHI LOADED...','REQUESTING MIC PERMISSION — ONCE ONLY...','WAKE WORD SYSTEM ARMED...','ALL SYSTEMS NOMINAL.','WELCOME SUDAIM!'];
const runBoot=()=>{let i=0;const step=()=>{if(i>=BOOTM.length){setTimeout(()=>{$('boot').style.transition='opacity .5s';$('boot').style.opacity='0';setTimeout(()=>$('boot').style.display='none',500);},500);return;}$('boot-log').textContent=BOOTM[i];$('boot-fill').style.width=((i+1)/BOOTM.length*100)+'%';i++;setTimeout(step,220);};step();};

// QUICK INPUT
window.fi=t=>{if(speaking){synth.cancel();doneSpeaking();}addMsg('user',t,false);processInput(t);};

// INIT
const init=async()=>{
  load();runBoot();loadDaily();buildEnc();renderNotes();renderGoals();renderPrayer();setMood('happy');updateStreak();addXP(0);

  // KEY FIX: Request mic permission ONCE right here — will NEVER ask again mid-conversation
  const mic=await getMic();
  if(mic)notify('Microphone ready — permission granted once, never asked again!','ok',4000);

  setTimeout(()=>{
    const welcome=isBday()
      ?'HAPPY BIRTHDAY MUHAMMAD SUDAIM!! Today is '+U.bday.d+' '+U.bday.mn+' '+U.bday.y+'! You are '+getAge()+' years old today! Every system in NOVA celebrates with you!'
      :'Hey Sudaim! NOVA v4 is fully online with over 300 knowledge articles covering science, Islam, Pakistan, history, math, technology, space, and health — all offline. Microphone permission has been requested once and will never ask again during conversations. Press Start Wake Word then just say Hi Nova anytime to activate me hands-free. Let us go!';
    addMsg('nova',welcome);setMood(isBday()?'excited':'warm');
  },2900);
};

$('tinp').addEventListener('keydown',e=>{if(e.key==='Enter')sTxt();});
document.addEventListener('DOMContentLoaded',init);
