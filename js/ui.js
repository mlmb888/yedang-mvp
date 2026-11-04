window.YD = window.YD || {};
YD.S = null;
YD.weeklyChoices = { upgrade:null, hire:null, faction:null, raise:false };
YD.$ = (sel) => document.querySelector(sel);
YD.$$ = (sel) => Array.from(document.querySelectorAll(sel));

YD.show = function(id) {
  YD.$$('.screen').forEach(el=>el.classList.remove('active'));
  const el = YD.$('#screen-'+id);
  if (el) el.classList.add('active');
};

YD.shopClass = (s) => YD.stageInfo(s).visual || 'stall';

YD.renderGoal = function(el) {
  if (!el || !YD.S) return;
  const g = YD.nextGoal(YD.S);
  const pct = Math.min(100, Math.round(100 * g.have / g.need));
  el.className = 'goal-bar' + (g.kind==='rent' && g.nightsLeft<=2 ? ' warn' : '');
  el.innerHTML = `<div class="t">下一目标 · <b>${g.title}</b></div>
    <div class="meter"><i style="width:${pct}%"></i></div>`;
};

YD.renderHud = function(target) {
  const s = YD.S; if (!s||!target) return;
  const heatPct = Math.min(100,s.heat);
  target.innerHTML = `
    <div class="cell">阶段<b>${YD.stageInfo(s).name}</b><span class="stage-pill">第${s.week}周·夜${s.nightInWeek}/7</span></div>
    <div class="cell cash">现金/明账<b>${YD.fmt(s.cash)} / ${YD.fmt(s.clean)}</b></div>
    <div class="cell heat">热度 / 债<b>${s.heat} / ${YD.fmt(s.debt)}</b>
      <div class="bar"><i style="width:${heatPct}%;background:${heatPct>=70?'var(--bad)':heatPct>=40?'var(--warn)':'var(--neon)'}"></i></div>
    </div>`;
};

YD.renderBounties = function(el) {
  if (!el||!YD.S) return;
  const s = YD.S;
  el.innerHTML = (s.bounties||[]).map(b=>{
    const met = YD.bountyMet(s,b);
    const have = YD.bountyHave(s,b);
    let prog = '';
    if (b.key==='heatAtMost'||b.key==='mistakesAtMost') prog = `${have}≤${b.need}`;
    else if (b.key==='nightProfit') prog = `${YD.fmt(have)}/${YD.fmt(b.need)}`;
    else prog = `${have}/${b.need}`;
    return `<div class="bounty ${met?'on':''}"><div class="n">${b.name}</div>${b.desc}<br>${prog} · +${YD.fmt(b.reward)}</div>`;
  }).join('');
};

YD.mount = function() {
  const app = YD.$('#app');
  app.innerHTML = `
    <section class="screen active" id="screen-title"></section>
    <section class="screen" id="screen-intro"></section>
    <section class="screen" id="screen-hub"></section>
    <section class="screen" id="screen-customer"></section>
    <section class="screen" id="screen-inspect"></section>
    <section class="screen" id="screen-haggle"></section>
    <section class="screen" id="screen-result"></section>
    <section class="screen" id="screen-repair"></section>
    <section class="screen" id="screen-settlement"></section>
    <section class="screen" id="screen-event"></section>
    <section class="screen" id="screen-weekly"></section>
    <section class="screen" id="screen-gameover"></section>
  `;
  document.body.addEventListener('pointerdown', ()=>YD.ensureAudio&&YD.ensureAudio(), {once:true});
  YD.renderTitle();
};

YD.renderTitle = function() {
  YD.show('title');
  YD.$('#screen-title').innerHTML = `
    <div class="title-wrap">
      <div class="logo">${YD.iconSvg('shop',56)}</div>
      <div class="tag">MIDNIGHT PAWN · ${YD.VERSION||'v2'}</div>
      <h1>夜　当</h1>
      <p class="dim">验货 · 压价 · 做大<br>每一单都在改利润、热度与下周房租</p>
    </div>
    <div class="title-actions">
      <button class="primary" id="btn-new">新的一局</button>
      <button id="btn-continue" ${YD.hasSave()?'':'disabled'}>继续存档</button>
      <p class="footer-note">欠债 ${YD.fmt(YD.NUM.startDebt)} · 顶栏永远告诉你下一目标</p>
    </div>`;
  YD.$('#btn-new').onclick = ()=>{ YD.sfx.click(); YD.clearSave(); YD.S=YD.newState(); YD.rollBounties(YD.S); YD.renderIntro(); };
  YD.$('#btn-continue').onclick = ()=>{ YD.sfx.click(); const saved=YD.load(); if(!saved)return; YD.S=YD.restoreRuntime(saved); YD.renderHub(); };
};

YD.renderIntro = function() {
  YD.show('intro');
  YD.$('#screen-intro').innerHTML = `
    <div class="title-wrap" style="justify-content:flex-end;padding-bottom:40px;">
      <p class="dim" style="font-size:15px;line-height:1.8;max-width:300px;">
        雨夜。桥下。<br>你铺开油布，打开手电。<br><br>
        <span style="color:var(--accent);font-size:18px;font-weight:700;">欠债 ${YD.fmt(YD.NUM.startDebt)}。</span><br>
        顶栏会盯着你：离「小当铺」还差多少。
      </p>
    </div>
    <button class="primary" id="btn-intro-go">开始收第一单</button>`;
  YD.$('#btn-intro-go').onclick = ()=>{ YD.sfx.click(); YD.startNight(YD.S); YD.save(YD.S); YD.renderCustomer(); };
};

YD.shell = function(inner, screenId) {
  const s = YD.S;
  return `<div class="shop-bg ${YD.shopClass(s)}"></div>
    <div class="goal-bar" id="goal-${screenId}"></div>
    <div class="hud" id="hud-${screenId}"></div>
    <div class="bounty-row" id="bounty-${screenId}"></div>
    ${inner}`;
};

YD.paintChrome = function(id) {
  YD.renderGoal(YD.$('#goal-'+id));
  YD.renderHud(YD.$('#hud-'+id));
  YD.renderBounties(YD.$('#bounty-'+id));
};

YD.renderHub = function() {
  const s = YD.S; YD.show('hub');
  const can = YD.canStageUp(s);
  const g = YD.nextGoal(s);
  YD.$('#screen-hub').innerHTML = YD.shell(`
    <div class="card scroll">
      <h2>${YD.stageInfo(s).name}</h2>
      <p class="dim">${YD.stageInfo(s).look} · 员工 ${s.employees.length}/2 · 图鉴 ${s.museum.length}</p>
      <p class="muted" style="margin-top:6px;">今晚 ${YD.stageInfo(s).customers[0]}–${YD.stageInfo(s).customers[1]} 客。悬赏完成打烊发奖。</p>
      ${can.ok?`<p class="tip" style="margin-top:8px;">可升级「${can.name}」费 ${YD.fmt(can.cost)} — 周末选。</p>`:`<p class="muted" style="margin-top:8px;">${g.title}</p>`}
      <h3 style="margin-top:12px;font-size:13px;">收藏架</h3>
      <div class="museum">${Array.from({length:8}).map((_,i)=>{
        const m=s.museum[i];
        return m?`<div class="slot filled">${YD.itemIcon(m.defId,28)}<br>${m.name}${m.jackpotHit?'★':''}</div>`:`<div class="slot">空</div>`;
      }).join('')}</div>
    </div>
    <button class="primary" id="btn-open">开门迎客</button>
    <button class="ghost" id="btn-save-quit">保存并回标题</button>
  `,'hub');
  YD.paintChrome('hub');
  YD.$('#btn-open').onclick = ()=>{ YD.sfx.click(); YD.startNight(s); YD.save(s); YD.renderCustomer(); };
  YD.$('#btn-save-quit').onclick = ()=>{ YD.save(s); YD.renderTitle(); };
};

YD.renderCustomer = function() {
  const s=YD.S, c=s.current; if(!c) return;
  YD.show('customer');
  const item=c.item;
  const idx=s.customerIndex+1, total=s.nightQueue.length;
  const castTag = c.cast ? `<span class="tag-pill">${c.cast.role==='cop'?'便衣':c.cast.role==='gang'?'码头':'熟客'}</span>` : '';
  const jp = item.jackpot ? `<span class="tag-pill">疑似珍品</span>` : '';
  YD.$('#screen-customer').innerHTML = YD.shell(`
    ${c.tip?`<div class="tip">${c.tip}</div>`:`<div class="story-banner">客人 ${idx}/${total}</div>`}
    <div class="customer-main">
      <div class="card">
        <div class="person-row">
          <div class="avatar ${c.cast?'cast':''}">${YD.iconSvg('person',36)}</div>
          <div>
            <h3 style="margin:0;">${c.name}${castTag}</h3>
            <p class="muted">${c.gender==='male'?'男':'女'} · 「${c.story}」</p>
          </div>
        </div>
      </div>
      <div class="item-showcase ${item.jackpot?'jackpot':''}">
        <div class="art">${YD.itemIcon(item.defId,56)}</div>
        <div style="flex:1;">
          <div style="font-weight:700;">${item.name} <span class="muted">· ${item.cat}</span>${jp}</div>
          <div class="price-row"><span class="muted">开口价</span><span class="ask">${YD.fmt(item.ask)}</span></div>
          <div class="muted">现金 ${YD.fmt(s.cash)}</div>
        </div>
      </div>
      <div class="id-card">
        <div class="id-photo ${c.idCard.photoMismatch?'bad':''}">${c.idCard.photoLabel}<br>${YD.iconSvg('person',24)}</div>
        <div class="id-meta">
          <div>姓名 <b>${c.idCard.name}</b>${c.idCard.name!==c.name?' <span style="color:var(--bad)">≠本人</span>':''}</div>
          <div>性别 ${c.idCard.gender} · 出生 ${c.idCard.birth}</div>
          <div>证件号 ${c.idCard.idNo.slice(0,6)}****</div>
          ${c.idCard.wantedMark?'<div style="color:var(--bad);font-weight:700;">⚠ 协查标记</div>':''}
        </div>
      </div>
    </div>
    <div class="actions actions4">
      <button id="btn-inspect">鉴定</button>
      <button class="good" id="btn-buy">收</button>
      <button id="btn-press">压价</button>
      <button id="btn-refuse">拒</button>
      <button class="danger" id="btn-report" style="grid-column:1/-1;">报警</button>
    </div>
  `,'c');
  YD.paintChrome('c');
  YD.$('#btn-inspect').onclick=()=>{YD.sfx.click();YD.renderInspect();};
  YD.$('#btn-buy').onclick=()=>{YD.sfx.click();YD.startHaggle(s,'buy');YD.renderHaggle();};
  YD.$('#btn-press').onclick=()=>{YD.sfx.click();YD.startHaggle(s,'press');YD.renderHaggle();};
  YD.$('#btn-refuse').onclick=()=>{YD.sfx.refuse();YD.actRefuse(s);YD.save(s);YD.renderResult();};
  YD.$('#btn-report').onclick=()=>{YD.sfx.click();YD.actReport(s);YD.save(s);YD.renderResult();};
};

YD.renderInspect = function() {
  const s=YD.S, c=s.current;
  const flaws=c.item.flaws;
  const slots=YD.clueSlots(s);
  YD.show('inspect');
  const positions=[
    {t:'22%',l:'18%'},{t:'48%',l:'62%'},{t:'68%',l:'28%'},{t:'30%',l:'72%'},
  ];
  const hotspotHtml = flaws.map((fid,i)=>{
    const found=s.foundFlaws.includes(fid);
    const pos=positions[i%positions.length];
    return `<button class="hotspot ${found?'found':''}" data-fid="${fid}" style="top:${pos.t};left:${pos.l};">${found?'✓':'?'}</button>`;
  }).join('');
  const chips = s.foundFlaws.map(id=>{
    const f=YD.FLAWS.find(x=>x.id===id);
    return `<span class="flaw-chip on">${f?f.name:id}</span>`;
  }).join('');

  YD.$('#screen-inspect').innerHTML = YD.shell(`
    <div class="tip" id="insp-tip">线索 ${s.foundFlaws.length}/${slots} · 点虚线圆排查 · 识破有「抓到了」反馈</div>
    <div class="inspect-area">
      <div class="art-wrap">${YD.itemIcon(c.item.defId,110)}</div>
      <p class="muted">${c.item.name}</p>
      ${hotspotHtml || '<p class="muted" style="margin-top:12px;">表面看不出破绽</p>'}
    </div>
    <div class="flaw-list">${chips||'<span class="muted">尚未发现破绽</span>'}</div>
    <div class="actions">
      <button id="btn-insp-back">返回</button>
      <button class="primary" id="btn-insp-done">完成鉴定</button>
    </div>
  `,'i');
  YD.paintChrome('i');
  YD.$$('.hotspot').forEach(btn=>{
    btn.onclick=()=>{
      const fid=btn.dataset.fid;
      if (s.foundFlaws.length>=slots && !s.foundFlaws.includes(fid)) {
        const tip=YD.$('#insp-tip'); if(tip) tip.textContent='线索位已满。升级/雇学徒可增加。';
        YD.sfx.bad(); return;
      }
      if (YD.revealFlaw(s,fid)) { YD.sfx.gotcha(); YD.renderInspect(); }
    };
  });
  YD.$('#btn-insp-back').onclick=()=>YD.renderCustomer();
  YD.$('#btn-insp-done').onclick=()=>YD.renderCustomer();
};

YD.renderHaggle = function() {
  const s=YD.S, h=s.haggle; if(!h) return;
  YD.show('haggle');
  const min=Math.max(10,Math.round(h.floor*0.7)), max=h.ask;
  YD.$('#screen-haggle').innerHTML = YD.shell(`
    <div class="card haggle-box scroll">
      <h2>${h.mode==='press'?'压价':'谈价收下'}</h2>
      <p class="dim">开口 ${YD.fmt(h.ask)} · 耐心 ${h.patience}</p>
      <div class="offer-val" id="offer-val">${YD.fmt(h.offer)}</div>
      <input type="range" id="offer-range" min="${min}" max="${max}" value="${h.offer}" step="5"/>
      <div class="haggle-log">${(h.log||[]).map(l=>`<div>· ${l}</div>`).join('')}</div>
    </div>
    <div class="actions">
      <button id="btn-hag-cancel">取消</button>
      <button class="primary" id="btn-hag-ok">出价</button>
      <button class="good" id="btn-hag-ask" style="grid-column:1/-1;">按开口价 ${YD.fmt(h.ask)}</button>
    </div>
  `,'h');
  YD.paintChrome('h');
  const range=YD.$('#offer-range'), val=YD.$('#offer-val');
  range.oninput=()=>{ h.offer=Number(range.value); val.textContent=YD.fmt(h.offer); };
  YD.$('#btn-hag-cancel').onclick=()=>{ s.haggle=null; s.phase='customer'; YD.renderCustomer(); };
  YD.$('#btn-hag-ok').onclick=()=>{
    const r=YD.haggleOffer(s, Number(range.value));
    if (r.ok||r.walk){ YD.sfx.coin(); YD.save(s); YD.renderResult(); }
    else YD.renderHaggle();
  };
  YD.$('#btn-hag-ask').onclick=()=>{
    const r=YD.finishDeal(s,h.ask,false);
    if(!r.ok){ const log=YD.$('.haggle-log'); if(log) log.innerHTML+=`<div>· ${r.msg||'无法成交'}</div>`; return; }
    YD.sfx.coin(); YD.save(s); YD.renderResult();
  };
};

YD.spawnCoins = function(layer, n) {
  if (!layer) return;
  for (let i=0;i<n;i++){
    const c=document.createElement('div');
    c.className='coin';
    const dx=(Math.random()*160-80)|0, dy=(-40-Math.random()*120)|0;
    c.style.left=(40+Math.random()*60)+'%';
    c.style.top='55%';
    c.style.setProperty('--dx',dx+'px');
    c.style.setProperty('--dy',dy+'px');
    c.style.animationDelay=(Math.random()*0.15)+'s';
    layer.appendChild(c);
  }
};

YD.renderResult = function() {
  const s=YD.S;
  const r=s.lastResult||{title:'……',text:'',reaction:''};
  YD.show('result');
  const cls = r.type==='gotcha'?'gotcha': r.type==='jackpot'?'jackpot':'';
  if (r.type==='gotcha') YD.sfx.gotcha();
  else if (r.type==='jackpot') YD.sfx.upgrade();
  else if (r.type==='buy') YD.sfx.coin();

  YD.$('#screen-result').innerHTML = YD.shell(`
    <div class="result-card card ${cls}" id="res-card">
      <div class="coin-layer" id="coins"></div>
      <div class="big">${r.title||''}</div>
      <div class="dim">${r.text||''}</div>
      ${r.reaction?`<div class="reaction">「${r.reaction}」</div>`:''}
      <div class="count-up" id="count-line">${r.delta&&r.delta.cash?YD.fmt(r.delta.cash):''}</div>
      <div class="dim">热度 ${s.heat} · 现金 ${YD.fmt(s.cash)}</div>
    </div>
    <button class="primary" id="btn-next-c">下一位</button>
  `,'r');
  YD.paintChrome('r');
  if (r.coins) YD.spawnCoins(YD.$('#coins'), r.coins);
  if (r.type==='gotcha') YD.$('#res-card')?.classList.add('flash-gotcha');
  YD.$('#btn-next-c').onclick=()=>{
    YD.sfx.click();
    YD.nextCustomer(s);
    if (s.phase==='repair') YD.renderRepair();
    else if (s.phase==='settlement') YD.afterCloseFlow();
    else if (s.phase==='gameover') YD.renderGameOver();
    else YD.renderCustomer();
  };
};

YD.renderRepair = function() {
  const s=YD.S, it=s.pendingRepair;
  YD.show('repair');
  let cost=Math.round((it.cost||50)*YD.NUM.repairCostRate)||20;
  if (s.repairDiscount) cost=Math.round(cost*0.5);
  const mult=s.employees.some(e=>e.id==='restorer')?1.6:YD.NUM.repairMult;
  const after=Math.round((it.sell||it.cost*1.4)*mult);
  YD.$('#screen-repair').innerHTML = YD.shell(`
    <div class="card scroll">
      <h2>打烊 · 翻新？</h2>
      <div class="item-showcase" style="margin-top:10px;">
        <div class="art">${YD.itemIcon(it.defId||'radio_vintage',56)}</div>
        <div>
          <div style="font-weight:700;">${it.name}</div>
          <p class="muted">花 ${YD.fmt(cost)}，售约 ${YD.fmt(after)}${s.repairDiscount?'（零件折扣）':''}</p>
        </div>
      </div>
    </div>
    <div class="actions">
      <button id="btn-skip-rp">直接出货</button>
      <button class="primary" id="btn-do-rp">翻新</button>
    </div>
  `,'rp');
  YD.paintChrome('rp');
  YD.$('#btn-skip-rp').onclick=()=>{YD.doRepair(s,false);YD.afterCloseFlow();};
  YD.$('#btn-do-rp').onclick=()=>{YD.sfx.coin();YD.doRepair(s,true);YD.afterCloseFlow();};
};

YD.afterCloseFlow = function() {
  const s=YD.S;
  YD.save(s);
  if (s.phase==='gameover') YD.renderGameOver();
  else if (s.eventQueue && s.eventQueue.length) YD.renderEvent();
  else YD.renderSettlement();
};

YD.renderEvent = function() {
  const s=YD.S;
  const ev=(s.eventQueue||[]).shift();
  if (!ev) { YD.renderSettlement(); return; }
  if (ev.shake) { const app=YD.$('#app'); app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake'); YD.sfx.raid(); }
  if (ev.upgrade) YD.sfx.upgrade();

  let interestNote='';
  if (ev.effect) {
    const g = YD.applyEventEffect(s, ev.effect);
    if (ev.effect.interest && g) interestNote = ` +${YD.fmt(g)}`;
  }

  let extra='';
  if (ev.effect && ev.effect.choice==='bribe') {
    extra = `<div class="actions" style="margin-top:12px;">
      <button id="btn-bribe">塞 ¥150（热度−8）</button>
      <button id="btn-nobribe">拒绝（热度+5）</button>
    </div>`;
  }
  if (ev.type==='faction_choice') {
    extra = `<div class="choice-grid" style="margin-top:12px;">
      ${YD.FACTIONS.map(f=>`<button class="choice" data-f="${f.id}"><div class="t">${f.name}</div><div class="d">${f.pitch}</div></button>`).join('')}
      <button class="choice" data-f=""><div class="t">暂不站队</div></button>
    </div>`;
  }

  YD.show('event');
  YD.$('#screen-event').innerHTML = YD.shell(`
    <div class="card scroll">
      <h2>夜间事件</h2>
      <p class="dim" style="margin-top:12px;line-height:1.65;font-size:15px;">${ev.text}${interestNote}</p>
      ${extra}
    </div>
    <button class="primary" id="btn-ev-ok">${extra&&ev.effect&&ev.effect.choice==='bribe'?'':'继续'}</button>
  `,'ev');
  YD.paintChrome('ev');
  let picked=null;
  YD.$$('.choice').forEach(btn=>{
    btn.onclick=()=>{ YD.$$('.choice').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); picked=btn.dataset.f; };
  });
  const bribe=YD.$('#btn-bribe'), nob=YD.$('#btn-nobribe');
  if (bribe) {
    YD.$('#btn-ev-ok').style.display='none';
    bribe.onclick=()=>{ if(YD.pay(s,150)) s.heat=YD.clamp(s.heat-8,0,100); YD.continueEvents(); };
    nob.onclick=()=>{ s.heat=YD.clamp(s.heat+5,0,100); YD.continueEvents(); };
  } else {
    YD.$('#btn-ev-ok').onclick=()=>{
      if (ev.type==='faction_choice' && picked) s.faction=picked;
      if (ev.type==='faction') s.factionTeased=true;
      YD.continueEvents();
    };
  }
};

YD.continueEvents = function() {
  const s=YD.S;
  if (s.eventQueue.length) YD.renderEvent();
  else if (s.phase==='gameover') YD.renderGameOver();
  else YD.renderSettlement();
};

YD.renderSettlement = function() {
  const s=YD.S;
  if (s.eventQueue && s.eventQueue.length) { YD.renderEvent(); return; }
  YD.show('settlement');
  const g=YD.nextGoal(s);
  YD.$('#screen-settlement').innerHTML = YD.shell(`
    <div class="card scroll">
      <h2>打烊结算</h2>
      <div class="list" style="margin-top:8px;">
        <div class="row"><span>明账入账</span><span style="color:var(--clean)">${YD.fmt(s.nightClean||0)}</span></div>
        <div class="row"><span>暗账入账</span><span style="color:var(--dirty)">${YD.fmt(s.nightDirty||0)}</span></div>
        <div class="row"><span>热度</span><span>${s.heat}</span></div>
        <div class="row"><span>净资产</span><span>${YD.fmt(YD.netWorth(s))}</span></div>
        <div class="row"><span>下一目标</span><span style="color:var(--accent);max-width:55%;text-align:right">${g.title}</span></div>
      </div>
      <div class="list" style="margin-top:10px;">
        ${(s.nightLog||[]).map(l=>`<div class="row"><span>${l.name} · ${l.action}</span><span>${l.price?YD.fmt(l.price):''}</span></div>`).join('')||'<div class="muted">无交易</div>'}
      </div>
    </div>
    <button class="primary" id="btn-next-day">${s.nightInWeek>=7?'进入周末结算':'下一夜'}</button>
  `,'set');
  YD.paintChrome('set');
  YD.$('#btn-next-day').onclick=()=>{
    YD.sfx.click();
    YD.advanceDay(s);
    if (s.phase==='weekly') YD.renderWeekly();
    else if (s.phase==='gameover') YD.renderGameOver();
    else if (s.phase==='customer') YD.renderCustomer();
    else YD.renderHub();
  };
};

YD.renderWeekly = function() {
  const s=YD.S;
  YD.weeklyChoices={upgrade:null,hire:null,faction:null,raise:false};
  const rent=YD.currentRent(s);
  const wages=s.employees.reduce((sum,e)=>sum+e.wage,0);
  const can=YD.canStageUp(s);
  YD.show('weekly');
  YD.$('#screen-weekly').innerHTML = YD.shell(`
    <div class="card scroll">
      <h2>周末结算 · 第 ${s.week} 周</h2>
      <div class="list">
        <div class="row"><span>房租${s.week>1?'（含周涨）':''}</span><span>${YD.fmt(rent)}</span></div>
        <div class="row"><span>员工周薪</span><span>${YD.fmt(wages)}</span></div>
        <div class="row"><span>应付合计</span><span style="color:var(--accent)">${YD.fmt(rent+wages)}</span></div>
      </div>
      <h3 style="margin-top:12px;">升级</h3>
      <div class="choice-grid" id="up-choices">
        ${can.ok?`<button class="choice" data-up="stage"><div class="t">升级「${can.name}」</div><div class="d">费 ${YD.fmt(can.cost)} · 店铺外观会变</div></button>`:`<div class="muted">${can.reason}</div>`}
        ${!s.upgrades.uv?`<button class="choice" data-up="uv"><div class="t">紫外灯</div><div class="d">¥800 · 线索+1</div></button>`:''}
        ${!s.upgrades.scale?`<button class="choice" data-up="scale"><div class="t">电子秤</div><div class="d">¥600 · 鉴定→Lv2</div></button>`:''}
        <button class="choice selected" data-up=""><div class="t">本周不升级</div></button>
      </div>
      <h3 style="margin-top:12px;">雇人</h3>
      <div class="choice-grid" id="hire-choices">
        ${YD.EMPLOYEES.map(e=>{
          const owned=s.employees.some(x=>x.id===e.id);
          return `<button class="choice" data-hire="${e.id}" ${owned||s.employees.length>=2?'disabled':''}><div class="t">${e.name}${owned?'（已雇）':''}</div><div class="d">${e.desc} · ${YD.fmt(e.cost)}</div></button>`;
        }).join('')}
        <button class="choice selected" data-hire=""><div class="t">不雇人</div></button>
      </div>
      ${s.factionTeased&&!s.faction?`
      <h3 style="margin-top:12px;">势力预告</h3>
      <div class="choice-grid" id="fac-choices">
        ${YD.FACTIONS.map(f=>`<button class="choice" data-fac="${f.id}"><div class="t">${f.name}</div><div class="d">${f.pitch}</div></button>`).join('')}
        <button class="choice selected" data-fac=""><div class="t">暂不站队</div></button>
      </div>`:''}
    </div>
    <button class="primary" id="btn-week-go">交租并进入下周</button>
  `,'w');
  YD.paintChrome('w');
  const bind=(root,attr,key)=>{
    YD.$$('#'+root+' .choice').forEach(btn=>{
      btn.onclick=()=>{ if(btn.disabled)return; YD.$$('#'+root+' .choice').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); YD.weeklyChoices[key]=btn.getAttribute(attr)||null; if(!YD.weeklyChoices[key]) YD.weeklyChoices[key]=null; };
    });
  };
  bind('up-choices','data-up','upgrade');
  bind('hire-choices','data-hire','hire');
  if (YD.$('#fac-choices')) bind('fac-choices','data-fac','faction');
  YD.$('#btn-week-go').onclick=()=>{
    YD.sfx.click();
    YD.resolveWeekly(s, YD.weeklyChoices);
    if (s.phase==='gameover') YD.renderGameOver();
    else if (s.eventQueue&&s.eventQueue.length) YD.renderEvent();
    else YD.renderHub();
  };
};

YD.renderGameOver = function() {
  const s=YD.S; YD.show('gameover');
  YD.$('#screen-gameover').innerHTML = `
    <div class="title-wrap">
      <div class="logo">${YD.iconSvg('warn',56)}</div>
      <h1 style="letter-spacing:.15em;">出局</h1>
      <p class="dim" style="line-height:1.7;max-width:300px;">${s.gameOverReason||'经营失败。'}</p>
      <p class="muted">${s.day} 天 · 峰值净值 ${YD.fmt(s.netWorthPeak)} · 识破 ${s.stats.caughtFake} · 图鉴 ${s.museum.length}</p>
    </div>
    <div class="title-actions">
      <button class="primary" id="btn-retry">保留鉴定等级重开</button>
      <button id="btn-title">回标题</button>
    </div>`;
  YD.$('#btn-retry').onclick=()=>{
    const id=s.idLevel; YD.clearSave(); YD.S=YD.newState(); YD.S.idLevel=id; YD.S.tutorialDone=true; YD.rollBounties(YD.S); YD.renderHub();
  };
  YD.$('#btn-title').onclick=()=>{ YD.clearSave(); YD.renderTitle(); };
};

document.addEventListener('DOMContentLoaded', ()=>YD.mount());
