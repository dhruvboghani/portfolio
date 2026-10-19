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

/* ---------- header + progress ---------- */
const top_=$('.top'),bar=$('#bar');
function prog(){const h=document.documentElement.scrollHeight-innerHeight;if(bar)bar.style.transform=`scaleX(${h>0?scrollY/h:0})`;if(top_)top_.classList.toggle('solid',scrollY>20)}
addEventListener('scroll',prog,{passive:true});addEventListener('resize',prog);prog();

/* ---------- copy buttons ---------- */
$$('[data-copy]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const t=b.dataset.copy,lb=b.textContent;
 const done=()=>{b.textContent='Copied';setTimeout(()=>b.textContent=lb,1500)};
 if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,()=>{});}));

/* ---------- drawing + reveal on arrival (everything is visible at rest) ---------- */
(function(){const targets=$$('.orn.pre,.word.pre,.rv');
 if(RM||!('IntersectionObserver' in window)){targets.forEach(t=>t.classList.remove('pre'));return}
 document.documentElement.classList.add('js');
 $$('.rv').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight*.9)el.classList.add('pre')});
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const t=e.target;requestAnimationFrame(()=>{t.classList.remove('pre');t.classList.add('in')});io.unobserve(t)}}),{rootMargin:'0px 0px -8% 0px'});
 targets.forEach(t=>io.observe(t));
 setTimeout(()=>targets.forEach(t=>{if(t.getBoundingClientRect().top<innerHeight)t.classList.remove('pre')}),3000);
})();
