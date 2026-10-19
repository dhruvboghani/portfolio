// home: count the stats up once they are in view
(function(){if(RM||!('IntersectionObserver' in window))return;
 $$('.hm-hero .stats b').forEach(el=>{const m=el.textContent.match(/^(\d+)(.*)$/);if(!m)return;const n=+m[1],s=m[2];
  const io=new IntersectionObserver(e=>{if(!e[0].isIntersecting)return;io.disconnect();const t0=performance.now();
   (function step(t){const k=Math.min(1,(t-t0)/1400),v=Math.round(n*(1-Math.pow(1-k,3)));el.textContent=v+s;if(k<1)requestAnimationFrame(step)})(t0)});io.observe(el)})})();
