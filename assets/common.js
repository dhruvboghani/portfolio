const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],RM=matchMedia('(prefers-reduced-motion:reduce)').matches,fmt=n=>Math.floor(n).toLocaleString();

// keep the active nav item visible on mobile (horizontal menu)
(function(){const a=$('#nav a.on');if(a&&matchMedia('(max-width:900px)').matches){const nav=$('.sb');nav.scrollLeft=a.offsetLeft-nav.clientWidth/2+a.clientWidth/2}})();

// uptime counter that keeps running across pages
let T0=Date.now();
try{const s=+sessionStorage.getItem('t0');if(s)T0=s;else sessionStorage.setItem('t0',T0)}catch(e){}
const upEl=$('#up');
function tickUp(){const sec=Math.floor((Date.now()-T0)/1000);upEl.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}
if(upEl){tickUp();setInterval(tickUp,1000)}

// scroll progress bar
const bar=$('#bar');
function prog(){bar.style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`}
addEventListener('scroll',prog,{passive:true});addEventListener('resize',prog);prog();

// reveal on scroll
const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.08});
$$('.rv').forEach(e=>io.observe(e));
