const A=[["Invoice no","INV-2041",-1],["Item","Laptop computer",0],["HSN code","8471",1],["Taxable value","Rs 50,000",0],["GST rate","18%",2],["GST amount","Rs 9,000",2],["Total","Rs 59,000",2]],B=[["PO no","PO-1187",-1],["Item","Laptop computer",0],["HSN code","8473",1],["Taxable value","Rs 50,000",0],["GST rate","12%",2],["GST amount","Rs 6,000",2],["Total","Rs 56,000",2]];
const fl=(a,id)=>$(id).innerHTML=a.map(r=>`<div class="f m" data-s="${r[2]}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');fl(A,'#iA');fl(B,'#iB');
const ST=["Extract fields (LLM)","Detect HSN","Check tax variance","Vector anomaly search"];$('#sp2').innerHTML=ST.map(s=>`<span>${s}</span>`).join('');
const FD=["HSN mismatch: invoice says 8471, order says 8473.","GST rate variance: billed 18%, expected 12%. Over-billed by Rs 3,000.","Closest past invoice is 94% similar and was flagged before. Route to review."];
let rb=false;$('#br').onclick=()=>{if(rb)return;rb=true;const sp=$$('#sp2 span'),fs=$$('#iA .f,#iB .f'),fd=$('#fd');fd.innerHTML='';sp.forEach(s=>s.className='');fs.forEach(f=>f.className='f m');
 let i=0;(function step(){if(i>0){sp[i-1].className='dn'}if(i>=ST.length){rb=false;return}sp[i].className='on';fs.forEach(f=>{if(+f.dataset.s===i)f.classList.add('hl')});
 if(i===1)fs.filter(f=>f.dataset.s==='1').forEach(f=>f.classList.add('bad'));if(i===2)fs.filter(f=>f.firstChild.textContent.includes('GST')).forEach(f=>f.classList.add('bad'));
 if(i>0){const d=document.createElement('div');d.textContent=FD[i-1];fd.appendChild(d)}
 i++;setTimeout(step,900)})()};
