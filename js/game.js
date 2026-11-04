window.YD = window.YD || {};
YD.rand = (a,b) => Math.floor(a + Math.random()*(b-a+1));
YD.pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
YD.clamp = (v,a,b) => Math.max(a, Math.min(b,v));
YD.fmt = (n) => '¥' + Math.round(n).toLocaleString('zh-CN');
YD.shuffle = (arr) => {
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){ const j=YD.rand(0,i); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
};

YD.assets = (s) => {
  const inv = (s.inventory||[]).reduce((sum,it)=>sum+(it.sell||it.cost||0),0);
  return s.cash + s.clean + s.dirty + inv;
};
YD.netWorth = (s) => YD.assets(s) - s.debt;

YD.nextGoal = function(s) {
  if (s.gameOver) return { title:'已出局', need:1, have:1, done:true, kind:'over' };
  if (s.stage < 3) {
    const next = YD.STAGE[s.stage];
    const have = Math.max(0, YD.netWorth(s));
    const need = next.unlockNet;
    const cost = next.unlockCost || 0;
    return {
      kind:'stage',
      title: have >= need ? `可升级「${next.name}」（费 ${YD.fmt(cost)}）` : `再赚到净资产 ${YD.fmt(need)} 开「${next.name}」`,
      have, need: Math.max(need,1), done: have >= need, nextName: next.name, cost,
    };
  }
  const rent = YD.currentRent(s);
  const nightsLeft = 8 - s.nightInWeek;
  return {
    kind:'rent',
    title: `本周日租 ${YD.fmt(rent)} · 还剩 ${nightsLeft} 夜`,
    have: s.clean + s.cash, need: Math.max(rent,1), done: (s.clean+s.cash) >= rent, rent, nightsLeft,
  };
};

YD.currentRent = function(s) {
  const st = YD.STAGE[s.stage-1];
  let rent = st.rent;
  if (s.week > 1) rent = Math.round(rent * Math.pow(1 + YD.NUM.rentInflation, s.week - 1));
  if (s.faction === 'dock') rent = Math.round(rent * 1.3);
  else if (s.faction === 'guild') rent = Math.round(rent * 1.2);
  return rent;
};

YD.newState = function() {
  return {
    day:1, week:1, nightInWeek:1, stage:1,
    cash:YD.NUM.startCash, clean:YD.NUM.startClean, dirty:0, debt:YD.NUM.startDebt,
    heat:0, idLevel:1, reputation:50, netWorthPeak: YD.NUM.startCash+YD.NUM.startClean-YD.NUM.startDebt,
    inventory:[], employees:[], museum:[],
    faction:null, factionTeased:false,
    tutorialStep:0, tutorialDone:false, missedRent:0,
    upgrades:{ magnifier:true, uv:false, scale:false },
    stats:{ dealt:0, refused:0, reported:0, mistakes:0, profit:0, caughtFake:0 },
    castSeen:{}, castAffinity:{},
    bounties:[], bountyProgress:{},
    repairDiscount:false,
    gameOver:false, gameOverReason:'',
    phase:'title', nightQueue:[], customerIndex:0, current:null,
    nightLog:[], nightProfit:0, nightDirty:0, nightClean:0,
    lastResult:null, haggle:null, foundFlaws:[], eventQueue:[],
    nightFlags:{ caughtFake:0, pressedDeals:0, goodReports:0, mistakes:0, jackpotGot:0 },
  };
};

YD.restoreRuntime = function(saved) {
  const s = YD.newState();
  Object.assign(s, saved);
  s.phase = 'hub';
  s.nightQueue=[]; s.current=null; s.nightLog=[]; s.haggle=null;
  s.foundFlaws=[]; s.eventQueue=[]; s.lastResult=null;
  s.museum = s.museum || [];
  s.bounties = s.bounties || [];
  s.bountyProgress = s.bountyProgress || {};
  s.nightFlags = s.nightFlags || { caughtFake:0, pressedDeals:0, goodReports:0, mistakes:0, jackpotGot:0 };
  s.castSeen = s.castSeen || {}; s.castAffinity = s.castAffinity || {};
  return s;
};

YD.stageInfo = (s) => YD.STAGE[s.stage-1];

YD.clueSlots = function(s) {
  let n = YD.stageInfo(s).clueSlots;
  if (s.employees.some(e=>e.id==='apprentice')) n += 1;
  if (s.upgrades.uv) n += 1;
  return Math.min(4, n);
};

YD.rollBounties = function(s) {
  const pool = YD.shuffle(YD.BOUNTY_POOL);
  s.bounties = pool.slice(0,3).map(b => ({ ...b, done:false, claimed:false }));
  s.bountyProgress = {};
  s.nightFlags = { caughtFake:0, pressedDeals:0, goodReports:0, mistakes:0, jackpotGot:0 };
};

YD.bountyHave = function(s, b) {
  const f = s.nightFlags || {};
  if (b.key === 'caughtFake') return f.caughtFake || 0;
  if (b.key === 'nightProfit') return (s.nightClean||0) + (s.nightDirty||0);
  if (b.key === 'heatAtMost') return s.heat;
  if (b.key === 'pressedDeals') return f.pressedDeals || 0;
  if (b.key === 'goodReports') return f.goodReports || 0;
  if (b.key === 'mistakesAtMost') return f.mistakes || 0;
  if (b.key === 'jackpotGot') return f.jackpotGot || 0;
  return 0;
};

YD.bountyMet = function(s, b) {
  const have = YD.bountyHave(s, b);
  if (b.key === 'heatAtMost' || b.key === 'mistakesAtMost') return have <= b.need;
  return have >= b.need;
};

YD.claimBounties = function(s) {
  let gain = 0;
  for (const b of s.bounties) {
    if (b.claimed) continue;
    if (YD.bountyMet(s, b)) {
      b.done = true; b.claimed = true;
      s.clean += b.reward; gain += b.reward;
    }
  }
  return gain;
};

YD.makeIdCard = function(name, gender, flaws) {
  const photoMismatch = flaws.includes('photo');
  let idName = name;
  if (flaws.includes('name')) {
    const pool = YD.NAMES[gender].filter(n=>n!==name);
    idName = YD.pick(pool);
  }
  const year = 1900 + YD.rand(65,95);
  const month = String(YD.rand(1,12)).padStart(2,'0');
  const day = String(YD.rand(1,28)).padStart(2,'0');
  let idNo = '3'; for (let i=0;i<17;i++) idNo += String(YD.rand(0,9));
  return {
    name:idName, gender: gender==='male'?'男':'女', idNo,
    birth:`${year}-${month}-${day}`,
    photoLabel: photoMismatch ? '照片（疑似）' : '照片',
    photoMismatch, wantedMark: flaws.includes('wanted'),
  };
};

YD.makeCustomer = function(s, script, cast) {
  if (script) {
    const itemDef = YD.ITEMS.find(i=>i.id===script.itemId);
    const base = itemDef.base;
    const ask = Math.round(base * (script.askMult||0.8));
    return {
      scripted:true, script, cast:null,
      name:script.name, gender:script.gender, story:script.story, tip:script.tip||'',
      item:{
        defId:itemDef.id, name:itemDef.name, cat:itemDef.cat, base, ask,
        floor:Math.round(base*0.45), genuine:script.genuine, flaws:script.flaws.slice(),
        stolen: script.flaws.includes('wanted')||script.flaws.includes('serial'),
        wanted: script.flaws.includes('wanted'),
        repairable: !!itemDef.repairable || itemDef.id==='radio_vintage',
        jackpot:!!itemDef.jackpot, jackpotMult:itemDef.jackpotMult||1, risky:!!itemDef.risky,
      },
      idCard: YD.makeIdCard(script.name, script.gender, script.flaws),
      patience: YD.NUM.hagglePatience,
    };
  }

  const stage = s.stage;
  let castNpc = cast || null;
  // inject cast sometimes
  if (!castNpc && s.tutorialDone && Math.random() < 0.28) {
    castNpc = YD.pick(YD.CAST);
  }

  let pool = YD.ITEMS.filter(i=>i.stage<=stage);
  // jackpot injection
  if (stage>=2 && Math.random() < YD.NUM.jackpotChance) {
    const jp = YD.ITEMS.filter(i=>i.jackpot && i.stage<=stage);
    if (jp.length) pool = jp;
  }

  const itemDef = YD.pick(pool);
  let isFake = Math.random() < YD.stageInfo(s).fakeRate;
  let gender = Math.random()<0.55 ? 'male':'female';
  let name = YD.pick(YD.NAMES[gender]);
  let story = YD.pick(YD.STORIES);
  let flaws = [];
  let askMult = isFake ? 1.05 : 0.9;

  if (castNpc) {
    name = castNpc.name; gender = castNpc.gender; story = YD.pick(castNpc.stories);
    s.castSeen[castNpc.id] = (s.castSeen[castNpc.id]||0)+1;
    if (castNpc.isCop && Math.random() < castNpc.trapChance) {
      // undercover trap: dirty-looking item that is actually bait OR clean with wanted mark fake
      isFake = true;
      flaws = ['wanted'];
      story = '随便看看……这相机你敢收吗？';
    } else if (castNpc.dirtyBoost) {
      isFake = Math.random() < 0.4;
      askMult = castNpc.askMult;
      if (!isFake) flaws = Math.random()<0.5 ? ['rush'] : [];
      else flaws = YD.shuffle(['serial','invoice','stamp']).slice(0, YD.rand(1,2)).map(x=>x);
    } else if (castNpc.preferGenuine) {
      isFake = Math.random() < 0.12;
    }
  }

  if (isFake && !flaws.length) {
    const count = YD.rand(1, Math.min(3, 1+Math.floor(stage/2)));
    flaws = YD.shuffle(YD.FLAWS).slice(0,count).map(f=>f.id);
  } else if (!isFake && Math.random()<0.1) {
    flaws = ['rush'];
  }

  // Cop clean visit
  if (castNpc && castNpc.isCop && !flaws.includes('wanted') && Math.random()<0.45) {
    isFake = false; flaws = [];
  }

  const base = itemDef.base;
  const variance = 0.85 + Math.random()*0.35;
  let ask = Math.round(base * variance * askMult);
  if (castNpc && castNpc.dirtyBoost) ask = Math.round(base * askMult);
  const floor = Math.round(base * (isFake ? 0.35 : 0.5));

  return {
    scripted:false, cast: castNpc,
    name, gender, story, tip: castNpc ? castNpc.intro : '',
    item:{
      defId:itemDef.id, name:itemDef.name, cat:itemDef.cat, base, ask, floor,
      genuine: !isFake, flaws,
      stolen: flaws.includes('serial')||flaws.includes('wanted')||(isFake&&Math.random()<0.3),
      wanted: flaws.includes('wanted'),
      repairable: !!itemDef.repairable || (!isFake && Math.random()<0.28),
      jackpot:!!itemDef.jackpot, jackpotMult:itemDef.jackpotMult||1, risky:!!itemDef.risky,
      dirtyDeal: !!(castNpc && castNpc.dirtyBoost),
      payoutMult: (castNpc && castNpc.payoutMult) || 1,
      heatOnAccept: (castNpc && castNpc.heatOnAccept) || 0,
    },
    idCard: YD.makeIdCard(name, gender, flaws),
    patience: YD.NUM.hagglePatience,
  };
};

YD.startNight = function(s) {
  s.nightLog=[]; s.nightProfit=0; s.nightDirty=0; s.nightClean=0;
  s.customerIndex=0; s.foundFlaws=[]; s.haggle=null; s.lastResult=null;
  s.nightFlags = { caughtFake:0, pressedDeals:0, goodReports:0, mistakes:0, jackpotGot:0 };
  if (!s.bounties || !s.bounties.length || s.nightInWeek===1 || !s.tutorialDone) {
    YD.rollBounties(s);
  }

  if (!s.tutorialDone) {
    s.nightQueue = YD.TUTORIAL.map(t=>YD.makeCustomer(s,t));
  } else {
    const st = YD.stageInfo(s);
    const n = YD.rand(st.customers[0], st.customers[1]);
    s.nightQueue = [];
    // guarantee one cast if past tutorial
    const forceCast = Math.random()<0.55 ? YD.pick(YD.CAST) : null;
    for (let i=0;i<n;i++) {
      const c = (i===Math.floor(n/2) && forceCast) ? YD.makeCustomer(s,null,forceCast) : YD.makeCustomer(s);
      s.nightQueue.push(c);
    }
    if (!s.nightQueue.some(c=>c.item.flaws.length && !c.item.genuine)) {
      s.nightQueue[n-1] = YD.makeCustomer(s, {
        name:'可疑客', gender:'male', story:'今晚就要钱，别问那么多。',
        itemId: YD.pick(YD.ITEMS.filter(i=>i.stage<=s.stage)).id,
        genuine:false, flaws:[YD.pick(YD.FLAWS).id], askMult:1.0,
      });
    }
  }
  s.current = s.nightQueue[0];
  s.phase = 'customer';
  s.foundFlaws = [];
};

YD.nextCustomer = function(s) {
  s.customerIndex += 1;
  s.foundFlaws = [];
  s.haggle = null;
  if (s.customerIndex >= s.nightQueue.length) { YD.closeNight(s); return; }
  s.current = s.nightQueue[s.customerIndex];
  s.phase = 'customer';
};

YD.revealFlaw = function(s, flawId) {
  if (!s.current) return false;
  if (!s.current.item.flaws.includes(flawId)) return false;
  if (s.foundFlaws.includes(flawId)) return false;
  if (s.foundFlaws.length >= YD.clueSlots(s)) return false;
  s.foundFlaws.push(flawId);
  return true;
};

YD.startHaggle = function(s, mode) {
  const c = s.current;
  s.haggle = {
    mode, ask:c.item.ask, floor:c.item.floor,
    offer: Math.round((c.item.ask+c.item.floor)/2),
    patience:c.patience, log:[],
  };
  s.phase = 'haggle';
};

YD.haggleOffer = function(s, price) {
  const h = s.haggle;
  if (!h) return { ok:false, msg:'无议价' };
  h.offer = price;
  if (price >= h.ask) return YD.finishDeal(s, price, false);
  if (price < h.floor) {
    h.patience -= 1;
    h.log.push('对方摇头：太低了。');
    if (h.patience <= 0) {
      s.reputation = YD.clamp(s.reputation-3,0,100);
      s.stats.refused += 1;
      s.lastResult = { type:'walk', title:'客人摔门走人', text:'压得太狠。口碑下降。', delta:{}, reaction:'哼，当我好说话？' };
      s.phase = 'result';
      return { ok:false, walk:true };
    }
    return { ok:false, msg:'太低，耐心−1' };
  }
  const ratio = (price - h.floor) / Math.max(1, h.ask - h.floor);
  const chance = 0.35 + ratio * 0.6;
  h.patience -= 1;
  if (Math.random() < chance || price >= h.ask * 0.92) {
    return YD.finishDeal(s, price, h.mode==='press');
  }
  h.log.push('再加点。');
  if (h.patience <= 0) {
    h.log.push('对方不耐烦了，坚持原价。');
    return { ok:false, msg:'只接受接近原价', forceAsk:true };
  }
  return { ok:false, msg:'未谈拢' };
};

YD.pay = function(s, price) {
  if (s.cash + s.clean < price) return false;
  if (s.cash >= price) s.cash -= price;
  else { const left = price - s.cash; s.cash = 0; s.clean -= left; }
  return true;
};

YD.finishDeal = function(s, price, pressed) {
  const c = s.current;
  const item = c.item;
  if (!YD.pay(s, price)) return { ok:false, msg:'现金不足' };

  const badHard = item.flaws.some(f=>['photo','wanted','serial','name'].includes(f));
  const isStolen = item.stolen || item.wanted || item.dirtyDeal;
  let margin = YD.NUM.marginMin + Math.random()*(YD.NUM.marginMax-YD.NUM.marginMin);
  let sell = Math.round(price * (1+margin) * (item.payoutMult||1));

  // Jackpot: if genuine rare, huge upside (SI mix multipliers spirit)
  let jackpotHit = false;
  if (item.jackpot && item.genuine && !badHard) {
    jackpotHit = true;
    sell = Math.round(price * (item.jackpotMult || 6));
    s.nightFlags.jackpotGot += 1;
  } else if (!item.genuine && badHard) {
    sell = Math.round(price * 0.65);
  }
  if (pressed) sell = Math.round(sell * 1.08);

  const invItem = {
    id:'inv_'+Date.now()+'_'+Math.random().toString(16).slice(2,6),
    name:item.name, defId:item.defId, cost:price, sell,
    genuine:item.genuine, flaws:item.flaws.slice(), stolen:isStolen,
    repairable:item.repairable, repaired:false,
    jackpot:item.jackpot, jackpotHit, museumWorthy: jackpotHit || (item.genuine && item.base>=500),
  };
  s.inventory.push(invItem);

  let heatDelta = 0;
  let note = '入库，打烊出货。';
  let reaction = pressed ? '……行吧，成交。' : '好，痛快。';
  let title = `收下「${item.name}」`;

  if (isStolen || badHard || item.dirtyDeal) {
    heatDelta += YD.HEAT.stolen + (item.heatOnAccept||0);
    note = '来路可疑，暗账风险↑。';
    reaction = item.dirtyDeal ? '识相。回头还有货。' : '嘿嘿，你懂的。';
  } else {
    heatDelta += YD.HEAT.registry;
  }
  if (item.wanted) heatDelta += 4;

  if (c.script && c.script.sympathy && pressed) {
    s.reputation = YD.clamp(s.reputation-5,0,100);
    note += ' 压价伤人情。'; reaction = '唉……随便你。';
  } else if (c.script && c.script.sympathy && !pressed) {
    s.reputation = YD.clamp(s.reputation+4,0,100);
    note += ' 口碑↑'; reaction = '谢谢你，孩子。';
  }
  if (c.cast && c.cast.role==='regular' && !pressed) {
    s.castAffinity[c.cast.id] = (s.castAffinity[c.cast.id]||0)+2;
  }

  if (jackpotHit) {
    title = `爆款！「${item.name}」`;
    note = `鉴定为珍品潜力，估值约 ${YD.fmt(sell)}！`;
    reaction = '你……你确定就这个价？！';
  }

  s.heat = YD.clamp(s.heat + heatDelta, 0, 100);
  s.stats.dealt += 1;
  if (pressed) s.nightFlags.pressedDeals += 1;
  s.nightLog.push({ name:c.name, action: pressed?'压':'收', price, heatDelta });

  s.lastResult = {
    type: jackpotHit ? 'jackpot' : 'buy',
    title, text: `${note} 成本 ${YD.fmt(price)}`,
    delta:{ heat:heatDelta, cash:-price },
    reaction, invItem, coins: Math.min(24, 6+Math.floor(price/80)),
  };
  s.phase = 'result';
  s.haggle = null;
  return { ok:true };
};

YD.actRefuse = function(s) {
  const c = s.current; const item = c.item;
  const bad = item.flaws.length>0 && (!item.genuine || item.flaws.some(f=>['photo','wanted','serial','name'].includes(f)));
  let heatDelta = 0;
  let title = `拒绝「${item.name}」`;
  let text = '';
  let reaction = '……走了。';
  let gotcha = false;

  if (bad) {
    heatDelta += YD.HEAT.refuseSuspect;
    text = '判断正确。';
    gotcha = !item.genuine;
    if (gotcha) {
      s.nightFlags.caughtFake += 1;
      s.stats.caughtFake += 1;
      heatDelta += YD.HEAT.gotchaBonus;
      title = '抓到了！赝品';
      text = `破绽：${item.flaws.map(id=>YD.FLAWS.find(f=>f.id===id)?.name).filter(Boolean).join('、')}`;
      reaction = c.script && c.script.angryOnRefuse ? '你给我等着！' : '……识破了？晦气。';
    }
    if (c.script && c.script.angryOnRefuse) { heatDelta += 5; text += ' 对方翻脸，热度+5。'; }
  } else {
    s.reputation = YD.clamp(s.reputation-2,0,100);
    s.stats.mistakes += 1; s.nightFlags.mistakes += 1;
    text = '这是干净货，误拒，口碑−2。';
    reaction = '有病吧？我这可是正经货！';
  }
  s.heat = YD.clamp(s.heat+heatDelta,0,100);
  s.stats.refused += 1;
  s.nightLog.push({ name:c.name, action:'拒', price:0, heatDelta });
  s.lastResult = { type: gotcha?'gotcha':'refuse', title, text, delta:{heat:heatDelta}, reaction, gotcha };
  s.phase = 'result';
};

YD.actReport = function(s) {
  const c = s.current; const item = c.item;
  const bad = item.flaws.some(f=>['photo','wanted','serial','name','invoice'].includes(f)) || item.wanted || item.stolen;
  let heatDelta = YD.HEAT.report;
  let title = '报警';
  let text = '';
  let reaction = '……警察来了。';
  if (bad) {
    text = '查有实据，热度下降。';
    s.reputation = YD.clamp(s.reputation+2,0,100);
    s.nightFlags.goodReports += 1;
    if (!item.genuine) { s.nightFlags.caughtFake += 1; s.stats.caughtFake += 1; title = '抓到了！报警收网'; }
    reaction = '你举报我？！';
  } else {
    heatDelta = 2;
    s.reputation = YD.clamp(s.reputation-4,0,100);
    s.stats.mistakes += 1; s.nightFlags.mistakes += 1;
    text = '误报，民警不悦。';
    reaction = '神经病啊！';
  }
  // Cop twist: reporting to undercover when clean angers; when trap succeeds rewards
  if (c.cast && c.cast.isCop) {
    if (bad) { text += ' 便衣点头：还算识相。'; heatDelta -= 2; }
    else { text += ' 便衣冷笑：浪费警力。'; heatDelta += 4; }
  }
  s.heat = YD.clamp(s.heat+heatDelta,0,100);
  s.stats.reported += 1;
  s.nightLog.push({ name:c.name, action:'警', price:0, heatDelta });
  s.lastResult = { type: bad?'gotcha':'report', title, text, delta:{heat:heatDelta}, reaction, gotcha:!!bad };
  s.phase = 'result';
};

YD.closeNight = function(s) {
  let cleanGain=0, dirtyGain=0;
  const sold = s.inventory.slice();
  s.inventory = [];
  let repairCandidate = null;
  if (!s.tutorialDone) {
    repairCandidate = {
      id:'tut_radio', name:'老式收音机', defId:'radio_vintage', cost:60, sell:140,
      genuine:true, flaws:[], stolen:false, repairable:true, repaired:false, museumWorthy:false,
    };
  } else {
    repairCandidate = sold.find(x=>x.repairable && !x.repaired) || null;
  }
  s.pendingRepair = repairCandidate;
  s.pendingSold = sold.filter(x=>x!==repairCandidate);
  for (const it of s.pendingSold) {
    const price = it.sell;
    if (it.stolen || (!it.genuine && it.flaws.length)) dirtyGain += price;
    else cleanGain += price;
    if (it.museumWorthy || it.jackpotHit) {
      if (!s.museum.some(m=>m.defId===it.defId && m.jackpotHit===!!it.jackpotHit)) {
        s.museum.push({ defId:it.defId, name:it.name, jackpotHit:!!it.jackpotHit, day:s.day });
      }
    }
  }
  s.pendingClean = cleanGain;
  s.pendingDirty = dirtyGain;
  if (s.pendingRepair) s.phase = 'repair';
  else YD.doRepair(s, false);
};

YD.doRepair = function(s, yes) {
  let cleanGain = s.pendingClean||0;
  let dirtyGain = s.pendingDirty||0;
  if (s.pendingRepair) {
    const it = s.pendingRepair;
    if (yes) {
      let cost = Math.round((it.cost||50)*YD.NUM.repairCostRate)||20;
      if (s.repairDiscount) cost = Math.round(cost*0.5);
      if (YD.pay(s, cost) || s.cash+s.clean>=0) {
        // if pay failed partially still proceed cheap
        const mult = s.employees.some(e=>e.id==='restorer') ? 1.6 : YD.NUM.repairMult;
        let price = Math.round((it.sell||it.cost*1.4)*mult);
        if (it.jackpotHit) price = Math.round(price * 1.2);
        if (it.stolen) dirtyGain += price; else cleanGain += price;
        s.nightLog.push({ name:'翻新', action:'修', price, heatDelta:0 });
        if (it.museumWorthy || it.jackpotHit) {
          if (!s.museum.some(m=>m.defId===it.defId)) s.museum.push({ defId:it.defId, name:it.name, jackpotHit:!!it.jackpotHit, day:s.day });
        }
      } else {
        const price = it.sell||it.cost;
        if (it.stolen) dirtyGain += price; else cleanGain += price;
      }
    } else {
      const price = it.sell||it.cost;
      if (it.stolen) dirtyGain += price; else cleanGain += price;
    }
  }
  s.clean += cleanGain; s.dirty += dirtyGain;
  s.nightClean = cleanGain; s.nightDirty = dirtyGain;
  s.nightProfit = cleanGain + dirtyGain;
  s.stats.profit += cleanGain + dirtyGain;
  s.pendingRepair = null; s.pendingSold = [];
  s.repairDiscount = false;

  s.heat = YD.clamp(s.heat + YD.HEAT.nightDecay, 0, 100);

  // wash dirty (SI laundromat daily cap)
  if (s.stage>=2 && s.dirty>0) {
    const wash = Math.min(YD.NUM.washNightCap, s.dirty);
    const fee = Math.round(wash * YD.NUM.washFee);
    s.dirty -= wash; s.clean += wash - fee;
  }
  if (s.debt>0 && s.clean>600) {
    const pay = Math.min(s.debt, Math.round(s.clean*0.1));
    s.clean -= pay; s.debt -= pay;
  }
  s.netWorthPeak = Math.max(s.netWorthPeak, YD.netWorth(s));

  // bounty payout
  const bountyGain = YD.claimBounties(s);

  s.eventQueue = [];
  if (s.heat >= YD.HEAT.seal) {
    s.gameOver = true; s.gameOverReason = '热度爆表，店铺被查封。';
    s.phase = 'gameover'; YD.save(s); return;
  }
  if (s.heat >= YD.HEAT.raid) {
    s.eventQueue.push({ type:'raid', text:'突查！暗账被抄走一大截。', shake:true });
    s.dirty = Math.round(s.dirty*0.55);
    s.cash = Math.max(0, Math.round(s.cash*0.85));
    s.heat = YD.clamp(s.heat-15,0,100);
  } else if (s.heat >= YD.HEAT.ask) {
    s.eventQueue.push({ type:'ask', text:'民警上门盘问，折腾半宿。热度略降。' });
    s.heat = YD.clamp(s.heat-8,0,100);
  }

  // nightly surprise (Probably Stolen morning/night beat)
  if (s.tutorialDone) {
    const ev = YD.weightedEvent();
    s.eventQueue.push({ type:'story', id:ev.id, text:ev.text, effect:ev.effect, shake:ev.id==='thief' });
  } else {
    s.eventQueue.push({ type:'faction', text:'码头帮小弟递来名片：「想做大，找我们。」' });
    s.factionTeased = true;
    s.tutorialDone = true; s.tutorialStep = 99;
    s.eventQueue.push({ type:'goal', text:`霓虹招牌在雨里闪了一下——目标：净资产到 ${YD.fmt(YD.STAGE[1].unlockNet)}，升级「小当铺」。` });
  }

  if (bountyGain>0) {
    s.eventQueue.unshift({ type:'bounty', text:`悬赏结算 +${YD.fmt(bountyGain)} 明账` });
  }

  for (const e of s.employees) e.loyalty = YD.clamp(e.loyalty - YD.NUM.loyaltyDecay, 0, 100);
  s.phase = 'settlement';
};

YD.weightedEvent = function() {
  const bag = [];
  for (const e of YD.NIGHT_EVENTS) for (let i=0;i<e.w;i++) bag.push(e);
  return YD.pick(bag);
};

YD.applyEventEffect = function(s, effect) {
  if (!effect) return;
  if (effect.heat) s.heat = YD.clamp(s.heat+effect.heat,0,100);
  if (effect.dirtyLoss) s.dirty = Math.round(s.dirty * (1-effect.dirtyLoss));
  if (effect.factionTease) s.factionTeased = true;
  if (effect.repairDiscount) s.repairDiscount = true;
  if (effect.interest) {
    const gain = Math.min(YD.NUM.interestCap, Math.floor(s.clean/100)*YD.NUM.interestPer100);
    s.clean += gain;
    return gain;
  }
  if (effect.choice==='bribe') {
    // handled in UI: pay 150 heat-8 or refuse heat+5
  }
  return 0;
};

YD.advanceDay = function(s) {
  if (s.gameOver) { s.phase='gameover'; return; }
  if (s.nightInWeek >= 7) { s.phase='weekly'; return; }
  s.nightInWeek += 1; s.day += 1;
  const float = Math.min(s.clean, 450);
  s.clean -= float; s.cash += float;
  YD.rollBounties(s);
  YD.save(s);
  YD.startNight(s);
};

YD.resolveWeekly = function(s, choices) {
  const rent = YD.currentRent(s);
  const wages = s.employees.reduce((sum,e)=>sum+e.wage,0);
  const totalDue = rent + wages;
  const pool = s.clean + s.cash;
  if (pool < totalDue) {
    s.missedRent += 1;
    if (s.missedRent >= 2) {
      s.gameOver = true; s.gameOverReason = '连续两周交不起房租与工钱，摊位被清走。';
      s.phase = 'gameover'; YD.save(s); return { ok:false };
    }
    s.cash = Math.round(s.cash*0.5);
    s.eventQueue = [{ type:'miss', text:'本周没交齐租金，被人砸了招牌。再欠一周就出局。' }];
  } else {
    s.missedRent = 0;
    YD.pay(s, totalDue);
  }
  if (choices.raise && s.employees.length) {
    for (const e of s.employees) { e.wage = Math.round(e.wage*1.1); e.loyalty = YD.clamp(e.loyalty+YD.NUM.raiseLoyalty,0,100); }
  }
  if (choices.hire) {
    const def = YD.EMPLOYEES.find(e=>e.id===choices.hire);
    if (def && !s.employees.some(e=>e.id===def.id) && s.employees.length<2) {
      if (s.clean+s.cash >= def.cost) { YD.pay(s, def.cost); s.employees.push({...def}); }
    }
  }
  if (choices.upgrade==='uv' && !s.upgrades.uv && s.clean+s.cash>=800) { YD.pay(s,800); s.upgrades.uv=true; }
  if (choices.upgrade==='scale' && !s.upgrades.scale && s.clean+s.cash>=600) { YD.pay(s,600); s.upgrades.scale=true; s.idLevel=Math.max(s.idLevel,2); }
  if (choices.upgrade==='stage') YD.tryStageUp(s);
  if (choices.faction && !s.faction) s.faction = choices.faction;

  s.week += 1; s.nightInWeek = 1; s.day += 1;
  const float = Math.min(s.clean, 500); s.clean -= float; s.cash += float;
  YD.rollBounties(s);
  YD.save(s);
  s.phase = 'hub';
  return { ok:true };
};

YD.tryStageUp = function(s) {
  if (s.stage >= 3) return false;
  const next = YD.STAGE[s.stage];
  if (YD.netWorth(s) < next.unlockNet) return false;
  if (next.needIdLv && s.idLevel < next.needIdLv) return false;
  const cost = next.unlockCost || 0;
  if (s.clean + s.cash < cost) return false;
  YD.pay(s, cost);
  s.stage += 1;
  if (s.stage >= 2) s.idLevel = Math.max(s.idLevel, 2);
  s.eventQueue = s.eventQueue || [];
  s.eventQueue.push({ type:'stage', text:`店铺升级为「${YD.STAGE[s.stage-1].name}」！外观已改变。`, upgrade:true });
  return true;
};

YD.canStageUp = function(s) {
  if (s.stage >= 3) return { ok:false, reason:'已达 MVP 上限' };
  const next = YD.STAGE[s.stage];
  const nw = YD.netWorth(s);
  if (nw < next.unlockNet) return { ok:false, reason:`净资产需 ${YD.fmt(next.unlockNet)}（现 ${YD.fmt(nw)}）` };
  if (next.needIdLv && s.idLevel < next.needIdLv) return { ok:false, reason:`鉴定等级需 ${next.needIdLv}` };
  if (s.clean + s.cash < (next.unlockCost||0)) return { ok:false, reason:`升级费 ${YD.fmt(next.unlockCost)}` };
  return { ok:true, cost:next.unlockCost, name:next.name };
};
