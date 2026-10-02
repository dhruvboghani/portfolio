const pl=$('#pl'),g=pl.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2);let W,H,nd=[];
const NM=["Redpanda","Flink","Iceberg","Trino"],DS=["Redpanda: Kafka-compatible streaming ingestion. The front door for 10M+ events a day.","Apache Flink: stateful stream transforms in flight. Bad events are quarantined here instead of poisoning the lake.","Apache Iceberg on MinIO with Nessie: versioned tables, so every commit is a snapshot you can read back in time.","Trino: fast interactive SQL across the lake, on fresh data."];
function rs(){W=pl.clientWidth;H=230;pl.width=W*dpr;pl.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0);const bw=Math.min(104,W/5.2);nd=NM.map((n,i)=>({x:W*(.14+.72*i/3)-bw/2,y:62,w:bw,h:62,f:0}));nd.dlq={x:nd[1].x,y:170,w:bw,h:40,f:0}}
rs();addEventListener('resize',rs);
let dq=0,rate=115,ing=0,tr=0,com=0,que=0,snaps=[],snapTotal=0,pk=[],acc=0,last=performance.now(),pending=0,hAcc=0;const hist=Array(60).fill(115);
$('#rt').oninput=e=>{rate=+e.target.value;$('#rtv').textContent=rate};
const spawn=(bad,wt)=>pk.push({k:-1,t:0,bad,wt:wt||Math.max(1,Math.round(rate/8)),y:nd[0].y+nd[0].h/2});
$('#bu').onclick=()=>{for(let i=0;i<22;i++)setTimeout(()=>spawn(false),i*45)};$('#bd').onclick=()=>spawn(true,1);
pl.onclick=e=>{const r=pl.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;nd.forEach((n,i)=>{if(x>n.x&&x<n.x+n.w&&y>n.y&&y<n.y+n.h){$('#dt').textContent=DS[i];n.f=1}})};
function commitSnap(){snapTotal++;snaps.push({n:snapTotal,c:com});if(snaps.length>6)snaps.shift();const s=$('#sn');s.innerHTML=snaps.map(x=>`<option value="${x.c}">snapshot_${String(x.n).padStart(2,'0')} (${fmt(x.c)} rows)</option>`).join('');s.selectedIndex=snaps.length-1}
function arrive(p,k){nd[k].f=1;if(k===0)ing+=p.wt;if(k===1){if(p.bad){p.dlq=1;nd.dlq.f=1;return}tr+=p.wt}if(k===2){com+=p.wt;pending+=p.wt;if(pending>=Math.max(60,rate)){pending=0;commitSnap()}}}
$('#bq').onclick=()=>{const o=$('#qo');if(!snaps.length){o.innerHTML='trino> <em>no committed snapshot yet</em>, wait a moment.';return}
 const sel=$('#sn');o.innerHTML=`trino> SELECT count(*) FROM lake.events FOR VERSION AS OF '${sel.selectedOptions[0].text.split(' ')[0]}';\n\n  _col0\n -------\n  <em>${fmt(+sel.value)}</em>\n\n1 row, read from Iceberg via Nessie`;que++};
const sctx=$('#sp').getContext('2d');
function draw(now){const dt=Math.min(.05,(now-last)/1000);last=now;
 acc+=dt*8;while(acc>=1){acc--;spawn(false)}
 g.clearRect(0,0,W,H);g.lineWidth=2;g.strokeStyle='#16140F';
 nd.forEach((n,i)=>{if(i<3){const m=nd[i+1];g.setLineDash([6,6]);g.beginPath();g.moveTo(n.x+n.w,n.y+n.h/2);g.lineTo(m.x,m.y+m.h/2);g.stroke();g.setLineDash([])}});
 g.setLineDash([4,5]);g.beginPath();g.moveTo(nd[1].x+nd[1].w/2,nd[1].y+nd[1].h);g.lineTo(nd.dlq.x+nd.dlq.w/2,nd.dlq.y);g.stroke();g.setLineDash([]);
 const box=(n,t,s)=>{n.f*=.92;g.fillStyle='#16140F';g.fillRect(n.x+3,n.y+3,n.w,n.h);g.fillStyle=n.f>.1?'#FF4B1F':'#ECEBE6';g.fillRect(n.x,n.y,n.w,n.h);g.strokeRect(n.x,n.y,n.w,n.h);g.fillStyle='#16140F';g.font='700 13px Archivo';g.textAlign='center';g.fillText(t,n.x+n.w/2,n.y+n.h/2-2);g.font='11px "IBM Plex Mono"';g.fillText(s,n.x+n.w/2,n.y+n.h/2+14)};
 nd.forEach((n,i)=>box(n,NM[i],i===0?fmt(ing):i===1?fmt(tr):i===2?fmt(com):que+' queries'));box(nd.dlq,'DLQ','quar. '+dq);
 pk=pk.filter(p=>{if(p.dlq){p.dy=(p.dy||0)+dt*140;const x=nd[1].x+nd[1].w/2,y=nd[1].y+nd[1].h+p.dy;if(y>=nd.dlq.y){dq++;return false}g.fillStyle='#FF4B1F';g.fillRect(x-4,y-4,8,8);return true}
  p.t+=dt*(W/3.2)/Math.max(1,(nd[1].x-nd[0].x));const a=p.k<0?{x:0}:nd[p.k],b=nd[p.k+1],ax=p.k<0?0:a.x+a.w,bx=b.x;
  const x=ax+(bx-ax)*Math.min(p.t,1),y=nd[0].y+nd[0].h/2;g.fillStyle=p.bad?'#FF4B1F':'#16140F';const s=p.bad?9:Math.min(4+Math.log2(p.wt),7);g.fillRect(x-s/2,y-s/2,s,s);
  if(p.t>=1){p.k++;p.t=0;arrive(p,p.k);if(p.k===3){return false}}return true});
 hAcc+=dt;if(hAcc>.12){hAcc=0;hist.push(rate*(.92+Math.random()*.16));hist.shift()}
 sctx.clearRect(0,0,160,30);sctx.strokeStyle='#FF4B1F';sctx.lineWidth=2;sctx.beginPath();hist.forEach((v,i)=>{const x=i/59*160,y=28-(v/450)*26;i?sctx.lineTo(x,y):sctx.moveTo(x,y)});sctx.stroke();
 $('#k1').textContent=rate;$('#k2').textContent=fmt(ing);$('#k3').textContent=snapTotal;$('#k4').textContent=dq;
 requestAnimationFrame(draw)}
requestAnimationFrame(draw);
