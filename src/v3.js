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
const rootEl=document.documentElement;
function setWorld(id){rootEl.style.setProperty('--wh',id?WORLD[id]:'#FFB224')}
L.forEach(l=>l.steps.unshift({t:'cover'}));
function coverCard(card,lv){const n=lv.steps.length-1,lab=lv.boss?'Boss level':/\d/.test(lv.n)?'Level '+String(lv.n).padStart(2,'0'):'Bonus level';
 const G=['σ','x̄','Σ','s²','%','CV','n','√'],X=[7,84,14,78,5,86,26,70],Y=[7,12,76,66,40,50,90,92];
 card.innerHTML=G.map((g,i)=>`<span class="gl" style="left:${X[i]}%;top:${Y[i]}%;animation-delay:${-i*1.3}s">${g}</span>`).join('')+
 `<div class="art"><div class="orbit"><i></i></div><div class="orbit o2"><i></i></div>${ARTSVG(lv.id)}</div><p class="num">${lab}</p><h2>${lv.name}</h2><p class="sub">${lv.sub}</p><div class="meta"><span>${n} cards</span><span>${lv.boss?'double XP':'up to 3 stars'}</span></div>`}
