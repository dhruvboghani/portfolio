function createAvatar(el){
 const T=THREE,sc=new T.Scene();sc.background=new T.Color(0x110F1A).convertSRGBToLinear();let fitH=1.9,fitC=.98;
 const cam=new T.PerspectiveCamera(28,1,.1,50);cam.position.set(0,1.0,4.7);cam.lookAt(0,.98,0);
 const rd=new T.WebGLRenderer({antialias:true});rd.setPixelRatio(Math.min(devicePixelRatio||1,2));rd.outputEncoding=T.sRGBEncoding;el.appendChild(rd.domElement);
 sc.add(new T.HemisphereLight(0xffffff,0x3a3560,1.1));sc.add(new T.AmbientLight(0xffffff,.45));
 const dl=new T.DirectionalLight(0xffffff,.9);dl.position.set(1.5,3,3);sc.add(dl);
 const rim=new T.DirectionalLight(0x8a7bff,.55);rim.position.set(-2,2,-2);sc.add(rim);const fr=new T.DirectionalLight(0xffffff,1.1);fr.position.set(0,1.7,4);sc.add(fr);
 const M=(c,r)=>new T.MeshStandardMaterial({color:new T.Color(c).convertSRGBToLinear(),roughness:r||.7,metalness:0});
 const skin=M(0xdba584,.65),hair=M(0x17130f,.9),shirt=M(0xf4f4f2,.85),jeans=M(0x35588a,.9),dark=M(0x14110e,.5),rose=M(0x7a2f2f,.6);
 const root=new T.Group();sc.add(root);
 const add=(g,m,x,y,z,p)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);(p||root).add(o);return o};
 const cyl=(a,b,h)=>new T.CylinderGeometry(a,b,h,24),sph=(r,a,b,c,d)=>new T.SphereGeometry(r,24,18,a||0,b||Math.PI*2,c||0,d||Math.PI);
 const fl=add(new T.CircleGeometry(.55,48),M(0x1c1930,1),0,.004,0);fl.rotation.x=-Math.PI/2;
 [-1,1].forEach(s=>{add(cyl(.09,.065,.86),jeans,s*.1,.48,0);add(new T.BoxGeometry(.1,.07,.27),dark,s*.1,.04,.05)});
 add(cyl(.2,.19,.22),jeans,0,.97,0).scale.z=.75;add(cyl(.2,.2,.05),dark,0,1.06,0).scale.z=.75;
 const torso=add(cyl(.21,.185,.58),shirt,0,1.35,0);torso.scale.z=.72;
 add(cyl(.055,.06,.1),skin,0,1.67,0);
 const head=new T.Group();head.position.set(0,1.7,0);root.add(head);
 add(sph(.115),skin,0,.11,0,head).scale.set(.9,1.12,1);
 add(sph(.123,0,Math.PI*2,0,Math.PI*.52),hair,0,.125,-.012,head).scale.set(.93,1.12,1.03);
 add(sph(.117,0,Math.PI*2,Math.PI*.6,Math.PI*.4),hair,0,.11,.004,head).scale.set(.91,1.12,1.02);
 [-1,1].forEach(s=>add(sph(.02),skin,s*.104,.11,0,head).scale.set(.5,1,.8));
 add(sph(.017),M(0xc98f6e),0,.1,.113,head);
 const mouth=add(sph(.026),rose,0,.052,.112,head);mouth.scale.set(1.1,.18,.4);
 const eyes=new T.Group();eyes.position.set(0,.135,0);head.add(eyes);
 [-1,1].forEach(s=>{add(sph(.017),M(0xffffff,.4),s*.04,0,.098,eyes).scale.z=.6;add(sph(.009),dark,s*.04,0,.108,eyes);
  const gl=add(new T.TorusGeometry(.03,.0035,8,28),M(0x3a3a3f,.4),s*.04,.135,.112,head)});
 add(new T.BoxGeometry(.03,.004,.004),M(0x3a3a3f),0,.14,.114,head);
 const arms=[-1,1].map(s=>{const sh=new T.Group();sh.position.set(s*.235,1.58,0);root.add(sh);
  add(sph(.06),shirt,0,0,0,sh);add(cyl(.047,.042,.3),shirt,0,-.15,0,sh);
  const el2=new T.Group();el2.position.set(0,-.3,0);sh.add(el2);
  add(cyl(.05,.05,.07),shirt,0,-.02,0,el2);add(cyl(.036,.03,.24),skin,0,-.15,0,el2);add(sph(.036),skin,0,-.28,0,el2).scale.set(.9,1.2,.7);
  sh.rotation.z=s*.1;return{sh,el:el2}});
 let state='idle',cur='idle',spk=0,mx=0,my=0,nb=2000,bl=0;const st=document.getElementById('stt');
 const LB={idle:'Tap the mic or type',listening:'Listening...',thinking:'Thinking...',speaking:'Speaking...'};
 addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();mx=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)*2));my=Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height-.5)*2))});
 function size(){const w=el.clientWidth||300,h=el.clientHeight||400;rd.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();refit()}
 function refit(){const th=Math.tan(cam.fov*Math.PI/360),d=Math.max((fitH*1.08/2)/th,(1.1/2)/(th*cam.aspect));cam.position.set(0,fitC,d);cam.lookAt(0,fitC,0)}
 new ResizeObserver(size).observe(el);size();
 const api={cur:'idle',setState(s){state=s;api.cur=s;if(st){st.textContent=LB[s];st.className='avs '+s}}};
 function loop(now){const t=now/1000,br=Math.sin(t*1.6)*.004;
  torso.scale.y=1+br*3;head.position.y=1.7+br;
  spk+=((state==='speaking'?1:0)-spk)*.12;
  mouth.scale.y=.18+spk*(.25+.75*Math.abs(Math.sin(t*13+Math.sin(t*5)*2)))*1.3;
  head.rotation.y+=(mx*.45-head.rotation.y)*.06;
  head.rotation.x+=(my*.2+spk*Math.sin(t*3)*.05+(state==='thinking'?-.12:0)-head.rotation.x)*.06;
  head.rotation.z+=((state==='listening'?.07:0)-head.rotation.z)*.06;
  root.rotation.y+=(mx*.15-root.rotation.y)*.04;
  arms.forEach((a,i)=>{const g=spk*(.5+.5*Math.sin(t*2.2+i*1.7));a.el.rotation.x+=((-.2-g*.9)-a.el.rotation.x)*.1;a.sh.rotation.x=-g*.25});
  if(now>nb){bl=1;nb=now+2500+Math.random()*3000}bl=Math.max(0,bl-.1);eyes.scale.y=Math.max(.08,1-bl*1.4);
  if(gl&&gl.userData.ok)api.glb(now);
  rd.render(sc,cam);requestAnimationFrame(loop)}
 let gl=null,mixer=null,headBone=null,hasTrack=false,hbase=null,lastT=performance.now(),vcur='viseme_aa',vnext=0;const morphs=[],hq=new T.Quaternion(),he=new T.Euler(),VS=['viseme_aa','viseme_E','viseme_I','viseme_O','viseme_U','viseme_DD','viseme_kk','viseme_SS','viseme_nn'];
 api.glb=function(now){const dt=Math.min(.05,(now-lastT)/1000);lastT=now;mixer.update(dt);
  if(now>vnext){vcur=VS[Math.floor(Math.random()*VS.length)];vnext=now+70+Math.random()*90}
  const b=bl>0?Math.min(1,bl*1.6):0;
  morphs.forEach(m=>{const d=m.morphTargetDictionary,f=m.morphTargetInfluences;const set=(k,v,r)=>{if(k in d)f[d[k]]+=(v-f[d[k]])*(r||.35)};
   VS.forEach(k=>set(k,spk>.5&&k===vcur?.5+Math.random()*.3:0));
   set('jawOpen',spk*(.1+.28*Math.abs(Math.sin(now/95))));set('mouthSmile',state==='speaking'?.1:.2,.1);
   set('browInnerUp',state==='thinking'?.5:0,.1);set('eyeBlinkLeft',b,.6);set('eyeBlinkRight',b,.6)});
  if(headBone){if(!hasTrack)headBone.quaternion.copy(hbase);he.set(head.rotation.x*.7,head.rotation.y*.7,head.rotation.z);hq.setFromEuler(he);headBone.quaternion.multiply(hq)}};
 if(T.GLTFLoader){const ld=new T.GLTFLoader();if(typeof MeshoptDecoder!=='undefined')ld.setMeshoptDecoder(MeshoptDecoder);
  if(st)st.textContent='Loading avatar...';
  const onG=g=>{gl=g.scene;sc.add(gl);sc.remove(root);gl.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.morphTargetDictionary)morphs.push(o)}});
   headBone=gl.getObjectByName('Head');hasTrack=!!(g.animations[0]&&g.animations[0].tracks.some(t=>/^Head\./.test(t.name)));if(headBone)hbase=headBone.quaternion.clone();const bb=new T.Box3().setFromObject(gl);fitH=Math.max(1,bb.max.y-bb.min.y);fitC=(bb.max.y+bb.min.y)/2;refit();mixer=new T.AnimationMixer(gl);if(g.animations[0])mixer.clipAction(g.animations[0]).play();gl.userData.ok=1;api.setState(api.cur)};const onE=()=>api.setState(api.cur);if(window.AVATAR_B64){const bin=atob(window.AVATAR_B64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);ld.parse(u.buffer,'',onG,onE)}else ld.load('assets/models/avatar.glb',onG,undefined,onE)}
 requestAnimationFrame(loop);api.setState('idle');if(T.GLTFLoader&&st)st.textContent='Loading avatar...';return api}

const Voice={id:0,rec:null,
 pick(){const v=speechSynthesis.getVoices();return v.find(x=>/en-IN/i.test(x.lang))||v.find(x=>/^en/i.test(x.lang)&&/male|daniel|david|alex|rishi/i.test(x.name))||v.find(x=>/^en/i.test(x.lang))},
 say(text,av){return new Promise(res=>{const id=++Voice.id;av.setState('speaking');
  const done=()=>{if(id===Voice.id)av.setState('idle');res()};
  if(!('speechSynthesis' in window)){setTimeout(done,Math.min(9000,text.length*55));return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text),v=Voice.pick();if(v)u.voice=v;u.onend=done;u.onerror=done;speechSynthesis.speak(u)})},
 listen(av,on,end){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return false;
  const r=new R();r.lang='en-IN';r.interimResults=false;r.onresult=e=>on(e.results[0][0].transcript);r.onend=end;r.onerror=e=>{if(/not-allowed|service-not-allowed/.test(e.error))Voice.denied=true};Voice.rec=r;
  if('speechSynthesis' in window)speechSynthesis.cancel();av.setState('listening');r.start();return true},
 stop(){try{Voice.rec&&Voice.rec.stop()}catch(e){}}};

function wireChat(av,brain,onUser,onBot,greet){
 let started=false,live=false;const m=$('#mic'),begin=()=>{started=true;$('#go').style.display='none'};
 function rec(){if(!live||Voice.denied)return;
  const ok=Voice.listen(av,t=>turn(t),()=>{
   if(Voice.denied){live=false;m.classList.remove('on');$('#stt').textContent='Microphone is blocked. Allow it in the address bar, or type instead.';return}
   if(live&&av.cur==='listening')setTimeout(rec,300)});
  if(!ok){live=false;m.classList.remove('on');$('#stt').textContent='Voice input not supported in this browser. Please type.'}}
 async function turn(text){text=text.trim();if(!text)return;if(!started)begin();Voice.stop();onUser(text);av.setState('thinking');
  await new Promise(r=>setTimeout(r,600+Math.random()*500));const out=brain(text);onBot(out);await Voice.say(out.say,av);if(live)rec()}
 $('#go').onclick=async()=>{if(started)return;begin();const g=greet();onBot(g);await Voice.say(g.say,av);if(live)rec()};
 m.onclick=()=>{if(live){live=false;m.classList.remove('on');Voice.stop();if(av.cur==='listening')av.setState('idle');return}
  live=true;Voice.denied=false;m.classList.add('on');if(!started)begin();rec()};
 const send=()=>{const i=$('#tx');const v=i.value;i.value='';turn(v)};
 $('#sd').onclick=send;$('#tx').onkeydown=e=>{if(e.key==='Enter')send()};
 $$('[data-q]').forEach(b=>b.onclick=()=>turn(b.dataset.q))}
