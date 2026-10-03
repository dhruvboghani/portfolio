const av=createAvatar($('#stage'));
const C=[{r:/towel/,n:'Premium Cotton Towels',d:'hotel-grade 600 GSM towels, from 180 rupees a piece, minimum order 500 pieces'},{r:/cook|steel|pan|kitchen/,n:'Stainless Steel Cookware Set',d:'an induction-ready seven-piece set at 3,400 rupees a set, minimum order 100 sets'},{r:/light|led|panel|lamp/,n:'LED Panel Lights',d:'energy-efficient panels from 420 rupees a unit, with a two-year warranty, minimum order 200 units'}];
const L={name:'',phone:'',interest:'',slot:'',step:'idle'};
function upd(){const v={l1:L.name||'unknown',l2:L.phone||'unknown',l3:L.interest||'not yet',l4:L.slot||'unset',l5:L.slot?'Booked':L.phone?'Qualified':L.interest?'Interested':'New lead'};
 for(const k in v){const e=$('#'+k),b=e.querySelector('b');if(b.textContent!==v[k]){b.textContent=v[k];e.classList.add('fl');setTimeout(()=>e.classList.remove('fl'),700)}}
 $('#se').style.width=(L.slot?92:L.phone?75:L.interest?60:40)+'%'}
function brain(t){const s=t.toLowerCase();
 if(L.step==='name'){L.name=(t.match(/(?:my name is|i am|i'm|this is)\s+([a-z]+)/i)||[0,t.trim().split(/\s+/).slice(0,2).join(' ')])[1];L.step='phone';upd();return{say:`Nice to meet you, ${L.name}. What is the best phone number to reach you on?`}}
 if(L.step==='phone'){const d=t.replace(/\D/g,'');if(d.length<8)return{say:"Sorry, I didn't catch the number. Could you say it again, digit by digit?"};L.phone=d.length>=10?d.slice(-10).replace(/(\d{5})(\d{5})/,'$1 $2'):d;L.step='slot';upd();return{say:'Thank you. I can book a visit or a call tomorrow at 11 AM or 3 PM. Which works for you?'}}
 if(L.step==='slot'){if(!/\b11\b|eleven|morning|\b3\b|three|afternoon/.test(s))return{say:'Would 11 AM or 3 PM tomorrow suit you better?'};L.slot=/\b11\b|eleven|morning/.test(s)?'Tomorrow, 11:00 AM':'Tomorrow, 3:00 PM';L.step='done';upd();return{say:`You are booked for ${L.slot.toLowerCase()}. We will send a confirmation to ${L.phone}. Is there anything else I can help with?`}}
 const p=C.find(x=>x.r.test(s));if(p){L.interest=p.n;upd();return{say:`${p.n}: ${p.d}. Would you like me to book a demo or a visit with our team?`}}
 if(/book|appointment|meeting|demo|visit|schedule|call me/.test(s)){if(L.step==='done')return{say:`You already have a slot: ${L.slot.toLowerCase()}. Want to change it?`};L.step='name';return{say:'Happy to set that up. May I have your name?'}}
 if(/price|cost|rate|quote/.test(s))return{say:'Pricing depends on quantity. Tell me which product you like and I will share the range, or I can book a call for an exact quotation.'};
 if(/product|catalog|sell|offer|what do you/.test(s))return{say:'We offer premium cotton towels, stainless steel cookware sets and LED panel lights. Which one would you like to know about?'};
 if(/\b(hi|hello|hey)\b/.test(s))return{say:'Hello! How can I help you today?'};
 return{say:'I can tell you about our products, share pricing, or book an appointment with our team. What would you like?'}}
const msg=(c,t)=>{const d=document.createElement('div');d.className='bb '+c;d.textContent=t;const b=$('#tr');b.appendChild(d);b.scrollTop=b.scrollHeight};
wireChat(av,brain,t=>msg('us',t),o=>msg('bot',o.say),()=>({say:'Hi, I am Aria from the sales team. I can tell you about our products, answer questions and book an appointment. How can I help?'}));
upd();
