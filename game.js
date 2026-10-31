(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const kicker = document.getElementById('panelKicker');
  const title = document.getElementById('panelTitle');
  const description = document.getElementById('panelText');
  const mainButton = document.getElementById('mainButton');
  let W = canvas.width;
  const H = canvas.height, FLOOR = 424;
  const input = {left:false,right:false,jump:false,up:false,down:false,attack:false,shoot:false};
  const justPressed = {jump:false,up:false,attack:false,shoot:false};
  // ===== בונה שלבים: כל שלב נבנה לפי מתכון משלו (אורך, מכשולים וחוק מיוחד) =====
  function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function buildLevel(def){
    const rnd=mulberry32(def.seed),R=(a,b)=>a+rnd()*(b-a),Ri=(a,b)=>Math.round(R(a,b));
    const pick=list=>{const total=list.reduce((sum,o)=>sum+o[1],0);let r=rnd()*total;for(const [v,w] of list){r-=w;if(r<=0)return v;}return list[list.length-1][0];};
    const L={...def,platforms:[],spikes:[],trees:[],soldiers:[],bases:[],ledges:[],flyers:[],power:[],checkpoints:[]};
    const from=def.from||{};
    const grav=def.gravity||1450,jumpV=(def.jump||900)*Math.sqrt(grav/1450)*(def.jumpMul||1),jumpDist=2*jumpV/grav*200*(def.speed||1),endRoom=Math.max(120,jumpDist*.6);
    let lastBase=-1e9,lastPower=0,lastCp=0,powerIdx=0;
    function fill(a,b,t,limit){
      let c=a+Ri(150,190);const maxC=Math.min(b,limit)-110,w=def.w;
      while(c<maxC){
        const kind=pick([['spike',w.spike],['tree',w.tree],['soldier',t>=(from.soldier||0)?w.soldier:0],['base',(t>=(from.base??9)&&b-a>=620&&c>a+230&&c<b-380&&c-lastBase>900)?w.base:0],['empty',w.empty]]);
        if(kind==='spike'){const n=Math.min(pick(def.spikeN.map(v=>[v,1])),Math.floor((Math.min(b,limit)-endRoom-c-34)/40)+1);if(n<1){c+=150;continue;}for(let i=0;i<n;i++)L.spikes.push(c+i*40);if(rnd()<def.ledge){const ly=Ri(278,312),lw=Ri(150,190);if(c-20+lw<=b-260)L.ledges.push([c-20,ly,lw]);}c+=n*40+Ri(def.space[0],def.space[1]);}
        else if(kind==='tree'){if(c<b-200)L.trees.push({x:c,height:Ri(165,200)});c+=Ri(def.space[0]-20,def.space[1]-20);}
        else if(kind==='soldier'){L.soldiers.push(c);if(rnd()<.35)L.soldiers.push(c+36);c+=Ri(def.space[0]+10,def.space[1]+30);}
        else if(kind==='base'){L.bases.push(c);lastBase=c;if(rnd()<.6)L.soldiers.push(c-100);c+=Ri(400,470);}
        else c+=Ri(100,200);
      }
      const room=Math.min(b,limit)-a;
      if(t>=(from.flyer||0)&&room>520){if(rnd()<def.flyer)L.flyers.push(Ri(a+220,a+room*.55));if(room>700&&rnd()<def.flyer*.6)L.flyers.push(Ri(a+room*.55,a+room-170));}
    }
    function addPower(a,b,limit){
      if(a-lastPower<def.powerEvery)return;
      for(let k=0;k<8;k++){
        const x=Ri(a+120,Math.min(b,limit)-120);
        if(L.trees.some(tr=>Math.abs(tr.x-x)<65)||L.bases.some(bx=>x>bx-170&&x<bx+120))continue;
        L.power.push([x,['heart','shield','rapid','heart'][powerIdx++%4]]);lastPower=a;return;
      }
    }
    let x=Ri(540,600);L.platforms.push([0,x]);L.trees.push({x:300,height:180});
    while(x<def.length){
      const start=x+Ri(def.gap[0],def.gap[1]),end=start+Ri(def.plat[0],def.plat[1]);
      L.platforms.push([start,end]);
      if(start-lastCp>=def.cpEvery){L.checkpoints.push(start+30);lastCp=start;}
      fill(start,end,start/def.length,end);addPower(start,end,end);
      x=end;
    }
    const fs=x+Ri(def.gap[0],def.gap[1]),width=fs+1050;
    L.platforms.push([fs,width]);L.width=width;L.bossCheckpoint=width-440;
    if(fs-lastCp>=def.cpEvery*.6)L.checkpoints.push(fs+30);
    fill(fs,width,1,L.bossCheckpoint-120);addPower(fs,width,L.bossCheckpoint-120);
    L.boss={...def.boss,x:width-180};
    return L;
  }
  const levels = [
    { name:'שלב 1 · גשר הרעל', theme:'forest', sky:['#172e57','#5b8ca4'], poison:'#8ee347', poisonDark:'#307b53', foliage:['#327b55','#70c779','#ffe9ad'],
      seed:101031040171, jump:760, length:4700, gap:[100,140], plat:[620,900], space:[230,310], w:{spike:.4,tree:.24,soldier:.32,base:0,empty:.08}, spikeN:[2,2,2,1], ledge:.1, flyer:.4, from:{soldier:.2,flyer:.4}, powerEvery:1500, cpEvery:1700,
      tip:'מתחילים! קפצו מעל הסכינים',
      boss:{name:'שומר הגשר',maxHp:3,color:'#ff9767',fire:2.8,speed:35} },
    { name:'שלב 2 · בסיס המדבר', theme:'desert', sky:['#6b3863','#e7a562'], poison:'#efb15e', poisonDark:'#ab604b', foliage:['#5d8871','#b4bd7c','#ffe5a1'],
      seed:202330120155, length:5600, gap:[110,150], plat:[650,1000], space:[190,270], w:{spike:.3,tree:.14,soldier:.24,base:.3,empty:.06}, spikeN:[2,2,3], ledge:.55, flyer:.4, from:{soldier:.08,flyer:.25,base:.2}, powerEvery:1500, cpEvery:1800,
      hazard:'rock', hazardEvery:3.6, tip:'סלעים נופלים! קפצו כשרואים !',
      boss:{name:'מלך הסכינים',maxHp:5,color:'#f768a4',fire:2.8,speed:50} },
    { name:'שלב 3 · מעבר הקרח', theme:'ice', sky:['#1d517c','#9ad9e8'], poison:'#79d4e4', poisonDark:'#2d809b', foliage:['#478ca1','#a6e0d7','#f7fbff'],
      seed:303003057008, length:6400, gap:[130,190], plat:[700,1050], space:[200,280], w:{spike:.38,tree:.14,soldier:.3,base:0,empty:.06}, spikeN:[2,3,3,1], ledge:.3, flyer:.6, from:{soldier:.05,flyer:.15}, powerEvery:1600, cpEvery:1900,
      speed:1.2, slip:true, tip:'קרח חלק! רצים מהר יותר',
      boss:{name:'שומר הקרח',maxHp:5,color:'#79dce9',fire:2.8,speed:48} },
    { name:'שלב 4 · מפעל הלבה', theme:'lava', sky:['#4a1d40','#de654d'], poison:'#ff944b', poisonDark:'#a6393d', foliage:['#684d5c','#b77468','#ffd89a'],
      seed:404004005008, length:7200, gap:[130,170], plat:[560,900], space:[170,250], w:{spike:.42,tree:.1,soldier:.24,base:.3,empty:.05}, spikeN:[2,3,3], ledge:.35, flyer:.45, from:{soldier:.05,flyer:.2,base:.15}, powerEvery:1500, cpEvery:1800,
      hazard:'fireball', hazardEvery:2.8, tip:'כדורי אש נופלים! שימו לב ל־!',
      boss:{name:'שומר הלבה',maxHp:5,color:'#ffb061',fire:2.7,speed:50} },
    { name:'שלב 5 · מצודת הלילה', theme:'neon', sky:['#151638','#574da2'], poison:'#c77dff', poisonDark:'#5c3b9b', foliage:['#3b6f9b','#6fc9c7','#ffe0f4'],
      seed:505007012007, length:8000, gap:[120,170], plat:[650,1050], space:[160,240], w:{spike:.3,tree:.1,soldier:.3,base:.32,empty:.03}, spikeN:[2,3,3], ledge:.3, flyer:.6, from:{soldier:.03,flyer:.1,base:.1}, powerEvery:1400, cpEvery:1800,
      hazard:'bolt', hazardEvery:2.5, tip:'ברקים! קפצו כשהאזהרה מהבהבת',
      boss:{name:'מפקד המצודה',maxHp:6,color:'#c790ff',fire:2.6,speed:55} },
    { name:'שלב 6 · תחנת החלל', theme:'space', sky:['#05061a','#2b1b66'], poison:'#ff5fd2', poisonDark:'#68167f', foliage:['#2d4a7a','#58b4d9','#e8f6ff'],
      seed:606025005037, length:9000, gap:[170,250], plat:[700,1100], space:[200,290], w:{spike:.34,tree:.08,soldier:.28,base:.3,empty:.04}, spikeN:[3,3,4,2], ledge:.4, flyer:.65, from:{soldier:.03,flyer:.08,base:.1}, powerEvery:1400, cpEvery:1900,
      gravity:900, jumpMul:1.12, hazard:'meteor', hazardEvery:2.4, tip:'כבידה נמוכה! קפיצות גבוהות',
      boss:{name:'מלך הגלקסיה',maxHp:8,color:'#5ff0d0',fire:2.4,speed:60} }
  ].map(buildLevel);
  let mode='intro', levelIndex=0, level=levels[0], player, boss, soldiers=[], bases=[], missiles=[], playerShots=[], soldierShots=[], projectiles=[], particles=[];
  let camera=0, time=0, lastTime=0, message='', messageTimer=0, shake=0;

  // ===== תוספות: ניקוד, מטבעות, בונוסים, צלילים, הפסקה =====
  const pauseBtn=document.getElementById('pauseBtn'), muteBtn=document.getElementById('muteBtn');
  let score=0, best=0, combo=0, comboTimer=0, collected=new Set(), collectedLevel=-1, levelStartScore=0;
  let snap={score:0,collected:new Set()}, hazards=[], hazardTimer=4, nextMessage='', coins=[], coinTotal=0, powerups=[], flyers=[], popups=[], muted=false, audioCtx=null, musicStep=0, panelAt=0;
  try{best=+localStorage.getItem('mchogim-best')||0;muted=localStorage.getItem('mchogim-muted')==='1';}catch(e){}
  function saveBest(){if(score>best){best=score;try{localStorage.setItem('mchogim-best',String(best));}catch(e){}}}

  // צלילים (נוצרים בקוד, בלי קבצים)
  function audio(){
    if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}
    if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();
    return audioCtx;
  }
  function tone(freq,dur,type='square',vol=.05,slide=0,delay=0){
    if(muted)return;const a=audio();if(!a)return;
    const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.03);
  }
  const sounds={
    jump:()=>tone(330,.16,'square',.04,330),
    shoot:()=>tone(880,.09,'sawtooth',.03,-500),
    slash:()=>tone(240,.12,'sawtooth',.05,-120),
    coin:()=>{tone(988,.07,'square',.04);tone(1319,.14,'square',.04,0,.07);},
    hurt:()=>tone(200,.3,'sawtooth',.07,-140),
    clang:()=>tone(1200,.08,'triangle',.05,-300),
    kill:()=>{tone(520,.08,'square',.045,-200);tone(260,.12,'square',.045,0,.07);},
    power:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.1,'triangle',.06,0,i*.07)),
    boom:()=>tone(120,.4,'sawtooth',.08,-90),
    roar:()=>tone(90,.6,'sawtooth',.08,60),
    checkpoint:()=>[659,784,988].forEach((f,i)=>tone(f,.12,'triangle',.06,0,i*.09)),
    win:()=>[523,659,784,659,784,1047].forEach((f,i)=>tone(f,.16,'square',.045,0,i*.11)),
    lose:()=>[392,330,262,196].forEach((f,i)=>tone(f,.2,'triangle',.07,0,i*.15))
  };
  function sfx(name){sounds[name]?.();}
  // מוזיקת רקע קטנה, שונה בכל שלב
  const musicRoots=[196,220,185,165,208,175], musicPattern=[0,null,4,null,7,null,12,7,9,null,5,null,7,4,2,null];
  setInterval(()=>{
    if(mode!=='playing'||muted)return;
    const root=musicRoots[levelIndex]||196,n=musicPattern[musicStep%16];
    if(n!==null)tone(root*Math.pow(2,n/12),.2,'triangle',.02);
    if(musicStep%4===0)tone(root/2,.3,'sine',.035);
    musicStep++;
  },230);

  function addScore(n,x,y,kill=false){
    if(kill){combo=comboTimer>0?Math.min(5,combo+1):1;comboTimer=3;n*=combo;}
    score+=n;
    popups.push({x,y,text:`+${n}`+(kill&&combo>1?` x${combo}`:''),life:1.1,color:kill&&combo>1?'#ff9fc0':'#fff3a9'});
  }
  function killSoldier(s){s.alive=false;burst(s.x,s.y,'#a8dfff',16);sfx('kill');addScore(100,s.x,s.y-34,true);}
  function killFlyer(f){f.alive=false;burst(f.x,f.y,f.color,18);sfx('kill');addScore(80,f.x,f.y-28,true);}
  function applyPower(type,x,y){
    sfx('power');burst(x,y,'#ffffff',16);
    if(type==='heart'){if(player.hp<player.maxHp){player.hp++;message='לב נוסף!';}else{addScore(100,x,y-24);message='הלבבות מלאים! +100';}}
    else if(type==='shield'){player.shield=7;message='מגן! 7 שניות בלי פגיעות';}
    else{player.rapid=8;message='ירי מהיר! 8 שניות';}
    messageTimer=1.8;
  }
  // מטבעות נוצרים אוטומטית: קשתות מעל הסכינים, שורות על הגשר, מדפים, וענפי עצים
  const coinCache={};
  function makeCoins(index){
    if(coinCache[index])return coinCache[index];
    const lv=levels[index],list=[],add=(x,y)=>list.push({id:list.length,x:Math.round(x),y:Math.round(y)});
    const groups=[];
    for(const s of [...lv.spikes].sort((a,b)=>a-b)){const g=groups[groups.length-1];if(g&&s-g[g.length-1]<110)g.push(s);else groups.push([s]);}
    const arcs=groups.map(g=>(g[0]+g[g.length-1]+34)/2);
    for(const cx of arcs)for(let i=-2;i<=2;i++)add(cx+i*34,FLOOR-52-(1-(i/2)**2)*58);
    const baseZones=(lv.bases||[]).map(x=>[x-150,x+100]);
    for(const [a,b] of lv.platforms)for(let x=a+130;x<b-100;x+=190){
      if(x>=lv.bossCheckpoint-40||arcs.some(c=>Math.abs(c-x)<110)||lv.trees.some(t=>Math.abs(t.x-x)<50)||baseZones.some(([l,r])=>x>l&&x<r))continue;
      add(x,FLOOR-48);
    }
    for(const [x,y,w] of lv.ledges||[])for(let i=0;i<3;i++)add(x+w*(.2+i*.3),y-42);
    for(const t of lv.trees)if(t.x<lv.bossCheckpoint)add(t.x,FLOOR-t.height+70-48);
    return coinCache[index]=list;
  }
  // סכנות נופלות: סימן אזהרה על הרצפה, ואז משהו נופל. קפצו כדי לחמוק!
  const hazardKinds={
    rock:{color:'#c98f5d',glow:'#e8c9a0',r:20,speed:520,warn:.85,shock:46},
    fireball:{color:'#ff8a3d',glow:'#ffd27a',r:16,speed:560,warn:.8,shock:58},
    bolt:{color:'#f4f0ff',glow:'#c9b6ff',r:10,speed:2200,warn:1,shock:56},
    meteor:{color:'#9fa8ff',glow:'#d7dbff',r:18,speed:430,warn:.9,shock:52,drift:-120}
  };
  function updateHazards(dt){
    if(level.hazard&&player.x>420&&player.x<level.bossCheckpoint-200){
      hazardTimer-=dt;
      if(hazardTimer<=0){
        const k=hazardKinds[level.hazard],fallT=FLOOR/k.speed;
        const tx=player.x+(Math.abs(player.vx)>20?player.vx:0)*(k.warn+fallT)+(Math.random()-.5)*140;
        if(level.platforms.some(([a,b])=>tx>a+40&&tx<b-40)){
          hazardTimer=level.hazardEvery*(.8+Math.random()*.5);
          hazards.push({kind:level.hazard,tx,x:tx-(k.drift||0)*fallT,y:-40,vx:k.drift||0,t:k.warn,fall:false});
        }else hazardTimer=.4;
      }
    }
    for(let i=hazards.length-1;i>=0;i--){
      const h=hazards[i],k=hazardKinds[h.kind];
      if(!h.fall){h.t-=dt;if(h.t<=0)h.fall=true;continue;}
      h.x+=h.vx*dt;h.y+=k.speed*dt;
      if(Math.abs(player.x-h.x)<player.w/2+k.r&&Math.abs(player.y-h.y)<player.h/2+k.r)damage(1,h.x);
      if(h.y>=FLOOR-k.r){
        hazards.splice(i,1);burst(h.x,FLOOR-6,k.color,18);shake=Math.max(shake,5);sfx('boom');
        if(Math.abs(player.x-h.x)<k.shock&&player.y+player.h/2>FLOOR-26)damage(1,h.x);
      }
    }
  }
  function togglePause(){
    if(mode==='playing'){mode='paused';setPanel('הפסקה','מנוחה קטנה','המשחק מחכה לך. מוכנים להמשיך?','להמשיך ←',()=>{mode='playing';hidePanel();});}
    else if(mode==='paused'){mode='playing';hidePanel();}
  }
  function refreshButtons(){muteBtn.textContent=muted?'🔇':'🔊';}
  muteBtn.onclick=()=>{muted=!muted;try{localStorage.setItem('mchogim-muted',muted?'1':'0');}catch(e){}refreshButtons();muteBtn.blur();if(!muted)sfx('coin');};
  pauseBtn.onclick=()=>{togglePause();pauseBtn.blur();};
  refreshButtons();
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
  function newGame(){score=0;collectedLevel=-1;collected=new Set();startLevel(0);}
  function resizeCanvas(){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const nextWidth=Math.round(H*rect.width/rect.height);
    if(Math.abs(nextWidth-W)>2){W=nextWidth;canvas.width=W;camera=Math.max(0,Math.min(level.width-W,camera));}
  }
  window.addEventListener('resize',resizeCanvas);
  window.visualViewport?.addEventListener('resize',resizeCanvas);
  function setPanel(k,t,d,b,action){kicker.textContent=k;title.textContent=t;description.textContent=d;mainButton.textContent=b;mainButton.onclick=action;panelAt=performance.now();overlay.classList.remove('hidden');}
  function hidePanel(){overlay.classList.add('hidden');}
  function startLevel(index, checkpointX=85){
    levelIndex=index; level=levels[index]; mode='playing'; hidePanel();
    if(collectedLevel!==index){collectedLevel=index;collected=new Set();levelStartScore=score;}
    else if(checkpointX<=85){collected=new Set();score=levelStartScore;}
    else{score=snap.score;collected=new Set(snap.collected);} // חזרה מנקודת שמירה: הניקוד והמטבעות חוזרים למצב באותה נקודה
    const allCoins=makeCoins(index);coinTotal=allCoins.length;coins=allCoins.filter(c=>!collected.has(c.id)).map(c=>({...c}));
    flyers=(level.flyers||[]).filter(x=>x>checkpointX+100).map((x,i)=>({x,y:FLOOR-78,baseY:FLOOR-78,t:i*1.3,alive:true,face:-1,color:level.boss.color}));
    powerups=(level.power||[]).filter(([x])=>x>checkpointX+100).map(([x,type])=>({x,y:FLOOR-72,type}));
    popups=[];combo=0;comboTimer=0;
    const hearts=index===0?3:5;
    player={x:checkpointX,y:FLOOR-31,w:32,h:62,vx:0,vy:0,face:1,onGround:false,climbing:false,jumpBuffer:0,coyote:0,hp:hearts,maxHp:hearts,inv:0,shield:0,rapid:0,shieldFlash:0,attack:0,attackCd:0,shootCd:0,checkpoint:checkpointX,cpPassed:level.checkpoints.filter(c=>c<=checkpointX).length,safeX:checkpointX,safePlat:0,bossCheckpointOn:checkpointX>=level.bossCheckpoint};
    boss={...level.boss,hp:level.boss.maxHp,startX:level.boss.x,y:FLOOR-52,w:75,h:104,dir:-1,shotTimer:2.4,hitFlash:0,hitCooldown:0,alive:true,enraged:false};
    soldiers=level.soldiers.filter(x=>x>checkpointX+100).map((x,i)=>({x,y:FLOOR-35,alive:true,fireTimer:2.5+i*.35,face:-1}));
    bases=(level.bases||[]).filter(x=>x>checkpointX+100).map(x=>({x,hp:10,maxHp:10,fireTimer:2.2,flash:0}));
    missiles=[];playerShots=[];soldierShots=[];projectiles=[];particles=[];camera=0;message=level.name;messageTimer=2.3;nextMessage=level.tip||'';hazards=[];hazardTimer=4;time=0;
  }
  function press(control,down){if(!Object.hasOwn(input,control))return;if(down&&!input[control]&&justPressed[control]!==undefined)justPressed[control]=true;input[control]=down;}
  const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyX:'attack',KeyJ:'attack',KeyZ:'shoot',KeyC:'shoot'};
  window.addEventListener('keydown',e=>{
    audio();
    if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();if(!e.repeat)togglePause();return;}
    // כשיש חלון על המסך, רווח או Enter לוחצים על הכפתור הראשי
    if(mode!=='playing'&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();if(!e.repeat&&performance.now()-panelAt>900)mainButton.click();return;}
    const control=keyMap[e.code];if(control){e.preventDefault();press(control,true);}
  });
  window.addEventListener('pointerdown',()=>audio());
  window.addEventListener('keyup',e=>{const control=keyMap[e.code];if(control){e.preventDefault();press(control,false);}});
  window.addEventListener('blur',()=>{for(const k in input)input[k]=false;});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);press('jump',true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{e.preventDefault();press('jump',false);});
  document.querySelectorAll('[data-control]').forEach(button=>{
    const control=button.dataset.control;
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add('pressed');press(control,true);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{e.preventDefault();button.classList.remove('pressed');press(control,false);});
  });
  function damage(amount,fromX,fall=false){
    if(player.inv>0||mode!=='playing')return;
    if(player.shield>0&&!fall){if(player.shieldFlash<=0){player.shieldFlash=.3;burst(player.x,player.y,'#8fe3ff',8);sfx('clang');}return;}
    player.hp-=amount;player.inv=1.15;shake=9;combo=0;comboTimer=0;sfx('hurt');
    burst(player.x,player.y,'#ff777d',14);
    if(player.hp<=0){
      const retryX=player.bossCheckpointOn?level.bossCheckpoint:player.checkpoint;
      saveBest();sfx('lose');
      mode='dead';setPanel('המשחק נעצר','ננסה שוב?',`נגמרו החיים. מתחילים שוב מנקודת השמירה עם כל הלבבות.\nניקוד: ${score} · שיא: ${best}`,'שוב מנקודת השמירה ←',()=>startLevel(levelIndex,retryX));return;
    }
    if(fall){player.x=Math.max(player.safePlat+30,player.safeX-80);player.y=FLOOR-100;player.vx=0;player.vy=0;player.climbing=false;message='נפלת לרעל!';messageTimer=1.2;}
    else{player.climbing=false;player.vx=fromX<player.x?180:-180;player.vy=-390;}
  }
  function burst(x,y,color,count){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=50+Math.random()*180;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:.35+Math.random()*.35,color});}}
  function hitBoss(){
    if(!boss.alive||boss.hitCooldown>0||player.x<level.bossCheckpoint)return false;
    boss.hp--;boss.hitFlash=.25;boss.hitCooldown=.75;shake=5;burst(boss.x,boss.y,boss.color,12);sfx('kill');
    if(boss.hp>0)addScore(150,boss.x,boss.y-100,true);
    if(boss.hp<=0){boss.alive=false;projectiles=[];soldierShots=[];missiles=[];burst(boss.x,boss.y,boss.color,38);mode='cleared';
      sfx('boom');setTimeout(()=>sfx('win'),350);
      addScore(1000,boss.x,boss.y-100);
      const got=collected.size,ratio=coinTotal?got/coinTotal:1,stars=ratio>=.7?3:ratio>=.4?2:1;
      score+=stars*250;
      const newBest=score>best;saveBest();
      const starText='★'.repeat(stars)+'☆'.repeat(3-stars);
      const stats=`${starText}\nמטבעות: ${got}/${coinTotal} · ניקוד: ${score}\n${newBest?'שיא חדש! 🎉':`השיא שלך: ${best}`}`;
      if(levelIndex<levels.length-1)setPanel('הבוס הובס',`שלב ${levelIndex+1} הושלם!`,stats+(stars<3?'\nאספו עוד מטבעות כדי להשיג 3 כוכבים!':'\nמושלם! קיבלת את כל הכוכבים!'),'לשלב הבא ←',()=>startLevel(levelIndex+1));
      else setPanel('ניצחון!','סיימת את המשחק!',`המחוג עבר את ששת השלבים והביס את כל הבוסים!\n${stats}`,'לשחק מהתחלה ←',newGame);
    }
    return true;
  }
  function attackBoss(){
    if(player.attackCd>0)return;
    player.attack=.22;player.attackCd=player.rapid>0?.22:.43;sfx('slash');
    const dx=boss.x-player.x;
    if(boss.alive&&Math.abs(dx)<165&&Math.abs(boss.y-player.y)<115)hitBoss();
    for(const soldier of soldiers){if(soldier.alive&&Math.abs(soldier.x-player.x)<75&&Math.abs(soldier.y-player.y)<75)killSoldier(soldier);}
    for(const f of flyers){if(f.alive&&Math.abs(f.x-player.x)<95&&Math.abs(f.y-player.y)<90)killFlyer(f);}
  }
  function shoot(){
    if(player.shootCd>0)return;
    player.shootCd=player.rapid>0?.11:.28;sfx('shoot');
    playerShots.push({x:player.x+player.face*24,y:player.y-7,vx:player.face*520,life:1.1});
    burst(player.x+player.face*24,player.y-7,'#fff1a5',3);
  }
  function update(dt){
    time+=dt;
    if(mode!=='playing')return;
    if(messageTimer>0)messageTimer-=dt;else if(nextMessage){message=nextMessage;messageTimer=3.2;nextMessage='';}
    if(shake>0)shake=Math.max(0,shake-25*dt);
    player.inv=Math.max(0,player.inv-dt);player.attack=Math.max(0,player.attack-dt);player.attackCd=Math.max(0,player.attackCd-dt);player.shootCd=Math.max(0,player.shootCd-dt);
    player.shield=Math.max(0,player.shield-dt);player.rapid=Math.max(0,player.rapid-dt);player.shieldFlash=Math.max(0,player.shieldFlash-dt);
    comboTimer=Math.max(0,comboTimer-dt);if(comboTimer===0)combo=0;
    player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
    player.coyote=player.onGround ? .12 : Math.max(0,player.coyote-dt);
    const explicitMove=(input.right?1:0)-(input.left?1:0);
    const blockingBase=bases.find(base=>base.hp>0&&player.x>=base.x-145&&player.x<base.x+95);
    const move=input.left?-1:blockingBase?0:1;
    const nearTree=level.trees.find(tree=>Math.abs(player.x-tree.x)<33&&player.y+player.h/2>=FLOOR-tree.height+65&&player.y-player.h/2<FLOOR);
    if(justPressed.jump||justPressed.up&&!nearTree)player.jumpBuffer=.16;
    if(!player.climbing&&nearTree&&(input.up||input.down))player.climbing=true;
    if(player.climbing){
      const tree=level.trees.find(t=>Math.abs(player.x-t.x)<42);
      if(!tree||explicitMove||justPressed.jump){if(justPressed.jump)player.coyote=.12;player.climbing=false;}
      else{
        const branchY=FLOOR-tree.height+70;
        player.x+=(tree.x-player.x)*Math.min(1,dt*12);
        player.y=Math.max(branchY-player.h/2,Math.min(FLOOR-player.h/2,player.y+((input.down?1:0)-(input.up?1:0))*185*dt));
        player.vx=0;player.vy=0;player.onGround=player.y<=branchY-player.h/2+1||player.y>=FLOOR-player.h/2-1;
      }
    }
    if(!player.climbing){
      if(move){player.face=move;const target=move*(W<500?150:200)*(level.speed||1);player.vx=level.slip?player.vx+(target-player.vx)*Math.min(1,dt*(player.onGround?2.6:1.4)):target;}else player.vx*=Math.pow(level.slip?.3:.07,dt);
      if(level.slip&&player.onGround&&Math.abs(player.vx)>120&&Math.random()<.3)particles.push({x:player.x-12,y:FLOOR-3,vx:-50,vy:-40,life:.4,color:'#e4faff'});
      if(player.jumpBuffer>0&&player.coyote>0){player.vy=(levelIndex===0?(W<500?-950:-760):(W<500?-1050:-900))*Math.sqrt((level.gravity||1450)/1450)*(level.jumpMul||1);player.onGround=false;player.coyote=0;player.jumpBuffer=0;burst(player.x,player.y+30,'#d1efff',6);sfx('jump');}
    }
    if(justPressed.attack||input.attack&&player.attackCd===0)attackBoss();
    if(justPressed.shoot||input.shoot&&player.shootCd===0)shoot();
    justPressed.jump=false;justPressed.up=false;justPressed.attack=false;justPressed.shoot=false;
    const previousBottom=player.y+player.h/2;
    if(!player.climbing){player.vy+=(level.gravity||1450)*dt;player.x=Math.max(16,Math.min(level.width-16,player.x+player.vx*dt));player.y+=player.vy*dt;player.onGround=false;}
    const bottom=player.y+player.h/2;
    if(!player.climbing&&player.vy>=0){
      for(const tree of level.trees){const branchY=FLOOR-tree.height+70;if(previousBottom<=branchY+6&&bottom>=branchY&&Math.abs(player.x-tree.x)<50){player.y=branchY-player.h/2;player.vy=0;player.onGround=true;break;}}
      if(!player.onGround)for(const [x,y,width] of level.ledges||[]){if(previousBottom<=y+6&&bottom>=y&&player.x+player.w/2>x&&player.x-player.w/2<x+width){player.y=y-player.h/2;player.vy=0;player.onGround=true;break;}}
    }
    if(!player.climbing&&player.vy>=0&&previousBottom<=FLOOR+8&&bottom>=FLOOR){
      for(const [a,b] of level.platforms){if(player.x+player.w/2>a&&player.x-player.w/2<b){player.y=FLOOR-player.h/2;player.vy=0;player.onGround=true;player.safeX=player.x;player.safePlat=a;break;}}
    }
    if(player.y>H+35)damage(1,player.x,true);
    for(const x of level.spikes){if(Math.abs(player.x-(x+17))<player.w/2+14&&player.y+player.h/2>FLOOR-21&&player.y-player.h/2<FLOOR)damage(1,x+17);}
    while(player.cpPassed<level.checkpoints.length&&player.x>=level.checkpoints[player.cpPassed]){player.checkpoint=level.checkpoints[player.cpPassed++];snap={score,collected:new Set(collected)};message='נקודת שמירה!';messageTimer=1.6;sfx('checkpoint');}
    if(!player.bossCheckpointOn&&player.x>=level.bossCheckpoint){player.bossCheckpointOn=true;player.checkpoint=level.bossCheckpoint;snap={score,collected:new Set(collected)};player.hp=player.maxHp;message='בוס! קפצו עליו או תקפו כמה פעמים';messageTimer=3.5;sfx('roar');}
    for(let i=coins.length-1;i>=0;i--){const c=coins[i];if(Math.abs(player.x-c.x)<30&&Math.abs(player.y-c.y)<player.h/2+14){coins.splice(i,1);collected.add(c.id);addScore(10,c.x,c.y-18);sfx('coin');burst(c.x,c.y,'#ffe27a',5);}}
    for(let i=powerups.length-1;i>=0;i--){const p=powerups[i];if(Math.abs(player.x-p.x)<34&&Math.abs(player.y-p.y)<player.h/2+18){powerups.splice(i,1);applyPower(p.type,p.x,p.y);}}
    for(const f of flyers){
      if(!f.alive)continue;
      f.t+=dt;f.y=f.baseY+Math.sin(f.t*3)*10;
      if(Math.abs(player.x-f.x)<460){f.face=player.x<f.x?-1:1;f.x+=f.face*55*dt;}
      const fdx=Math.abs(player.x-f.x);
      if(fdx<38){
        if(player.vy>0&&!player.climbing&&bottom<=f.y+2&&bottom>=f.y-26){killFlyer(f);player.vy=-520;player.onGround=false;}
        else if(fdx<28&&Math.abs(player.y-f.y)<46)damage(1,f.x);
      }
    }
    for(let i=popups.length-1;i>=0;i--){const p=popups[i];p.y-=45*dt;p.life-=dt;if(p.life<=0)popups.splice(i,1);}
    updateHazards(dt);
    if(boss.alive&&player.x>=level.bossCheckpoint&&player.vy>0&&previousBottom<=boss.y-35&&bottom>=boss.y-43&&Math.abs(player.x-boss.x)<45){
      player.y=boss.y-43-player.h/2;player.vy=-520;player.onGround=false;player.inv=Math.max(player.inv,.35);hitBoss();
    }
    for(let i=playerShots.length-1;i>=0;i--){
      const shot=playerShots[i];shot.x+=shot.vx*dt;shot.life-=dt;
      if(shot.life<=0||shot.x<0||shot.x>level.width){playerShots.splice(i,1);continue;}
      const soldier=soldiers.find(s=>s.alive&&Math.abs(s.x-shot.x)<22&&Math.abs(s.y-shot.y)<36);
      if(soldier){killSoldier(soldier);playerShots.splice(i,1);continue;}
      const flyer=flyers.find(f=>f.alive&&Math.abs(f.x-shot.x)<26&&Math.abs(f.y-shot.y)<50);
      if(flyer){killFlyer(flyer);playerShots.splice(i,1);continue;}
      const missile=missiles.find(m=>Math.hypot(m.x-shot.x,m.y-shot.y)<19);
      if(missile){missiles.splice(missiles.indexOf(missile),1);burst(missile.x,missile.y,'#ffd47b',8);addScore(30,missile.x,missile.y-20);sfx('kill');playerShots.splice(i,1);continue;}
      const base=bases.find(b=>b.hp>0&&Math.abs(b.x-shot.x)<58&&shot.y>FLOOR-139&&shot.y<FLOOR-7);
      if(base){base.hp--;base.flash=.2;burst(shot.x,shot.y,'#ffe39a',5);playerShots.splice(i,1);if(base.hp===0){burst(base.x,FLOOR-70,'#ffcb68',32);sfx('boom');addScore(500,base.x,FLOOR-150);message='המפקדה נהרסה! ממשיכים קדימה';messageTimer=2.3;}continue;}
      if(boss.alive&&player.x>=level.bossCheckpoint&&Math.abs(boss.x-shot.x)<40&&Math.abs(boss.y-shot.y)<60){playerShots.splice(i,1);hitBoss();}
    }
    for(const base of bases){
      if(base.hp<=0)continue;
      base.flash=Math.max(0,base.flash-dt);
      if(Math.abs(player.x-base.x)>610)continue;
      base.fireTimer-=dt;
      if(base.fireTimer<=0){const dx=player.x-(base.x-55),dy=player.y-(FLOOR-98),distance=Math.hypot(dx,dy)||1;base.fireTimer=4.4;missiles.push({x:base.x-55,y:FLOOR-98,vx:dx/distance*185,vy:dy/distance*185,r:12,life:4});}
    }
    for(let i=missiles.length-1;i>=0;i--){const missile=missiles[i];missile.x+=missile.vx*dt;missile.y+=missile.vy*dt;missile.life-=dt;
      if(missile.life<=0||missile.y>H+20){missiles.splice(i,1);continue;}
      if(Math.abs(player.x-missile.x)<player.w/2+missile.r&&Math.abs(player.y-missile.y)<player.h/2+missile.r){damage(1,missile.x);missiles.splice(i,1);}
    }
    for(const soldier of soldiers){
      if(!soldier.alive||Math.abs(player.x-soldier.x)>420)continue;
      soldier.face=player.x<soldier.x?-1:1;soldier.fireTimer-=dt;
      if(soldier.fireTimer<=0){soldier.fireTimer=3.5;soldierShots.push({x:soldier.x+soldier.face*24,y:soldier.y-5,vx:soldier.face*180,r:8,life:3});}
      const soldierTop=soldier.y-46;
      if(Math.abs(player.x-soldier.x)<36&&player.vy>0&&!player.climbing&&previousBottom<=soldierTop+8&&bottom>=soldierTop){killSoldier(soldier);player.vy=-520;player.onGround=false;continue;}
      if(Math.abs(player.x-soldier.x)<28&&Math.abs(player.y-soldier.y)<51)damage(1,soldier.x);
    }
    for(let i=soldierShots.length-1;i>=0;i--){
      const shot=soldierShots[i];shot.x+=shot.vx*dt;shot.life-=dt;
      if(shot.life<=0||shot.x<0||shot.x>level.width){soldierShots.splice(i,1);continue;}
      if(Math.abs(player.x-shot.x)<player.w/2+shot.r&&Math.abs(player.y-shot.y)<player.h/2+shot.r){damage(1,shot.x);soldierShots.splice(i,1);}
    }
    if(boss.alive&&player.x>level.width-440){
      boss.shotTimer-=dt;boss.hitFlash=Math.max(0,boss.hitFlash-dt);boss.hitCooldown=Math.max(0,boss.hitCooldown-dt);
      boss.dir=player.x<boss.x?-1:1;
      const desired=Math.max(level.width-340,Math.min(level.width-100,player.x+boss.dir*-65));
      boss.x+=Math.sign(desired-boss.x)*Math.min(Math.abs(desired-boss.x),boss.speed*dt);
      if(levelIndex>0&&!boss.enraged&&boss.hp<=Math.ceil(boss.maxHp/2)){boss.enraged=true;message='הבוס כועס! עכשיו הוא יורה שלוש פעמים';messageTimer=2.6;shake=8;sfx('roar');}
      if(boss.shotTimer<=0){
        boss.shotTimer=boss.fire*(boss.enraged?.75:1);
        const angle=Math.atan2(player.y-boss.y,player.x-boss.x),speed=boss.enraged?245:230;
        for(const spread of boss.enraged?[-.3,0,.3]:[0])projectiles.push({x:boss.x+boss.dir*35,y:boss.y-10,vx:Math.cos(angle+spread)*speed,vy:Math.sin(angle+spread)*speed,r:12,life:3});
      }
      if(Math.abs(player.x-boss.x)<49&&player.y>boss.y-45&&player.y<boss.y+78)damage(1,boss.x);
    }
    for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(p.life<=0||p.y>H+20){projectiles.splice(i,1);continue;}
      if(Math.abs(player.x-p.x)<player.w/2+p.r-2&&Math.abs(player.y-p.y)<player.h/2+p.r-2){damage(1,p.x);projectiles.splice(i,1);}
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
    camera=Math.max(0,Math.min(level.width-W,player.x-W*.34));
  }
  function rounded(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawBackground(){
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,level.sky[0]);grad.addColorStop(1,level.sky[1]);ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    const glowX=750-camera*.08,glowY=115;
    const glow=ctx.createRadialGradient(glowX,glowY,8,glowX,glowY,165);glow.addColorStop(0,level.theme==='forest'||level.theme==='desert'?'#fff3a864':'#e3b4ff55');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(glowX-170,glowY-170,340,340);
    ctx.fillStyle=level.theme==='forest'||level.theme==='desert'?'#fff4c3':'#e8d3ff';ctx.beginPath();ctx.arc(glowX,glowY,level.theme==='desert'?48:level.theme==='forest'?38:32,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.globalAlpha=.16;ctx.fillStyle='#f0f5ff';
    for(let i=0;i<9;i++){const x=((i*230-camera*.15)%(W+260)+W+260)%(W+260)-90,y=105+(i*77)%170;for(const [ox,oy,r] of [[-26,5,18],[0,-6,27],[29,6,18]]){ctx.beginPath();ctx.arc(x+ox,y+oy,r,0,Math.PI*2);ctx.fill();}}
    ctx.restore();
    if(level.theme==='forest'){
      ctx.fillStyle='#376c73';for(let i=0;i<10;i++){const x=((i*190-camera*.25)%(W+220)+W+220)%(W+220)-110;ctx.beginPath();ctx.arc(x,435,95+(i%3)*20,Math.PI,0);ctx.lineTo(x+135,435);ctx.closePath();ctx.fill();}
      ctx.fillStyle='#275b62';for(let i=0;i<13;i++){const x=((i*116-camera*.4)%(W+160)+W+160)%(W+160)-80;ctx.beginPath();ctx.moveTo(x,415);ctx.lineTo(x+36,280+(i%3)*28);ctx.lineTo(x+73,415);ctx.closePath();ctx.fill();ctx.fillRect(x+32,382,8,42);}
    }else if(level.theme==='desert'){
      for(let layer=0;layer<2;layer++){ctx.fillStyle=layer?'#955c67':'#be806d';for(let i=0;i<8;i++){const x=((i*240-camera*(layer?.38:.2))%(W+300)+W+300)%(W+300)-150;ctx.beginPath();ctx.arc(x,454,145+(i%3)*24,Math.PI,0);ctx.lineTo(x+170,454);ctx.fill();}}
      ctx.fillStyle='#694958';for(let i=0;i<9;i++){const x=((i*260-camera*.33)%(W+280)+W+280)%(W+280)-120;ctx.fillRect(x,345+(i%2)*28,80,94);ctx.fillRect(x+14,320+(i%2)*28,52,30);}
    }else if(level.theme==='ice'){
      for(let layer=0;layer<2;layer++){ctx.fillStyle=layer?'#4e91a9':'#7ec3d4';for(let i=0;i<10;i++){const x=((i*185-camera*(layer?.33:.17))%(W+220)+W+220)%(W+220)-110;ctx.beginPath();ctx.moveTo(x-110,440);ctx.lineTo(x,210+(i%3)*48);ctx.lineTo(x+120,440);ctx.fill();}}
      ctx.fillStyle='#e4faff';for(let i=0;i<8;i++){const x=((i*230-camera*.33)%(W+250)+W+250)%(W+250)-110;ctx.beginPath();ctx.moveTo(x-24,281+(i%3)*48);ctx.lineTo(x,210+(i%3)*48);ctx.lineTo(x+29,282+(i%3)*48);ctx.fill();}
    }else if(level.theme==='lava'){
      ctx.fillStyle='#673047';for(let i=0;i<12;i++){const x=((i*170-camera*.3)%(W+190)+W+190)%(W+190)-95,h=90+(i*37)%100;ctx.fillRect(x,440-h,78,h);ctx.fillRect(x+18,430-h,38,-25);ctx.fillStyle='#ffae69';ctx.fillRect(x+21,450-h,8,17);ctx.fillRect(x+49,450-h,8,17);ctx.fillStyle='#673047';}
      ctx.strokeStyle='#d97868';ctx.lineWidth=5;for(let i=0;i<8;i++){const x=((i*270-camera*.3)%(W+300)+W+300)%(W+300)-90;ctx.beginPath();ctx.moveTo(x,300);ctx.lineTo(x+35,300);ctx.lineTo(x+35,370);ctx.stroke();}
    }else if(level.theme==='space'){
      ctx.fillStyle='#fff';
      for(let i=0;i<70;i++){const x=((i*83-camera*(.06+(i%3)*.05))%(W+40)+W+40)%(W+40),y=(i*53)%340,big=i%4===0;ctx.globalAlpha=.35+.65*Math.abs(Math.sin(time*1.5+i));ctx.fillRect(x,y,big?3:2,big?3:2);}
      ctx.globalAlpha=1;
      const px=330-camera*.04,py=210;
      const planet=ctx.createRadialGradient(px-20,py-25,8,px,py,75);planet.addColorStop(0,'#c58cff');planet.addColorStop(1,'#4a2a8f');
      ctx.fillStyle=planet;ctx.beginPath();ctx.arc(px,py,70,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffd9f5aa';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(px,py,112,22,-.35,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<12;i++){const x=((i*190-camera*.3)%(W+220)+W+220)%(W+220)-110,h=70+(i*41)%90;ctx.fillStyle='#1b1a42';ctx.fillRect(x,440-h,64,h);ctx.beginPath();ctx.arc(x+32,440-h,32,Math.PI,0);ctx.fill();ctx.fillStyle=i%2?'#5ff0d0':'#ff8be6';for(let row=0;row<3;row++)ctx.fillRect(x+12+row*17,452-h,7,9);}
      ctx.strokeStyle='#7d6fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,365);ctx.lineTo(W,365);ctx.stroke();
    }else{
      ctx.fillStyle='#302658';for(let i=0;i<14;i++){const x=((i*165-camera*.35)%(W+190)+W+190)%(W+190)-95,h=95+(i*39)%105;ctx.fillRect(x,440-h,74,h);ctx.fillStyle=i%2?'#7edbde':'#dc8cff';for(let row=0;row<3;row++)ctx.fillRect(x+14+row*17,458-h,7,10);ctx.fillStyle='#302658';}
      ctx.strokeStyle='#bb8aff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,360);ctx.lineTo(W,360);ctx.stroke();
    }
    ctx.fillStyle=level.foliage[2];ctx.globalAlpha=.6;
    for(let i=0;i<25;i++){const x=((i*97-camera*.5)%(W+80)+W+80)%(W+80)-40,y=190+(i*71)%225;ctx.beginPath();ctx.arc(x+Math.sin(time*2+i)*3,y+Math.cos(time*1.5+i)*3,2+(i%2),0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    const poisonGrad=ctx.createLinearGradient(0,455,0,H);poisonGrad.addColorStop(0,level.poison);poisonGrad.addColorStop(1,level.poisonDark);ctx.fillStyle=poisonGrad;ctx.fillRect(0,466,W,H-466);
    ctx.fillStyle='#dffff1';ctx.globalAlpha=.5;
    for(let x=-30;x<W+40;x+=45){const y=467+Math.sin(time*3+x*.04)*4;ctx.beginPath();ctx.ellipse(x,y,26,4,0,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }
  function drawWorld(){
    ctx.save();ctx.translate(-camera,0);
    for(const [a,b] of level.platforms){if(b<camera-60||a>camera+W+60)continue;rounded(a,FLOOR,b-a,22,4,'#263449');rounded(a,FLOOR,b-a,8,3,'#eed17e');for(let x=a+24;x<b;x+=57){ctx.fillStyle='#64849b';ctx.fillRect(x,FLOOR+9,5,5);}ctx.fillStyle='#27324b';for(let x=a+25;x<b;x+=160){ctx.fillRect(x,FLOOR+21,12,60);}}
    for(const [x,y,width] of level.ledges||[]){rounded(x,y,width,14,5,'#35445c');rounded(x,y,width,5,3,level.foliage[2]);ctx.fillStyle='#324055';ctx.fillRect(x+12,y+14,7,18);ctx.fillRect(x+width-19,y+14,7,18);}
    drawPlants();
    drawBushes();
    for(const tree of level.trees)if(tree.x>camera-130&&tree.x<camera+W+130)drawTree(tree);
    for(const x of level.spikes){if(x<camera-50||x>camera+W+50)continue;ctx.fillStyle='#e8edf4';ctx.beginPath();ctx.moveTo(x,FLOOR);ctx.lineTo(x+17,FLOOR-32);ctx.lineTo(x+34,FLOOR);ctx.closePath();ctx.fill();ctx.fillStyle='#f2788a';ctx.beginPath();ctx.moveTo(x+8,FLOOR-14);ctx.lineTo(x+17,FLOOR-32);ctx.lineTo(x+25,FLOOR-14);ctx.fill();}
    for(const base of bases)if(base.x>camera-130&&base.x<camera+W+130)drawBase(base);
    for(const soldier of soldiers)if(soldier.alive&&soldier.x>camera-60&&soldier.x<camera+W+60)drawSoldier(soldier);
    for(const c of coins)if(c.x>camera-30&&c.x<camera+W+30)drawCoin(c);
    for(const p of powerups)drawPower(p);
    for(const f of flyers)if(f.alive)drawFlyer(f);
    level.checkpoints.forEach((cp,n)=>{if(cp<camera-60||cp>camera+W+60)return;ctx.fillStyle='#e7c764';ctx.fillRect(cp,FLOOR-77,5,77);ctx.fillStyle=n<(player?.cpPassed||0)?'#89efba':'#ffce74';ctx.beginPath();ctx.moveTo(cp+5,FLOOR-76);ctx.lineTo(cp+49,FLOOR-64);ctx.lineTo(cp+5,FLOOR-49);ctx.fill();});
    for(const shot of soldierShots){ctx.fillStyle='#ffb478';ctx.beginPath();ctx.arc(shot.x,shot.y,shot.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0c0';ctx.beginPath();ctx.arc(shot.x,shot.y,3,0,Math.PI*2);ctx.fill();}
    for(const shot of playerShots){ctx.fillStyle='#fff3a9';ctx.beginPath();ctx.arc(shot.x,shot.y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(shot.x,shot.y,3,0,Math.PI*2);ctx.fill();}
    for(const missile of missiles){ctx.save();ctx.translate(missile.x,missile.y);ctx.rotate(Math.atan2(missile.vy,missile.vx));ctx.fillStyle='#ffb253';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-29,-6);ctx.lineTo(-24,0);ctx.lineTo(-29,6);ctx.fill();rounded(-12,-7,24,14,7,'#e5eaf3');ctx.fillStyle='#ef6764';ctx.beginPath();ctx.moveTo(12,-7);ctx.lineTo(23,0);ctx.lineTo(12,7);ctx.fill();ctx.restore();}
    for(const p of projectiles){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(time*5);ctx.fillStyle=levelIndex===0?'#ff9c66':'#fa73b4';for(let j=0;j<4;j++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(0,-19);ctx.lineTo(6,-6);ctx.fill();}ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.restore();}
    drawHazards();
    if(boss?.alive)drawBoss();
    if(player)drawPlayer();
    for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x-3,p.y-3,6,6);}ctx.globalAlpha=1;
    for(const p of popups){ctx.globalAlpha=Math.min(1,p.life*2);ctx.font='bold 20px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.lineJoin='round';ctx.strokeStyle='#1a2540';ctx.strokeText(p.text,p.x,p.y);ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y);}ctx.globalAlpha=1;
    ctx.restore();
  }
  function drawHazards(){
    for(const h of hazards){
      const k=hazardKinds[h.kind];
      if(!h.fall){
        if(h.tx<camera-80||h.tx>camera+W+80)continue;
        const pulse=.35+.35*Math.sin(time*18);
        ctx.globalAlpha=pulse;ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.ellipse(h.tx,FLOOR+2,k.shock,9,0,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=Math.min(1,pulse+.35);ctx.fillStyle='#fff';ctx.font='bold 24px system-ui';ctx.textAlign='center';ctx.fillText('!',h.tx,FLOOR-14);
        ctx.globalAlpha=1;continue;
      }
      if(h.x<camera-120||h.x>camera+W+120)continue;
      if(h.kind==='bolt'){
        ctx.lineJoin='round';ctx.lineCap='round';
        for(const [col,wd,al] of [[k.glow,16,.4],['#fff',5,1]]){ctx.globalAlpha=al;ctx.strokeStyle=col;ctx.lineWidth=wd;ctx.beginPath();ctx.moveTo(h.x,-40);for(let i=1;i<=9;i++)ctx.lineTo(h.x+(i<9?(i%2?14:-14):0),-40+(h.y+40)*i/9);ctx.stroke();}
        ctx.globalAlpha=1;continue;
      }
      ctx.save();ctx.translate(h.x,h.y);
      const tail=h.kind==='meteor'?{x:-h.vx*.2,y:-k.speed*.2}:{x:0,y:-k.r*3.5};
      ctx.globalAlpha=.4;ctx.strokeStyle=k.glow;ctx.lineWidth=k.r*1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(0,0);ctx.stroke();ctx.globalAlpha=1;
      ctx.fillStyle=k.color;ctx.beginPath();ctx.arc(0,0,k.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#00000040';ctx.beginPath();ctx.arc(-k.r*.3,-k.r*.2,k.r*.32,0,Math.PI*2);ctx.arc(k.r*.35,k.r*.3,k.r*.22,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }
  function drawCoin(c){
    const bob=Math.sin(time*3+c.id)*3,w=Math.abs(Math.cos(time*4+c.id*.7))*9+3,y=c.y+bob;
    ctx.fillStyle='#b8801f';ctx.beginPath();ctx.ellipse(c.x,y,w+2,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffd451';ctx.beginPath();ctx.ellipse(c.x,y,w,11,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.ellipse(c.x-w*.25,y-3,Math.max(1,w*.25),4,0,0,Math.PI*2);ctx.fill();
  }
  function drawPower(p){
    const y=p.y+Math.sin(time*3+p.x)*5,col={heart:'#ff6b81',shield:'#6fd3ff',rapid:'#ffd35e'}[p.type],icon={heart:'❤️',shield:'🛡️',rapid:'⚡'}[p.type];
    ctx.globalAlpha=.28;ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,y,27+Math.sin(time*5)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    rounded(p.x-18,y-18,36,36,11,'#18253f');
    ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(p.x-18,y-18,36,36,11);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText(icon,p.x,y+7);
  }
  function drawFlyer(f){
    const flap=Math.sin(time*16+f.x*.1);
    ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face,1);
    ctx.fillStyle=f.color;
    for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*8,-2);ctx.quadraticCurveTo(s*30,-28-flap*13,s*40,-4+flap*10);ctx.quadraticCurveTo(s*24,-8,s*8,8);ctx.fill();}
    ctx.beginPath();ctx.moveTo(-10,-10);ctx.lineTo(-6,-24);ctx.lineTo(0,-12);ctx.moveTo(10,-10);ctx.lineTo(6,-24);ctx.lineTo(0,-12);ctx.fill();
    ctx.fillStyle='#2a203f';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(0,1,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-5,-2,4,0,Math.PI*2);ctx.arc(5,-2,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#251b32';ctx.beginPath();ctx.arc(-6,-2,2,0,Math.PI*2);ctx.arc(4,-2,2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#251b32';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-8);ctx.lineTo(-2,-5);ctx.moveTo(9,-8);ctx.lineTo(2,-5);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-4,6);ctx.lineTo(-2,10);ctx.lineTo(0,6);ctx.moveTo(1,6);ctx.lineTo(3,10);ctx.lineTo(5,6);ctx.fill();
    ctx.restore();
  }
  function limb(x1,y1,x2,y2,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function drawPlants(){
    for(const [a,b] of level.platforms){
      if(b<camera-60||a>camera+W+60)continue;
      for(let x=a+38;x<b-25;x+=69){
        if(level.spikes.some(s=>Math.abs(s-x)<50)||level.trees.some(t=>Math.abs(t.x-x)<65))continue;
        const sway=Math.sin(time*2+x)*2;
        ctx.strokeStyle=level.foliage[0];ctx.lineWidth=3;ctx.lineCap='round';
        for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x+i*6,FLOOR);ctx.quadraticCurveTo(x+i*7+sway,FLOOR-14,x+i*10+sway,FLOOR-21-(i+1)*3);ctx.stroke();}
        if(Math.floor(x/69)%3===0){ctx.fillStyle=level.foliage[2];ctx.beginPath();ctx.arc(x+sway,FLOOR-27,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff1ca';ctx.beginPath();ctx.arc(x+sway,FLOOR-27,2,0,Math.PI*2);ctx.fill();}
      }
    }
  }
  function drawBushes(){
    for(const [a,b] of level.platforms){
      if(b<camera-60||a>camera+W+60)continue;
      for(let x=a+112;x<b-65;x+=174){
        if(level.spikes.some(s=>Math.abs(s-x)<75)||level.trees.some(t=>Math.abs(t.x-x)<85))continue;
        const dark=level.foliage[0];
        const light=level.foliage[1];
        ctx.fillStyle=dark;
        for(const [ox,r] of [[-25,22],[0,30],[27,22]]){ctx.beginPath();ctx.arc(x+ox,FLOOR-r*.5,r,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle=light;
        for(const [ox,oy,r] of [[-27,-22,12],[-4,-38,17],[26,-23,13]]){ctx.beginPath();ctx.arc(x+ox,FLOOR+oy,r,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle=level.foliage[2];
        for(const [ox,oy] of [[-28,-26],[6,-37],[24,-19]]){ctx.beginPath();ctx.arc(x+ox,FLOOR+oy,3,0,Math.PI*2);ctx.fill();}
      }
    }
  }
  function drawTree(tree){
    const x=tree.x, top=FLOOR-tree.height, branchY=top+70;
    ctx.fillStyle=({ice:'#b3d6df',lava:'#493747',space:'#454a7c'})[level.theme]||'#6c4a39';ctx.beginPath();ctx.moveTo(x-17,FLOOR);ctx.lineTo(x-12,top+33);ctx.lineTo(x+12,top+33);ctx.lineTo(x+17,FLOOR);ctx.closePath();ctx.fill();
    ctx.strokeStyle=level.theme==='ice'?'#e5faff':'#a87852';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-3,FLOOR-15);ctx.lineTo(x+1,top+47);ctx.stroke();
    ctx.fillStyle=level.foliage[0];
    for(const [ox,oy,r] of [[-29,36,34],[29,36,34],[0,8,44],[-10,53,35],[18,55,34]]){ctx.beginPath();ctx.arc(x+ox,top+oy,r,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=level.foliage[1];
    for(const [ox,oy,r] of [[-38,22,19],[18,-4,24],[37,33,19],[-5,34,26]]){ctx.beginPath();ctx.arc(x+ox,top+oy,r,0,Math.PI*2);ctx.fill();}
    rounded(x-52,branchY-5,104,11,5,level.theme==='ice'?'#d1f3ff':'#8c6045');
    ctx.fillStyle='#ffe7a9';for(const ox of [-31,30]){ctx.beginPath();ctx.arc(x+ox,top+29,3,0,Math.PI*2);ctx.fill();}
  }
  function drawBase(base){
    const x=base.x,y=FLOOR-132;
    rounded(x-58,y+15,116,117,6,base.hp>0?(base.flash>0?'#fff4d6':'#39475e'):'#424956');
    rounded(x-47,y+35,94,20,3,base.hp>0?'#7a8da6':'#5c6673');
    rounded(x-30,y+67,60,65,3,base.hp>0?'#20354d':'#303e50');
    ctx.fillStyle=base.hp>0?'#ffbd70':'#6f7680';ctx.fillRect(x-41,y+66,15,22);ctx.fillRect(x+27,y+66,15,22);
    ctx.fillStyle=base.hp>0?'#ff736b':'#667283';ctx.beginPath();ctx.moveTo(x-66,y+16);ctx.lineTo(x,y-15);ctx.lineTo(x+66,y+16);ctx.closePath();ctx.fill();
    if(base.hp>0){rounded(x-55,y-29,110,12,6,'#203149');rounded(x-53,y-27,106*base.hp/base.maxHp,8,4,'#ffbf6a');ctx.fillStyle='#fff';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(`מפקדה ${base.hp}/10`,x,y-38);}
    else{ctx.strokeStyle='#222e42';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-28,y+34);ctx.lineTo(x+21,y+109);ctx.moveTo(x+22,y+42);ctx.lineTo(x-10,y+87);ctx.stroke();}
  }
  function drawSoldier(soldier){
    const x=soldier.x,y=soldier.y;ctx.save();ctx.translate(x,y);ctx.scale(soldier.face,1);
    const coat=levelIndex===0?'#6d8fb7':'#8975b2';
    limb(-8,17,-11,35,7,'#27344d');limb(8,17,11,35,7,'#27344d');
    limb(-11,35,-17,35,8,'#27344d');limb(11,35,17,35,8,'#27344d');
    rounded(-16,-16,32,37,8,coat);
    ctx.fillStyle='#ffdeb0';ctx.beginPath();ctx.arc(0,-24,15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=levelIndex===0?'#3d5f84':'#5b497f';ctx.beginPath();ctx.arc(0,-28,18,Math.PI,0);ctx.lineTo(20,-27);ctx.lineTo(-20,-27);ctx.closePath();ctx.fill();
    ctx.fillStyle='#233047';ctx.beginPath();ctx.arc(5,-24,2.5,0,Math.PI*2);ctx.fill();
    limb(11,-6,24,-2,7,coat);rounded(19,-6,21,8,3,'#36435d');
    ctx.fillStyle='#a8dfff';ctx.fillRect(33,-5,6,5);
    ctx.restore();
  }
  function drawPlayer(){
    if(player.shield>0&&(player.shield>2||Math.floor(time*10)%2===0)){ctx.save();ctx.globalAlpha=.2+Math.sin(time*6)*.05;ctx.fillStyle='#8fe3ff';ctx.beginPath();ctx.arc(player.x,player.y-2,48,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.strokeStyle='#bff0ff';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
    if(player.inv>0&&Math.floor(time*14)%2===0)return;
    const x=player.x,y=player.y,bob=player.onGround?Math.sin(time*14)*1.3:0,walk=Math.abs(player.vx)>30&&player.onGround?Math.sin(time*15)*10:0;
    ctx.save();ctx.translate(x,y+bob);ctx.scale(player.face,1);
    limb(-5,16,-10-walk,31,6,'#1a263e');limb(6,16,12+walk,31,6,'#1a263e');
    limb(-10-walk,31,-16-walk,31,7,'#ffe0a8');limb(12+walk,31,18+walk,31,7,'#ffe0a8');
    limb(-10,-4,-24,6+walk*.35,6,'#1a263e');limb(10,-4,23,-11-walk*.35,6,'#1a263e');
    ctx.fillStyle='#ffe0a8';ctx.beginPath();ctx.arc(-24,6+walk*.35,5,0,Math.PI*2);ctx.arc(23,-11-walk*.35,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffcc68';ctx.strokeStyle='#263552';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-39);ctx.lineTo(15,12);ctx.quadraticCurveTo(0,23,-15,12);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#21344e';ctx.beginPath();ctx.arc(-5,-9,2.5,0,Math.PI*2);ctx.arc(6,-9,2.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#21344e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(1,-2,5,.1,Math.PI-.1);ctx.stroke();
    if(player.attack>0){ctx.strokeStyle='#fff3b6';ctx.lineWidth=8;ctx.beginPath();ctx.arc(12,-8,47,-.9,.9);ctx.stroke();ctx.globalAlpha=.45;ctx.lineWidth=3;ctx.beginPath();ctx.arc(12,-8,74,-.8,.8);ctx.stroke();ctx.globalAlpha=1;}
    ctx.restore();
  }
  function drawBoss(){
    const x=boss.x,y=boss.y;ctx.save();ctx.translate(x,y);ctx.scale(boss.dir,1);
    limb(-15,24,-24,52,11,'#25213b');limb(17,24,27,52,11,'#25213b');
    limb(-20,-14,-49,3,10,'#25213b');limb(20,-14,48,-3,10,'#25213b');
    ctx.fillStyle=boss.hitFlash>0?'#fff':boss.color;ctx.strokeStyle='#2a203f';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-60);ctx.lineTo(29,13);ctx.quadraticCurveTo(0,40,-29,13);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=boss.enraged?'#ff3b3b':'#251b32';ctx.beginPath();ctx.arc(-10,-15,boss.enraged?5:4,0,Math.PI*2);ctx.arc(10,-15,boss.enraged?5:4,0,Math.PI*2);ctx.fill();
    if(levelIndex===5){ctx.strokeStyle='#2a203f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-60);ctx.lineTo(0,-74);ctx.stroke();ctx.fillStyle=Math.floor(time*4)%2?'#ff5f8a':'#fff3a9';ctx.beginPath();ctx.arc(0,-77,5,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#251b32';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-12,-29);ctx.lineTo(-3,-25);ctx.moveTo(12,-29);ctx.lineTo(3,-25);ctx.moveTo(-8,2);ctx.lineTo(8,2);ctx.stroke();
    if(levelIndex===1){ctx.fillStyle='#eee5fa';ctx.beginPath();ctx.moveTo(-29,-5);ctx.lineTo(-45,-24);ctx.lineTo(-24,-16);ctx.moveTo(29,-5);ctx.lineTo(45,-24);ctx.lineTo(24,-16);ctx.fill();}
    ctx.restore();
    const barW=116;rounded(x-barW/2,y-82,barW,12,6,'#28324e');rounded(x-barW/2+2,y-80,(barW-4)*boss.hp/boss.maxHp,8,4,boss.color);
    ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText(`${boss.hp}/${boss.maxHp}`,x,y-91);
  }
  function drawExtras(compact,edge){
    const txt=`★ ${collected.size}/${coinTotal}  ·  ${score}${combo>1?`  ·  x${combo}`:''}`;
    ctx.fillStyle='#ffd451';
    if(compact){ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(txt,W/2,38,W-190);}
    else{rounded(edge,70,231,40,12,'#122139cc');ctx.fillStyle='#ffd451';ctx.font='bold 17px system-ui';ctx.textAlign='left';ctx.fillText(txt,edge+14,96,205);}
    let y=compact?62:118;
    for(const [icon,t,col] of [['🛡️',player?.shield||0,'#7fd8ff'],['⚡',player?.rapid||0,'#ffd35e']]){
      if(t<=0)continue;
      rounded(edge,y,96,30,10,'#122139cc');ctx.font='bold 16px system-ui';ctx.fillStyle=col;ctx.textAlign='left';ctx.fillText(`${icon} ${Math.ceil(t)}`,edge+10,y+21);
      y+=36;
    }
  }
  function drawHud(){
    const compact=W<500;
    if(compact){
      rounded(10,10,W-20,46,11,'#122139cc');ctx.fillStyle='#fff';ctx.font='bold 17px system-ui';ctx.textAlign='left';ctx.fillText(`שלב ${levelIndex+1}`,20,39);
      ctx.fillStyle='#ff8490';ctx.font='bold 22px system-ui';ctx.textAlign='right';ctx.fillText('♥'.repeat(player?.hp||3),W-20,40);
      drawExtras(true,10);
    }else{
      const edge=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches?60:18;
      rounded(edge,16,231,47,12,'#122139cc');ctx.fillStyle='#fff';ctx.font='bold 20px system-ui';ctx.textAlign='left';ctx.fillText(level.name,edge+14,46);
      rounded(W-edge-160,16,160,47,12,'#122139cc');ctx.fillStyle='#ff8490';ctx.font='bold 28px system-ui';ctx.textAlign='right';ctx.fillText('♥'.repeat(player?.hp||3),W-edge-14,48);
      drawExtras(false,edge);
    }
    if(messageTimer>0){const boxW=Math.min(310,W-20),y=compact?69:78;ctx.globalAlpha=Math.min(1,messageTimer);rounded(W/2-boxW/2,y,boxW,45,12,'#102540d9');ctx.fillStyle='#fff';ctx.font=compact?'bold 17px system-ui':'bold 23px system-ui';ctx.textAlign='center';ctx.fillText(message,W/2,y+30,boxW-18);ctx.globalAlpha=1;}
    if(boss?.alive&&player&&player.x>level.width-440){ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';ctx.textAlign='center';if(!compact)ctx.fillText(boss.name,W/2,38);ctx.font=compact?'bold 14px system-ui':'bold 16px system-ui';ctx.fillText('קפצו על הבוס או תקפו ב־X / ✦',W/2,H-30,W-20);}
    else if(player&&bases.some(base=>base.hp>0&&Math.abs(base.x-player.x)<320)){ctx.fillStyle='#fff';ctx.font=compact?'bold 14px system-ui':'bold 16px system-ui';ctx.textAlign='center';ctx.fillText('החזיקו ✦ כדי להרוס את המפקדה · 10 פגיעות',W/2,H-30,W-20);}
    else if(player&&flyers.some(f=>f.alive&&Math.abs(f.x-player.x)<380)){ctx.fillStyle='#fff';ctx.font=compact?'bold 14px system-ui':'bold 16px system-ui';ctx.textAlign='center';ctx.fillText('קפצו על המעופף או ירו בו!',W/2,H-30,W-20);}
    else if(player&&soldiers.some(s=>s.alive&&Math.abs(s.x-player.x)<420)){ctx.fillStyle='#fff';ctx.font=compact?'bold 14px system-ui':'bold 16px system-ui';ctx.textAlign='center';ctx.fillText('קפצו על החייל או החזיקו ✦ כדי לירות בו',W/2,H-30,W-20);}
    if(player&&mode==='playing'&&level.trees.some(tree=>Math.abs(player.x-tree.x)<45)&&!player.climbing){ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('↑ לטיפוס',player.x-camera,player.y-67);}
  }
  function render(){ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawBackground();drawWorld();if(mode==='playing'||mode==='cleared'||mode==='dead'||mode==='paused')drawHud();ctx.restore();}
  function frame(timestamp){const dt=Math.min(.033,(timestamp-lastTime)/1000||0);lastTime=timestamp;update(dt);render();requestAnimationFrame(frame);}
  setPanel('משחק הרפתקה','מחוגים כאלה',`שישה שלבים שונים: גשרים, עצים לטיפוס, חיילים, מעופפים, טילים ומפקדות. אספו מטבעות ובונוסים, וגם הביסו בוס בסוף כל שלב.${best?`\nהשיא שלך: ${best}`:''}`,'מתחילים לשחק ←',newGame);
  resizeCanvas();
  requestAnimationFrame(frame);
})();
