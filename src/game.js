const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const rootEl=document.documentElement;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={get(k,d){try{const v=localStorage.getItem('ms2:'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('ms2:'+k,JSON.stringify(v))}catch(e){}}};
const fmt=(v,d=2)=>(Math.round(v*10**d)/10**d).toLocaleString('en-US',{maximumFractionDigits:d});
function toast(t,ms=2200){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),ms)}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

/* ---------- sound ---------- */
let AC=null,muted=store.get('muted',false);
function ac(){try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
function tone(f,d=.15,type='sine',v=.12,at=0,f2){const c=ac();if(!c||muted)return;const t=c.currentTime+at,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.03)}
function noise(d=.25,v=.05,f1=2500,f2=500){const c=ac();if(!c||muted)return;const t=c.currentTime,n=c.sampleRate*d,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type='bandpass';fl.Q.value=.9;fl.frequency.setValueAtTime(f1,t);fl.frequency.exponentialRampToValueAtTime(f2,t+d);const g=c.createGain();g.gain.value=v;s.connect(fl).connect(g).connect(c.destination);s.start(t)}
const N=n=>440*Math.pow(2,(n-69)/12);
function bell(n,at=0,v=.1){tone(N(n),.5,'sine',v,at);tone(N(n)*2.01,.25,'sine',v*.3,at);tone(N(n)*3.98,.08,'triangle',v*.12,at)}
const sfx={
 tap(){tone(1100,.035,'triangle',.04)},
 swipe(){noise(.22,.035,3800,900)},
 good(k=0){[0,4,7].forEach((s,i)=>bell(76+s+Math.min(k,7),i*.055,.09))},
 bad(){tone(220,.22,'triangle',.09,0,140);tone(110,.25,'sine',.08,.02)},
 coin(){tone(N(88),.06,'square',.03);tone(N(93),.16,'square',.03,.06)},
 star(i){bell(79+i*4,0,.12);tone(N(91+i*4),.18,'triangle',.03,.05)},
 clear(){[0,4,7,12].forEach((s,i)=>bell(67+s,i*.08,.1));noise(.6,.03,6000,1500)},
 boss(){[0,3,7,10,12,15,19,24].forEach((s,i)=>bell(60+s,i*.07,.1));tone(N(36),1.4,'sawtooth',.025,.5)},
 egg(){[0,7,12,19,24].forEach((s,i)=>tone(N(76+s),.12,'square',.03,i*.05))},
 pluck(f){tone(f,.1,'triangle',.05)}
};
function setMute(m){muted=m;store.set('muted',m);$$('.snd').forEach(b=>{b.textContent=m?'×':'♪';b.setAttribute('aria-label',m?'Sound off':'Sound on')})}
setMute(muted);$$('.snd').forEach(b=>b.onclick=()=>{setMute(!muted);if(!muted)sfx.coin()});

/* ---------- theme ---------- */
// follows the OS until you pick one, then remembers your pick
const sysDark=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(t){if(t==='light'||t==='dark')rootEl.setAttribute('data-theme',t);else rootEl.removeAttribute('data-theme');
 const dark=t==='dark'||(t!=='light'&&sysDark.matches);
 $$('.thm').forEach(b=>{b.textContent=dark?'◐':'◑';b.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme')});
 const meta=document.querySelector('meta[name=theme-color]');if(meta)meta.setAttribute('content',dark?'#0B0C0E':'#F3F4F2')}
let themePref=store.get('theme',null);
applyTheme(themePref);
sysDark.addEventListener('change',()=>{if(!store.get('theme',null))applyTheme(null)});
$$('.thm').forEach(b=>b.onclick=()=>{const dark=rootEl.getAttribute('data-theme')==='dark'||(!rootEl.getAttribute('data-theme')&&sysDark.matches);
 themePref=dark?'light':'dark';store.set('theme',themePref);applyTheme(themePref);sfx.tap();renderMap()});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.opt');if(!b||b.disabled||RM)return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),sp=document.createElement('span');sp.className='rip';sp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.appendChild(sp);setTimeout(()=>sp.remove(),650)});

/* ---------- particles ---------- */
const cv=$('#fx'),cx=cv.getContext('2d');let parts=[],raf=0;
function size(){cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio;cx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}size();addEventListener('resize',size);
// the map is drawn in pixel space, so it has to be rebuilt when the column width changes
let rsz=0,lastW=innerWidth;
addEventListener('resize',()=>{if(innerWidth===lastW)return;lastW=innerWidth;clearTimeout(rsz);rsz=setTimeout(()=>{if(!$('#mapv').hidden)renderMap()},180)});
function cols(){const s=getComputedStyle(rootEl),w=(rootEl.style.getPropertyValue('--wh')||'#FFB224').trim();
 // the level's world colour + a lightened sibling, so confetti matches the level you just cleared
 return[w,shade(w,.6),s.getPropertyValue('--ice').trim(),s.getPropertyValue('--good').trim(),s.getPropertyValue('--ink').trim()]}
function hex2rgb(h){h=h.trim().replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[0,2,4].map(i=>parseInt(h.substr(i,2),16))}
function shade(h,k){try{const[r,g,b]=hex2rgb(h);return`rgb(${[r,g,b].map(v=>Math.round(v+(255-v)*k)).join(',')})`}catch(e){return h}}
function burst(x,y,k=40,sp=1){if(RM)return;const c=cols();for(let i=0;i<k;i++){const a=Math.random()*6.283,v=(2+Math.random()*7)*sp;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2.5*sp,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:c[i%5],s:3+Math.random()*5,l:70+Math.random()*50,t:i%3})}if(!raf)loop()}
function burstEl(el,k,sp){if(!el)return;const r=el.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,k,sp)}
function rain(k=180){if(RM)return;const c=cols();for(let i=0;i<k;i++)parts.push({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.6,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,r:Math.random()*6,vr:(Math.random()-.5)*.25,c:c[i%5],s:4+Math.random()*6,l:260,rn:1,t:i%3});if(!raf)loop()}
function loop(){cx.clearRect(0,0,innerWidth,innerHeight);parts=parts.filter(p=>p.l>0&&p.y<innerHeight+30);for(const p of parts){p.vy+=p.rn?.03:.22;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.l--;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.globalAlpha=Math.min(1,p.l/30);cx.fillStyle=p.c;
 if(p.t===0)cx.fillRect(-p.s,-p.s/2.5,p.s*2,p.s/1.25);else if(p.t===1){cx.beginPath();cx.arc(0,0,p.s/1.6,0,6.283);cx.fill()}else{cx.beginPath();cx.moveTo(0,-p.s);cx.lineTo(p.s*.35,-p.s*.35);cx.lineTo(p.s,0);cx.lineTo(p.s*.35,p.s*.35);cx.lineTo(0,p.s);cx.lineTo(-p.s*.35,p.s*.35);cx.lineTo(-p.s,0);cx.lineTo(-p.s*.35,-p.s*.35);cx.closePath();cx.fill()}cx.restore()}raf=parts.length?requestAnimationFrame(loop):0}

/* ---------- state ---------- */
let XP=store.get('xp',0),done=store.get('done',{}),slips=store.get('slips',[]),found=store.get('eggs',{}),solved=store.get('solved',{}),unlockAll=store.get('unlockAll',false);
function countUp(el,from,to,ms=700){if(RM){el.textContent=to;return}const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*e);if(k<1)requestAnimationFrame(f)})(t0)}
function addXP(n,el){const old=XP;XP=Math.max(0,XP+n);store.set('xp',XP);countUp($('#xpT'),old,XP);countUp($('#xpS'),old,XP);if(el&&n>0&&!RM){const r=el.getBoundingClientRect(),f=document.createElement('span');f.className='xpf';f.textContent='+'+n;f.style.left=(r.left+r.width/2-14)+'px';f.style.top=(r.top-8)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1000)}if(XP>=1296)egg('dice')}
$('#xpT').textContent=XP;$('#xpS').textContent=XP;
function slip(s){slips.push(s);store.set('slips',slips);renderRep()}
function renderRep(){$('#rep').value=slips.length?'Mean Streets report\n'+slips.map((s,i)=>(i+1)+'. '+s).join('\n'):'Nothing logged yet.'}renderRep();
$('#copy').onclick=()=>{navigator.clipboard.writeText($('#rep').value).then(()=>{toast('Report copied');sfx.coin()}).catch(()=>{$('#rep').select();toast('Selected. Copy it manually.')})};
$('#unlock').onclick=()=>{unlockAll=!unlockAll;store.set('unlockAll',unlockAll);renderMap();toast(unlockAll?'All levels unlocked':'Levels lock in order again');sfx.tap()};
let armed=0;$('#reset').onclick=()=>{if(!armed){armed=1;$('#reset').textContent='Tap again to wipe';setTimeout(()=>{armed=0;$('#reset').textContent='Reset'},3000);return}['xp','done','slips','eggs','solved','unlockAll'].forEach(k=>{try{localStorage.removeItem('ms2:'+k)}catch(e){}});try{Object.keys(localStorage).filter(k=>k.startsWith('ms2:in:')).forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()};

/* ---------- eggs ---------- */
const EGGS={logo:'🪙',outlier:'🛸',konami:'🌀',dice:'🎲',nminus1:'🧮'};
const EGGNAME={logo:'Coin flip',outlier:'Certified outlier',konami:'Outlier mode',dice:'6⁴ XP club',nminus1:'n − 1 forever'};
function renderAch(){$('#ach').innerHTML=Object.keys(EGGS).map(k=>`<div class="${found[k]?'got':''}" title="${found[k]?EGGNAME[k]:'???'}">${found[k]?EGGS[k]:'?'}</div>`).join('');$('#eggC').textContent=Object.keys(found).length+'/5'}
function egg(k){if(found[k])return;found[k]=1;store.set('eggs',found);renderAch();sfx.egg();toast('Secret found · '+EGGNAME[k]+' '+EGGS[k],3000);rain(100)}renderAch();
let logoN=0;$('#brand').onclick=()=>{logoN++;tone(N(72+logoN*2),.12,'triangle',.07);$('#brand').style.transform=`rotateY(${logoN*180}deg)`;$('#brand').style.transition='transform .5s';if(logoN===5)egg('logo')};
const KON=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];let kp=0,typed='';
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();kp=k===KON[kp]?kp+1:(k===KON[0]?1:0);if(kp===KON.length){kp=0;document.body.classList.toggle('outlier');egg('konami')}typed=(typed+k).slice(-7);if(typed==='nminus1')egg('nminus1')});

/* ---------- helpers ---------- */
const F=(n,d)=>`<span class="frac"><span>${n}</span><span>${d}</span></span>`;
const S=(k,t)=>`<div class="step"><span class="k">${k}</span><span>${t}</span></div>`;
const T=(rows,mk)=>`<div class="tw"><table>${rows.map((r,i)=>`<tr class="${mk&&mk.includes(i)?'mk':''}${r.tot?' tot':''}">${(r.c||r).map(c=>i===0?`<th>${c}</th>`:`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
const chip=(t,body,cls='')=>`<div class="chip ${cls}"><span class="t">${t}</span><span>${body}</span></div>`;
function parse(s){s=String(s).trim().replace(/,/g,'').replace(/\s/g,'');if(!s)return null;let m;if(m=s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/))return +m[1]/+m[2];if(m=s.match(/^(-?\d*\.?\d+)%$/))return +m[1];if(/^-?\d*\.?\d+$/.test(s))return +s;return NaN}
const near=(v,a)=>Math.abs(v-a)<=Math.max(Math.abs(a)*.006,.011);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const TF=['True','False'];

/* ---------- problems ---------- */
const P={
P1:{title:'Late Ubers',q:`<p>Minutes late for 9 Uber rides:</p><div class="formula" style="font-size:1rem">7, 3, 12, 5, 3, 9, 4, 3, 8</div>`,f:[{l:'Mean x̄',a:6},{l:'Median',a:5},{l:'Mode',a:3}],hint:'Sort first. n = 9 is odd → the median sits at position (9 + 1)/2 = 5.',
 sol:S('mean','54 / 9 = <b>6 min</b>')+S('sort','3, 3, 3, 4, <b>5</b>, 7, 8, 9, 12')+S('median','n odd → X<sub>(5)</sub> = <b>5 min</b>')+S('mode','3 appears 3 times → <b>3 min</b>')},
P2:{title:'Battery at noon',q:`<p>Your battery % at noon over 8 days:</p><div class="formula" style="font-size:1rem">62, 45, 80, 71, 45, 58, 90, 69</div>`,f:[{l:'Mean x̄',a:65},{l:'Median',a:65.5},{l:'Mode',a:45}],hint:'n = 8 is even → average the 4th and 5th values after sorting.',
 sol:S('mean','520 / 8 = <b>65%</b>')+S('sort','45, 45, 58, <b>62, 69</b>, 71, 80, 90')+S('median','(62 + 69)/2 = <b>65.5%</b>')+S('mode','45 twice → <b>45%</b>')},
P3:{title:'Name that mode',q:`<p>Describe each data set.</p>`,f:[{l:'4, 8, 6, 10, 7',a:'No mode',o:['One mode','Bimodal','Multimodal','No mode']},{l:'2, 4, 4, 6, 6, 8',a:'Bimodal',o:['One mode','Bimodal','Multimodal','No mode']},{l:'1, 1, 2, 2, 3, 3, 5',a:'Multimodal',o:['One mode','Bimodal','Multimodal','No mode']},{l:'Mean of 9, 9, 9, 9, 9',a:9}],hint:'Two values tied → bimodal. More than two → multimodal. All different → no mode.',
 sol:S('1','all different → <b>no mode</b>')+S('2','4 and 6 → <b>bimodal</b>')+S('3','1, 2, 3 → <b>multimodal</b>')+S('4','45 / 5 = <b>9</b>')},
P4:{title:'Coffee per day',q:`<p>Cups per day for 25 students. Build x·f and CF on paper.</p>`+T([['x','0','1','2','3','4'],['f','3','7','8','5','2']]),f:[{l:'Mean x̄',a:1.84},{l:'Median',a:2},{l:'Mode',a:2}],hint:'Σxf = 46. n = 25 is odd → position 13. Walk down the CF.',
 sol:T([['x','f','x·f','CF'],['0','3','0','3'],['1','7','7','10'],['2','8','16','18'],['3','5','15','23'],['4','2','8','25'],{c:['Total','25','46','—'],tot:1}],[3])+S('mean','46 / 25 = <b>1.84 cups</b>')+S('median','position 13 → CF 10 no, 18 yes → <b>2</b>')+S('mode','biggest f = 8 → <b>2</b>')},
HW42:{hw:1,title:'Assignment 4 · Ex 2',q:`<p>Hours worked by 50 employees.</p>`+T([['hours','5','6','7','8','9'],['f','6','10','13','16','5']]),f:[{l:'Mean x̄',a:7.08},{l:'Median',a:7},{l:'Mode',a:8}],hint:'n = 50 even → positions 25 and 26. CF: 6, 16, 29…',
 sol:S('mean','Σxf = 354 → 354 / 50 = <b>7.08 h</b>')+S('median','25 and 26 both fall at CF 29 → x = 7 → <b>7 h</b>')+S('mode','f = 16 → <b>8 h</b>')},
P5:{title:'TikTok minutes',q:`<p>Minutes per day, 40 students.</p>`+T([['class','15–24','25–34','35–44','45–54','55–64','65–74'],['f','3','7','12','9','6','3']]),f:[{l:'Mean x̄',a:43.75},{l:'Median',a:42.833,s:'42.83'},{l:'Mode',a:40.75}],hint:'Midpoints 19.5, 29.5, … n/2 = 20. For the 35–44 class, L = 34.5.',
 sol:T([['limits','bound.','f','m','m·f','CF'],['15–24','14.5–24.5','3','19.5','58.5','3'],['25–34','24.5–34.5','7','29.5','206.5','10'],['35–44','34.5–44.5','12','39.5','474','22'],['45–54','44.5–54.5','9','49.5','445.5','31'],['55–64','54.5–64.5','6','59.5','357','37'],['65–74','64.5–74.5','3','69.5','208.5','40'],{c:['Total','—','40','—','1750','—'],tot:1}],[3])+S('mean','1750 / 40 = <b>43.75 min</b>')+S('median',`n/2 = 20 → 35–44 · 34.5 + ${F('20 − 10','22 − 10')} × 10 = <b>42.83</b>`)+S('mode',`Δ₁ = 5, Δ₂ = 3 → 34.5 + ${F('5','8')} × 10 = <b>40.75</b>`)},
P6:{title:'Mode trap',q:`<p>Delivery waits (min), 26 orders.</p>`+T([['class','10–19','20–29','30–39','40–49'],['f','11','8','5','2']]),f:[{l:'Mode',a:'Does not exist',o:['14.5','19.5','16.6','Does not exist']},{l:'Median',a:22}],hint:'Where is the biggest f? Remember the prof\'s rule. Median: n/2 = 13.',
 sol:S('mode','biggest f is in the <b>first</b> class → no class before it → <b>does not exist</b>')+S('median',`n/2 = 13 → class 20–29 · 19.5 + ${F('13 − 11','19 − 11')} × 10 = <b>22 min</b>`)},
HW43:{hw:1,title:'Assignment 4 · Ex 3',q:`<p>Net worth ($M) of 45 corporations. Width is <b>11</b>. Two classes tie.</p>`+T([['class','10–20','21–31','32–42','43–53','54–64','65–75'],['f','2','6','12','8','12','5']]),f:[{l:'Mean x̄',a:46.044,s:'46.04'},{l:'Median',a:45.9375,s:'45.94'},{l:'Mode 1 (lower)',a:38.1},{l:'Mode 2 (upper)',a:57.5}],hint:'Midpoints 15, 26, 37, 48, 59, 70. Compute the mode formula for both f = 12 classes.',
 sol:S('mean','2072 / 45 = <b>46.04</b>')+S('median',`n/2 = 22.5 → 43–53 · 42.5 + ${F('2.5','8')} × 11 = <b>45.94</b>`)+S('mode 1',`31.5 + ${F('6','6 + 4')} × 11 = <b>38.1</b>`)+S('mode 2',`53.5 + ${F('4','4 + 7')} × 11 = <b>57.5</b>`)},
P7:{title:'Variance by hand',q:`<p>Sample of 5 quiz scores:</p><div class="formula" style="font-size:1rem">4, 8, 6, 10, 7</div>`,f:[{l:'Mean x̄',a:7},{l:'Range',a:6},{l:'Variance s²',a:5},{l:'SD s',a:2.236,s:'2.24'}],hint:'Deviations: −3, 1, −1, 3, 0. Square, add, divide by n − 1 = 4.',
 sol:T([['x','4','8','6','10','7','Σ'],['x − x̄','−3','1','−1','3','0','0'],['(x − x̄)²','9','1','1','9','0','20']])+S('variance',`${F('20','4')} = <b>5</b> · shortcut: ${F('265 − 5(49)','4')} = 5 ✓`)+S('SD','√5 = <b>2.24</b>')},
P8:{title:'Population or sample?',q:`<p>A tiny <b>population</b>: 2, 4, 6, 8.</p>`,f:[{l:'μ',a:5},{l:'σ²',a:5},{l:'s² if it were a sample',a:6.667,s:'6.67'},{l:'"Sample SD = √σ²"',a:'False',o:TF}],hint:'Σ(x − 5)² = 20. Population ÷ N = 4, sample ÷ (n − 1) = 3.',
 sol:S('μ','20 / 4 = <b>5</b>')+S('σ²','20 / 4 = <b>5</b>')+S('s²','20 / 3 = <b>6.67</b>')+S('T/F','√σ² is the population SD → <b>False</b>')},
P9:{title:'Coffee · spread',q:`<p>Same coffee table (n = 25, x̄ = 1.84). Add an x²·f column.</p>`,f:[{l:'Range',a:4},{l:'Σx²f',a:116},{l:'Variance s²',a:1.3067,s:'1.31'},{l:'SD s',a:1.143,s:'1.14'},{l:'CV %',a:62.12,s:'62.1%'}],hint:'x²f = x × (x·f): 0, 7, 32, 45, 32.',
 sol:S('Σx²f','<b>116</b>')+S('s²',`${F('116 − 25(1.84)²','24')} = ${F('31.36','24')} = <b>1.31</b>`)+S('s','<b>1.14</b>')+S('CV',`${F('1.143','1.84')} × 100 = <b>62.1%</b>`)},
P10:{title:'TikTok · spread',q:`<p>Same TikTok table (n = 40, x̄ = 43.75). Add m²·f.</p>`,f:[{l:'Range',a:60},{l:'Σm²f',a:83740},{l:'Variance s²',a:184.04},{l:'SD s',a:13.566,s:'13.57'}],hint:'Range = 74.5 − 14.5 (boundaries). m²f = m × (m·f).',
 sol:S('range','74.5 − 14.5 = <b>60</b>')+S('Σm²f','<b>83740</b>')+S('s²',`${F('83740 − 40(43.75)²','39')} = ${F('7177.5','39')} = <b>184.04</b>`)+S('s','<b>13.57</b>')},
P11:{title:'Uber: fare vs time',q:`<p>Fare: mean <b>32 SAR</b>, SD <b>6</b>. Trip time: mean <b>18 min</b>, SD <b>5</b>.</p>`,f:[{l:'CV fare %',a:18.75},{l:'CV time %',a:27.78,s:'27.78%'},{l:'More variable',a:'Trip time',o:['Fare','Trip time','Same']}],hint:'Different units → CV = s / x̄ × 100.',
 sol:S('fare',`${F('6','32')} × 100 = <b>18.75%</b>`)+S('time',`${F('5','18')} × 100 = <b>27.78%</b>`)+S('so','CV<sub>fare</sub> &lt; CV<sub>time</sub> → <b>time is more variable</b>')},
HW51:{hw:1,title:'Assignment 5 · Ex 1',q:`<p>Fast-food visits per week, 50 people.</p>`+T([['times','0','1','2','3','4','5','6'],['f','6','10','15','8','5','4','2']]),f:[{l:'Mean x̄',a:2.32},{l:'Range',a:6},{l:'Variance s²',a:2.5486,s:'2.55'},{l:'CV %',a:68.81,s:'68.8%'}],hint:'Σxf = 116, Σx²f = 394.',
 sol:S('mean','116 / 50 = <b>2.32</b>')+S('range','<b>6</b>')+S('s²',`${F('394 − 50(2.32)²','49')} = <b>2.55</b>`)+S('CV','1.596 / 2.32 × 100 = <b>68.8%</b>')},
HW52:{hw:1,title:'Assignment 5 · Ex 2',q:`<p>Shipping days, 40 companies. Classes are already boundaries.</p>`+T([['days','0.5–3.5','3.5–6.5','6.5–9.5','9.5–12.5','12.5–15.5','15.5–18.5'],['f','6','9','10','7','3','5']]),f:[{l:'Mean x̄',a:8.525,s:'8.53'},{l:'Range',a:18},{l:'Variance s²',a:22.10}],hint:'Midpoints 2, 5, 8, 11, 14, 17. Σmf = 341, Σm²f = 3769.',
 sol:S('mean','341 / 40 = <b>8.53</b>')+S('range','18.5 − 0.5 = <b>18</b>')+S('s²',`${F('3769 − 40(8.525)²','39')} = <b>22.10</b>`)},
HW53:{hw:1,title:'Assignment 5 · Ex 3',q:`<p>Age: mean <b>26</b>, SD <b>6</b>. Salary: mean <b>$31,000</b>, SD <b>$4,000</b>.</p>`,f:[{l:'CV age %',a:23.08,s:'23.08%'},{l:'CV salary %',a:12.9,s:'12.90%'},{l:'More variable',a:'Age',o:['Age','Salary','Same']}],hint:'CV = s / x̄ × 100.',
 sol:S('age','<b>23.08%</b>')+S('salary','<b>12.90%</b>')+S('so','<b>age is more variable</b>')},
BOSS:{boss:1,title:'Weekly gaming hours · 50 students',q:T([['class','1–5','6–10','11–15','16–20','21–25','26–30'],['f','4','9','15','12','7','3']])+`<p>Mean, median, mode, range, variance, SD and CV. Build the full table on paper.</p>`,f:[{l:'Mean x̄',a:14.8},{l:'Median',a:14.5},{l:'Mode',a:13.833,s:'13.83'},{l:'Range',a:30},{l:'Variance s²',a:43.633,s:'43.63'},{l:'SD s',a:6.6055,s:'6.61'},{l:'CV %',a:44.63,s:'44.6%'}],
 sol:T([['limits','bound.','f','m','m·f','m²·f','CF'],['1–5','0.5–5.5','4','3','12','36','4'],['6–10','5.5–10.5','9','8','72','576','13'],['11–15','10.5–15.5','15','13','195','2535','28'],['16–20','15.5–20.5','12','18','216','3888','40'],['21–25','20.5–25.5','7','23','161','3703','47'],['26–30','25.5–30.5','3','28','84','2352','50'],{c:['Total','—','50','—','740','13090','—'],tot:1}],[3])+S('mean','740 / 50 = <b>14.8</b>')+S('median',`10.5 + ${F('25 − 13','28 − 13')} × 5 = <b>14.5</b>`)+S('mode',`10.5 + ${F('6','6 + 3')} × 5 = <b>13.83</b>`)+S('range','30.5 − 0.5 = <b>30</b>')+S('s²',`${F('13090 − 50(14.8)²','49')} = ${F('2138','49')} = <b>43.63</b>`)+S('s','<b>6.61</b>')+S('CV','6.61 / 14.8 × 100 = <b>44.6%</b>')}
};

/* ---------- decks ---------- */
const DECKS={
cold:[{q:'The mean of 3, 5, 10 is…',o:['5','6','18','3.3'],a:1,e:'18 / 3 = 6.'},{q:'Median of 9, 2, 7, 4?',o:['7','5.5','4','5'],a:1,e:'Sort → 2, 4, 7, 9 → (4 + 7)/2.'},{q:'In the grouped median formula, L is…',o:['the lower limit of the median class','the lower boundary of the median class','the smallest value','the width'],a:1,e:'Always a boundary.'},{q:'Grouped mode: Δ₁ =',o:['f − f(before)','f − f(after)','F₂ − F₁','n/2 − F₁'],a:0,e:'Δ₂ uses the class after.'},{q:'Sample variance divides by…',o:['n','n − 1','N','N − 1'],a:1,e:'n − 1 for a sample.'},{q:'Mean 35, SD 7 → CV =',o:['5%','20%','245%','0.2%'],a:1,e:'7 / 35 × 100.'}],
drill:[{q:'The sample mode is not always unique.',o:TF,a:0,e:'Bimodal sets exist.'},{q:'The sample mean estimates the population median.',o:TF,a:1,e:'It estimates the population <b>mean</b>.'},{q:'For eleven 9s, the mean is 9.0.',o:TF,a:0,e:'99 / 11 = 9.'},{q:'The median class has the highest frequency.',o:TF,a:1,e:'That\'s the modal class.'},{q:'For 25, 29, 35, 27, 29, 25, 29 the mode is 25.',o:TF,a:1,e:'29 appears 3 times.'},{q:'The mode works for quantitative data but not qualitative.',o:TF,a:1,e:'Works for both.'},{q:'n = 100, Σmf = 709, Σm²f = 6092.9 → mean = 60.92.',o:TF,a:1,e:'709 / 100 = 7.09.'},{q:'More than two modes is called…',o:['Unimodal','Bimodal','Multimodal','No modal'],a:2,e:'Multimodal.'},{q:'A number from sample values is a…',o:['Parameter','Variable','Statistic','Probability'],a:2,e:'Statistic ↔ sample.'},{q:'Not affected by outliers?',o:['Mode','Midrange','Median','Mean'],a:2,e:'Median.'},{q:'Mean of 20, 26, 40, 36, 23, 42, 35, 24, 30',o:['30.7','30.0','22.0','31.0'],a:0,e:'276 / 9.'},{q:'Mode of 100, 1.01, 10.1, 1.10, 10.0, 101, 0.10, 1.0',o:['1.0','10.0','No mode','0.10'],a:2,e:'All different.'},{q:'Which takes ALL values into account?',o:['Mode','Midrange','Median','Mean'],a:3,e:'The mean.'},{q:'The range is not affected by extreme values.',o:TF,a:1,e:'Uses only max and min.'},{q:'CV is the square root of the variance.',o:TF,a:1,e:'That\'s the SD.'},{q:'Small variance → values more spread out.',o:TF,a:1,e:'Small = close to the mean.'},{q:'The SAMPLE CV is σ/μ × 100.',o:TF,a:1,e:'Sample: s / x̄ × 100.'},{q:'Sample SD of 10, 21, 33, 53, 54 is 19.41.',o:TF,a:0,e:'Code-checked ✓'},{q:'n = 100, Σmf = 709, Σm²f = 6092.9 → variance = 10.77.',o:TF,a:0,e:'(6092.9 − 100·7.09²)/99 ✓'},{q:'Uses only two values?',o:['Variance','SD','Range','Median'],a:2,e:'Range.'},{q:'Population SD =',o:['2√s','√(2σ²)','√s²','√σ²'],a:3,e:'σ = √σ².'},{q:'Population variance of 10, 60, 50, 30, 40, 20',o:['350','291.7','41.7','0.0'],a:1,e:'1750 / 6. (350 uses n − 1.)'},{q:'CV for mean 35, SD 7.07',o:['7.59%','20.2%','10.0%','495%'],a:1,e:'7.07 / 35 × 100.'}],
throw:[{q:'"Time spent on homework" is…',o:['Discrete','Continuous','Nominal','Ordinal'],a:1,e:'Time is measured.'},{q:'Boundaries of 8.0 inches (prof\'s ruling)?',o:['7.95–8.05','7.5–8.5','8.05–8.15','7.9–8.1'],a:1,e:'He treats 8.0 as an integer.'},{q:'R ÷ K is exactly 7. The prof wants…',o:['5 classes of 7','one extra class','W = 6','drop the max'],a:1,e:'Add a class.'},{q:'A histogram\'s x-axis shows…',o:['midpoints','boundaries','limits','CF'],a:1,e:'Polygon → midpoints, closed on both sides.'},{q:'"At least 5" from {3, 4, 5, 6, 7}',o:['6, 7','5, 6, 7','3, 4, 5','3, 4'],a:1,e:'Includes 5.'},{q:'Upper limit → next lower limit is the…',o:['width','accuracy unit','midpoint','range'],a:1,e:'19 → 20 = 1.'},{q:'Classical probability uses…',o:['a frequency table','the sample space','opinions','the median'],a:1,e:'n(E) / n(S).'},{q:'"Less than 12.5" from a cumulative table →',o:['only the 8–12 class','the CF at 12.5','n − CF','the rel. freq.'],a:1,e:'Everything below.'}]
};

/* ---------- levels ---------- */
const L=[
{id:'warm',n:'0',name:'Warm-up',sub:'6 questions',steps:[{t:'learn',k:'Intro',h:'What survived?',b:`<p>You aced the L4/L5 quiz three weeks ago. Six quick questions, no teaching first. It's just a check, so don't overthink it.</p>`+chip('Rule','Pick an answer, read the one-line why, keep moving.')},{t:'deck',key:'cold'}]},
{id:'avg',n:'1',name:'The 3 averages',sub:'mean · median · mode',steps:[
 {t:'learn',k:'Learn',h:'Statistic or parameter?',b:`<p>From the <b>sample</b> → a <b>statistic</b>. From the whole <b>population</b> → a <b>parameter</b>.</p>`+T([['','sample','population'],['size','n','N'],['mean','x̄','μ'],['variance','s²','σ²'],['SD','s','σ']])+chip('Trick','<b>S</b>tatistic ↔ <b>S</b>ample · <b>P</b>arameter ↔ <b>P</b>opulation')},
 {t:'learn',k:'Learn',h:'The mean is the balance point',b:`<p>Add everything, divide by how many.</p><div class="formula"><span class="lab">sample · population</span>x̄ = ${F('Σx','n')} &nbsp; μ = ${F('ΣX','N')}</div><div class="facts"><div class="fact">Always unique</div><div class="fact">Uses <b>all</b> the values</div><div class="fact">x̄ estimates μ</div><div class="fact"><b>Affected by outliers</b></div></div>`},
 {t:'learn',k:'Learn',h:'The median is the middle',b:`<p><b>Sort first. Always.</b></p><div class="formula"><span class="lab">n odd · n even</span>X<sub>(${F('n+1','2')})</sub> &nbsp;&nbsp; ${F('X<sub>(n/2)</sub> + X<sub>(n/2+1)</sub>','2')}</div><div class="facts"><div class="fact">7 values → the 4th</div><div class="fact">8 values → average the 4th and 5th</div><div class="fact"><b>Not affected by outliers</b> · uses 1 or 2 values</div></div>`},
 {t:'learn',k:'Learn',h:'The mode is the most repeated',b:T([['data','mode'],['18, 14, 10, 11, 10, 12, 10','10'],['104 ×3, 109 ×3','both · bimodal'],['all different','no mode'],['more than two tie','multimodal']])+`<div class="facts"><div class="fact">Not always unique</div><div class="fact">Works for <b>qualitative</b> data too</div><div class="fact">Might not exist</div></div>`},
 {t:'toy',k:'Play',h:'Make the mean move',toy:'beamA',b:`<p>Drag the dots. Then add the billionaire. The <span class="g">mean</span> chases him, the <span class="ic">median</span> barely moves.</p>`},
 {t:'check',q:'Which measure is NOT affected by extreme values?',o:['Mean','Median','Range','Variance'],a:1,e:'The median only cares about the middle position.'},
 {t:'prob',id:'P1'},{t:'prob',id:'P2'},{t:'prob',id:'P3'}]},
{id:'ung',n:'2',name:'Ungrouped tables',sub:'values with f',steps:[
 {t:'learn',k:'Learn',h:'Why multiply by f?',b:`<p>"x = 12, f = 8" means 12 appears <b>8 times</b>. So instead of adding 12 eight times, you write 12 × 8.</p><div class="formula"><span class="lab">ungrouped</span>x̄ = ${F('Σ x·f','n')} &nbsp;·&nbsp; mode = x with the biggest f</div>`+chip('Trap','Divide by <b>n</b> (total frequency), never by the number of rows.','bad')},
 {t:'learn',k:'Learn',h:'Median through the CF',b:`<p>Find the position, then walk down the <b>cumulative frequency</b> until it reaches it.</p>`+T([['x','f','x·f','CF'],['10','3','30','3'],['11','5','55','8'],['12','8','96','16 ← 15, 16'],['13','7','91','23'],['14','5','70','28'],['15','2','30','30'],{c:['Total','30','372','—'],tot:1}],[3])+`<p>n = 30 → positions 15 and 16 → both 12. x̄ = 372 / 30 = <b>12.4</b> · MD = <b>12</b> · mode = <b>12</b>.</p>`},
 {t:'check',q:'An ungrouped table has 5 rows and n = 45. Σxf = 317. The mean is…',o:['63.4','7.04','317','9'],a:1,e:'317 / 45 = 7.04. Dividing by 5 rows lost someone the mark in 2024.'},
 {t:'prob',id:'P4'},{t:'prob',id:'HW42'}]},
{id:'grp',n:'3',name:'Grouped tables',sub:'the big one',steps:[
 {t:'learn',k:'Learn',h:'Build one big table',b:`<p>Exact values are gone, so everyone in a class "sits" at its <b>midpoint m</b>.</p>`+T([['limits','boundaries','f','m','m·f','CF'],['given','∓ 0.5','given','(low+up)/2','m × f','running'],{c:['Total','—','n','—','Σmf','last = n'],tot:1}])+`<div class="formula"><span class="lab">mean</span>x̄ = ${F('Σ m·f','n')}</div>`+chip('W','Lower limit to the next lower limit: 26 − 21 = <b>5</b>, never 25 − 21.','ice')},
 {t:'learn',k:'Learn',h:'Median: walk into the class',b:`<div class="formula"><span class="lab">grouped median</span>MD = <span class="g">L</span> + ${F(F('n','2')+' − F₁','F₂ − F₁')} × W</div><div class="facts"><div class="fact"><b>Median class</b> = first CF that <b>reaches</b> n/2</div><div class="fact"><span class="g">L</span> = its lower <b>boundary</b></div><div class="fact">F₂ = its CF · F₁ = the CF before it</div></div><p>You've passed F₁ people already. You need n/2 − F₁ more, out of F₂ − F₁ inside, so you walk that fraction of W.</p>`},
 {t:'toy',k:'Watch',h:'Walk to the median',toy:'walk',b:`<p>Book Ex. 7: 20 runners, n/2 = 10.</p>`},
 {t:'learn',k:'Learn',h:'Mode: lean to the taller side',b:`<div class="formula"><span class="lab">grouped mode</span>Mode = <span class="g">L</span> + ${F('Δ₁','Δ₁ + Δ₂')} × W</div><div class="facts"><div class="fact"><b>Modal class</b> = the biggest f (a different rule from the median class!)</div><div class="fact">Δ₁ = f − f<sub>before</sub> · Δ₂ = f − f<sub>after</sub></div></div>`},
 {t:'toy',k:'Play',h:'Move the neighbors',toy:'lean',b:`<p>The mode leans toward whichever neighbor is taller.</p>`},
 {t:'learn',k:'Rule',h:'Two special cases',b:chip('Prof','If the biggest f is in the <b>first or last</b> class, the mode <b>does not exist</b>.','ice')+chip('Bimodal','Two classes tie for the biggest f → compute the formula for <b>each</b>. Your Assignment 4, Ex 3 is exactly this.')+chip('Top slips','L = 21 instead of 20.5 · W = 4 instead of 5 · picking CF = 9 when n/2 = 10','bad')},
 {t:'check',q:'n/2 = 10. CF column: 1, 3, 6, 11, 15… Which class is the median class?',o:['The one with CF 6','The one with CF 11','The one with the biggest f','The middle row'],a:1,e:'The first CF that reaches 10 is 11.'},
 {t:'prob',id:'P5'},{t:'prob',id:'P6'},{t:'prob',id:'HW43'}]},
{id:'spr',n:'4',name:'Spread',sub:'range · s² · s',steps:[
 {t:'toy',k:'Play',h:'Same mean, different vibe',toy:'beamB',b:`<p>Two paint brands both last <b>35 months</b> on average. Flip between them and watch the green ±1 SD band.</p>`},
 {t:'learn',k:'Learn',h:'Range',b:`<div class="formula"><span class="lab">range</span>R = X<sub>max</sub> − X<sub>min</sub></div><div class="facts"><div class="fact">Not a typical measure: it uses <b>only two values</b></div><div class="fact">It's <b>affected by outliers</b></div><div class="fact">Grouped: last upper boundary − first lower boundary</div></div>`},
 {t:'learn',k:'Learn',h:'Variance',b:`<p>Square every distance from the mean, then average. We square because the deviations <b>always add up to 0</b>.</p><div class="formula"><span class="lab">sample · population</span>s² = ${F('Σ(x − x̄)²','n − 1')} &nbsp; σ² = ${F('Σ(X − μ)²','N')}</div><div class="formula" style="background:var(--gold-soft)"><span class="lab">the shortcut you'll actually use</span>s² = ${F('Σx² − n·x̄²','n − 1')}</div>`+chip('Say it','Squares, minus n times mean squared, over n minus one.')},
 {t:'learn',k:'Learn',h:'Standard deviation',b:`<div class="formula"><span class="lab">undo the square</span>s = √s² &nbsp; σ = √σ²</div><p>Back in the <b>original units</b>. Small → values hug the mean.</p>`+chip('Prof','Written questions: <b>sample</b> formulas only. True/false can ask about the population ones.','ice')},
 {t:'check',q:'Why do we square the deviations?',o:['To make the numbers bigger','Because they always add up to zero','Because the prof likes squares','To get the median'],a:1,e:'Positive and negative deviations cancel out.'},
 {t:'prob',id:'P7'},{t:'prob',id:'P8'}]},
{id:'cv',n:'5',name:'Tables + CV',sub:'Σx²f · Σm²f · CV',steps:[
 {t:'learn',k:'Learn',h:'Same formula, new clothes',b:T([['','raw','ungrouped','grouped'],['mean','Σx/n','Σxf/n','Σmf/n'],['s²','Σx² − nx̄²','Σx²f − nx̄²','Σm²f − nx̄²'],['÷','n − 1','n − 1','n − 1'],['range','max − min','max − min','last UB − first LB']],[2])+chip('Fast','m²·f = m × (m·f). You already have m·f.')},
 {t:'learn',k:'Learn',h:'Coefficient of variation',b:`<div class="formula"><span class="lab">sample · population</span>CV = ${F('s','x̄')} × 100% &nbsp; ${F('σ','μ')} × 100%</div><p>It compares spread across <b>different units</b>. <b>Bigger CV = more variable.</b> Finish with a sentence: "Since CV₁ &lt; CV₂, the first is less variable."</p>`+chip('Units','s² → units² · CV → % · everything else → the data\'s units','bad')},
 {t:'check',q:'Car sales CV = 5.7%, commissions CV = 14.8%. Which varies more?',o:['Car sales','Commissions','Same','Can\'t tell'],a:1,e:'The bigger CV is the more variable one.'},
 {t:'prob',id:'P9'},{t:'prob',id:'P10'},{t:'prob',id:'P11'},{t:'prob',id:'HW51'},{t:'prob',id:'HW52'},{t:'prob',id:'HW53'}]},
{id:'boss',n:'★',name:'Boss fight',sub:'all 7 measures',boss:1,steps:[{t:'learn',k:'Boss',h:'The full chain',b:`<p>One grouped table, all seven measures, midterm style. <b>No hints.</b> Double XP.</p>`+chip('Paper','limits → boundaries → f → m → m·f → m²·f → CF')},{t:'prob',id:'BOSS'}]},
{id:'drill',n:'⚡',name:'Exam drill',sub:'Exercises 4 + 5',steps:[{t:'learn',k:'Drill',h:'The prof\'s own questions',b:`<p>23 true/false and multiple-choice questions from the end of Lectures 4 and 5. His exam questions look like these "with some changes."</p>`},{t:'deck',key:'drill'}]},
{id:'throw',n:'↺',name:'Throwback',sub:'L1 · L2 · L3 · L6',steps:[{t:'learn',k:'Recall',h:'Don\'t forget us',b:`<p>Mixed questions from the other lectures, with no labels. Exactly like the midterm.</p>`},{t:'deck',key:'throw'}]}
];

/* ---------- v3: worlds, emblems, cover screens ---------- */
const WORLD={warm:'#6FD3FF',avg:'#FFB224',ung:'#FF7A66',grp:'#5BE49B',spr:'#FF6F9C',cv:'#36D6C8',boss:'#FF5C5C',drill:'#C8F04C',throw:'#FFD166'};
const ARTS={
 warm:'<path d="M37 5 14 36h16l-4 23 24-33H34z" fill="currentColor" fill-opacity=".2"/>',
 avg:'<path d="M7 33h50"/><path d="M32 33 22 55h20z" fill="currentColor" fill-opacity=".2"/><circle cx="13" cy="26" r="4.5"/><circle cx="23" cy="26" r="4.5"/><circle cx="41" cy="26" r="4.5"/><circle cx="51" cy="26" r="4.5"/>',
 ung:'<rect x="8" y="9" width="48" height="46" rx="9" fill="currentColor" fill-opacity=".12"/><path d="M8 24h48M8 39h48M27 9v46"/><path d="M34 16.5h15M34 31.5h10M34 46.5h6"/>',
 grp:'<rect x="7" y="34" width="11" height="21" rx="3" fill="currentColor" fill-opacity=".2"/><rect x="20" y="19" width="11" height="36" rx="3" fill="currentColor" fill-opacity=".2"/><rect x="33" y="8" width="11" height="47" rx="3" fill="currentColor" fill-opacity=".2"/><rect x="46" y="26" width="11" height="29" rx="3" fill="currentColor" fill-opacity=".2"/>',
 spr:'<path d="M8 22h48M15 14l-7 8 7 8M49 14l7 8-7 8"/><path d="M8 42v14M56 42v14M8 49h48"/><path d="M20 49v-5M32 49v-8M44 49v-5"/>',
 cv:'<circle cx="19" cy="19" r="9" fill="currentColor" fill-opacity=".2"/><circle cx="45" cy="45" r="9" fill="currentColor" fill-opacity=".2"/><path d="M50 10 14 54"/>',
 boss:'<path d="M8 47 12 17l13 14 7-20 7 20 13-14 4 30z" fill="currentColor" fill-opacity=".2"/><path d="M10 56h44"/>',
 drill:'<circle cx="30" cy="34" r="22"/><circle cx="30" cy="34" r="12"/><circle cx="30" cy="34" r="3" fill="currentColor"/><path d="M32 32 54 10M46 8h10v10"/>',
 throw:'<path d="M12 28A21 21 0 1 1 18 48"/><path d="M12 12v16h16"/>'
};
const ARTSVG=id=>`<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ARTS[id]||''}</svg>`;
const LOCK='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="13" y="28" width="38" height="28" rx="8"/><path d="M21 28v-7a11 11 0 0 1 22 0v7"/><circle cx="32" cy="42" r="3" fill="currentColor"/></svg>';
function setWorld(id){rootEl.style.setProperty('--wh',id?WORLD[id]:'#FFB224')}
L.forEach(l=>l.steps.unshift({t:'cover'}));
function coverCard(card,lv){const n=lv.steps.length-1,lab=lv.boss?'Boss level':/\d/.test(lv.n)?'Level '+String(lv.n).padStart(2,'0'):'Bonus level';
 const G=['σ','x̄','Σ','s²','%','CV','n','√'],X=[7,84,14,78,5,86,26,70],Y=[7,12,76,66,40,50,90,92];
 card.innerHTML=G.map((g,i)=>`<span class="gl" style="left:${X[i]}%;top:${Y[i]}%;animation-delay:${-i*1.3}s">${g}</span>`).join('')+
 `<div class="art"><div class="orbit"><i></i></div><div class="orbit o2"><i></i></div>${ARTSVG(lv.id)}</div><p class="num">${lab}</p><h2>${lv.name}</h2><p class="sub">${lv.sub}</p><div class="meta"><span>${n} cards</span><span>${lv.boss?'double XP':'up to 3 stars'}</span></div>`}

/* ---------- map ---------- */
const POS=[50,76,24,72,28,74,50,26,74];
function unlocked(i){return unlockAll||i===0||!!done[L[i-1].id]}
function renderMap(){
 const map=$('#map');
 // real pixel space, so road strokes and lane dashes aren't distorted by a non-uniform viewBox
 const W=map.clientWidth||360,gap=138,H=L.length*gap+26;
 map.style.height=H+'px';
 const pts=L.map((l,i)=>[Math.round(W*POS[i]/100),76+i*gap]);
 let d=`M ${pts[0][0]} ${pts[0][1]}`;
 for(let i=1;i<pts.length;i++){const[a,b]=pts[i-1],[c,e]=pts[i];d+=` C ${a} ${b+gap*.55}, ${c} ${e-gap*.55}, ${c} ${e}`}
 let lastDone=-1;L.forEach((l,i)=>{if(done[l.id])lastDone=i});
 const curIdx=L.findIndex((l,i)=>!done[l.id]&&unlocked(i));
 // the level you haven't reached yet owns the road ahead of you
 let html=`<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
  <path class="road-kerb" d="${d}"/>
  <path class="road-bed" d="${d}"/>
  <path class="road-lane" d="${d}"/>
  <path id="prog" class="road-pave" d="${d}"/>
  <path id="progLane" class="road-pave-lane" d="${d}"/>
 </svg>`;
 // one faint glyph per level, parked on the side the node isn't using
 const GLYPH=['x̄','σ','Σ','s²','%','n','CV','√','μ'];
 L.forEach((l,i)=>{
   const side=POS[i]>56?'left':POS[i]<44?'right':(i%2?'right':'left');
   html+=`<span class="gl" style="--s:${side};top:${pts[i][1]+gap*.5}px;animation-delay:${-i*1.7}s">${GLYPH[i%GLYPH.length]}</span>`;
 });
 L.forEach((l,i)=>{
  const st=done[l.id]?.stars||0,cls=done[l.id]?'won':(i===curIdx?'cur':(unlocked(i)?'':'lock'));
  html+=`<button class="node ${cls}${l.boss?' boss':''}" data-i="${i}" style="--wh:${WORLD[l.id]};left:${pts[i][0]}px;top:${pts[i][1]}px"${unlocked(i)?'':' aria-disabled="true"'}>
   <span class="orb">${unlocked(i)?ARTSVG(l.id):LOCK}<i class="no">${l.n}</i></span>
   ${i===curIdx?'<span class="flag">GO</span>':''}
   <span class="tag"><span class="nm">${l.name}</span><span class="sb">${l.sub}</span></span>
   <span class="stars">${done[l.id]?[1,2,3].map(k=>`<span class="${k<=st?'':'off'}">★</span>`).join(''):''}</span>
  </button>`});
 map.innerHTML=html;
 const pr=$('#prog'),pl=$('#progLane');
 // pave up to the level you're standing at, so the road behind you is always lit
 const upTo=curIdx>=0?curIdx:L.length-1;
 try{const len=pr.getTotalLength(),seg=upTo/(L.length-1);
   [pr,pl].forEach(p=>{p.style.strokeDasharray=len;p.style.strokeDashoffset=len});
   requestAnimationFrame(()=>{[pr,pl].forEach(p=>{p.style.transition='stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)';p.style.strokeDashoffset=len*(1-seg)})})}catch(e){}
 $$('.node').forEach(n=>n.onclick=()=>{const i=+n.dataset.i;if(!unlocked(i)){sfx.bad();n.querySelector('.orb').animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:300});toast('Clear the previous level first');return}sfx.coin();openLevel(i)});
 const ndone=L.filter(l=>done[l.id]).length,stars=L.reduce((a,l)=>a+(done[l.id]?.stars||0),0);
 $('#starsT').textContent=stars;$('#campPct').textContent=Math.round(ndone/L.length*100)+'%';setTimeout(()=>$('#campBar').style.width=(ndone/L.length*100)+'%',60)}
renderMap();

/* ---------- stage ---------- */
let LV=0,SI=0,SES=null;
function openLevel(i){LV=i;SI=0;SES={ok:0,tot:0,xp0:XP,att:{}};$('#mapv').hidden=true;$('#stagev').hidden=false;$('#abar').hidden=false;scrollTo(0,0);
 setWorld(L[i].id);$('#sEmb').innerHTML=ARTSVG(L[i].id);
 $('#sLvl').textContent=L[i].boss?'Boss level':(L[i].n.match(/\d/)?'Level '+L[i].n:L[i].name);$('#sName').textContent=L[i].name;
 $('#segs').innerHTML=L[i].steps.slice(1).map(()=>'<i></i>').join('');renderStep(1)}
function toMap(){setWorld(null);$('#stagev').hidden=true;$('#abar').hidden=true;$('#mapv').hidden=false;$('#fin').hidden=true;renderMap();scrollTo(0,0)}
$('#tomap').onclick=()=>{sfx.tap();toMap()};
function segs(){const c=SI-1;$$('#segs i').forEach((s,k)=>{s.className=k<c?'on':k===c?'now':''})}
function renderStep(dir){const st=L[LV].steps[SI],host=$('#cardhost');segs();
 const card=document.createElement('section');card.className='card '+(dir>0?'pre':'back');
 const nx=$('#next'),sk=$('#skip');sk.hidden=true;nx.disabled=false;nx.textContent=SI===L[LV].steps.length-1?'Finish level':'Continue';$('#prev').disabled=SI===0;
 if(st.t==='cover'){card.classList.add('cover');coverCard(card,L[LV]);nx.textContent='Start level'}
 else if(st.t==='learn'||st.t==='toy'){card.innerHTML=`<span class="kind"><span class="dot"></span>${st.k}</span><h2>${st.h}</h2>${st.b}${st.t==='toy'?'<div class="toy" id="toyhost"></div>':''}`}
 else if(st.t==='check'){card.innerHTML=`<span class="kind check"><span class="dot"></span>Quick check</span><p class="dq">${st.q}</p><div class="opts">${st.o.map((o,j)=>`<button class="opt" data-j="${j}"><span class="key">${'ABCD'[j]}</span>${o}</button>`).join('')}</div><p class="expl"></p>`;const key='c'+LV+'_'+SI;if(!SES.att[key])nx.disabled=true}
 else if(st.t==='prob'){renderProb(card,st.id);if(!SES.att[st.id]&&!solved[st.id]){nx.disabled=true;sk.hidden=false}}
 else if(st.t==='deck'){renderDeck(card,st.key);if(!SES.att['d'+st.key])nx.disabled=true}
 host.innerHTML='';host.appendChild(card);
 if(st.t==='check')wireCheck(card,st,'c'+LV+'_'+SI);
 if(st.t==='toy')TOYS[st.toy]($('#toyhost'));
 requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.remove('pre','back')));scrollTo({top:0,behavior:RM?'auto':'smooth'})}
$('#next').onclick=()=>{if(SI<L[LV].steps.length-1){SI++;sfx.swipe();renderStep(1)}else complete()};
$('#prev').onclick=()=>{if(SI>0){SI--;sfx.swipe();renderStep(-1)}};
$('#skip').onclick=()=>{const st=L[LV].steps[SI];if(!st||st.t!=='prob'||!P[st.id])return;
 slip(`Skipped "${P[st.id].title}" without trying`);SES.att[st.id]=1;SES.tot+=P[st.id].f.length;$('#next').disabled=false;$('#skip').hidden=true;toast('Skipped. It\'s in your report.')};
function attempt(key){SES.att[key]=1;$('#next').disabled=false;$('#skip').hidden=true}

function wireCheck(card,st,key){card.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const j=+b.dataset.j,ok=j===st.a;card.querySelectorAll('.opt').forEach(x=>{x.disabled=true;const k=+x.dataset.j;if(k===st.a)x.classList.add('r');else if(k===j)x.classList.add('w')});
 if(!SES.att[key]){SES.tot++;if(ok){SES.ok++;addXP(10,b)}else slip(`Quick check "${st.q}" → picked "${st.o[j]}"`)}
 card.querySelector('.expl').innerHTML=(ok?'<b style="color:var(--good)">Right.</b> ':'<b style="color:var(--bad)">Not quite.</b> ')+st.e;ok?(sfx.good(1),burstEl(b,16,.6),buzz(10)):(sfx.bad(),buzz([25,30,25]));attempt(key)})}

function renderProb(card,id){const o=P[id],kind=o.boss?'boss':o.hw?'':'solo',lab=o.boss?'Boss · double XP':o.hw?'Your assignment':'Solo';
 card.innerHTML=`<span class="kind ${kind}"><span class="dot"></span>${lab}</span><h2>${o.title}</h2>${o.q}<div class="fields">${o.f.map((f,i)=>`<div class="field"><label for="${id}_${i}">${f.l}</label>${f.o?`<select id="${id}_${i}"><option value="">choose…</option>${f.o.map(x=>`<option>${x}</option>`).join('')}</select>`:`<input id="${id}_${i}" inputmode="decimal" autocomplete="off" placeholder="?">`}<span class="mk"></span></div>`).join('')}</div>
 <div class="prow"><button class="btn sm" data-a="chk">Check</button>${o.hint&&!o.boss?'<button class="btn sec sm" data-a="hint">Hint · −5 XP</button>':''}<button class="btn sec sm" data-a="sol"${solved[id]?'':' disabled'}>${solved[id]?'Solution':'Solution 🔒'}</button><span class="pst"></span></div><div class="hint" hidden>${o.hint||''}</div><div class="sol" hidden>${o.sol}</div>`;
 if(solved[id])card.insertAdjacentHTML('afterbegin','<span class="stampc">CLEARED</span>');
 const tries={};let firstDone=false;
 o.f.forEach((f,i)=>{const el=card.querySelector('#'+id+'_'+i),k='in:'+id+'_'+i,v=store.get(k,'');if(v)el.value=v;el.addEventListener('input',()=>{store.set(k,el.value);const fd=el.closest('.field');fd.classList.remove('ok','no');fd.querySelector('.mk').textContent=''});el.addEventListener('keydown',e=>{if(e.key==='Enter')card.querySelector('[data-a=chk]').click()})});
 card.querySelector('[data-a=chk]').onclick=e=>{let ok=0,blank=0,gain=0;
  o.f.forEach((f,i)=>{const el=card.querySelector('#'+id+'_'+i),fd=el.closest('.field'),mk=fd.querySelector('.mk');fd.classList.remove('ok','no');void fd.offsetWidth;const raw=el.value.trim();if(!raw){blank++;return}
   let good=f.o?raw===f.a:(()=>{const v=parse(raw);return v!==null&&!Number.isNaN(v)&&near(v,f.a)})();tries[i]=(tries[i]||0)+1;
   if(good){ok++;fd.classList.add('ok');mk.innerHTML='<span style="color:var(--good)">✓</span>';if(!fd.dataset.paid){fd.dataset.paid=1;gain+=(tries[i]===1?10:4)*(o.boss?2:1)}}
   else{fd.classList.add('no');mk.innerHTML='<span style="color:var(--bad)">✗</span>';if(tries[i]===1)slip(`${o.title} → ${f.l}: typed "${raw}", correct ${f.s||fmt(f.a)}`)}
   if(tries[i]===1&&!SES.att[id+'_'+i]){SES.att[id+'_'+i]=1;SES.tot++;if(good)SES.ok++}});
  const pst=card.querySelector('.pst');if(blank===o.f.length){pst.textContent='Type something first';sfx.tap();return}
  pst.textContent=`${ok}/${o.f.length} right`;const sb=card.querySelector('[data-a=sol]');sb.disabled=false;sb.textContent='Solution';attempt(id);if(gain)addXP(gain,e.target);
  if(ok===o.f.length){o.boss?sfx.boss():sfx.clear();burstEl(card,o.boss?120:50,o.boss?1.4:1);if(o.boss)rain(200);buzz([15,30,15]);if(!solved[id]){solved[id]=1;store.set('solved',solved)}if(!card.querySelector('.stampc'))card.insertAdjacentHTML('afterbegin','<span class="stampc">CLEARED</span>')}
  else if(ok)sfx.good(ok);else sfx.bad()};
 const hb=card.querySelector('[data-a=hint]');if(hb)hb.onclick=()=>{const h=card.querySelector('.hint');if(h.hidden){h.hidden=false;addXP(-5);slip(`${o.title} → used the hint`);sfx.tap()}};
 card.querySelector('[data-a=sol]').onclick=()=>{const s=card.querySelector('.sol');s.hidden=!s.hidden;sfx.tap()}}

function renderDeck(card,key){const Q=DECKS[key];let order=shuffle([...Q.keys()]),i=0,score=0,streak=0;
 function draw(){const q=Q[order[i]];card.innerHTML=`<div class="dtop"><span>${i+1} / ${Q.length}</span><span>${score} pts${streak>=3?` <span class="combo">· ×${streak} combo</span>`:''}</span></div><div class="track"><i style="width:${i/Q.length*100}%"></i></div><p class="dq">${q.q}</p><div class="opts">${q.o.map((x,j)=>`<button class="opt" data-j="${j}"><span class="key">${'ABCD'[j]}</span>${x}</button>`).join('')}</div><p class="expl"></p>`;
  card.querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.j,b))}
 function pick(j,b){const q=Q[order[i]],ok=j===q.a;card.querySelectorAll('.opt').forEach(x=>{x.disabled=true;const k=+x.dataset.j;if(k===q.a)x.classList.add('r');else if(k===j)x.classList.add('w')});SES.tot++;
  if(ok){SES.ok++;score++;streak++;sfx.good(streak);addXP(5,b);if(streak>=3)burstEl(b,20,.7);buzz(8)}else{streak=0;sfx.bad();buzz([25,30,25]);slip(`"${q.q}" → picked "${q.o[j]}", correct "${q.o[q.a]}"`)}
  card.querySelector('.expl').innerHTML=(ok?'<b style="color:var(--good)">Yes.</b> ':'<b style="color:var(--bad)">Nope.</b> ')+q.e;
  const nb=document.createElement('button');nb.className='btn sm';nb.textContent=i===Q.length-1?'See score':'Next question';nb.onclick=()=>{sfx.swipe();i++;if(i<Q.length)draw();else end()};card.appendChild(nb)}
 function end(){card.innerHTML=`<span class="kind check"><span class="dot"></span>Round over</span><p class="pixel" style="font-size:clamp(3.4rem,16vw,5rem);line-height:1;color:var(--gold)">${score}/${Q.length}</p><p>${score/Q.length>=.85?'Clean. Hit Finish level below.':score/Q.length>=.6?'Decent. Check the misses in your report later.':'These come back fast. Run it again tomorrow morning.'}</p><button class="btn sec sm" id="again">Run it again</button>`;$('#again').onclick=()=>{sfx.tap();order=shuffle([...Q.keys()]);i=0;score=0;streak=0;draw()};attempt('d'+key);sfx.coin()}
 draw()}

/* ---------- level complete ---------- */
function complete(){const lv=L[LV],acc=SES.tot?SES.ok/SES.tot:1,stars=acc>=.9?3:acc>=.65?2:1,prev=done[lv.id]?.stars||0,bonus=lv.boss?100*stars:40*stars;
 done[lv.id]={stars:Math.max(prev,stars)};store.set('done',done);addXP(bonus);const gained=XP-SES.xp0;
 const nextI=LV+1<L.length?LV+1:-1,d=$('#fin');
 d.innerHTML=`<div class="fin-in"><div class="rays"></div><div class="medal"><svg viewBox="0 0 150 150" width="150" height="150" aria-hidden="true"><defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--w2)"/><stop offset="1" stop-color="var(--w)"/></linearGradient></defs><circle cx="75" cy="75" r="71" fill="url(#mg)"/><circle cx="75" cy="75" r="57" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round"/><circle cx="75" cy="75" r="71" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="3"/><g transform="translate(41 41) scale(1.06)" style="color:#1A1206" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${ARTS[lv.id]||''}</g></svg></div>
 <p class="clear">${lv.boss?'BOSS DOWN':'LEVEL CLEAR'}</p><p class="muted">${lv.name}</p><div class="bigstars">${[1,2,3].map(()=>'<span>★</span>').join('')}</div>
 <div class="dstats"><div><small>Accuracy</small><b id="dAcc">0</b><b>%</b></div><div><small>XP earned</small><b id="dXp">0</b></div></div>
 <div class="dbtns">${nextI>=0?`<button class="btn" id="dNext">Next level · ${L[nextI].name}</button>`:''}<button class="btn sec" id="dMap">Back to map</button>${stars<3?'<button class="btn ghost" id="dRe">Replay for 3 stars</button>':''}</div></div>`;
 d.hidden=false;$('#abar').hidden=true;lv.boss?sfx.boss():sfx.clear();rain(lv.boss?260:160);buzz([20,40,20,40,80]);
 setTimeout(()=>{countUp($('#dAcc'),0,Math.round(acc*100),900);countUp($('#dXp'),0,gained,1100)},400);
 $$('.bigstars span').forEach((s,k)=>{if(k<stars)setTimeout(()=>{s.classList.add('on');sfx.star(k);burstEl(s,24,.7)},800+k*380)});
 if(nextI>=0)$('#dNext').onclick=()=>{d.hidden=true;sfx.coin();openLevel(nextI)};
 $('#dMap').onclick=()=>{sfx.tap();toMap()};if($('#dRe'))$('#dRe').onclick=()=>{d.hidden=true;openLevel(LV)}}

/* ---------- toys ---------- */
const TOYS={
beamA:h=>beam(h,{lo:0,hi:100,tick:10,sets:{Reset:[12,18,20,22,25,25,30,34],'Add a billionaire':[12,18,20,22,25,25,30,96]},start:'Reset',egg:1}),
beamB:h=>beam(h,{lo:0,hi:70,tick:10,sets:{'Brand A':[10,60,50,30,40,20],'Brand B':[35,45,30,35,40,25]},start:'Brand A'}),
walk:h=>walk(h),lean:h=>lean(h)};
function beam(host,o){host.innerHTML=`<div class="tbtns">${Object.keys(o.sets).map(k=>`<button class="btn sec sm" data-k="${k}">${k}</button>`).join('')}</div><svg viewBox="0 0 400 190"></svg><div class="stats"></div>`;
 const svg=host.querySelector('svg'),stE=host.querySelector('.stats'),X0=18,X1=382,sx=v=>X0+(v-o.lo)/(o.hi-o.lo)*(X1-X0),vx=p=>o.lo+(p-X0)/(X1-X0)*(o.hi-o.lo);let data=o.sets[o.start].slice(),drag=-1,lastS={};
 function S_(d){const n=d.length,m=d.reduce((a,b)=>a+b,0)/n,s=[...d].sort((a,b)=>a-b),md=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2,v=d.reduce((a,b)=>a+(b-m)**2,0)/(n-1);return{m,md,R:s[n-1]-s[0],v,s:Math.sqrt(v)}}
 function draw(){const st=S_(data);let g='';const a=Math.max(X0-10,sx(st.m-st.s)),b=Math.min(X1+10,sx(st.m+st.s));
  g+=`<rect x="${a}" y="38" width="${b-a}" height="86" rx="12" fill="var(--good)" opacity=".12"/><line x1="${X0}" y1="124" x2="${X1}" y2="124" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round"/>`;
  for(let t=o.lo;t<=o.hi;t+=o.tick)g+=`<text x="${sx(t)}" y="150" text-anchor="middle" font-family="Geist Mono,monospace" font-size="11" fill="var(--ink-3)">${t}</text>`;
  g+=`<line x1="${sx(st.md)}" y1="30" x2="${sx(st.md)}" y2="124" stroke="var(--ice)" stroke-width="2.5" stroke-dasharray="5 5"/><line x1="${sx(st.m)}" y1="24" x2="${sx(st.m)}" y2="124" stroke="var(--gold)" stroke-width="3"/><polygon points="${sx(st.m)},128 ${sx(st.m)-13},152 ${sx(st.m)+13},152" fill="var(--gold)"/><text x="${sx(st.m)}" y="17" text-anchor="middle" font-family="Geist Pixel,monospace" font-size="14" fill="var(--gold)">x̄</text>`;
  const stk={};data.forEach((v,i)=>{const k=Math.round(sx(v)/20);stk[k]=(stk[k]||0)+1;g+=`<circle data-i="${i}" cx="${sx(v)}" cy="${110-(stk[k]-1)*22}" r="10" fill="var(--surf)" stroke="var(--ink)" stroke-width="2.5" style="cursor:grab"/>`});svg.innerHTML=g;
  const vals={m:fmt(st.m,1),md:fmt(st.md,1),R:fmt(st.R,0),v:fmt(st.v,1),s:fmt(st.s,1)};
  stE.innerHTML=`<div class="st m"><small>mean</small><b>${vals.m}</b></div><div class="st md"><small>median</small><b>${vals.md}</b></div><div class="st"><small>range</small><b>${vals.R}</b></div><div class="st"><small>s²</small><b>${vals.v}</b></div><div class="st s"><small>SD</small><b>${vals.s}</b></div><div class="st"><small>n</small><b>${data.length}</b></div>`;
  if(o.egg&&drag>=0&&st.s>0&&data.some(v=>Math.abs(v-st.m)>2.2*st.s))egg('outlier')}
 const pt=e=>{const r=svg.getBoundingClientRect();return(e.clientX-r.left)/r.width*400};
 svg.addEventListener('pointerdown',e=>{const c=e.target.closest('circle[data-i]');if(!c)return;drag=+c.dataset.i;svg.setPointerCapture(e.pointerId);sfx.pluck(600)});
 svg.addEventListener('pointermove',e=>{if(drag<0)return;let v=Math.max(o.lo,Math.min(o.hi,Math.round(vx(pt(e)))));if(v!==data[drag]){data[drag]=v;draw();if(Math.random()<.3)sfx.pluck(300+v*5)}});
 svg.addEventListener('pointerup',()=>drag=-1);
 host.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{data=o.sets[b.dataset.k].slice();draw();sfx.coin()});draw()}
function walk(host){host.innerHTML=`<button class="btn sm" id="wb">▶ Walk to the median</button><svg viewBox="0 0 400 200"></svg><p class="mono muted" id="wt" style="font-size:.9rem">n/2 = 10 → the 10th runner.</p>`;
 const svg=host.querySelector('svg'),f=[1,2,3,5,4,3,2],lab=['6–10','11–15','16–20','21–25','26–30','31–35','36–40'],cf=[1,3,6,11,15,18,20],X0=14,u=372/20;
 function base(p=-1){let g='',x=X0;f.forEach((v,i)=>{const w=v*u,on=p>=0&&i===3;g+=`<rect x="${x+1}" y="62" width="${w-2}" height="52" rx="8" fill="${on?'var(--gold-soft)':'var(--surf-2)'}" stroke="${on?'var(--gold)':'var(--line-2)'}" stroke-width="1.5"/><text x="${x+w/2}" y="93" text-anchor="middle" font-family="Geist Pixel,monospace" font-size="14" fill="var(--ink)">${v}</text>${(w>=50||on)?`<text x="${x+w/2}" y="134" text-anchor="middle" font-family="Geist Mono,monospace" font-size="10" fill="${on?'var(--gold)':'var(--ink-3)'}">${lab[i]}</text>`:''}<text x="${x+w}" y="52" text-anchor="middle" font-family="Geist Mono,monospace" font-size="11" fill="var(--ice)">${cf[i]}</text>`;x+=w});
  const t=X0+10*u;g+=`<line x1="${t}" y1="40" x2="${t}" y2="122" stroke="var(--gold)" stroke-width="2.5" stroke-dasharray="4 4"/><text x="${t}" y="178" text-anchor="middle" font-family="Geist Pixel,monospace" font-size="13" fill="var(--gold)">n/2 = 10</text><text x="${X0}" y="26" font-family="Geist Mono,monospace" font-size="10" fill="var(--ice)">CF</text>`;
  if(p>=0)g+=`<circle cx="${X0+p*u}" cy="88" r="8" fill="var(--gold)"/>`;svg.innerHTML=g}
 base();let busy=0;host.querySelector('#wb').onclick=()=>{if(busy)return;busy=1;const t0=performance.now(),dur=RM?1:2600;let last=-1;
  (function fr(t){const k=Math.min(1,(t-t0)/dur),p=10*(1-Math.pow(1-k,2.2));base(p);const ip=Math.floor(p);if(ip!==last){last=ip;sfx.pluck(420+ip*45)}
   host.querySelector('#wt').innerHTML=p<6?`Passed ${ip} runners…`:p<9.99?'Inside 21–25 (L = 20.5). Need 10 − 6 = 4 of its 5 runners…':'MD = 20.5 + (4/5) × 5 = <b style="color:var(--gold)">24.5 miles</b>';
   if(k<1)requestAnimationFrame(fr);else{busy=0;sfx.good(2);burstEl(svg,24,.7)}})(t0)}}
function lean(host){host.innerHTML=`<svg viewBox="0 0 400 230"></svg><label class="muted" style="font-size:.85rem">f before: <b class="mono" id="v1">3</b></label><input type="range" id="r1" min="0" max="8" step="1" value="3"><label class="muted" style="font-size:.85rem">f after: <b class="mono" id="v2">4</b></label><input type="range" id="r2" min="0" max="8" step="1" value="4"><p class="mono muted" id="lt" style="font-size:.9rem"></p>`;
 const svg=host.querySelector('svg');function draw(){const f1=+host.querySelector('#r1').value,f2=+host.querySelector('#r2').value,f=9;host.querySelector('#v1').textContent=f1;host.querySelector('#v2').textContent=f2;
  const W=120,X=140,sc=15,b=185;let g='';[[f1,X-W,'before'],[f,X,'modal'],[f2,X+W,'after']].forEach(([v,x,l],i)=>{g+=`<rect x="${x+2}" y="${b-v*sc}" width="${W-4}" height="${v*sc}" rx="8" fill="${i===1?'var(--gold-soft)':'var(--surf-2)'}" stroke="${i===1?'var(--gold)':'var(--line-2)'}" stroke-width="1.5"/><text x="${x+W/2}" y="${b-v*sc-8}" text-anchor="middle" font-family="Geist Pixel,monospace" font-size="13" fill="var(--ink)">${v}</text><text x="${x+W/2}" y="${b+18}" text-anchor="middle" font-family="Geist Mono,monospace" font-size="11" fill="var(--ink-3)">${l}</text>`});
  const d1=f-f1,d2=f-f2,fr=(d1+d2)?d1/(d1+d2):.5,mx=X+fr*W;g+=`<line x1="${mx}" y1="30" x2="${mx}" y2="${b}" stroke="var(--gold)" stroke-width="3"/><text x="${mx}" y="22" text-anchor="middle" font-family="Geist Pixel,monospace" font-size="13" fill="var(--gold)">mode</text><text x="${X}" y="${b+36}" text-anchor="middle" font-family="Geist Mono,monospace" font-size="11" fill="var(--ice)">L</text><text x="${X+W}" y="${b+36}" text-anchor="middle" font-family="Geist Mono,monospace" font-size="11" fill="var(--ice)">L + W</text>`;svg.innerHTML=g;
  host.querySelector('#lt').textContent=(d1+d2)?`Δ₁ = ${d1}, Δ₂ = ${d2} → ${fmt(fr,2)} of W. ${f1>f2?'Taller left → leans left.':f2>f1?'Taller right → leans right.':'Equal → center.'}`:'Neighbors equal the modal f.'}
 ['r1','r2'].forEach(i=>host.querySelector('#'+i).addEventListener('input',e=>{draw();sfx.pluck(300+(+e.target.value)*60)}));draw()}
