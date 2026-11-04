window.YD = window.YD || {};

YD.S = null;
YD.weeklyChoices = { upgrade: null, hire: null, faction: null, raise: false };

YD.$ = (sel) => document.querySelector(sel);
YD.$$ = (sel) => Array.from(document.querySelectorAll(sel));

YD.show = function (id) {
  YD.$$('.screen').forEach((el) => el.classList.remove('active'));
  const el = YD.$('#screen-' + id);
  if (el) el.classList.add('active');
};

YD.renderHud = function (target) {
  const s = YD.S;
  if (!s || !target) return;
  const heatPct = Math.min(100, s.heat);
  target.innerHTML = `
    <div class="cell">阶段<b>${YD.stageInfo(s).name}</b><span class="stage-pill">第${s.week}周·夜${s.nightInWeek}/7</span></div>
    <div class="cell cash">明账/现金<b>${YD.fmt(s.clean)} / ${YD.fmt(s.cash)}</b></div>
    <div class="cell dirty">暗账 / 债<b>${YD.fmt(s.dirty)} / ${YD.fmt(s.debt)}</b></div>
    <div class="cell">资产/净值<b>${YD.fmt(YD.assets(s))} / ${YD.fmt(YD.netWorth(s))}</b></div>
    <div class="cell">口碑 / 鉴定<b>${s.reputation} / Lv${s.idLevel}</b></div>
    <div class="cell heat">热度<b>${s.heat}</b>
      <div class="bar"><i style="width:${heatPct}%;background:${heatPct>=70? 'var(--bad)': heatPct>=40? 'var(--warn)':'var(--neon)'}"></i></div>
    </div>`;
};

YD.mount = function () {
  const app = YD.$('#app');
  app.innerHTML = `
    <div class="rain"></div>
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
  YD.renderTitle();
};

YD.renderTitle = function () {
  YD.show('title');
  YD.$('#screen-title').innerHTML = `
    <div class="title-wrap">
      <div class="logo">${YD.iconSvg('shop', 56)}</div>
      <div class="tag">MIDNIGHT PAWN · MVP</div>
      <h1>夜　当</h1>
      <p class="dim">城郊深夜旧货摊<br>验货 · 压价 · 做大</p>
      <p class="muted">竖屏试玩 · 数据驱动 · 本地存档</p>
    </div>
    <div class="title-actions">
      <button class="primary" id="btn-new">新的一局</button>
      <button id="btn-continue" ${YD.hasSave() ? '' : 'disabled'}>继续存档</button>
      <p class="footer-note">欠债 ${YD.fmt(YD.NUM.startDebt)}，七天期限</p>
    </div>`;
  YD.$('#btn-new').onclick = () => {
    YD.clearSave();
    YD.S = YD.newState();
    YD.renderIntro();
  };
  YD.$('#btn-continue').onclick = () => {
    const saved = YD.load();
    if (!saved) return;
    YD.S = YD.restoreRuntime(saved);
    YD.renderHub();
  };
};

YD.renderIntro = function () {
  YD.show('intro');
  YD.$('#screen-intro').innerHTML = `
    <div class="title-wrap" style="justify-content:flex-end;padding-bottom:40px;">
      <p class="dim" style="font-size:15px;line-height:1.8;max-width:300px;">
        雨夜。桥下。<br>
        你铺开油布，打开手电。<br><br>
        <span style="color:var(--accent);font-size:18px;font-weight:700;">欠债 ${YD.fmt(YD.NUM.startDebt)}，七天。</span>
      </p>
    </div>
    <button class="primary" id="btn-intro-go">开始收第一单</button>`;
  YD.$('#btn-intro-go').onclick = () => {
    YD.startNight(YD.S);
    YD.save(YD.S);
    YD.renderCustomer();
  };
};

YD.renderHub = function () {
  const s = YD.S;
  YD.show('hub');
  const can = YD.canStageUp(s);
  YD.$('#screen-hub').innerHTML = `
    <div class="hud" id="hud-hub"></div>
    <div class="card scroll">
      <h2>${YD.stageInfo(s).name}</h2>
      <p class="dim">第 ${s.week} 周 · 第 ${s.nightInWeek} 夜 · 员工 ${s.employees.length}/2</p>
      <p class="muted" style="margin-top:8px;">今晚预计 ${YD.stageInfo(s).customers[0]}–${YD.stageInfo(s).customers[1]} 位客人。找破绽，决定收/拒/压价/报警。</p>
      ${s.faction ? `<p class="tip" style="margin-top:10px;">已站队：${YD.FACTIONS.find(f=>f.id===s.faction).name}</p>` : s.factionTeased ? `<p class="muted" style="margin-top:10px;">码头帮名片还在抽屉里……</p>` : ''}
      ${can.ok ? `<p class="tip" style="margin-top:10px;">可升级为「${can.name}」（费 ${YD.fmt(can.cost)}）——周末结算时选择。</p>` : `<p class="muted" style="margin-top:10px;">下一阶段：${can.reason || ''}</p>`}
      <div class="list" style="margin-top:12px;">
        <div class="row"><span>累计成交</span><span>${s.stats.dealt}</span></div>
        <div class="row"><span>拒绝 / 报警</span><span>${s.stats.refused} / ${s.stats.reported}</span></div>
        <div class="row"><span>误判</span><span>${s.stats.mistakes}</span></div>
      </div>
    </div>
    <button class="primary" id="btn-open">开门迎客</button>
    <button class="ghost" id="btn-save-quit">保存并回标题</button>`;
  YD.renderHud(YD.$('#hud-hub'));
  YD.$('#btn-open').onclick = () => {
    YD.startNight(s);
    YD.save(s);
    YD.renderCustomer();
  };
  YD.$('#btn-save-quit').onclick = () => {
    YD.save(s);
    YD.renderTitle();
  };
};

YD.renderCustomer = function () {
  const s = YD.S;
  const c = s.current;
  if (!c) return;
  YD.show('customer');
  const item = c.item;
  const idx = s.customerIndex + 1;
  const total = s.nightQueue.length;
  YD.$('#screen-customer').innerHTML = `
    <div class="hud" id="hud-c"></div>
    ${c.tip ? `<div class="tip">${c.tip}</div>` : `<div class="story-banner">客人 ${idx}/${total}</div>`}
    <div class="customer-main">
      <div class="card">
        <div class="person-row">
          <div class="avatar">${YD.iconSvg('person', 40)}</div>
          <div>
            <h3 style="margin:0;">${c.name}</h3>
            <p class="muted">${c.gender === 'male' ? '男' : '女'} · 「${c.story}」</p>
          </div>
        </div>
      </div>
      <div class="item-showcase">
        <div class="art">${YD.itemIcon(item.defId, 56)}</div>
        <div style="flex:1;">
          <div style="font-weight:700;">${item.name} <span class="muted">· ${item.cat}</span></div>
          <div class="price-row"><span class="muted">开口价</span><span class="ask">${YD.fmt(item.ask)}</span></div>
          <div class="muted">你的现金 ${YD.fmt(s.cash)}</div>
        </div>
      </div>
      <div class="id-card">
        <div class="id-photo ${c.idCard.photoMismatch ? 'bad' : ''}">${c.idCard.photoLabel}<br>${YD.iconSvg('person', 28)}</div>
        <div class="id-meta">
          <div>姓名 <b>${c.idCard.name}</b>${c.idCard.name !== c.name ? ' <span style="color:var(--bad)">≠本人</span>' : ''}</div>
          <div>性别 ${c.idCard.gender} · 出生 ${c.idCard.birth}</div>
          <div>证件号 ${c.idCard.idNo.slice(0,6)}****</div>
          ${c.idCard.wantedMark ? '<div style="color:var(--bad);font-weight:700;">⚠ 协查标记未注销</div>' : ''}
        </div>
      </div>
    </div>
    <div class="actions actions4">
      <button id="btn-inspect">放大镜鉴定</button>
      <button class="good" id="btn-buy">收</button>
      <button id="btn-press">压价</button>
      <button id="btn-refuse">拒</button>
      <button class="danger" id="btn-report" style="grid-column:1/-1;">报警</button>
    </div>`;
  YD.renderHud(YD.$('#hud-c'));
  YD.$('#btn-inspect').onclick = () => YD.renderInspect();
  YD.$('#btn-buy').onclick = () => {
    YD.startHaggle(s, 'buy');
    // quick accept at ask if enough money
    YD.renderHaggle();
  };
  YD.$('#btn-press').onclick = () => {
    YD.startHaggle(s, 'press');
    YD.renderHaggle();
  };
  YD.$('#btn-refuse').onclick = () => {
    YD.actRefuse(s);
    YD.save(s);
    YD.renderResult();
  };
  YD.$('#btn-report').onclick = () => {
    YD.actReport(s);
    YD.save(s);
    YD.renderResult();
  };
};

YD.renderInspect = function () {
  const s = YD.S;
  const c = s.current;
  const flaws = c.item.flaws;
  const slots = YD.clueSlots(s);
  YD.show('inspect');

  // Place hotspots
  const positions = [
    { t: '18%', l: '20%' },
    { t: '40%', l: '58%' },
    { t: '62%', l: '28%' },
    { t: '30%', l: '70%' },
  ];

  const hotspotHtml = flaws.map((fid, i) => {
    const f = YD.FLAWS.find((x) => x.id === fid);
    const found = s.foundFlaws.includes(fid);
    const pos = positions[i % positions.length];
    return `<button class="hotspot ${found ? 'found' : ''}" data-fid="${fid}" style="top:${pos.t};left:${pos.l};" ${found ? 'disabled' : ''}>${found ? '✓' : '?'}</button>`;
  }).join('');

  const chips = YD.FLAWS.map((f) => {
    const on = s.foundFlaws.includes(f.id);
    const real = flaws.includes(f.id);
    // only show chips for found or as legend of found
    if (!on) return '';
    return `<span class="flaw-chip on">${f.name}</span>`;
  }).join('');

  YD.$('#screen-inspect').innerHTML = `
    <div class="hud" id="hud-i"></div>
    <div class="tip">线索位 ${s.foundFlaws.length}/${slots} · 点击虚线圆圈排查破绽</div>
    <div class="inspect-area">
      <div style="text-align:center;padding-top:24px;opacity:0.9;">${YD.itemIcon(c.item.defId, 96)}</div>
      <p class="muted" style="text-align:center;margin-top:8px;">${c.item.name}</p>
      ${hotspotHtml || '<p class="muted" style="text-align:center;margin-top:24px;">表面看不出破绽</p>'}
    </div>
    <div class="flaw-list">${chips || '<span class="muted">尚未发现破绽</span>'}</div>
    <div class="actions">
      <button id="btn-insp-back">返回</button>
      <button class="primary" id="btn-insp-done">完成鉴定</button>
    </div>`;
  YD.renderHud(YD.$('#hud-i'));

  YD.$$('.hotspot').forEach((btn) => {
    btn.onclick = () => {
      const fid = btn.dataset.fid;
      if (s.foundFlaws.length >= slots && !s.foundFlaws.includes(fid)) {
        const tip = document.querySelector('#screen-inspect .tip');
        if (tip) tip.textContent = '线索位已满。升级店铺或雇学徒可增加。';
        return;
      }
      if (YD.revealFlaw(s, fid)) {
        const f = YD.FLAWS.find((x) => x.id === fid);
        // brief feedback via re-render
        YD.renderInspect();
      }
    };
  });
  YD.$('#btn-insp-back').onclick = () => YD.renderCustomer();
  YD.$('#btn-insp-done').onclick = () => YD.renderCustomer();
};

YD.renderHaggle = function () {
  const s = YD.S;
  const h = s.haggle;
  if (!h) return;
  YD.show('haggle');
  const min = Math.max(10, Math.round(h.floor * 0.7));
  const max = h.ask;
  YD.$('#screen-haggle').innerHTML = `
    <div class="hud" id="hud-h"></div>
    <div class="card haggle-box scroll">
      <h2>${h.mode === 'press' ? '压价' : '谈价收下'}</h2>
      <p class="dim">对方开口 ${YD.fmt(h.ask)} · 耐心 ${h.patience}</p>
      <div class="offer-val" id="offer-val">${YD.fmt(h.offer)}</div>
      <input type="range" id="offer-range" min="${min}" max="${max}" value="${h.offer}" step="5" />
      <p class="muted">拖动出价。过低会走人。</p>
      <div class="haggle-log">${(h.log || []).map((l) => `<div>· ${l}</div>`).join('')}</div>
    </div>
    <div class="actions">
      <button id="btn-hag-cancel">取消</button>
      <button class="primary" id="btn-hag-ok">出价</button>
      <button class="good" id="btn-hag-ask" style="grid-column:1/-1;">按开口价收下 ${YD.fmt(h.ask)}</button>
    </div>`;
  YD.renderHud(YD.$('#hud-h'));
  const range = YD.$('#offer-range');
  const val = YD.$('#offer-val');
  range.oninput = () => {
    h.offer = Number(range.value);
    val.textContent = YD.fmt(h.offer);
  };
  YD.$('#btn-hag-cancel').onclick = () => {
    s.haggle = null;
    s.phase = 'customer';
    YD.renderCustomer();
  };
  YD.$('#btn-hag-ok').onclick = () => {
    const r = YD.haggleOffer(s, Number(range.value));
    if (r.ok || r.walk) {
      YD.save(s);
      YD.renderResult();
    } else if (r.forceAsk) {
      YD.renderHaggle();
    } else {
      YD.renderHaggle();
    }
  };
  YD.$('#btn-hag-ask').onclick = () => {
    const r = YD.finishDeal(s, h.ask, false);
    if (!r.ok) {
      const log = document.querySelector('.haggle-log');
      if (log) log.innerHTML += `<div>· ${r.msg || '无法成交'}</div>`;
      return;
    }
    YD.save(s);
    YD.renderResult();
  };
};

YD.renderResult = function () {
  const s = YD.S;
  const r = s.lastResult || { text: '……', delta: {} };
  YD.show('result');
  YD.$('#screen-result').innerHTML = `
    <div class="hud" id="hud-r"></div>
    <div class="result-card card">
      <div class="big">${r.text}</div>
      <div class="dim">热度 ${s.heat} · 现金 ${YD.fmt(s.cash)}</div>
    </div>
    <button class="primary" id="btn-next-c">下一位</button>`;
  YD.renderHud(YD.$('#hud-r'));
  YD.$('#btn-next-c').onclick = () => {
    YD.nextCustomer(s);
    if (s.phase === 'repair') YD.renderRepair();
    else if (s.phase === 'settlement') YD.renderSettlement();
    else if (s.phase === 'gameover') YD.renderGameOver();
    else YD.renderCustomer();
  };
};

YD.renderRepair = function () {
  const s = YD.S;
  const it = s.pendingRepair;
  YD.show('repair');
  const cost = Math.round((it.cost || 50) * YD.NUM.repairCostRate) || 20;
  const mult = s.employees.some((e) => e.id === 'restorer') ? 1.6 : YD.NUM.repairMult;
  const after = Math.round((it.sell || it.cost * 1.4) * mult);
  YD.$('#screen-repair').innerHTML = `
    <div class="hud" id="hud-rp"></div>
    <div class="card scroll">
      <h2>打烊 · 翻新？</h2>
      <div class="item-showcase" style="margin-top:10px;">
        <div class="art">${YD.itemIcon(it.defId || 'radio_vintage', 56)}</div>
        <div>
          <div style="font-weight:700;">${it.name}</div>
          <p class="muted">花费 ${YD.fmt(cost)} 零件时间，售价约 ${YD.fmt(after)}</p>
        </div>
      </div>
      <p class="dim" style="margin-top:10px;">不翻新则按原价出货。</p>
    </div>
    <div class="actions">
      <button id="btn-skip-rp">直接出货</button>
      <button class="primary" id="btn-do-rp">翻新</button>
    </div>`;
  YD.renderHud(YD.$('#hud-rp'));
  YD.$('#btn-skip-rp').onclick = () => {
    YD.doRepair(s, false);
    YD.afterRepair();
  };
  YD.$('#btn-do-rp').onclick = () => {
    YD.doRepair(s, true);
    YD.afterRepair();
  };
};

YD.afterRepair = function () {
  const s = YD.S;
  YD.save(s);
  if (s.phase === 'gameover') YD.renderGameOver();
  else if (s.eventQueue && s.eventQueue.length) YD.renderEvent();
  else YD.renderSettlement();
};

YD.renderEvent = function () {
  const s = YD.S;
  const ev = (s.eventQueue || []).shift();
  if (!ev) {
    YD.renderSettlement();
    return;
  }
  YD.show('event');
  let extra = '';
  if (ev.type === 'faction_choice') {
    extra = `<div class="choice-grid" style="margin-top:12px;">
      ${YD.FACTIONS.map((f) => `<button class="choice" data-f="${f.id}"><div class="t">${f.name}</div><div class="d">${f.pitch}<br>${f.risk}</div></button>`).join('')}
      <button class="choice" data-f=""><div class="t">暂不站队</div><div class="d">先观望</div></button>
    </div>`;
  }
  YD.$('#screen-event').innerHTML = `
    <div class="hud" id="hud-ev"></div>
    <div class="card scroll">
      <h2>夜间事件</h2>
      <p class="big dim" style="margin-top:12px;line-height:1.6;">${ev.text}</p>
      ${extra}
    </div>
    <button class="primary" id="btn-ev-ok">${ev.type === 'faction_choice' ? '确认' : '继续'}</button>`;
  YD.renderHud(YD.$('#hud-ev'));
  let picked = null;
  YD.$$('.choice').forEach((btn) => {
    btn.onclick = () => {
      YD.$$('.choice').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      picked = btn.dataset.f;
    };
  });
  YD.$('#btn-ev-ok').onclick = () => {
    if (ev.type === 'faction_choice' && picked) s.faction = picked;
    if (ev.type === 'faction') s.factionTeased = true;
    if (s.eventQueue.length) YD.renderEvent();
    else if (s.phase === 'gameover') YD.renderGameOver();
    else YD.renderSettlement();
  };
};

YD.renderSettlement = function () {
  const s = YD.S;
  // drain remaining events first
  if (s.eventQueue && s.eventQueue.length) {
    YD.renderEvent();
    return;
  }
  YD.show('settlement');
  YD.$('#screen-settlement').innerHTML = `
    <div class="hud" id="hud-set"></div>
    <div class="card scroll">
      <h2>打烊结算</h2>
      <div class="list" style="margin-top:8px;">
        <div class="row"><span>本夜明账入账</span><span style="color:var(--clean)">${YD.fmt(s.nightClean || 0)}</span></div>
        <div class="row"><span>本夜暗账入账</span><span style="color:var(--dirty)">${YD.fmt(s.nightDirty || 0)}</span></div>
        <div class="row"><span>热度</span><span>${s.heat}</span></div>
        <div class="row"><span>债务剩余</span><span>${YD.fmt(s.debt)}</span></div>
        <div class="row"><span>净资产</span><span>${YD.fmt(YD.netWorth(s))}</span></div>
      </div>
      <div class="list" style="margin-top:12px;">
        ${(s.nightLog || []).map((l) => `<div class="row"><span>${l.name} · ${l.action}</span><span>${l.price ? YD.fmt(l.price) : ''} ${l.heatDelta ? `(热度${l.heatDelta>0?'+':''}${l.heatDelta})` : ''}</span></div>`).join('') || '<div class="muted">无交易记录</div>'}
      </div>
      ${!s.tutorialDone ? '' : ''}
      ${s.tutorialDone && s.day === 1 ? `<p class="tip" style="margin-top:12px;">霓虹当铺招牌在雨里闪了一下——目标：攒到净资产 ${YD.fmt(1500)}，升级「小当铺」。</p>` : ''}
    </div>
    <button class="primary" id="btn-next-day">${s.nightInWeek >= 7 ? '进入周末结算' : '进入下一夜'}</button>`;
  YD.renderHud(YD.$('#hud-set'));
  YD.$('#btn-next-day').onclick = () => {
    YD.advanceDay(s);
    if (s.phase === 'weekly') YD.renderWeekly();
    else if (s.phase === 'gameover') YD.renderGameOver();
    else if (s.phase === 'customer') YD.renderCustomer();
    else YD.renderHub();
  };
};

YD.renderWeekly = function () {
  const s = YD.S;
  YD.weeklyChoices = { upgrade: null, hire: null, faction: null, raise: false };
  const st = YD.stageInfo(s);
  let rent = st.rent;
  if (s.faction === 'dock') rent = Math.round(rent * 1.3);
  else if (s.faction === 'guild') rent = Math.round(rent * 1.2);
  const wages = s.employees.reduce((sum, e) => sum + e.wage, 0);
  const can = YD.canStageUp(s);

  YD.show('weekly');
  YD.$('#screen-weekly').innerHTML = `
    <div class="hud" id="hud-w"></div>
    <div class="card scroll">
      <h2>周末结算 · 第 ${s.week} 周</h2>
      <div class="list">
        <div class="row"><span>房租${s.faction ? '（含保护费）' : ''}</span><span>${YD.fmt(rent)}</span></div>
        <div class="row"><span>员工周薪</span><span>${YD.fmt(wages)}</span></div>
        <div class="row"><span>应付合计</span><span style="color:var(--accent)">${YD.fmt(rent + wages)}</span></div>
      </div>
      <h3 style="margin-top:14px;">升级 / 工具</h3>
      <div class="choice-grid" id="up-choices">
        ${can.ok ? `<button class="choice" data-up="stage"><div class="t">升级「${can.name}」</div><div class="d">费用 ${YD.fmt(can.cost)}</div></button>` : `<div class="muted">阶段升级：${can.reason}</div>`}
        ${!s.upgrades.uv ? `<button class="choice" data-up="uv"><div class="t">买紫外灯</div><div class="d">¥800 · 线索位+1</div></button>` : ''}
        ${!s.upgrades.scale ? `<button class="choice" data-up="scale"><div class="t">买电子秤</div><div class="d">¥600 · 鉴定等级→2</div></button>` : ''}
        <button class="choice selected" data-up=""><div class="t">本周不升级</div><div class="d">先攒钱</div></button>
      </div>
      <h3 style="margin-top:14px;">雇人（最多 2）</h3>
      <div class="choice-grid" id="hire-choices">
        ${YD.EMPLOYEES.map((e) => {
          const owned = s.employees.some((x) => x.id === e.id);
          return `<button class="choice" data-hire="${e.id}" ${owned || s.employees.length >= 2 ? 'disabled' : ''}><div class="t">${e.name}${owned ? '（已雇）' : ''}</div><div class="d">${e.desc} · 签约 ${YD.fmt(e.cost)} · 周薪 ${YD.fmt(e.wage)}</div></button>`;
        }).join('')}
        <button class="choice selected" data-hire=""><div class="t">不雇人</div><div class="d">自己扛</div></button>
      </div>
      ${s.factionTeased && !s.faction ? `
      <h3 style="margin-top:14px;">势力（预告）</h3>
      <div class="choice-grid" id="fac-choices">
        ${YD.FACTIONS.map((f) => `<button class="choice" data-fac="${f.id}"><div class="t">${f.name}</div><div class="d">${f.pitch}</div></button>`).join('')}
        <button class="choice selected" data-fac=""><div class="t">暂不站队</div><div class="d">MVP 仅预告效果</div></button>
      </div>` : ''}
      ${s.employees.length ? `<label class="dim" style="display:flex;gap:8px;align-items:center;margin-top:12px;"><input type="checkbox" id="chk-raise"/> 给员工涨薪 10%（忠诚+8）</label>` : ''}
    </div>
    <button class="primary" id="btn-week-go">交租并进入下周</button>`;
  YD.renderHud(YD.$('#hud-w'));

  const bindExclusive = (root, attr, key) => {
    YD.$$(`#${root} .choice`).forEach((btn) => {
      btn.onclick = () => {
        if (btn.disabled) return;
        YD.$$(`#${root} .choice`).forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        YD.weeklyChoices[key] = btn.getAttribute(attr) || null;
        if (!YD.weeklyChoices[key]) YD.weeklyChoices[key] = null;
      };
    });
  };
  bindExclusive('up-choices', 'data-up', 'upgrade');
  bindExclusive('hire-choices', 'data-hire', 'hire');
  if (YD.$('#fac-choices')) bindExclusive('fac-choices', 'data-fac', 'faction');

  YD.$('#btn-week-go').onclick = () => {
    const raise = YD.$('#chk-raise') ? YD.$('#chk-raise').checked : false;
    YD.weeklyChoices.raise = raise;
    // normalize empty strings
    if (!YD.weeklyChoices.upgrade) YD.weeklyChoices.upgrade = null;
    if (!YD.weeklyChoices.hire) YD.weeklyChoices.hire = null;
    if (!YD.weeklyChoices.faction) YD.weeklyChoices.faction = null;
    YD.resolveWeekly(s, YD.weeklyChoices);
    if (s.phase === 'gameover') YD.renderGameOver();
    else {
      if (s.eventQueue && s.eventQueue.length) YD.renderEvent();
      else YD.renderHub();
    }
  };
};

YD.renderGameOver = function () {
  const s = YD.S;
  YD.show('gameover');
  YD.$('#screen-gameover').innerHTML = `
    <div class="title-wrap">
      <div class="logo">${YD.iconSvg('warn', 56)}</div>
      <h1 style="letter-spacing:0.15em;">出局</h1>
      <p class="dim" style="line-height:1.7;max-width:300px;">${s.gameOverReason || '经营失败。'}</p>
      <p class="muted">存活 ${s.day} 天 · 最高净资产 ${YD.fmt(s.netWorthPeak)} · 成交 ${s.stats.dealt}</p>
    </div>
    <div class="title-actions">
      <button class="primary" id="btn-retry">保留鉴定等级，重开</button>
      <button id="btn-title">回标题</button>
    </div>`;
  YD.$('#btn-retry').onclick = () => {
    const idLevel = s.idLevel;
    YD.clearSave();
    YD.S = YD.newState();
    YD.S.idLevel = idLevel;
    YD.S.tutorialDone = true; // skip tutorial on retry
    YD.renderHub();
  };
  YD.$('#btn-title').onclick = () => {
    YD.clearSave();
    YD.renderTitle();
  };
};

document.addEventListener('DOMContentLoaded', () => {
  YD.mount();
});
