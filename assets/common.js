const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],RM=matchMedia('(prefers-reduced-motion:reduce)').matches,fmt=n=>Math.floor(n).toLocaleString();

/* ---------- rangoli ornaments: precise geometry, drawn line by line ---------- */
const ORN=(()=>{
 const f=n=>n.toFixed(1),pol=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
 const P=(d,c)=>`<path pathLength="1"${c?` class="${c}"`:''} d="${d}"/>`;
 const C=(r,c)=>`<circle pathLength="1"${c?` class="${c}"`:''} r="${r}"/>`;
 const D=(x,y,r,c)=>`<circle class="${c||'dot'}" cx="${f(x)}" cy="${f(y)}" r="${r}"/>`;
 function petals(n,r0,r1,w,cls,off=0){let d='';for(let i=0;i<n;i++){const a=off+i*2*Math.PI/n,[x0,y0]=pol(r0,a),[x1,y1]=pol(r1,a),[ax,ay]=pol((r0+r1)/2,a-w),[bx,by]=pol((r0+r1)/2,a+w);
  d+=`M${f(x0)} ${f(y0)} Q${f(ax)} ${f(ay)} ${f(x1)} ${f(y1)} Q${f(bx)} ${f(by)} ${f(x0)} ${f(y0)} `}return P(d,cls)}
 function dots(n,r,s,c,off=0){let o='';for(let i=0;i<n;i++){const[x,y]=pol(r,off+i*2*Math.PI/n);o+=D(x,y,s,c)}return o}
 function scallop(n,r,h,cls){let d='';for(let i=0;i<=n;i++){const a=i*2*Math.PI/n,[x,y]=pol(r,a);if(!i){d+=`M${f(x)} ${f(y)} `;continue}const[cx,cy]=pol(r+h,a-Math.PI/n);d+=`Q${f(cx)} ${f(cy)} ${f(x)} ${f(y)} `}return P(d,cls)}
 function poly(n,r,cls,off=-Math.PI/2){let d='';for(let i=0;i<=n;i++){const[x,y]=pol(r,off+i*2*Math.PI/n);d+=(i?'L':'M')+f(x)+' '+f(y)+' '}return P(d,cls)}
 const frame=()=>C(198)+C(192)+scallop(48,192,8)+dots(48,184,1.6);
 const G={
  hero:()=>`<g class="spin">${frame()}${petals(24,120,176,.12)}${petals(24,124,168,.06,'m',Math.PI/24)}</g><g class="spin-r">${C(118)}${dots(36,110,1.8,'dotm')}${petals(16,80,108,.16)}</g>${C(78,'m')}${C(74)}`,
  stars:()=>{let o=frame();[150,128,106,84,62].forEach((r,i)=>{o+=`<g class="${i%2?'spin-r':'spin'}">${C(r)}${dots(10+i*4,r,i?1.5:2,i%2?'dotm':'dot',i)}</g>`});let a='';for(let i=0;i<8;i++){const t=i*Math.PI/4,[x,y]=pol(176,t),[x2,y2]=pol(158,t);a+=`M${f(x2)} ${f(y2)} L${f(x)} ${f(y)} `}return o+P(a,'s')},
  waves:()=>{let o=frame();for(let k=0;k<6;k++)o+=`<g class="${k%2?'spin':'spin-r'}">${scallop(16+k*4,60+k*20,10,k%3===1?'m':'')}</g>`;return o+C(54)+petals(8,20,52,.3,'m')},
  sound:()=>{let o=frame();for(let k=1;k<=7;k++){const r=28+k*20;[0,Math.PI].forEach((s,j)=>{const[x0,y0]=pol(r,s-.55),[x1,y1]=pol(r,s+.55);o+=P(`M${f(x0)} ${f(y0)} A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}`,k%2&&j?'m':'')})}return o+`<g class="spin">${petals(12,150,172,.1)}</g>`},
  rays:()=>{let o=frame(),d='';for(let i=0;i<72;i++){const a=i*Math.PI/36,[x0,y0]=pol(62,a),[x1,y1]=pol(i%2?150:120,a);d+=`M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)} `}return o+`<g class="spin">${P(d)}</g>`+P('M-150 0 Q0 -96 150 0 Q0 96 -150 0Z','m')+C(58)+C(44,'m')+dots(24,166,1.6,'dotm')},
  four:()=>{let o=frame()+'<g class="spin">';for(let q=0;q<4;q++){const a=q*Math.PI/2;o+=petals(1,40,170,.42,q%2?'m':'',a)+petals(1,60,140,.26,'',a)}return o+'</g>'+poly(4,120,'',Math.PI/4)+poly(4,120,'s',0)+C(38)+C(30,'m')+dots(4,92,4,'dotm',Math.PI/4)},
  wheel:()=>{let o=frame(),d='';for(let i=0;i<16;i++){const a=i*Math.PI/8,[x0,y0]=pol(36,a),[x1,y1]=pol(150,a);d+=`M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)} `}return o+`<g class="spin">${C(160)}${C(150,'m')}${P(d)}${dots(16,155,2.2,'dotm',Math.PI/16)}${petals(16,100,140,.08,'',Math.PI/16)}</g>`+C(36)+C(26,'m')},
  lotus:()=>frame()+`<g class="spin-r">${petals(32,150,178,.06)}</g>`+petals(16,60,150,.17)+petals(16,60,134,.17,'m',Math.PI/16)+petals(8,30,90,.3,'s')+C(20)+C(26)+C(32),
  spiral:()=>{let o=frame();[0,1].forEach(j=>{let d='';for(let t=0;t<=6*Math.PI;t+=.06){const[x,y]=pol(16+t*7.6,t+j*Math.PI);d+=(t?'L':'M')+f(x)+' '+f(y)+' '}o+=`<g class="spin">${P(d,j?'m':'')}</g>`});return o+dots(24,170,1.6,'dotm')},
  grid:()=>{let o=frame()+poly(4,150,'',Math.PI/4),d='',v='';for(let i=-3;i<=3;i++)d+=`M-106 ${i*30} L106 ${i*30} `;for(let i=-3;i<=3;i+=2)v+=`M${i*30} -106 L${i*30} 106 `;return o+P(d)+P(v,'m')+`<g class="spin-r">${dots(28,170,1.6)}</g>`+poly(4,176,'s',0)},
  door:()=>{let o=frame()+`<g class="spin-r">${petals(24,150,176,.1)}</g>`;o+=P('M-70 110 V-10 Q-70 -90 0 -104 Q70 -90 70 -10 V110','m')+P('M-52 110 V-6 Q-52 -70 0 -82 Q52 -70 52 -6 V110')+P('M-90 110 H90');return o+dots(12,128,2,'dotm')},
  rule:()=>P('M-200 0 H-30')+P('M30 0 H200')+petals(4,4,13,.5,'m')+D(-36,0,2,'dotm')+D(36,0,2,'dotm')
 };
 return {draw:(svg)=>{const k=svg.dataset.orn;if(G[k])svg.innerHTML=G[k]()},kinds:G};
})();

/* ---------- each page carries one word ---------- */
const PAGE=(()=>{const p=location.pathname.replace(/\/+$/,'/'),f=p.split('/').pop()||'index.html',inBlog=/\/blog\//.test(p);
 const M={'voice-avatar.html':['वाणी','vāṇī · speech','sound'],'admin-assistant.html':['दृष्टि','dṛṣṭi · sight','rays'],'pipeline.html':['लेखा','lekhā · record','grid'],
  'invoice-ai.html':['विवेक','viveka · discernment','lotus'],'voice-agent.html':['संवाद','saṃvāda · dialogue','spiral'],'work.html':['कर्म','karma · work','wheel'],
  'experience.html':['यात्रा','yātrā · journey','stars'],'contact.html':['अतिथि','atithi · guest','door'],'blog.html':['ज्ञान','jñāna · knowledge','four'],'faq.html':['प्रश्न','praśna · question','waves']};
 return inBlog?['ज्ञान','jñāna · knowledge','four']:M[f]||null})();

(function seal(){if(!PAGE)return;const sec=$('main>section');if(!sec)return;
 const d=document.createElement('div');d.className='pseal';d.setAttribute('aria-hidden','true');
 d.innerHTML=`<svg class="orn pre" data-orn="${PAGE[2]}" viewBox="-210 -210 420 420"></svg><div class="wd"><div><b>${PAGE[0]}</b><i>${PAGE[1].split(' · ')[0]}</i></div></div>`;
 if(sec.id==='ct'){d.classList.add('ctr');sec.insertBefore(d,sec.firstChild);return}
 const head=document.createElement('div');head.className='phead';const txt=document.createElement('div');txt.className='ptxt';
 const isHead=el=>el&&el.matches('.ttl,.sub,.ph1,.meta,p.m.u');
 sec.insertBefore(head,sec.firstChild);let n=head.nextElementSibling;
 while(n&&isHead(n)){const nx=n.nextElementSibling;txt.appendChild(n);n=nx}
 head.appendChild(txt);head.appendChild(d)})();

$$('svg[data-orn]').forEach(ORN.draw);
$$('svg.orn').forEach(s=>[...s.querySelectorAll('[pathLength]')].forEach((p,i)=>p.style.transitionDelay=Math.min(i*.07,2.4)+'s'));
$$('.word text').forEach(t=>{try{t.style.setProperty('--L',Math.ceil(t.getComputedTextLength()*6))}catch(e){}});

/* ---------- menu ---------- */
(function(){const b=$('.hb'),nav=$('#nav');if(!b||!nav)return;
 const set=o=>{document.body.classList.toggle('mo',o);b.setAttribute('aria-expanded',o);b.querySelector('.lb').textContent=o?'Close':'Menu';document.documentElement.style.overflow=o?'hidden':''};
 b.addEventListener('click',()=>set(!document.body.classList.contains('mo')));
 $$('#nav a').forEach(a=>a.addEventListener('click',()=>set(false)));
 addEventListener('keydown',e=>{if(e.key==='Escape')set(false)})})();

/* ---------- ready (after the preloader doors open) ---------- */
const ROOT=document.documentElement;
function whenReady(fn){if(ROOT.classList.contains('ready'))fn();else document.addEventListener('site:ready',fn,{once:true})}
setTimeout(()=>{if(!ROOT.classList.contains('ready')){ROOT.classList.add('ready');document.dispatchEvent(new Event('site:ready'))}},7000);

/* ---------- header: solid after scroll, hides going down, returns going up ---------- */
const top_=$('.top'),bar=$('#bar');let lastY=scrollY;
function prog(){const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;if(bar)bar.style.transform=`scaleX(${h>0?y/h:0})`;
 if(top_){top_.classList.toggle('solid',y>20);if(!document.body.classList.contains('mo'))top_.classList.toggle('away',y>lastY+4&&y>240);if(y<lastY-4||y<240)top_.classList.remove('away')}
 lastY=y;if(toTop)toTop.classList.toggle('on',y>innerHeight*.8);if(toTop&&ring)ring.style.strokeDashoffset=String(1-(h>0?y/h:0))}
const toTop=document.createElement('button');toTop.className='totop';toTop.type='button';toTop.setAttribute('aria-label','Back to top');
toTop.innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg><span>↑</span>';
document.body.appendChild(toTop);const ring=toTop.querySelector('circle');toTop.onclick=()=>scrollTo({top:0,behavior:RM?'auto':'smooth'});
addEventListener('scroll',prog,{passive:true});addEventListener('resize',prog);prog();

/* ---------- copy buttons ---------- */
$$('[data-copy]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const t=b.dataset.copy,lb=b.textContent;
 const done=()=>{b.textContent='Copied';setTimeout(()=>b.textContent=lb,1500)};
 if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,()=>{});}));

/* ---------- split headings into words that rise ---------- */
function splitWords(el){let i=0;const walk=node=>{[...node.childNodes].forEach(c=>{
  if(c.nodeType===3){if(!c.textContent.trim())return;const frag=document.createDocumentFragment();
   c.textContent.split(/(\s+)/).forEach(part=>{if(!part)return;if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return}
    const w=document.createElement('span');w.className='w';const inner=document.createElement('span');inner.textContent=part;inner.style.setProperty('--i',i++);w.appendChild(inner);frag.appendChild(w)});
   c.replaceWith(frag)}
  else if(c.nodeType===1&&c.tagName!=='BR'&&c.tagName!=='svg')walk(c)})};walk(el);el.classList.add('split')}
const heads=$$('.ttl h1,.ttl h2,.ph1,#ct h1,#ct h2,.pada h2,.hm-hero h1,.cm h2');
if(!RM)heads.forEach(splitWords);

/* ---------- stagger groups ---------- */
const groups=$$('.also,.fx,.kp,.cl,.index,.skills,.journey,.chips,.lg,.sp');
if(!RM)groups.forEach(g=>{[...g.children].forEach((c,k)=>c.style.setProperty('--d',Math.min(k,12)));g.classList.add('st')});

/* ---------- drawing + reveal on arrival ---------- */
(function(){const targets=[...new Set([...$$('.orn.pre,.word.pre,.rv'),...heads,...groups])];
 if(RM||!('IntersectionObserver' in window)){targets.forEach(t=>{t.classList.remove('pre');t.classList.add('shown','in')});return}
 $$('.rv').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight*.9)el.classList.add('pre')});
 const show=t=>{t.classList.remove('pre');t.classList.add('shown','in')};
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const t=e.target;io.unobserve(t);whenReady(()=>requestAnimationFrame(()=>show(t)))}}),{rootMargin:'0px 0px -8% 0px'});
 targets.forEach(t=>io.observe(t));
 whenReady(()=>setTimeout(()=>targets.forEach(t=>{if(t.getBoundingClientRect().top<innerHeight)show(t)}),2600));
})();

/* ---------- seals turn slowly as you scroll ---------- */
(function(){if(RM)return;const els=$$('.seal>.orn,.pseal>.orn,.hm-hero .mandala>.orn');let tick=false;
 const run=()=>{els.forEach(e=>{const b=e.getBoundingClientRect();if(b.bottom<-50||b.top>innerHeight+50)return;const c=(b.top+b.height/2-innerHeight/2)/innerHeight;e.style.transform=`rotate(${(c*-28).toFixed(2)}deg)`});tick=false};
 addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(run)}},{passive:true});run()})();

/* ---------- cursor: kumkum bindu, rangoli ring, diya sparks (mouse and trackpad only) ---------- */
(function(){if(RM||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
 const petals=Array.from({length:12},(_,i)=>{const a=i*30;return `<path d="M0 -15 Q3 -19 0 -24 Q-3 -19 0 -15Z" transform="rotate(${a})"/>`}).join('');
 const dots=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return `<circle cx="${(19*Math.cos(a)).toFixed(1)}" cy="${(19*Math.sin(a)).toFixed(1)}" r=".9"/>`}).join('');
 const wrap=document.createElement('div');wrap.className='cur-w';
 wrap.innerHTML=`<div class="cur-r"><svg viewBox="-28 -28 56 56" aria-hidden="true"><g class="cr-spin"><circle class="cr-o" r="26"/><g class="cr-p">${petals}</g><g class="cr-d">${dots}</g></g></svg><span class="cur-l"></span></div>`;
 const dot=document.createElement('div');dot.className='cur';
 const cv=document.createElement('canvas');cv.className='cur-cv';
 document.body.append(cv,wrap,dot);
 const ring=wrap.querySelector('svg'),label=wrap.querySelector('.cur-l'),g=cv.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2);
 const fit=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;g.setTransform(dpr,0,0,dpr,0,0)};fit();addEventListener('resize',fit);
 let x=-200,y=-200,rx=x,ry=y,px=x,py=y,sparks=[],moving=0;
 addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;ROOT.classList.add('has-cur');ROOT.classList.remove('cur-hide')},{passive:true});
 document.addEventListener('mouseleave',()=>ROOT.classList.add('cur-hide'));
 /* what the ring says over different things */
 const say=el=>{if(!el)return'';if(el.dataset.cursor)return el.dataset.cursor;
  if(el.matches('.bt,.hb,button'))return'';
  if(el.closest('.pr,#latest .also>a')||/\/blog\//.test(el.getAttribute('href')||''))return'Read';
  if(el.matches('.also>a,.nx,.index a,#nav a,.cl a,.em'))return'Open';
  if(el.matches('canvas'))return'Click';return''};
 const hot='a,button,summary,label,canvas,select,.pr';
 document.addEventListener('pointerover',e=>{const t=e.target;
  if(t.closest('input,textarea,[contenteditable]')){ROOT.classList.add('cur-text');return}ROOT.classList.remove('cur-text');
  const h=t.closest(hot);wrap.classList.toggle('big',!!h);const l=say(h);label.textContent=l;wrap.classList.toggle('lbl',!!l);
  wrap.classList.toggle('dev',!h&&!!t.closest('.word,.pseal,.seal,.mandala,.index b,#nav .w,.brand'))});
 /* click: a ring of petals opens where you clicked */
 addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;wrap.classList.add('press');
  const b=document.createElement('div');b.className='cur-burst';b.style.left=e.clientX+'px';b.style.top=e.clientY+'px';
  b.innerHTML=Array.from({length:8},(_,i)=>`<i style="--a:${i*45}deg"></i>`).join('');document.body.appendChild(b);setTimeout(()=>b.remove(),700);
  for(let i=0;i<10;i++)sparks.push(spark(e.clientX,e.clientY,1.6))});
 addEventListener('pointerup',()=>wrap.classList.remove('press'));
 function spark(x,y,f){const a=Math.random()*Math.PI*2,v=(.3+Math.random()*.9)*f;return{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.35*f,life:1,r:.8+Math.random()*1.6,h:Math.random()<.3}}
 (function loop(){rx+=(x-rx)*.16;ry+=(y-ry)*.16;
  wrap.style.transform=`translate(${rx}px,${ry}px)`;dot.style.transform=`translate(${x}px,${y}px)`;
  const d=Math.hypot(x-px,y-py);moving=moving*.9+d*.1;
  if(d>2&&!ROOT.classList.contains('cur-text')){const n=Math.min(3,Math.floor(d/9)+1);for(let i=0;i<n;i++)sparks.push(spark(px+(x-px)*i/n,py+(y-py)*i/n,.45))}
  px=x;py=y;if(sparks.length>90)sparks.splice(0,sparks.length-90);
  g.clearRect(0,0,innerWidth,innerHeight);
  sparks=sparks.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy-=.012;p.vx*=.98;p.life-=.022;if(p.life<=0)return false;
   const a=p.life*p.life;g.beginPath();g.arc(p.x,p.y,p.r*(.6+p.life*.6),0,7);g.fillStyle=p.h?`rgba(124,29,42,${a*.7})`:`rgba(217,150,60,${a*.85})`;g.fill();return true});
  /* the ring leans in the direction of travel */
  const sk=Math.min(moving/40,.18);ring.style.transform=`scale(${1+sk},${1-sk*.6}) rotate(${Math.atan2(y-ry,x-rx)}rad)`;
  requestAnimationFrame(loop)})();
 /* buttons lean toward the pointer */
 $$('.bt,.hb').forEach(b=>{b.addEventListener('pointermove',e=>{const q=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-q.left-q.width/2)*.18}px,${(e.clientY-q.top-q.height/2)*.28}px)`});b.addEventListener('pointerleave',()=>b.style.transform='')});
})();

/* ---------- home: section words on the right edge ---------- */
(function(){const map=[['top','आरम्भ','Opening'],['w1','ध्रुव','Name'],['w2','मंथन','Skills'],['w3','वाणी','Sales avatar'],['w4','दृष्टि','Admin assistant'],['w5','व्यास','Curriculum engine'],['w6','सारथी','Exam assistant'],['w7','विवेक','Invoice AI'],['w8','संवाद','Calling bot'],['w9','लेखा','Lakehouse'],['journey','कर्म','Journey'],['ct','अतिथि','Contact']];
 const items=map.map(([id,w,l])=>[document.getElementById(id),w,l,id]).filter(x=>x[0]);if(items.length<6)return;
 const nav=document.createElement('nav');nav.className='secnav';nav.setAttribute('aria-label','Sections');
 nav.innerHTML=items.map(([,w,l,id])=>`<a href="#${id}" data-cursor="" title="${l}"><span>${w}</span></a>`).join('');document.body.appendChild(nav);
 const links=[...nav.children];
 links.forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();items[i][0].scrollIntoView({behavior:RM?'auto':'smooth',block:items[i][3]==='top'?'start':'center'});history.replaceState(null,'','#'+items[i][3])}));
 let tick=false;const upd=()=>{const mid=innerHeight*.5;let on=0;items.forEach(([el],i)=>{if(el.getBoundingClientRect().top<mid)on=i});links.forEach((a,i)=>{a.classList.toggle('on',i===on);if(i===on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});tick=false};
 addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});upd();
 whenReady(()=>nav.classList.add('in'));
})();

/* ---------- page transitions: the doors close, then the next page opens them ---------- */
(function(){if(RM)return;
 document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  if(a.target&&a.target!=='_self'||a.hasAttribute('download'))return;const u=new URL(a.href,location.href);
  if(u.origin!==location.origin||!/^https?:$/.test(u.protocol))return;if(u.pathname===location.pathname&&u.hash)return;if(/\.(xml|json|txt|zip|pdf)$/i.test(u.pathname))return;
  e.preventDefault();ROOT.classList.add('leave');setTimeout(()=>{location.href=u.href},520)});
 addEventListener('pageshow',e=>{if(e.persisted)ROOT.classList.remove('leave')});
})();
