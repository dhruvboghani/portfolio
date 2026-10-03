const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],RM=matchMedia('(prefers-reduced-motion:reduce)').matches,fmt=n=>Math.floor(n).toLocaleString();

// mobile / tablet menu (hamburger)
(function(){const sb=$('.sb'),nav=$('#nav');if(!sb||!nav)return;
 const b=document.createElement('button');b.className='hb';b.type='button';b.setAttribute('aria-controls','nav');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Open menu');b.innerHTML='<i></i><i></i><i></i>';sb.appendChild(b);
 const set=o=>{document.body.classList.toggle('mo',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu')};
 b.onclick=()=>set(!document.body.classList.contains('mo'));
 $$('#nav a').forEach(a=>a.addEventListener('click',()=>set(false)));
 addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
 matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)set(false)})})();

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
