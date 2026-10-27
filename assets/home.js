// kinetic name
$$('#nm .ln').forEach((l,j)=>{l.innerHTML=[...l.textContent].map((c,i)=>`<span class="c" style="--i:${i+j*5}">${c}</span>`).join('')});
const cs=$$('#nm .c');let px=-999,py=-999;addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY});

// live KPI ticker (the full simulation lives on the Pipeline page)
let rate=115,ing=0,last=performance.now(),hAcc=0;const hist=Array(60).fill(115),t0=performance.now();
const sctx=$('#sp').getContext('2d');
function draw(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;
 rate=Math.round(115+14*Math.sin(now/1700)+6*Math.sin(now/430));
 ing+=rate*dt;
 hAcc+=dt;if(hAcc>.12){hAcc=0;hist.push(rate*(.94+Math.random()*.12));hist.shift()}
 sctx.clearRect(0,0,160,30);sctx.strokeStyle='#FF4B1F';sctx.lineWidth=2;sctx.beginPath();
 hist.forEach((v,i)=>{const x=i/59*160,y=28-(v/250)*26;i?sctx.lineTo(x,y):sctx.moveTo(x,y)});sctx.stroke();
 $('#k1').textContent=rate;$('#k2').textContent=fmt(ing);$('#k3').textContent=Math.floor((now-t0)/4000);
 cs.forEach((c,k)=>{const b=c.getBoundingClientRect(),d=Math.hypot(b.left+b.width/2-px,b.top+b.height/2-py),v=Math.max(Math.max(0,1-d/300),(RM?.4:.5+.5*Math.sin(now/1000*1.4+k*.55))*.55);c.style.fontVariationSettings=`"wdth" ${70+42*v},"wght" ${300+600*v}`});
 requestAnimationFrame(draw)}
requestAnimationFrame(draw);
