// ═══════════════════════════════════════════════
//  NOVA v4.0 — MAIN SCRIPT
//  AI API Connected · 300+ offline articles
//  Personal details removed — generic version
// ═══════════════════════════════════════════════

let mood='happy',xp=0,level=1,msgs=0,qs=0,wakes=0;
let wakeOn=false,listening=false,speaking=false;
let voices=[],selVoice=null,rec=null,wakeRec=null;
let globalMic=null,audioCtx=null,analyser=null,animId=null;
let voiceProfile=null,enrollStep=0,enrollSamples=[];
let qScore=0,qCorrect=0,qStreak=0,curQ=null;
let notes=[],goals=[],trackers={water:0,exercise:0,reading:0,sleep:7};
let moodHist=[],topicsSet=new Set(),storyTxt='',curKK=null,kkStep=0,curRiddle=null;
let settings={speak:true,sfx:true,type:true,part:true,water:false,api:true};
let respT=0,customPhrase='hi nova',blitzT=null,blitzN=0;
const synth=window.speechSynthesis;
const $=id=>document.getElementById(id);
const startTime=Date.now();

// ═══════════════════════════════════════════════
//  AI API — HACK CLUB FREE AI
// ═══════════════════════════════════════════════
const askAI = async (question) => {
  if (!settings.api) return null;
  if (!NOVA_API_KEY || NOVA_API_KEY === "YOUR_API_KEY_HERE") return null;
  try {
    const response = await fetch(NOVA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: NOVA_API_KEY,
        model: NOVA_MODEL,
        messages: [
          {
            role: "system",
            content: "You are NOVA, an intelligent AI student assistant. Give clear, educational, concise answers suitable for students. Keep responses under 150 words. Be friendly and encouraging."
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    return null;
  } catch (e) {
    console.error('AI API Error:', e);
    return null;
  }
};

// ═══════════════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════════════
const save=()=>{try{localStorage.setItem('nv4_xp',xp);localStorage.setItem('nv4_lv',level);localStorage.setItem('nv4_notes',JSON.stringify(notes));localStorage.setItem('nv4_goals',JSON.stringify(goals));localStorage.setItem('nv4_trk',JSON.stringify(trackers));localStorage.setItem('nv4_last',new Date().toDateString());localStorage.setItem('nv4_str',getStreak());if(voiceProfile)localStorage.setItem('nv4_vp',JSON.stringify(voiceProfile));}catch(e){}};
const load=()=>{try{xp=+localStorage.getItem('nv4_xp')||0;level=+localStorage.getItem('nv4_lv')||1;notes=JSON.parse(localStorage.getItem('nv4_notes')||'[]');goals=JSON.parse(localStorage.getItem('nv4_goals')||'[]');trackers=JSON.parse(localStorage.getItem('nv4_trk')||JSON.stringify(trackers));const vp=localStorage.getItem('nv4_vp');if(vp)voiceProfile=JSON.parse(vp);}catch(e){}};
const getStreak=()=>{const last=localStorage.getItem('nv4_last'),today=new Date().toDateString(),s=+localStorage.getItem('nv4_str')||0;if(last===today)return s;const y=new Date();y.setDate(y.getDate()-1);return last===y.toDateString()?s+1:1;};

// ═══════════════════════════════════════════════
//  MOODS
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  XP & LEVELS
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════
const notify=(msg,type='info',dur=3000)=>{const d=document.createElement('div');d.className='nf '+type;d.textContent=msg;$('notif').appendChild(d);setTimeout(()=>d.remove(),dur);};

// ═══════════════════════════════════════════════
//  VOICES
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  WAVEFORM
// ═══════════════════════════════════════════════
const wc=$('wc'),wctx=wc.getContext('2d');
const drawWave=(active,color)=>{
  wc.width=wc.offsetWidth||500;wc.height=32;wctx.clearRect(0,0,wc.width,32);
  if(!active){wctx.beginPath();wctx.moveTo(0,16);wctx.lineTo(wc.width,16);wctx.strokeStyle='rgba(0,212,255,0.08)';wctx.lineWidth=1;wctx.stroke();return;}
  wctx.strokeStyle=color||'#00d4ff';wctx.lineWidth=1.8;wctx.shadowBlur=5;wctx.shadowColor=color||'#00d4ff';wctx.beginPath();
  if(analyser){const buf=new Uint8Array(analyser.frequencyBinCount);analyser.getByteTimeDomainData(buf);for(let i=0;i<buf.length;i++){const x=(i/buf.length)*wc.width,y=((buf[i]-128)/128)*12+16;i===0?wctx.moveTo(x,y):wctx.lineTo(x,y);}
  }else{const t=Date.now()*.004;for(let i=0;i<wc.width;i++){const y=16+Math.sin(i*.04+t)*7+Math.sin(i*.1+t*1.5)*3;i===0?wctx.moveTo(i,y):wctx.lineTo(i,y);}}
  wctx.stroke();wctx.shadowBlur=0;animId=requestAnimationFrame(()=>drawWave(active,color));
};

// ═══════════════════════════════════════════════
//  MICROPHONE
// ═══════════════════════════════════════════════
const getMic=async()=>{
  if(globalMic)return globalMic;
  try{globalMic=await navigator.mediaDevices.getUserMedia({audio:true,video:false});return globalMic;}
  catch(e){notify('Microphone permission denied.','err',5000);return null;}
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

// ═══════════════════════════════════════════════
//  SPEAK
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  VOICE BIOMETRICS
// ═══════════════════════════════════════════════
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
    if(enrollStep>=3){voiceProfile={samples:enrollSamples};save();$('enroll-st').textContent='Voice profile saved!';['es1','es2','es3'].forEach(id=>$(id).className='es done');notify('Voice profile enrolled!','ok');}
    else{$('es'+enrollStep).className='es done';$('es'+(enrollStep+1)).className='es act';$('enroll-st').textContent='Sample '+(enrollStep+1)+' — say it again...';setTimeout(recSample,800);}
  };
  r.onerror=()=>{$('enroll-st').textContent='Error — try again.';};r.start();
};
window.clearVP=()=>{voiceProfile=null;localStorage.removeItem('nv4_vp');notify('Voice profile cleared','warn');$('enroll-st').textContent='Profile cleared.';};

// ═══════════════════════════════════════════════
//  WAKE WORD
// ═══════════════════════════════════════════════
const startWakeLoop=()=>{
  if(!wakeOn||speaking||listening)return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  wakeRec=new SR();wakeRec.lang='en-US';wakeRec.interimResults=true;wakeRec.continuous=false;
  wakeRec.onresult=e=>{
    let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;
    const tl=t.toLowerCase().trim();
    const phrase=($('wpi').value||'hi nova').toLowerCase().trim();
    if(tl.includes(phrase)||tl.includes('hi nova')||tl.includes('hey nova')||tl.includes('hello nova')){
      if(voiceProfile&&!voiceMatch(extractF(t))){notify('Unrecognized voice','warn');return;}
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
  if(!SR){speak("Wake word requires Chrome or Edge.");return;}
  customPhrase=($('wpi').value||'hi nova').toLowerCase().trim();
  await getMic();
  wakeOn=true;updateWakeUI(true);startWakeLoop();
  notify('Wake word active: "'+customPhrase+'"','ok');
  speak("Wake word activated! Just say "+customPhrase+" and I will wake up immediately!");
};
window.stopWake=()=>{wakeOn=false;if(wakeRec)wakeRec.stop();updateWakeUI(false);$('slbl').textContent='READY — TAP MIC OR TYPE';};
const updateWakeUI=on=>{$('wdot').className=on?'on':'';$('wtxt').textContent=on?'Listening for "'+customPhrase+'"':'Inactive — press START';};

// ═══════════════════════════════════════════════
//  FULL LISTEN
// ═══════════════════════════════════════════════
const startFullListen=async()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR||listening)return;
  await getMic();
  rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.maxAlternatives=1;
  let finalTxt='';
  rec.onstart=async()=>{
    listening=true;$('orb').className='L';
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
    if(wakeOn)setTimeout(startWakeLoop,1000);
    else{$('slbl').textContent='READY — TAP MIC OR TYPE';$('slbl').style.color='var(--t3)';}
  };
  rec.start();
};
window.toggleListen=()=>{if(speaking){synth.cancel();doneSpeaking();return;}if(listening){if(rec)rec.stop();return;}startFullListen();};
const sTxt=()=>{const v=$('tinp').value.trim();if(!v)return;$('tinp').value='';addMsg('user',v,false);processInput(v);};

// ═══════════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════════
const addMsg=(role,text,spk=true)=>{
  const log=$('chat-log'),d=document.createElement('div');
  const isN=role==='nova',isSys=role==='sys';
  d.className='msg '+(isN?'mn':isSys?'ms':'mu');
  if(!isSys){const s=document.createElement('div');s.className='mspk '+(isN?'n':'u');s.textContent=isN?'NOVA':USER_NAME.toUpperCase();d.appendChild(s);}
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

const processInput=async txt=>{
  if(!txt||!txt.trim())return;
  qs++;$('sq').textContent=qs;$('str-l').textContent=qs;
  $('nova-st').textContent='THINKING';showTyping();respT=Date.now();

  // First check offline knowledge base
  const offlineReply = getReply(txt);
  const isUnknown = offlineReply.includes("still learning") || offlineReply.includes("Try asking");

  if (isUnknown && settings.api && NOVA_API_KEY !== "YOUR_API_KEY_HERE") {
    // Use AI API for unknown questions
    $('nova-st').textContent='AI THINKING';
    const aiReply = await askAI(txt);
    hideTyping();
    const finalReply = aiReply || offlineReply;
    addMsg('nova', finalReply);
    if (aiReply) notify('AI Response', 'ok', 1500);
  } else {
    setTimeout(()=>{
      hideTyping();
      addMsg('nova', offlineReply);
    }, Math.random()*250+350);
  }

  const ms=Date.now()-respT;$('sresp').textContent=ms+'ms';$('rdisp').textContent='RESP: '+ms+'ms';
  addXP(5);checkAch();
};

// ═══════════════════════════════════════════════
//  QUIZ
// ═══════════════════════════════════════════════
window.nextQ=()=>{
  const cat=$('qcat').value;
  const pool=cat==='all'?QDB:QDB.filter(q=>q.c===cat);
  if(!pool.length)return;
  curQ=pool[Math.floor(Math.random()*pool.length)];
  $('quiz-q').textContent=curQ.q;
  const opts=$('quiz-opts');opts.innerHTML='';
  curQ.o.forEach((o,i)=>{const b=document.createElement('div');b.className='qo';b.textContent=String.fromCharCode(65+i)+'. '+o;b.onclick=()=>ansQ(i,b);opts.appendChild(b);});
  speak(curQ.q);
};
const ansQ=(idx,el)=>{
  document.querySelectorAll('.qo').forEach(b=>b.onclick=null);
  if(idx===curQ.a){el.classList.add('ok');qCorrect++;qStreak++;qScore+=10+qStreak*2;beep(880,.08);notify('+'+( 10+qStreak*2)+' pts! Correct!','ok');addXP(15);}
  else{el.classList.add('no');document.querySelectorAll('.qo')[curQ.a].classList.add('ok');qStreak=0;beep(220,.05);notify('Wrong! Better luck next time.','err');}
  $('qsc').textContent=qScore;$('qco').textContent=qCorrect;$('qst').textContent=qStreak+'🔥';$('squiz').textContent=qScore;
  checkAch();
};

// ═══════════════════════════════════════════════
//  ENCYCLOPEDIA
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
//  GAMES
// ═══════════════════════════════════════════════
const RIDDLES=[{q:"I speak without a mouth and hear without ears. I come alive with wind but have no body. What am I?",a:"echo"},{q:"The more you take, the more you leave behind. What am I?",a:"footsteps"},{q:"I have cities but no houses, mountains but no trees, water but no fish. What am I?",a:"map"},{q:"What can travel around the world staying in a corner?",a:"stamp"},{q:"I have hands but cannot clap. What am I?",a:"clock"},{q:"What gets wetter the more it dries?",a:"towel"}];
const WYR=["Would you rather be able to fly OR be invisible?","Would you rather live on the Moon OR on Mars?","Would you rather know all languages OR play every instrument?","Would you rather have unlimited money OR unlimited knowledge?","Would you rather be the smartest OR the kindest person in the world?","Would you rather travel to the past OR the future?"];
const TONGUE=["She sells seashells by the seashore.","Peter Piper picked a peck of pickled peppers.","How much wood would a woodchuck chuck if a woodchuck could chuck wood?","Red lorry, yellow lorry, red lorry, yellow lorry.","I saw Susie sitting in a shoeshine shop."];
const KKJ=[["Knock knock.","Who is there?","Lettuce.","Lettuce who?","Lettuce in, it is cold out here!"],["Knock knock.","Who is there?","Nobel.","Nobel who?","Nobel — that is why I knocked!"],["Knock knock.","Who is there?","Interrupting cow.","Interrupting cow wh—","MOOO!"]];
const RAPS={space:"Yo let me take you to the stars,\nPast Jupiter and Saturn all the way to Mars,\nBlack holes spinning deep in the darkest night,\nGalaxies colliding — what a beautiful sight!\nMilky Way is our home with 100 billion suns,\nNOVA dropping knowledge — we have only just begun!",pakistan:"Land of mountains and rivers proud and free,\nFrom Khyber Pass to the Arabian Sea,\nKarachi is the heartbeat Lahore has the soul,\nIslamabad is the head that makes Pakistan whole!\nThe future is bright for this great nation,\nBuilding tomorrow through education!",islam:"In the name of Allah the merciful the wise,\nKnowledge is the ladder that helps us rise,\nIqra was the first word — that was the sign,\nSeek knowledge sincerely and make your future shine!\nFrom Al-Khwarizmi algebra to Ibn Sina cure,\nThe Islamic Golden Age legacy endures!"};

const startG=type=>{
  const area=$('game-area'),cnt=$('gcnt');area.style.display='block';
  if(type==='riddle'){curRiddle=RIDDLES[Math.floor(Math.random()*RIDDLES.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">RIDDLE ME</div><div style="margin-bottom:12px;font-size:14px;line-height:1.6">'+curRiddle.q+'</div><div style="display:flex;gap:6px"><input id="rinp" style="flex:1;padding:7px 10px;background:var(--cd);border:1px solid var(--b2);color:var(--t);font-family:var(--fb);font-size:12px;outline:none" placeholder="Your answer..."/><button class="btn bh" onclick="chkRiddle()">CHECK</button></div>';speak(curRiddle.q);}
  else if(type==='wyr'){const q=WYR[Math.floor(Math.random()*WYR.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">WOULD YOU RATHER</div><div style="font-size:14px;line-height:1.6;margin-bottom:12px">'+q+'</div><button class="btn bh" onclick="startG(\'wyr\')">NEXT</button>';speak(q);}
  else if(type==='tongue'){const t=TONGUE[Math.floor(Math.random()*TONGUE.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">TONGUE TWISTER</div><div style="font-size:14px;line-height:1.7;margin-bottom:12px">'+t+'</div><button class="btn bh" onclick="startG(\'tongue\')">NEXT</button>';speak("Try saying this three times fast: "+t);}
  else if(type==='kk'){curKK=KKJ[Math.floor(Math.random()*KKJ.length)];kkStep=0;cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">KNOCK KNOCK</div><div id="kktxt" style="font-size:14px;margin-bottom:12px">'+curKK[0]+'</div><button class="btn bh" onclick="advKK()">REPLY</button>';speak(curKK[0]);}
  else if(type==='story'){storyTxt='Once upon a time, ';cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">STORY BUILDER</div><div id="stxt" style="font-size:13px;line-height:1.7;color:var(--t2);margin-bottom:10px">'+storyTxt+'</div><div style="display:flex;gap:6px"><input id="sinp" style="flex:1;padding:7px 10px;background:var(--cd);border:1px solid var(--b2);color:var(--t);font-family:var(--fb);font-size:12px;outline:none" placeholder="Continue the story..."/><button class="btn bh" onclick="contStory()">ADD</button></div>';speak("Let us build a story together! Once upon a time... you continue!");}
  else if(type==='rap'){const topics=Object.keys(RAPS);const t=topics[Math.floor(Math.random()*topics.length)];const rap=RAPS[t];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">NOVA RAPS: '+t.toUpperCase()+'</div><div style="font-size:13px;line-height:2;color:var(--t2);font-style:italic;white-space:pre-line">'+rap+'</div><button class="btn bh" onclick="startG(\'rap\')" style="margin-top:8px">NEW TOPIC</button>';speak(rap.replace(/\n/g,' '));}
  else if(type==='t2l'){const sets=[{s:["Pakistan was founded in 1947","Karachi is the capital of Pakistan","K2 is in Pakistan"],lie:1},{s:["DNA has four bases A T C G","The brain has 86 billion neurons","The Moon is made of cheese"],lie:2},{s:["Light travels at 300,000 km/s","Jupiter is the largest planet","The Sun is a planet"],lie:2},{s:["The Quran has 114 Surahs","Islam has 5 pillars","Muslims pray 3 times daily"],lie:2}];const set=sets[Math.floor(Math.random()*sets.length)];cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">2 TRUTHS 1 LIE — WHICH IS FALSE?</div>'+set.s.map((s,i)=>'<div class="qo" onclick="chkT2L('+i+','+set.lie+',this)">'+(i+1)+'. '+s+'</div>').join('');speak("Two are true one is a lie. Which is false?");}
  else if(type==='blitz'){blitzN=0;cnt.innerHTML='<div style="font-family:var(--fh);font-size:9px;letter-spacing:2px;color:var(--cy);margin-bottom:8px">60-SECOND TRIVIA BLITZ</div><div id="bzt" style="font-family:var(--fh);font-size:24px;color:var(--c);text-align:center;margin-bottom:10px">60</div><div id="bzq" style="font-size:13px;margin-bottom:10px"></div><div id="bzo"></div><div id="bzs" style="font-family:var(--fh);font-size:12px;color:var(--cy);margin-top:8px">Score: 0</div>';startBlitz();}
};
const chkRiddle=()=>{const a=(document.getElementById('rinp')||{}).value;if(!a)return;if(curRiddle&&a.toLowerCase().includes(curRiddle.a)){speak("Brilliant! Correct! The answer is "+curRiddle.a+". Well done!");addXP(10);notify('Correct! +10 XP','ok');}else speak("Not quite. Think differently — the answer involves "+curRiddle.a[0]+"...");};
const advKK=()=>{kkStep++;if(!curKK||kkStep>=curKK.length){speak("Haha! Want to hear another one?");return;}$('kktxt').textContent=curKK[kkStep];speak(curKK[kkStep]);};
const contStory=()=>{const a=(document.getElementById('sinp')||{}).value;if(!a)return;document.getElementById('sinp').value='';storyTxt+=a+' ';const adds=["and suddenly a mysterious figure appeared,","but then something extraordinary happened,","when at that very moment a brilliant idea struck,","little did they know that just around the corner,"];const pick=adds[Math.floor(Math.random()*adds.length)];storyTxt+=pick+' ';$('stxt').textContent=storyTxt;speak("Great addition! I will continue: "+pick);};
const chkT2L=(idx,lie,el)=>{document.querySelectorAll('#game-area .qo').forEach((b,i)=>{b.onclick=null;if(i===lie)b.classList.add('ok');else if(i===idx&&i!==lie)b.classList.add('no');});if(idx===lie){speak("Correct! That was the lie! Well done!");addXP(10);notify('Correct!','ok');}else speak("Not quite! Statement "+(lie+1)+" was the lie.");};
const startBlitz=()=>{
  let time=60;
  const blitzQ=()=>{const q=QDB[Math.floor(Math.random()*QDB.length)];$('bzq').textContent=q.q;const opts=$('bzo');opts.innerHTML='';q.o.forEach((o,i)=>{const b=document.createElement('div');b.className='qo';b.style.padding='5px 10px';b.style.fontSize='12px';b.textContent=String.fromCharCode(65+i)+'. '+o;b.onclick=()=>{if(i===q.a){blitzN++;$('bzs').textContent='Score: '+blitzN;addXP(5);beep(660,.05);}b.classList.add(i===q.a?'ok':'no');document.querySelectorAll('#bzo .qo').forEach(x=>x.onclick=null);setTimeout(blitzQ,400);};opts.appendChild(b);});};
  blitzQ();
  blitzT=setInterval(()=>{time--;if($('bzt'))$('bzt').textContent=time;if(time<=0){clearInterval(blitzT);speak('Time is up! You scored '+blitzN+' in 60 seconds. Excellent effort!');$('bzq').textContent='Game over! Score: '+blitzN;$('bzo').innerHTML='';}},1000);
};

// ═══════════════════════════════════════════════
//  NOTES
// ═══════════════════════════════════════════════
window.saveNote=()=>{const t=$('nta').value.trim();if(!t)return;notes.unshift({t,d:new Date().toLocaleString()});$('nta').value='';renderNotes();save();unlock('note','Note Taker!');notify('Note saved!','ok');};
window.clearNotes=()=>{if(confirm('Clear all notes?')){notes=[];renderNotes();save();}};
const renderNotes=()=>{$('nlist').innerHTML=notes.map((n,i)=>'<div class="ni"><div><div class="nt">'+n.t+'</div><div class="nd">'+n.d+'</div></div><button class="ndel" onclick="delNote('+i+')">✕</button></div>').join('');};
window.delNote=i=>{notes.splice(i,1);renderNotes();save();};
window.expNotes=()=>{const b=new Blob([notes.map(n=>n.d+'\n'+n.t).join('\n\n---\n\n')],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='nova-notes.txt';a.click();};

// ═══════════════════════════════════════════════
//  GOALS
// ═══════════════════════════════════════════════
window.addGoal=()=>{const t=$('ginp').value.trim();if(!t)return;goals.push({t,done:false});$('ginp').value='';renderGoals();save();};
const renderGoals=()=>{$('glist').innerHTML=goals.map((g,i)=>'<div class="lr"><span class="lk" style="'+(g.done?'text-decoration:line-through;opacity:.4':'')+'">'+g.t+'</span><button class="btn bh" style="padding:3px 8px;font-size:8px" onclick="togGoal('+i+')">'+(g.done?'UNDO':'DONE')+'</button></div>').join('');};
window.togGoal=i=>{goals[i].done=!goals[i].done;renderGoals();save();if(goals[i].done){beep(660,.05);notify('Goal completed!','ok');}};

// ═══════════════════════════════════════════════
//  LIFESTYLE
// ═══════════════════════════════════════════════
window.trk=(k,v)=>{trackers[k]=Math.max(0,+(trackers[k]||0)+v);$('t-'+k).textContent=trackers[k];save();if(k==='water'){$('str-w').textContent=trackers[k]+'/8';if(trackers[k]>=8)notify('Great hydration today!','ok');}};
const renderPrayer=()=>{
  const prayers=[{n:'Fajr',t:'05:15'},{n:'Dhuhr',t:'12:30'},{n:'Asr',t:'15:45'},{n:'Maghrib',t:'18:20'},{n:'Isha',t:'19:45'}];
  const now=new Date(),cur=now.getHours()*60+now.getMinutes();
  let next=-1;prayers.forEach((p,i)=>{const[h,m]=p.t.split(':').map(Number);if(h*60+m>cur&&next===-1)next=i;});
  $('plist').innerHTML=prayers.map((p,i)=>'<div class="pr'+(i===next?' cur':'')+'"><span class="pn">'+(i===next?'▶ ':'')+p.n+'</span><span class="pt">'+p.t+'</span></div>').join('');
};

// BREATHING
window.startBreath=()=>{
  const phases=[{t:'INHALE',d:4},{t:'HOLD',d:7},{t:'EXHALE',d:8}];
  let pi=0,cnt=0;
  const o=$('borb');
  const step=()=>{const p=phases[pi];o.textContent=p.t+' ('+cnt+')';cnt--;
    if(cnt<0){pi=(pi+1)%phases.length;cnt=phases[pi].d;if(pi===0)o.textContent='CYCLE COMPLETE';}
    setTimeout(step,1000);};
  cnt=phases[0].d;step();
};

// ═══════════════════════════════════════════════
//  CLOCK & DAILY CONTENT
// ═══════════════════════════════════════════════
const updateClock=()=>{
  const n=new Date();
  const h=String(n.getHours()).padStart(2,'0'),m=String(n.getMinutes()).padStart(2,'0'),s=String(n.getSeconds()).padStart(2,'0');
  $('bclock').textContent=h+':'+m+':'+s;
  $('hupt').textContent=Math.floor((Date.now()-startTime)/60000)+'m';
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('bdate').textContent=days[n.getDay()]+', '+months[n.getMonth()]+' '+n.getDate()+' '+n.getFullYear();
  $('bday-ls').textContent=days[n.getDay()]+' '+n.getDate()+' '+months[n.getMonth()];
};
setInterval(updateClock,1000);updateClock();

const FACTS=["The human brain has 86 billion neurons with 100 trillion connections.","DNA in one human cell stretches to 2 meters if unwound.","Light from the Sun takes 8 minutes 20 seconds to reach Earth.","The Milky Way contains 200-400 billion stars.","Pakistan has more glaciers than anywhere outside the polar regions.","The Quran was revealed over 23 years starting in 610 CE.","Al-Khwarizmi invented algebra in the 9th century CE.","The human heart beats 100,000 times every day.","K2 is the world's second highest peak at 8,611 meters.","Quantum computers can solve in seconds what takes classical computers millennia.","The human body replaces 330 billion cells every day.","The internet carries 5 exabytes of data every day.","Pi has been calculated to over 100 trillion decimal places.","The first Islamic Golden Age lasted from 750 to 1258 CE.","Photosynthesis produces all the oxygen we breathe."];
const QUOTES=[{q:"The acquisition of knowledge is a duty incumbent on every Muslim.",a:"Prophet Muhammad (PBUH)"},{q:"An investment in knowledge pays the best interest.",a:"Benjamin Franklin"},{q:"The more I learn, the more I realize how much I don't know.",a:"Albert Einstein"},{q:"Education is the most powerful weapon you can use to change the world.",a:"Nelson Mandela"},{q:"Iqra — Read. The first word revealed in the Quran.",a:"Surah Al-Alaq 96:1"},{q:"Science without religion is lame, religion without science is blind.",a:"Albert Einstein"},{q:"The ink of the scholar is more sacred than the blood of the martyr.",a:"Islamic Saying"},{q:"In the middle of every difficulty lies opportunity.",a:"Albert Einstein"}];
const VOCAB=[{w:"Epistemology",t:"noun",d:"The branch of philosophy concerned with the theory of knowledge.",e:"Epistemology asks: how do we know what we know?"},{w:"Algorithm",t:"noun",d:"A step-by-step procedure for solving a problem or accomplishing a task.",e:"Search engines use algorithms to rank websites."},{w:"Entropy",t:"noun",d:"A measure of disorder or randomness in a system.",e:"Entropy always increases in an isolated system — the Second Law of Thermodynamics."},{w:"Paradigm",t:"noun",d:"A typical example or pattern of something; a framework for understanding.",e:"Einstein's relativity created a paradigm shift in physics."},{w:"Synthesis",t:"noun",d:"The combination of ideas to form a theory or system.",e:"The synthesis of knowledge from multiple subjects leads to innovation."}];

const loadDaily=()=>{const d=new Date().getDate();const f=FACTS[d%FACTS.length];$('dft').textContent=f;const q=QUOTES[d%QUOTES.length];$('qt').textContent='"'+q.q+'"';$('qa').textContent='— '+q.a;const v=VOCAB[d%VOCAB.length];$('vw').textContent=v.w;$('vtype').textContent=v.t;$('vdef').textContent=v.d;$('vex').textContent='"'+v.e+'"';};

// ═══════════════════════════════════════════════
//  MOOD CHART
// ═══════════════════════════════════════════════
const renderMoodChart=()=>{$('mch').innerHTML=moodHist.slice(-10).map(m=>'<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+m.c+';margin:2px;opacity:.8" title="'+m.m+'"></span>').join('');};

// ═══════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════
window.expChat=()=>{const msgs=[...$('chat-log').querySelectorAll('.msg')].map(m=>{const spk=m.querySelector('.mspk');const body=m.querySelector('.mbody');const meta=m.querySelector('.mmeta');return(spk?spk.textContent+': ':'')+( body?body.textContent:'')+(meta?' ['+meta.textContent+']':'');}).join('\n\n');const b=new Blob([msgs],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='nova-chat.txt';a.click();};

// ═══════════════════════════════════════════════
//  TABS & MODALS
// ═══════════════════════════════════════════════
const sTab=tab=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));const te=document.querySelector('[onclick="sTab(\''+tab+'\')"]');if(te)te.classList.add('on');const ve=$('tab-'+tab);if(ve)ve.classList.add('on');};
window.openM=id=>$(id).classList.add('on');
window.closeM=id=>$(id).classList.remove('on');
document.querySelectorAll('.mbg').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on');}));
window.togS=key=>{settings[key]=!settings[key];$('tog-'+key)&&$('tog-'+key).classList.toggle('on',settings[key]);if(key==='part')$('ptc').style.display=settings.part?'block':'none';};
window.resetAll=()=>{if(confirm('Reset ALL NOVA data?')){localStorage.clear();location.reload();}};

// ═══════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════
(()=>{
  const c=$('ptc'),ctx=c.getContext('2d');
  const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};resize();
  const pts=Array.from({length:55},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,r:Math.random()*.9+.2,o:Math.random()*.18+.05}));
  const draw=()=>{ctx.clearRect(0,0,c.width,c.height);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;});for(let i=0;i<pts.length;i++)for(let k=i+1;k<pts.length;k++){const dx=pts[i].x-pts[k].x,dy=pts[i].y-pts[k].y,d=Math.sqrt(dx*dx+dy*dy);if(d<100){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[k].x,pts[k].y);ctx.strokeStyle='rgba(0,212,255,'+(1-d/100)*.05+')';ctx.lineWidth=.5;ctx.stroke();}}pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(0,212,255,'+p.o+')';ctx.fill();});requestAnimationFrame(draw);};
  draw();window.addEventListener('resize',resize);
})();

// ═══════════════════════════════════════════════
//  STREAK
// ═══════════════════════════════════════════════
const updateStreak=()=>{const s=getStreak();$('str-d').textContent=s;$('hstr').textContent=s+'🔥';if(s>=3)unlock('str3','3-Day Streak!');};

// ═══════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════
const BOOTM=['LOADING NOVA v4.0...','INITIALIZING 300+ KNOWLEDGE ARTICLES...','VOICE ENGINE READY...','EMOTION MATRIX CALIBRATED...','AI API CONNECTED...','PRAYER TIMES KARACHI LOADED...','REQUESTING MIC PERMISSION — ONCE ONLY...','WAKE WORD SYSTEM ARMED...','ALL SYSTEMS NOMINAL.','WELCOME TO NOVA!'];
const runBoot=()=>{let i=0;const step=()=>{if(i>=BOOTM.length){setTimeout(()=>{$('boot').style.transition='opacity .5s';$('boot').style.opacity='0';setTimeout(()=>$('boot').style.display='none',500);},500);return;}$('boot-log').textContent=BOOTM[i];$('boot-fill').style.width=((i+1)/BOOTM.length*100)+'%';i++;setTimeout(step,220);};step();};

// QUICK INPUT
window.fi=t=>{if(speaking){synth.cancel();doneSpeaking();}addMsg('user',t,false);processInput(t);};
window.sTab=sTab;
window.startG=startG;
window.chkRiddle=chkRiddle;
window.advKK=advKK;
window.contStory=contStory;
window.chkT2L=chkT2L;
window.nextQ=window.nextQ;
window.startEnroll=startEnroll;

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
const init=async()=>{
  load();runBoot();loadDaily();buildEnc();renderNotes();renderGoals();renderPrayer();setMood('happy');updateStreak();addXP(0);
  const mic=await getMic();
  if(mic)notify('Microphone ready!','ok',3000);
  setTimeout(()=>{
    const apiStatus = (NOVA_API_KEY && NOVA_API_KEY !== "sk-hc-v1-26e85c741c8c482cb61738d7232d87f5e3b2f92c1aF8489085cb d1a63alae016") ? "AI API connected for intelligent responses." : "Running in offline mode — add API key in config.js for AI responses.";
    addMsg('nova','Hello! NOVA v4 is fully online with over 300 knowledge articles covering science, Islam, Pakistan, history, math, technology, space, and health — all offline. '+apiStatus+' Press Start Wake Word then just say Hi Nova anytime to activate me hands-free!');
    setMood('warm');
  },2900);
};

$('tinp').addEventListener('keydown',e=>{if(e.key==='Enter')sTxt();});
document.addEventListener('DOMContentLoaded',init);

// ═══════════════════════════════════════════════
//  STUDENT TOOLS
// ═══════════════════════════════════════════════

// GRADE CALCULATOR
let subjects = [];
window.addSubject = () => {
    const name = $('subj-name').value.trim();
    const marks = parseFloat($('subj-marks').value);
    const total = parseFloat($('subj-total').value);
    if (!name || isNaN(marks) || isNaN(total)) {
        notify('Please fill all fields!', 'err');
        return;
    }
    if (marks > total) {
        notify('Marks cannot exceed total!', 'err');
        return;
    }
    subjects.push({ name, marks, total });
    renderSubjects();
    $('subj-name').value = '';
    $('subj-marks').value = '';
    $('subj-total').value = '';
    notify('Subject added!', 'ok');
};

const renderSubjects = () => {
    $('grade-subjects').innerHTML = subjects.map((s, i) => {
        const pct = ((s.marks / s.total) * 100).toFixed(1);
        return `<div class="lr">
            <span class="lk">${s.name}</span>
            <span class="lv">${s.marks}/${s.total} — ${pct}%</span>
            <button class="btn br" style="padding:3px 8px;font-size:8px" onclick="removeSubject(${i})">✕</button>
        </div>`;
    }).join('');
};

window.removeSubject = i => {
    subjects.splice(i, 1);
    renderSubjects();
};

window.calcGrades = () => {
    if (!subjects.length) {
        notify('Add subjects first!', 'err');
        return;
    }
    const total = subjects.reduce((a, s) => a + (s.marks / s.total) * 100, 0);
    const avg = (total / subjects.length).toFixed(1);
    const grade = avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
    const msg = avg >= 80 ? '🎉 Excellent work!' : avg >= 60 ? '👍 Good effort!' : '💪 Keep working hard!';
    $('grade-result').innerHTML = `Overall: ${avg}% — Grade: ${grade} ${msg}`;
    speak(`Your overall percentage is ${avg} percent. Grade ${grade}. ${msg}`);
    addXP(10);
};

window.clearGrades = () => { subjects = []; renderSubjects(); $('grade-result').innerHTML = ''; };

// ═══════════════════════════════════════════════
//  POMODORO TIMER
// ═══════════════════════════════════════════════
let pomTimer = null, pomSeconds = 25 * 60, pomIsStudy = true, pomSessions = 0, pomRunning = false;

const pomUpdate = () => {
    const m = Math.floor(pomSeconds / 60);
    const s = pomSeconds % 60;
    $('pom-display').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    $('pom-display').style.color = pomIsStudy ? 'var(--c)' : 'var(--cg)';
};

window.pomStart = () => {
    if (pomRunning) return;
    pomRunning = true;
    notify(pomIsStudy ? 'Study session started! Focus!' : 'Break time! Relax!', 'ok');
    pomTimer = setInterval(() => {
        pomSeconds--;
        pomUpdate();
        if (pomSeconds <= 0) {
            clearInterval(pomTimer);
            pomRunning = false;
            beep(880, 0.1);
            beep(660, 0.1);
            if (pomIsStudy) {
                pomSessions++;
                $('pom-count').textContent = '🍅 Sessions completed: ' + pomSessions;
                pomSeconds = 5 * 60;
                pomIsStudy = false;
                $('pom-status').textContent = 'BREAK TIME';
                speak('Study session complete! Take a 5 minute break. Well done!');
                addXP(20);
                notify('🍅 Session complete! Take a break!', 'ok', 5000);
            } else {
                pomSeconds = 25 * 60;
                pomIsStudy = true;
                $('pom-status').textContent = 'STUDY SESSION';
                speak('Break over! Time to focus for 25 minutes!');
                notify('Break over! Back to studying!', 'ok', 5000);
            }
            pomUpdate();
        }
    }, 1000);
};

window.pomPause = () => {
    if (!pomRunning) return;
    clearInterval(pomTimer);
    pomRunning = false;
    notify('Timer paused!', 'warn');
};

window.pomReset = () => {
    clearInterval(pomTimer);
    pomRunning = false;
    pomSeconds = 25 * 60;
    pomIsStudy = true;
    $('pom-status').textContent = 'STUDY SESSION';
    pomUpdate();
    notify('Timer reset!', 'warn');
};

// ═══════════════════════════════════════════════
//  EXAM COUNTDOWN
// ═══════════════════════════════════════════════
let exams = JSON.parse(localStorage.getItem('nova_exams') || '[]');

window.addExam = () => {
    const name = $('exam-name').value.trim();
    const date = $('exam-date').value;
    if (!name || !date) {
        notify('Please enter exam name and date!', 'err');
        return;
    }
    exams.push({ name, date });
    localStorage.setItem('nova_exams', JSON.stringify(exams));
    $('exam-name').value = '';
    $('exam-date').value = '';
    renderExams();
    notify('Exam added!', 'ok');
};

const renderExams = () => {
    if (!exams.length) {
        $('exam-list').innerHTML = '<div style="color:var(--t3);font-size:11px;padding:8px">No exams added yet!</div>';
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    $('exam-list').innerHTML = exams.map((e, i) => {
        const examDate = new Date(e.date);
        examDate.setHours(0, 0, 0, 0);
        const days = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        const color = days <= 3 ? 'var(--cr,#ef4444)' : days <= 7 ? 'var(--cy)' : 'var(--cg)';
        const msg = days < 0 ? 'PASSED' : days === 0 ? 'TODAY!' : days === 1 ? 'TOMORROW!' : days + ' days left';
        return `<div class="lr">
            <span class="lk">📝 ${e.name}</span>
            <span style="color:${color};font-family:var(--fh);font-size:11px">${msg}</span>
            <span class="lv">${e.date}</span>
            <button class="btn br" style="padding:3px 8px;font-size:8px" onclick="removeExam(${i})">✕</button>
        </div>`;
    }).join('');
};

window.removeExam = i => {
    exams.splice(i, 1);
    localStorage.setItem('nova_exams', JSON.stringify(exams));
    renderExams();
};

renderExams();

// ═══════════════════════════════════════════════
//  UNIT CONVERTER
// ═══════════════════════════════════════════════
const UNITS = {
    length: {
        units: ['Kilometers', 'Meters', 'Centimeters', 'Miles', 'Feet', 'Inches', 'Yards'],
        base: 'Meters',
        toBase: { Kilometers: 1000, Meters: 1, Centimeters: 0.01, Miles: 1609.34, Feet: 0.3048, Inches: 0.0254, Yards: 0.9144 }
    },
    weight: {
        units: ['Kilograms', 'Grams', 'Pounds', 'Ounces', 'Tonnes'],
        base: 'Kilograms',
        toBase: { Kilograms: 1, Grams: 0.001, Pounds: 0.453592, Ounces: 0.0283495, Tonnes: 1000 }
    },
    temp: {
        units: ['Celsius', 'Fahrenheit', 'Kelvin'],
        base: 'Celsius',
        toBase: null
    },
    speed: {
        units: ['km/h', 'm/s', 'mph', 'Knots'],
        base: 'm/s',
        toBase: { 'km/h': 0.277778, 'm/s': 1, 'mph': 0.44704, 'Knots': 0.514444 }
    },
    area: {
        units: ['Square Meters', 'Square Kilometers', 'Square Feet', 'Acres', 'Hectares'],
        base: 'Square Meters',
        toBase: { 'Square Meters': 1, 'Square Kilometers': 1e6, 'Square Feet': 0.092903, 'Acres': 4046.86, 'Hectares': 10000 }
    }
};

window.updateConverter = () => {
    const type = $('conv-type').value;
    const u = UNITS[type].units;
    [$('conv-from'), $('conv-to')].forEach((sel, i) => {
        sel.innerHTML = u.map(u => `<option>${u}</option>`).join('');
        sel.value = u[i === 0 ? 0 : 1];
    });
    $('conv-result').textContent = '';
};

window.convert = () => {
    const type = $('conv-type').value;
    const val = parseFloat($('conv-input').value);
    const from = $('conv-from').value;
    const to = $('conv-to').value;
    if (isNaN(val)) { $('conv-result').textContent = ''; return; }

    let result;
    if (type === 'temp') {
        if (from === 'Celsius' && to === 'Fahrenheit') result = val * 9/5 + 32;
        else if (from === 'Fahrenheit' && to === 'Celsius') result = (val - 32) * 5/9;
        else if (from === 'Celsius' && to === 'Kelvin') result = val + 273.15;
        else if (from === 'Kelvin' && to === 'Celsius') result = val - 273.15;
        else if (from === 'Fahrenheit' && to === 'Kelvin') result = (val - 32) * 5/9 + 273.15;
        else if (from === 'Kelvin' && to === 'Fahrenheit') result = (val - 273.15) * 9/5 + 32;
        else result = val;
    } else {
        const u = UNITS[type];
        result = (val * u.toBase[from]) / u.toBase[to];
    }

    $('conv-result').textContent = `${val} ${from} = ${result.toFixed(4)} ${to}`;
};

updateConverter();

// ═══════════════════════════════════════════════
//  SPACE SCREENSAVER
// ═══════════════════════════════════════════════
let idleTimer = null, screensaverOn = false;

const resetIdle = () => {
    clearTimeout(idleTimer);
    if (screensaverOn) stopScreensaver();
    idleTimer = setTimeout(startScreensaver, 3 * 60 * 1000);
};

const startScreensaver = () => {
    screensaverOn = true;
    document.body.style.background = '#000010';
    notify('💤 Nova is idle — space screensaver active', 'ok', 3000);
};

const stopScreensaver = () => {
    screensaverOn = false;
    document.body.style.background = '';
};

document.addEventListener('mousemove', resetIdle);
document.addEventListener('keypress', resetIdle);
document.addEventListener('click', resetIdle);
resetIdle();
// ═══════════════════════════════════════════════
//  THEME CREATOR
// ═══════════════════════════════════════════════
window.applyTheme = () => {
    const primary = $('theme-primary').value;
    const accent = $('theme-accent').value;
    const success = $('theme-success').value;
    document.documentElement.style.setProperty('--c', primary);
    document.documentElement.style.setProperty('--cp', accent);
    document.documentElement.style.setProperty('--cg', success);
    document.documentElement.style.setProperty('--c-glow', primary + '40');
};

window.saveTheme = () => {
    const theme = {
        primary: $('theme-primary').value,
        accent: $('theme-accent').value,
        success: $('theme-success').value
    };
    localStorage.setItem('nova_theme', JSON.stringify(theme));
    notify('Theme saved! 🌈', 'ok');
    beep(880, 0.05);
};

window.resetTheme = () => {
    document.documentElement.style.setProperty('--c', '#00d4ff');
    document.documentElement.style.setProperty('--cp', '#7c3aed');
    document.documentElement.style.setProperty('--cg', '#10b981');
    $('theme-primary').value = '#00d4ff';
    $('theme-accent').value = '#7c3aed';
    $('theme-success').value = '#10b981';
    localStorage.removeItem('nova_theme');
    notify('Theme reset to default!', 'warn');
};

const loadTheme = () => {
    const saved = localStorage.getItem('nova_theme');
    if (!saved) return;
    const theme = JSON.parse(saved);
    $('theme-primary').value = theme.primary;
    $('theme-accent').value = theme.accent;
    $('theme-success').value = theme.success;
    document.documentElement.style.setProperty('--c', theme.primary);
    document.documentElement.style.setProperty('--cp', theme.accent);
    document.documentElement.style.setProperty('--cg', theme.success);
};

loadTheme();