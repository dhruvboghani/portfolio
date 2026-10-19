/* Katha backgrounds: one faint line drawing per section, taken from its katha.
   Home: each section has its own scene and they cross-fade as you scroll.
   Other pages: one scene for the whole page. */
(function(){
const cv=document.createElement('canvas');cv.id='kbg';cv.setAttribute('aria-hidden','true');document.body.insertBefore(cv,document.body.firstChild);
const g=cv.getContext('2d');let W=0,H=0;const dpr=Math.min(devicePixelRatio||1,1.5);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function fit(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0)}fit();addEventListener('resize',fit);
let A=1,SP=0;const GOLD=a=>`rgba(180,138,54,${a*A})`,MAR=a=>`rgba(124,29,42,${a*A})`,SAF=a=>`rgba(217,115,30,${a*A})`,BLUE=a=>`rgba(110,150,165,${a*A})`,GREEN=a=>`rgba(110,140,90,${a*A})`;
const dev=(s,x,y,size,col)=>{g.font=`${size}px Amita, serif`;g.fillStyle=col;g.fillText(s,x,y)};
function petals(cx,cy,n,r0,r1,w,col,off){g.strokeStyle=col;g.beginPath();for(let i=0;i<n;i++){const a=off+i*2*Math.PI/n,p=(r,aa)=>[cx+r*Math.cos(aa),cy+r*Math.sin(aa)];
  const[x0,y0]=p(r0,a),[x1,y1]=p(r1,a),[ax,ay]=p((r0+r1)/2,a-w),[bx,by]=p((r0+r1)/2,a+w);g.moveTo(x0,y0);g.quadraticCurveTo(ax,ay,x1,y1);g.quadraticCurveTo(bx,by,x0,y0)}g.stroke()}
const S={
/* each scene: one quiet line motif, thin gold, very faint */
kala(t){const cx=W/2,cy=H*.5,Rr=Math.min(W,H)*.46,rot=t*.00002+SP*.3;g.lineWidth=1;g.strokeStyle=GOLD(.18);g.beginPath();g.arc(cx,cy,Rr,0,7);g.stroke();petals(cx,cy,24,Rr*.78,Rr*.96,.06,GOLD(.12),rot)},

dhruva(t){const cx=W*.78,cy=H*.18,rot=t*.00003+SP*.4;g.lineWidth=1;
  [120,200,290].forEach((r,i)=>{g.strokeStyle=GOLD(.12);g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();
   for(let k=0;k<5+i*2;k++){const a=rot*(i%2?-1:1)+k*6.283/(5+i*2);g.fillStyle=GOLD(.35);g.beginPath();g.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.6,0,7);g.fill()}});
  const gl=g.createRadialGradient(cx,cy,0,cx,cy,26);gl.addColorStop(0,SAF(.4));gl.addColorStop(1,SAF(0));g.fillStyle=gl;g.beginPath();g.arc(cx,cy,26,0,7);g.fill();g.fillStyle=MAR(.7);g.beginPath();g.arc(cx,cy,2.6,0,7);g.fill()},

manthan(t){g.lineWidth=1;for(let L=0;L<3;L++){const y0=H*.84+L*22,len=34+L*6,sp=(L%2?1:-1)*(t*.01+SP*60);g.strokeStyle=GOLD(.2-L*.04);g.beginPath();
   for(let x=-len*2+(sp%(len*2));x<W+len*2;x+=len){g.moveTo(x,y0);g.quadraticCurveTo(x+len/2,y0-8,x+len,y0)}g.stroke()}
  for(let i=0;i<4;i++){const p=(t*.00006+i/4)%1,x=W*(.2+i*.2),y=H*.86-p*H*.3;g.save();g.translate(x,y);g.rotate(Math.PI/4);g.fillStyle=SAF(.35*(1-p));g.fillRect(-3,-3,6,6);g.restore()}},

vani(t){g.lineWidth=1;const ox=-20,oy=H*.5;for(let i=0;i<4;i++){const r=((t*.04+i*150)%600)+60;g.strokeStyle=GOLD(.18*(1-r/660));g.beginPath();g.arc(ox,oy,r,-.7,.7);g.stroke()}
  ['अ','क','ग','म','र','ह'].forEach((c,i)=>{g.textAlign='center';dev(c,W*(.1+i*.16),H*(.18+(i%3)*.3)-SP*30+Math.sin(t*.0006+i)*6,26,GOLD(.14))});g.textAlign='left'},

drishti(t){g.lineWidth=1;const hz=H*.8;g.strokeStyle=GOLD(.2);g.beginPath();g.moveTo(W*.08,hz);g.lineTo(W*.92,hz);g.stroke();
  for(let i=0;i<12;i++){const x=W*(.12+i*.068),w=Math.sin(t*.003+i)*1.5;g.strokeStyle=GOLD(.28);g.beginPath();g.moveTo(x,hz);g.lineTo(x,hz-12);g.stroke();g.fillStyle=(i%3?GOLD:MAR)(.3);g.beginPath();g.moveTo(x,hz-12);g.lineTo(x+7,hz-10+w);g.lineTo(x,hz-8);g.fill()}},

vyasa(t){g.lineWidth=1;const sx=W*.5,top=H*.1,y1=H*.32;g.strokeStyle=GOLD(.18);g.beginPath();g.moveTo(sx,top);g.lineTo(sx,y1);g.stroke();
  for(let c=0;c<4;c++){const cx=W*(.2+c*.2);g.beginPath();g.moveTo(sx,y1);g.bezierCurveTo(sx,y1+50,cx,y1+30,cx,y1+100);g.lineTo(cx,H*.95);g.stroke()}
  const p=(t*.00012+SP*.3)%1;for(let c=0;c<4;c++){const cx=W*(.2+c*.2),y=y1+100+p*(H*.95-y1-100);g.fillStyle=MAR(.35);g.beginPath();g.arc(cx,y,2,0,7);g.fill()}},

sarathi(t){g.lineWidth=1;const cx=W*.1,cy=H*.72,Rw=Math.min(W,H)*.32,rot=t*.00015+SP*2;g.strokeStyle=GOLD(.2);g.beginPath();g.arc(cx,cy,Rw,0,7);g.stroke();g.beginPath();g.arc(cx,cy,Rw*.14,0,7);g.stroke();
  g.strokeStyle=GOLD(.14);g.beginPath();for(let i=0;i<8;i++){const a=rot+i*Math.PI/4;g.moveTo(cx+Math.cos(a)*Rw*.14,cy+Math.sin(a)*Rw*.14);g.lineTo(cx+Math.cos(a)*Rw,cy+Math.sin(a)*Rw)}g.stroke()},

viveka(t){g.lineWidth=1.2;for(let s=0;s<2;s++){g.strokeStyle=s?BLUE(.3):GOLD(.25);g.beginPath();for(let x=0;x<=W;x+=10){const p=x/W,mix=Math.max(0,1-Math.abs(p-.3)*3.5),sep=p>.5?(p-.5)*(s?1:-1)*H*.18:0;
   const y=H*.82+Math.sin(x*.012+t*.0012+s*Math.PI*mix)*10*mix+sep;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}g.lineWidth=1},

samvad(t){g.lineWidth=1;const P=[[.12,.2],[.88,.16],[.6,.86]].map(([x,y])=>[x*W,y*H-SP*20]);g.setLineDash([2,8]);g.strokeStyle=GOLD(.22);
  [[0,1],[1,2]].forEach(([a,b])=>{g.beginPath();g.moveTo(P[a][0],P[a][1]);g.quadraticCurveTo((P[a][0]+P[b][0])/2,Math.min(P[a][1],P[b][1])-50,P[b][0],P[b][1]);g.stroke()});g.setLineDash([]);
  P.forEach(([x,y])=>{g.strokeStyle=GOLD(.3);g.beginPath();g.arc(x,y,5,0,7);g.stroke()});
  const p=(t*.00018)%1,[a,b]=p<.5?[0,1]:[1,2],q=(p%.5)*2,cx=(P[a][0]+P[b][0])/2,cy=Math.min(P[a][1],P[b][1])-50,x=(1-q)*(1-q)*P[a][0]+2*(1-q)*q*cx+q*q*P[b][0],y=(1-q)*(1-q)*P[a][1]+2*(1-q)*q*cy+q*q*P[b][1];
  g.fillStyle=SAF(.6);g.beginPath();g.arc(x,y,2.6,0,7);g.fill()},

lekha(t){g.lineWidth=1;const x0=W*.06,x1=W*.94,lh=40,rows=Math.ceil(H/lh),off=(SP*60)%lh;g.strokeStyle=MAR(.12);g.beginPath();g.moveTo(x0,0);g.lineTo(x0,H);g.stroke();
  for(let r=0;r<=rows;r++){const y=r*lh-off;g.strokeStyle=GOLD(.08);g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.stroke()}
  const r=Math.floor(t*.00025)%rows,pr=(t*.00025)%1,y=r*lh-off-12;g.strokeStyle=GOLD(.3);g.beginPath();g.moveTo(x0+20,y);g.lineTo(x0+20+pr*(x1-x0-40)*.6,y);g.stroke()},

karma(t){[.3,.5,.7].forEach((f,i)=>{const x=W*f,y=H-28,fl=1+.08*Math.sin(t*.01+i);const gl=g.createRadialGradient(x,y-8,0,x,y-8,40);gl.addColorStop(0,SAF(.22));gl.addColorStop(1,SAF(0));g.fillStyle=gl;g.beginPath();g.arc(x,y-8,40,0,7);g.fill();
   g.fillStyle=GOLD(.4);g.beginPath();g.ellipse(x,y+3,11,4,0,0,7);g.fill();g.fillStyle=SAF(.65);g.beginPath();g.moveTo(x,y-12*fl);g.quadraticCurveTo(x+4,y-3,x,y);g.quadraticCurveTo(x-4,y-3,x,y-12*fl);g.fill()});
  for(let i=0;i<8;i++){const p=(t*.00008+i/8)%1;g.fillStyle=SAF(.35*(1-p));g.beginPath();g.arc(W*(.3+(i%3)*.2)+Math.sin(t*.001+i)*8,H-40-p*H*.4,1.4,0,7);g.fill()}},

atithi(t){g.lineWidth=1;const cx=W/2,top=H*.12,w=Math.min(W*.6,560);g.strokeStyle=GOLD(.2);g.beginPath();g.moveTo(cx-w/2,H);g.lineTo(cx-w/2,top+H*.22);g.quadraticCurveTo(cx-w/2,top,cx,top-8);g.quadraticCurveTo(cx+w/2,top,cx+w/2,top+H*.22);g.lineTo(cx+w/2,H);g.stroke();
  const n=13;for(let i=0;i<n;i++){const p=i/(n-1),x=cx-w*.4+p*w*.8,y=top+28+Math.sin(p*Math.PI)*10+Math.sin(t*.002+i)*1.5;g.fillStyle=(i%2?GREEN:SAF)(.35);g.beginPath();g.arc(x,y,3,0,7);g.fill()}}
};

/* which scene goes where */
const file=(location.pathname.split('/').pop()||'index.html'),inBlog=/\/blog\//.test(location.pathname);
const PAGE={'voice-avatar.html':'vani','admin-assistant.html':'drishti','pipeline.html':'lekha','invoice-ai.html':'viveka','voice-agent.html':'samvad',
 'work.html':'sarathi','experience.html':'karma','blog.html':'vyasa','faq.html':'samvad','contact.html':'atithi'};
const HOME={top:'kala',w1:'dhruva',w2:'manthan',w3:'vani',w4:'drishti',w5:'vyasa',w6:'sarathi',w7:'viveka',w8:'samvad',w9:'lekha',journey:'karma',latest:'vyasa',ct:'atithi'};
let secs=[];const single=inBlog?'vyasa':PAGE[file];
if(!single){for(const id in HOME){const el=document.getElementById(id);if(el)secs.push({el,s:HOME[id]})}}
if(!single&&!secs.length)return;
let t0=performance.now(),run=true;document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run)requestAnimationFrame(frame)});
function frame(now){if(!run)return;const t=reduce?0:now-t0;g.clearRect(0,0,W,H);
 if(single){A=1;const h=document.documentElement.scrollHeight-innerHeight;SP=h>0?scrollY/h*2-1:0;g.save();S[single](t);g.restore()}
 else{const mid=innerHeight/2,ws=secs.map(o=>{const b=o.el.getBoundingClientRect(),c=b.top+b.height/2;return{s:o.s,w:Math.max(0,1-Math.abs(c-mid)/(Math.max(b.height,innerHeight)*.75)),p:(c-mid)/innerHeight}});
  const top=ws.sort((a,b)=>b.w-a.w).slice(0,2),sum=(top[0].w+(top[1]?top[1].w:0))||1;
  top.forEach(o=>{if(o.w<=0)return;A=o.w/sum;SP=-o.p;g.save();S[o.s](t);g.restore()})}
 if(!reduce)requestAnimationFrame(frame)}
requestAnimationFrame(frame);if(reduce)addEventListener('scroll',()=>requestAnimationFrame(frame),{passive:true});
})();
