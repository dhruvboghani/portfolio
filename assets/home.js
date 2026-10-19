// home: count the stats up once the doors have opened
whenReady(()=>{if(RM)return;
 $$('.hm-hero .stats b').forEach(el=>{const m=el.textContent.match(/^(\d+)(.*)$/);if(!m)return;const n=+m[1],s=m[2];el.textContent='0'+s;
  setTimeout(()=>{const t0=performance.now();(function step(t){const k=Math.min(1,(t-t0)/1500),v=Math.round(n*(1-Math.pow(1-k,3)));el.textContent=v+s;if(k<1)requestAnimationFrame(step)})(t0)},700)})});
