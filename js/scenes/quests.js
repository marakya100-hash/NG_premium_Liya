import {createSnowmanRig} from './snowman-rig.js?v=6';
/* Illustrated story interactions. All foreground art comes from assets/art. */
const ART = new URL('../../assets/art/', import.meta.url).href;
const art = name => `${ART}${name}.webp`;
const make = (tag, cls, text) => {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const style = (el, rules) => Object.assign(el.style,rules);
const image = (name,cls='',alt='') => {const e=make('img',cls);e.src=art(name);e.alt=alt;e.draggable=false;e.decoding='async';return e;};
const buddyNames={kitten:'Котёнок',fox:'Лисёнок',dragon:'Дракончик',cat:'Котёнок'};

export function buildGiftDeck(){
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const symbols=shuffle(['star','snowflake','moon','star','snowflake','moon']);let covers;
  for(let attempt=0;attempt<100;attempt++){covers=shuffle(['gift-a','gift-b','gift-c','gift-a','gift-b','gift-c']);if(symbols.every((symbol,i)=>symbols.every((other,j)=>i===j||symbol!==other||covers[i]!==covers[j])))break;}
  if(!symbols.every((symbol,i)=>symbols.every((other,j)=>i===j||symbol!==other||covers[i]!==covers[j]))){const seen={};covers=symbols.map(symbol=>{const k=['star','snowflake','moon'].indexOf(symbol);const c=['gift-a','gift-b','gift-c'][(k+(seen[symbol]?1:0))%3];seen[symbol]=true;return c;});}
  return symbols.map((symbol,i)=>({symbol,cover:covers[i]}));
}

export function mountQuest(index,container,options={}) {
 const {easy=false,photoUrl='',photoPosition='50% 50%',childName='',buddyKey='kitten',onComplete=()=>{},onReaction=()=>{},sound={}}=options;
 let disposed=false,completed=false;
 const listeners=[],timers=new Set(),frames=new Set();
 const board=make('div',`quest-board illustrated-quest quest-${index+1}`);
 const instruction=make('p','game-instruction');
 const stage=make('div','quest-playground illustrated-stage');
 const status=make('p','game-status');status.setAttribute('aria-live','polite');
 const toolbar=make('div','quest-toolbar');
 board.append(instruction,stage,status,toolbar);container.replaceChildren(board);
 const particles=make('canvas','quest-sparkles');particles.setAttribute('aria-hidden','true');board.prepend(particles);
 const pctx=particles.getContext('2d');let motes=[],lastFrame=0,particleRunning=false;
 const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function on(el,type,fn,opt){el.addEventListener(type,fn,opt);listeners.push(()=>el.removeEventListener(type,fn,opt));}
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},ms);timers.add(id);return id;}
 function frame(fn){const id=requestAnimationFrame(t=>{frames.delete(id);if(!disposed)fn(t);});frames.add(id);}
 function resize(){particles.width=Math.max(320,board.clientWidth);particles.height=Math.max(480,board.clientHeight);}
 resize();on(window,'resize',resize);
 function burst(x=50,y=40,count=34,color='#ffe2a3') {const w=particles.width,h=particles.height;for(let i=0;i<(motionReduced?6:Math.min(count,55));i++){const a=Math.random()*Math.PI*2,s=.5+Math.random()*2.4;motes.push({x:x/100*w,y:y/100*h,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.1,life:1,size:.9+Math.random()*2.2,color});}if(!particleRunning){particleRunning=true;lastFrame=0;frame(draw);}}
 function draw(t){if(!pctx||document.hidden){motes=[];particleRunning=false;return;}const dt=Math.min(2.2,(t-lastFrame)/16.67||1);if(lastFrame&&t-lastFrame<30){frame(draw);return;}lastFrame=t;pctx.clearRect(0,0,particles.width,particles.height);motes=motes.filter(m=>m.life>0);pctx.shadowBlur=5;for(const m of motes){m.x+=m.vx*dt;m.y+=m.vy*dt;m.vy+=.012*dt;m.life-=.024*dt;pctx.globalAlpha=Math.max(0,m.life);pctx.shadowColor=m.color;pctx.fillStyle=m.color;pctx.beginPath();pctx.arc(m.x,m.y,m.size,0,Math.PI*2);pctx.fill();}pctx.globalAlpha=1;pctx.shadowBlur=0;if(motes.length)frame(draw);else particleRunning=false;}

 function note(f=660,d=.3){try{sound.note?.(f,d);}catch{}}
 function say(text){if(disposed)return;status.textContent=text;container.dispatchEvent(new CustomEvent('quest-progress',{detail:{text},bubbles:true}));}
 function react(text,emotion='happy'){say(text);try{onReaction(text,emotion);}catch{}}
 function complete(text,delay=1700){if(completed||disposed)return;completed=true;board.classList.add('quest-complete');react(text,'delighted');burst(50,40,70);board.querySelectorAll('button,input').forEach(e=>e.disabled=true);note(880,.55);later(()=>onComplete(),delay);}
 function button(label,fn,cls='game-action'){const b=make('button',cls);b.type='button';b.setAttribute('aria-label',label);b.textContent=label;on(b,'click',ev=>{if(!completed&&!disposed&&!b.disabled)fn(ev,b);});return b;}
 function artButton(label,name,fn,cls='art-object',caption=true){const b=button(label,fn,cls);b.replaceChildren(image(name,'object-art'));if(caption)b.append(make('span','object-caption',label));return b;}
 function hint(fn){toolbar.append(button('Подсказка',fn,'small-action quest-hint'));}
 function glow(el){if(!el)return;el.classList.remove('art-highlight');void el.offsetWidth;el.classList.add('art-highlight');later(()=>el.classList.remove('art-highlight'),1800);}
 function pointBurst(el){const r=el.getBoundingClientRect(),b=board.getBoundingClientRect();burst((r.left+r.width/2-b.left)/b.width*100,(r.top+r.height/2-b.top)/b.height*100);}
 function pickable(b,onSelect,onDrop){let drag=null,ghost=null,suppress=false;
  on(b,'click',()=>{if(suppress){suppress=false;return;}if(!b.disabled&&!completed)onSelect();});
  on(b,'pointerdown',e=>{if(b.disabled||completed)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};});
  on(document,'pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>9&&!drag.moved){drag.moved=true;onSelect();ghost=b.cloneNode(true);ghost.classList.add('art-drag-ghost');ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;document.body.append(ghost);}if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}if(drag.moved)e.preventDefault();},{passive:false});
  on(document,'pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;drag=null;ghost?.remove();ghost=null;if(moved){suppress=true;onDrop(document.elementFromPoint(e.clientX,e.clientY));later(()=>suppress=false,160);}});
  on(document,'pointercancel',()=>{drag=null;ghost?.remove();ghost=null;});
  listeners.push(()=>ghost?.remove());b.style.touchAction='none';
 }
 function selectOnly(list,current){list.forEach(b=>b.classList.toggle('selected',b===current));}

 if(index===0){
  instruction.textContent='Соедини сияющие звёзды — открой путь к дворцу.';
  stage.classList.add('sky-stage');
  const canvas=make('canvas','constellation-trail');canvas.setAttribute('aria-hidden','true');stage.append(canvas);
  const ctx=canvas.getContext('2d');
  const pos=easy?[[12,67],[32,48],[52,58],[67,31],[85,42]]:[[10,68],[26,49],[43,56],[57,46],[67,23],[79,31],[88,45]];
  let count=0,holding=false;const stars=[];
  const paint=()=>{const r=stage.getBoundingClientRect();canvas.width=r.width*2;canvas.height=r.height*2;ctx.scale(2,2);ctx.clearRect(0,0,r.width,r.height);ctx.strokeStyle='#f9dea5';ctx.lineWidth=2;ctx.lineCap='round';ctx.shadowColor='#ffda88';ctx.shadowBlur=17;ctx.beginPath();pos.slice(0,count).forEach(([x,y],i)=>{const px=x/100*r.width,py=y/100*r.height;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();};
  on(window,'resize',paint);later(paint,100);
  function advance(i){if(completed)return;if(i<count)return;if(i!==count){glow(stars[count]);react('Начни со звёздочки, которая зовёт тебя светом.','thoughtful');return;}stars[i].classList.add('star-collected');stars[i].setAttribute('aria-label',`Звезда ${i+1} зажжена`);pointBurst(stars[i]);note(460+i*85);count++;stars.forEach((s,j)=>s.classList.toggle('star-next',j===count));paint();if(count===pos.length){complete('Сияющая дорожка ожила! Теперь мы найдём путь к дворцу.',2400);paint();}else react(['Первая искра проснулась. Дальше светится следующая!','Звёзды складываются в дорожку. Продолжай!','Видишь, свет тянется за тобой?'][count%3]);}
  pos.forEach(([x,y],i)=>{const s=artButton(`Зажечь звезду ${i+1}`,'star',()=>advance(i),'art-object sky-star',false);s.dataset.skyStar=String(i);style(s,{left:x+'%',top:y+'%',animationDelay:(i*.19)+'s'});s.classList.toggle('star-next',i===0);stage.append(s);stars.push(s);on(s,'pointerdown',()=>{holding=true;advance(i);});});
  on(document,'pointerup',()=>holding=false);on(stage,'pointermove',e=>{if(!holding)return;const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-sky-star]');if(hit)advance(Number(hit.dataset.skyStar));});
  hint(()=>{glow(stars[count]);react('Коснись звёздочки в золотом сиянии. Я побуду рядом.','helpful');});react('Начни с первой звёздочки. Можно нажимать или вести пальцем по свету.','welcoming');
 }
 else if(index===1){
  instruction.textContent='Растопи морозный узор — зеркало хранит сюрприз.';
  stage.classList.add('mirror-stage');
  const mirror=make('div','enchanted-mirror');const opening=make('div','mirror-opening');
  const portrait=make('img','mirror-portrait');portrait.src=photoUrl;portrait.alt=childName?`Портрет ${childName}`:'Твой сказочный портрет';portrait.draggable=false;portrait.style.objectPosition=photoPosition;
  opening.append(portrait);on(portrait,'error',()=>{portrait.hidden=true;opening.append(image('star','mirror-fallback'));});
  const frost=make('canvas','frost-layer');frost.width=360;frost.height=450;frost.setAttribute('aria-hidden','true');opening.append(frost);mirror.append(opening,image('mirror-frame','mirror-frame'));stage.append(mirror);
  const ctx=frost.getContext('2d',{willReadFrequently:true});
  const g=ctx.createLinearGradient(0,0,360,450);g.addColorStop(0,'#e6f7f5');g.addColorStop(.3,'#c8e3eb');g.addColorStop(.7,'#a3c6d3');g.addColorStop(1,'#e7f3eb');ctx.fillStyle=g;ctx.fillRect(0,0,360,450);ctx.strokeStyle='#f4ffffb5';ctx.lineWidth=1.2;
  for(let i=0;i<32;i++){ctx.save();ctx.translate((i*83+14)%360,(i*97+7)%450);ctx.rotate(i*.8);for(let k=0;k<6;k++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-15-i%5*2);ctx.moveTo(0,-9);ctx.lineTo(-6,-16);ctx.moveTo(0,-9);ctx.lineTo(6,-16);ctx.stroke();}ctx.restore();}
  let down=false,strokes=0,flakes=0;let revealing=false;
  const reveal=()=>{if(revealing)return;revealing=true;mirror.classList.add('mirror-revealed');note(920,.65);burst(50,35,90);complete(childName?`${childName}, зеркало узнало тебя! Эта сказка твоя.`:'Вот кого ждала эта сказка! Добро пожаловать.',4200);};
  const check=()=>{if(revealing)return;const d=ctx.getImageData(0,0,360,450).data;let total=0,n=0;for(let y=5;y<450;y+=15)for(let x=5;x<360;x+=15){total++;if(d[(y*360+x)*4+3]<70)n++;}if(n/total>=.60)reveal();else if(n/total>.2&&strokes%24===0)react('Сквозь иней уже видно что-то знакомое. Ещё немного!');};
  const rub=e=>{if(!down||completed)return;const r=frost.getBoundingClientRect();const x=(e.clientX-r.left)*360/r.width,y=(e.clientY-r.top)*450/r.height;ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,37,0,Math.PI*2);ctx.fill();if(++strokes%8===0)check();};
  on(frost,'pointerdown',e=>{down=true;frost.setPointerCapture(e.pointerId);rub(e);});on(frost,'pointermove',rub);on(frost,'pointerup',()=>{down=false;check();});on(frost,'pointercancel',()=>{down=false;check();});
  const alternatives=make('div','frost-snowflakes');
  for(let i=0;i<3;i++){const b=artButton(`Растопить снежинку ${i+1}`,'snowflake',()=>{b.disabled=true;b.classList.add('melted');flakes++;ctx.globalCompositeOperation='destination-out';ctx.fillRect(i*120,0,122,450);pointBurst(b);note(650+flakes*110);if(flakes===3)reveal();else react('Снежинка растаяла. Посмотри, как меняется зеркало!');},'art-object frost-snowflake',false);alternatives.append(b);}stage.append(alternatives);
  if(childName)stage.append(make('p','portrait-name',childName));
  hint(()=>{const b=alternatives.querySelector('button:not(:disabled)');glow(b);react('Погладь зеркало пальцем. Или коснись трёх больших снежинок.','helpful');});react('В этом зеркале прячется тот, кого Дед Мороз ждал больше всего.','curious');
 }
 else if(index===2){
  instruction.textContent='Выбери вещь и надень её на снеговика. Можно перетаскивать или нажимать.';stage.classList.add('snowman-playground','fitted-snowman-stage');
  const scene=make('div','dressing-scene'),model=make('div','snowman-model');const rig=createSnowmanRig();model.append(rig.element);scene.append(model);stage.append(scene);
  // Reveal registered parts of one coherent illustration; no independent scaling.
  const parts=[
   {key:'hat',name:'Шляпа',target:[560,240,310,220],place:'На голову'},
   {key:'scarf',name:'Шарф',target:[615,550,290,130],place:'На шею'},
   {key:'left-mitten',name:'Левая варежка',target:[205,520,170,160],place:'На левую ручку'},
   {key:'right-mitten',name:'Правая варежка',target:[1004,660,160,160],place:'На правую ручку'},
   {key:'carrot',name:'Морковка',target:[639,368,135,110],place:'Вместо носика'},
   {key:'vest',name:'Жилетка',target:[650,700,310,210],place:'На животик'},
   {key:'broom',name:'Метла',target:[1105,455,150,310],place:'В правую ручку'}
  ];
  const count=make('p','wardrobe-count','На снеговике 0 из 7 вещей');stage.append(count);
  const tray=make('div','item-tray snowman-tray');stage.append(tray);const buttons=[],targets=[],done=new Set();let selected=null;
  function choose(i){if(done.has(i))return;selected=i;selectOnly(buttons,buttons[i]);targets.forEach((t,j)=>t.classList.toggle('target-inviting',i===j));react(`${parts[i].name}: ${parts[i].place.toLowerCase()}. Коснись светящегося места или перетащи вещь туда.`,'helpful');}
  function place(i){if(selected===null){react('Сначала выбери вещь под снеговиком.','helpful');return;}if(selected!==i){glow(targets[selected]);react('Эта вещь садится в другое место. Оно подсвечено.','helpful');return;}const part=parts[i];rig.wear(part.key);done.add(i);targets[i].disabled=true;targets[i].classList.remove('target-inviting');buttons[i].disabled=true;buttons[i].classList.add('piece-placed');buttons[i].setAttribute('aria-label',`${part.name} уже на снеговике`);selected=null;note(540+done.size*55);pointBurst(targets[i]);count.textContent=`На снеговике ${done.size} из 7 вещей`;if(done.size===7){rig.finish();instruction.textContent='Вот какой нарядный снеговик! Всё на своих местах.';complete('Ты одел нашего друга! Теперь он готов отправиться на новогодний праздник.',4000);}else react(`${part.name} на месте! Выбери следующую вещь.`,'happy');}
  parts.forEach((part,i)=>{const t=button(part.place,()=>place(i),'dressing-target');t.replaceChildren(make('span','dressing-place-label',part.place));t.dataset.dressSlot=String(i);const [x,y,w,h]=part.target;style(t,{left:x/1254*100+'%',top:y/1254*100+'%',width:w/1254*100+'%',height:h/1254*100+'%'});scene.append(t);targets.push(t);const b=make('button','art-object clothing-piece');b.type='button';b.setAttribute('aria-label',part.name);b.append(image('snowman-'+part.key,'object-art'),make('span','object-caption',part.name));buttons.push(b);tray.append(b);pickable(b,()=>choose(i),el=>{const hit=el?.closest('[data-dress-slot]');if(hit)place(Number(hit.dataset.dressSlot));else react('Отпусти вещь на подсвеченном месте снеговика.','helpful');});});
  hint(()=>{const i=selected??parts.findIndex((_,j)=>!done.has(j));if(i<0)return;choose(i);glow(buttons[i]);glow(targets[i]);});react('Нарядим снеговика вместе! Начни с любой вещи: выбери её и найди место на фигуре.','welcoming');
 }
 else if(index===3){

  instruction.textContent='Сначала посмотри мелодию. Затем нажми колокольчики в том же порядке.';stage.classList.add('bells-stage');
  const notes=easy?[0,2,1]:[0,2,1,3,2],freq=[523,659,784,1047];let progress=0,playing=false,ready=false,wrong=0;const bells=[];
  const steps=make('div','melody-steps');steps.append(make('span','','1. Нажми «Показать мелодию»'),make('span','','2. Запомни светящиеся колокольчики'),make('span','','3. Повтори их порядок'));stage.append(steps);
  const row=make('div','enchanted-bells');stage.append(row);
  const bridge=make('div','crystal-bridge');bridge.append(image('crystal-bridge','crystal-bridge-art'));stage.append(bridge);
  const score=make('div','melody-score');const beads=notes.map((_,i)=>{const bead=make('span','melody-bead',String(i+1));score.append(bead);return bead;});stage.append(score);
  function ring(i){const b=bells[i];b.classList.remove('bell-ringing');void b.offsetWidth;b.classList.add('bell-ringing');note(freq[i],.6);pointBurst(b);later(()=>b.classList.remove('bell-ringing'),900);}
  function show(){if(playing||completed)return;playing=true;ready=false;progress=0;beads.forEach(b=>b.classList.remove('played','listening'));bells.forEach(b=>b.disabled=true);replay.disabled=true;react('Сейчас мой ход. Смотри на номера колокольчиков и запоминай порядок.','listening');notes.forEach((n,i)=>later(()=>{beads.forEach(b=>b.classList.remove('listening'));beads[i].classList.add('listening');ring(n);},500+i*1100));later(()=>{playing=false;ready=true;beads.forEach(b=>b.classList.remove('listening'));bells.forEach(b=>b.disabled=false);replay.disabled=false;replay.textContent='Показать мелодию ещё раз';instruction.textContent='Теперь твой ход: повтори порядок колокольчиков.';react('Твой ход! Коснись колокольчиков в том порядке, как они загорались.','encouraging');},notes.length*1100+500);}
  function choose(i){if(playing)return;if(!ready){glow(replay);react('Сначала нажми большую кнопку «Показать мелодию». Я сыграю, а ты посмотри.','helpful');return;}ring(i);if(i!==notes[progress]){wrong++;glow(bells[notes[progress]]);react('Следующим был другой колокольчик. Я подсветил его — попробуй!','helpful');return;}beads[progress].classList.add('played');progress++;bridge.style.setProperty('--bridge-light',String(.45+progress/notes.length*.8));if(progress===notes.length){bridge.classList.add('bridge-awake');complete('Посмотри под колокольчики: хрустальный мост засиял! Теперь по нему можно пройти.',3500);}else react(`Получилось! Осталось повторить ${notes.length-progress} ${notes.length-progress===1?'ноту':'ноты'}.`,'happy');}
  for(let i=0;i<4;i++){const b=artButton(`Колокольчик ${i+1}`,'bell',()=>choose(i),'art-object enchanted-bell',false);b.append(make('span','bell-number',String(i+1)));bells.push(b);row.append(b);}
  const replay=button('Показать мелодию',show,'game-action melody-button');toolbar.prepend(replay);hint(()=>{if(playing)return;if(!ready){glow(replay);react('Начни с кнопки «Показать мелодию».','helpful');}else{glow(bells[notes[progress]]);react(`Сейчас нужен колокольчик ${notes[progress]+1}. Коснись его.`,'helpful');}});react('Чтобы зажечь мост, повторим короткую песенку. Сначала я покажу её, потом сыграешь ты.','curious');

 }
 else if(index===4){

  instruction.textContent='Полей цветок, подари ему свет и позови лёгкий ветерок.';stage.classList.add('garden-stage');let step=0,busy=false;
  const plant=make('div','enchanted-flower');plant.append(image('flower-bud','flower-bud'),image('flower-open','flower-open'));stage.append(plant);
  const needs=['water','sun','wind'],names=['Полить цветок','Подарить свет','Позвать ветер'];const need=make('p','garden-step','Шаг 1 из 3 · Полей цветок');stage.prepend(need);
  const fx=make('div','garden-effects');fx.setAttribute('aria-hidden','true');stage.append(fx);
  const tray=make('div','garden-tools');stage.append(tray);const buttons=[];
  function effect(i){fx.replaceChildren();fx.className=`garden-effects effect-${needs[i]}`;const prop=image(needs[i],'active-garden-tool');fx.append(prop);if(i===0){for(let k=0;k<24;k++){const drop=make('i','water-drop');drop.style.setProperty('--delay',(k%8*.18)+'s');drop.style.setProperty('--x',(k%6*9)+'px');fx.append(drop);}}if(i===1){fx.append(make('div','sun-beam'));for(let k=0;k<10;k++){const ray=make('i','sun-mote');ray.style.setProperty('--n',String(k));fx.append(ray);}}if(i===2){const wind=make('div','wind-ribbons');wind.innerHTML='<svg viewBox="0 0 700 300"><path d="M-40 110 C150 10 280 210 470 95 S620 55 750 110"/><path d="M-20 160 C140 60 310 260 490 150 S650 105 760 155"/><path d="M-60 215 C170 100 290 290 510 205 S660 160 750 215"/></svg>';fx.append(wind);}plant.classList.add(`care-${i+1}`);}
  function use(i){if(busy)return;if(i!==step){glow(buttons[step]);react('Начни с подсвеченного предмета внизу: сейчас цветку нужно другое.','thoughtful');return;}busy=true;buttons.forEach(b=>b.disabled=true);buttons[i].classList.add('care-used','tool-in-action');plant.scrollIntoView({block:'center',behavior:motionReduced?'instant':'smooth'});effect(i);react(['Смотри: лейка наклонилась, и капельки добрались до корней.','Тёплый луч освещает бутон. Лепестки согреваются.','Лёгкий ветерок качает цветок. Сейчас случится чудо!'][i],'gentle');note(570+i*170);later(()=>{step++;busy=false;buttons.forEach((b,j)=>b.disabled=j<step);buttons[i].classList.remove('tool-in-action');buttons[i].classList.add('tool-finished');buttons[i].querySelector('.object-caption').textContent=['Полито ✓','Согрето ✓','Ветерок позван ✓'][i];fx.replaceChildren();fx.className='garden-effects';if(step===3){plant.classList.add('flower-awake');need.textContent='Все три шага готовы';complete('Вода, свет и ветер помогли цветку раскрыться! В лепестках сияет искра.',3500);}else{need.textContent=`Шаг ${step+1} из 3 · ${names[step]}`;glow(buttons[step]);react(step===1?'Мы полили корни. Теперь выбери солнышко — подарим бутону свет.':'Цветок согрелся. Осталось позвать лёгкий ветерок.','happy');}},4200);}
  needs.forEach((name,i)=>{const b=artButton(names[i],name,()=>use(i),'art-object garden-tool');buttons.push(b);tray.append(b);});hint(()=>{if(busy)return;glow(buttons[step]);react('Выбери подсвеченный предмет внизу.','helpful');});react('Начнём с воды. Выбери лейку и посмотри, как она польёт корни.','gentle');

 }
 else if(index===5){
  instruction.textContent='Открой подарки и найди одинаковые волшебные украшения.';stage.classList.add('gifts-stage');
  const deck=buildGiftDeck();
  const grid=make('div','gift-collection');stage.append(grid);const buttons=[],solved=new Set();let first=null,locked=false,found=0;
  const show=i=>{buttons[i].classList.add('gift-open');buttons[i].setAttribute('aria-label',`Подарок ${i+1}, узор открыт`);};
  const hide=i=>{buttons[i].classList.remove('gift-open');buttons[i].setAttribute('aria-label',`Открыть подарок ${i+1}`);};
  function open(i){if(locked||solved.has(i)||first===i)return;show(i);note(600,.3);if(first===null){first=i;react('Запомни украшение. Где спряталось такое же?','curious');return;}const a=first;first=null;if(deck[a].symbol===deck[i].symbol){solved.add(a);solved.add(i);buttons[a].disabled=true;buttons[i].disabled=true;buttons[a].classList.add('gift-matched');buttons[i].classList.add('gift-matched');found++;pointBurst(buttons[i]);if(found===3)complete('Все пары нашлись! Зверята успеют приготовить подарки.',2300);else react('Вот и пара! Два украшения засияли вместе.','delighted');}else{locked=true;react('Они разные. Запомним, где лежат, и попробуем ещё.','thoughtful');later(()=>{hide(a);hide(i);locked=false;},1600);}}
  deck.forEach((d,i)=>{const b=button(`Открыть подарок ${i+1}`,()=>open(i),'art-object wrapped-gift');const bottom=image(d.cover,'gift-bottom'),lid=image(d.cover,'gift-lid'),orn=image(d.symbol,'gift-ornament');b.replaceChildren(bottom,orn,lid);grid.append(b);buttons.push(b);});
  hint(()=>{if(locked)return;let a=first;if(a===null){a=deck.findIndex((_,i)=>!solved.has(i));if(a<0)return;open(a);}const b=deck.findIndex((d,i)=>i!==a&&!solved.has(i)&&d.symbol===deck[a].symbol);if(b>=0){glow(buttons[b]);react('В этом подарке прячется такое же украшение. Открой его.','helpful');}});
  if(easy){locked=true;buttons.forEach((_,i)=>show(i));react('Украшения на миг открылись. Посмотрим и запомним.','curious');later(()=>{buttons.forEach((_,i)=>hide(i));locked=false;react('Теперь попробуй найти пары. Я рядом.','encouraging');},3500);}else react('В мастерской прячутся три пары украшений. Откроем подарки?','curious');
 }
 else if(index===6){

  const total=6;instruction.textContent='Собери звёздного лисёнка из шести частей неба.';stage.classList.add('observatory-stage','six-piece-puzzle');
  stage.append(image('telescope','illustrated-telescope'));const sky=make('div','jigsaw-sky');stage.append(sky);sky.append(image('constellation','constellation-whole'));
  const slots=make('div','constellation-slots');sky.append(slots);const tray=make('div','constellation-pieces');stage.append(tray);
  const order=[4,0,3,2,5,1];let selected=null;const done=new Set(),buttons=new Map(),targets=[];
  const slice=(key,cls)=>{const p=make('span',`constellation-slice ${cls}`);p.style.backgroundImage=`url("${art('constellation')}")`;p.style.backgroundPosition=`${key%3*50}% ${Math.floor(key/3)*100}%`;return p;};
  function choose(key){if(done.has(key))return;selected=key;buttons.forEach((b,k)=>b.classList.toggle('selected',k===key));targets.forEach((t,k)=>t.classList.toggle('target-inviting',easy&&key===k));react('Найди продолжение ушек, хвостика или сияющих линий.','curious');}
  function place(key){if(selected===null){react('Сначала выбери один кусочек неба внизу.','helpful');return;}if(selected!==key){glow(targets[selected]);react('Рисунок пока не совпал. Попробуй другое место.','thoughtful');return;}done.add(key);targets[key].replaceChildren(slice(key,'placed-slice'));targets[key].classList.add('slice-filled');targets[key].disabled=true;buttons.get(key).disabled=true;buttons.get(key).classList.add('piece-placed');pointBurst(targets[key]);selected=null;note(600+done.size*65);if(done.size===total){sky.classList.add('jigsaw-complete');complete('Все шесть кусочков соединились — звёздный лисёнок ожил!',3300);}else react(`Уже ${done.size} из 6 частей на месте!`,'happy');}
  for(let key=0;key<total;key++){const t=button(`Место звёздного рисунка ${key+1}`,()=>place(key),'jigsaw-target');t.replaceChildren(slice(key,'ghost-slice'));t.dataset.jigsawSlot=String(key);slots.append(t);targets.push(t);}
  order.forEach(key=>{const b=make('button','art-object jigsaw-piece');b.type='button';b.setAttribute('aria-label',`Часть звёздного рисунка ${key+1}`);b.append(slice(key,''));buttons.set(key,b);tray.append(b);pickable(b,()=>choose(key),el=>{const hit=el?.closest('[data-jigsaw-slot]');if(hit)place(Number(hit.dataset.jigsawSlot));});});
  hint(()=>{let key=selected;if(key===null)key=[0,1,2,3,4,5].find(k=>!done.has(k));if(key===undefined)return;choose(key);glow(buttons.get(key));glow(targets[key]);react('Я подсветил место для выбранного кусочка.','helpful');});react('Наш звёздный лисёнок разделился на шесть кусочков. Соберём его снова?','curious');

 }
 else if(index===7){

  instruction.textContent='Подбери три разные детали к таким же светящимся гнёздам.';stage.classList.add('clockwork-stage');
  const clock=make('div','illustrated-clock');clock.append(image('clock-face','clock-art'));stage.append(clock);
  const symbols=['snowflake','star','moon'],names=['Снежинка','Солнышко','Месяц'];let selected=null;const done=new Set(),buttons=[],targets=[];
  const tray=make('div','clock-parts');stage.append(tray);
  function gearPiece(key,ghost=false){const wrap=make('span',ghost?'ornate-gear gear-ghost':'ornate-gear');wrap.append(image(`gear-${key}`,'gear-art'));return wrap;}
  function choose(key){if(done.has(key))return;selected=key;selectOnly(buttons,buttons[key]);targets.forEach((t,j)=>t.classList.toggle('target-inviting',j===key));react(`Найди на часах такое же гнездо: «${names[key]}».`,'curious');}
  function place(key){if(selected===null){react('Выбери одну из трёх деталей под часами.','helpful');return;}if(selected!==key){glow(targets[selected]);react('Сравни форму и цвет. Я подсветил подходящее гнездо.','helpful');return;}done.add(key);targets[key].replaceChildren(gearPiece(symbols[key]),make('span','clock-slot-label',names[key]));targets[key].classList.add('gear-installed');targets[key].classList.remove('target-inviting');targets[key].disabled=true;buttons[key].disabled=true;buttons[key].classList.add('piece-placed');selected=null;note(480+done.size*130);pointBurst(targets[key]);if(done.size===3){wind.disabled=false;wind.classList.add('wind-ready');react('Детали стоят на месте, но ещё не движутся. Нажми большую кнопку «Завести часы».','encouraging');instruction.textContent='Все детали на месте. Теперь нажми «Завести часы».';}else react(`Готово ${done.size} из 3 деталей. Пока механизм неподвижен.`,'happy');}
  symbols.forEach((symbol,key)=>{const t=button(`Гнездо «${names[key]}»`,()=>place(key),'clock-target');t.dataset.clockSlot=String(key);t.replaceChildren(gearPiece(symbol,true),make('span','clock-slot-label',names[key]));t.style.left=[23,50,77][key]+'%';t.style.top=[54,76,54][key]+'%';targets.push(t);clock.append(t);const b=make('button','art-object clock-piece');b.type='button';b.setAttribute('aria-label',`Деталь «${names[key]}»`);b.append(gearPiece(symbol),make('span','object-caption',names[key]));buttons.push(b);tray.append(b);pickable(b,()=>choose(key),el=>{const hit=el?.closest('[data-clock-slot]');if(hit)place(Number(hit.dataset.clockSlot));});});
  const wind=button('Завести часы',()=>{wind.disabled=true;wind.classList.remove('wind-ready');wind.classList.add('handle-turn');clock.classList.add('clock-awake');instruction.textContent='Посмотри: шестерёнки закрутились — часы ожили!';[520,660,790].forEach((f,i)=>later(()=>note(f,.5),i*250));complete('Теперь механизм движется! Новогодние часы снова идут.',3600);},'game-action wind-handle wind-button');wind.prepend(image('moon','wind-key'));wind.disabled=true;toolbar.prepend(wind);
  hint(()=>{if(done.size===3){glow(wind);react('Большая золотая кнопка под деталями заводит весь механизм.','helpful');return;}let key=selected;if(key===null)key=[0,1,2].find(k=>!done.has(k));choose(key);glow(buttons[key]);glow(targets[key]);react('Форма, цвет и название совпадают. Соедини эту пару.','helpful');});react('Сначала вернём три разные шестерёнки, а потом заведём часы большой кнопкой.','curious');

 }
 else if(index===8){
  instruction.textContent='Загадай желание про себя. Коснись большой звезды три раза или удерживай её.';stage.classList.add('wish-stage');
  const tree=make('div','wish-tree');tree.append(image('tree','wish-tree-art'));stage.append(tree);
  const crown=make('div','tree-crown-star');crown.append(image('star'));tree.append(crown);
  let selected='star',charge=0,holding=false,holdStart=0,holdEpoch=0;
  const chargeButton=artButton('Передать желание звезде','star',()=>{if(holding||completed)return;charge=Math.min(1,charge+1/3);updateCharge();if(charge>=.99)release();else react('Свет становится ярче. Ещё одно прикосновение.','gentle');},'art-object wishing-star');chargeButton.disabled=false;stage.append(chargeButton);
  const progress=make('div','wish-charge-halo');chargeButton.prepend(progress);
  function updateCharge(){chargeButton.style.setProperty('--charge',`${charge*100}%`);chargeButton.classList.add('star-charging');}
  function release(){if(completed)return;holdEpoch++;holding=false;tree.classList.add('wish-received');chargeButton.classList.add('star-released');burst(50,30,120);complete('Желание отправилось к звезде. Смотри, всё вокруг наполняется светом!',4200);}
  on(chargeButton,'pointerdown',e=>{if(!selected||completed)return;holding=true;holdStart=performance.now();const current=++holdEpoch;chargeButton.setPointerCapture(e.pointerId);const start=charge;const loop=t=>{if(!holding||current!==holdEpoch||disposed||completed)return;charge=Math.min(1,start+(t-holdStart)/2000);updateCharge();if(charge>=1)release();else frame(loop);};frame(loop);});
  on(chargeButton,'pointerup',()=>{if(!holding)return;const held=performance.now()-holdStart;holding=false;holdEpoch++;if(held<300&&!completed){charge=Math.min(1,charge+1/3);updateCharge();if(charge>=.99)release();else react('Звезда почувствовала твоё желание. Коснись её ещё.','gentle');}});
  on(chargeButton,'pointercancel',()=>{holding=false;holdEpoch++;});
  on(chargeButton,'click',e=>{if(e.detail!==0)e.stopImmediatePropagation();},true);
  // Pointer interactions are handled above; keyboard clicks use the ordinary action.
  hint(()=>{glow(chargeButton);react('Загадай желание про себя. Удерживай большую звезду или коснись её три раза.','helpful');});react(`${buddyNames[buddyKey]||'Твой друг'} рядом. Загадай желание и передай звёздочке свой свет.`,'gentle');
 }
 else {instruction.textContent='Скоро здесь откроется новое чудо.';}
 later(resize,250);
 return()=>{disposed=true;timers.forEach(clearTimeout);frames.forEach(cancelAnimationFrame);listeners.splice(0).forEach(fn=>fn());container.replaceChildren();};
}
