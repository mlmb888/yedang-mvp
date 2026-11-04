window.YD = window.YD || {};

YD.rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
YD.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
YD.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
YD.fmt = (n) => '¥' + Math.round(n).toLocaleString('zh-CN');

YD.assets = (s) => {
  const inv = (s.inventory || []).reduce((sum, it) => sum + (it.sell || it.cost || 0), 0);
  return s.cash + s.clean + s.dirty + inv;
};
YD.netWorth = (s) => YD.assets(s) - s.debt;

YD.newState = function () {
  return {
    day: 1,
    week: 1,
    nightInWeek: 1,
    stage: 1,
    cash: YD.NUM.startCash,
    clean: YD.NUM.startClean,
    dirty: 0,
    debt: YD.NUM.startDebt,
    heat: 0,
    idLevel: 1,
    reputation: 50,
    netWorthPeak: YD.NUM.startCash + YD.NUM.startClean - YD.NUM.startDebt,
    inventory: [],
    employees: [],
    faction: null,
    factionTeased: false,
    tutorialStep: 0,
    tutorialDone: false,
    missedRent: 0,
    upgrades: { magnifier: true, uv: false, scale: false },
    stats: { dealt: 0, refused: 0, reported: 0, mistakes: 0, profit: 0 },
    gameOver: false,
    gameOverReason: '',
    // runtime (not saved deeply)
    phase: 'title',
    nightQueue: [],
    customerIndex: 0,
    current: null,
    nightLog: [],
    nightProfit: 0,
    nightDirty: 0,
    nightClean: 0,
    lastResult: null,
    haggle: null,
    foundFlaws: [],
    eventQueue: [],
  };
};

YD.restoreRuntime = function (saved) {
  const s = YD.newState();
  Object.assign(s, saved);
  s.phase = 'hub';
  s.nightQueue = [];
  s.current = null;
  s.nightLog = [];
  s.haggle = null;
  s.foundFlaws = [];
  s.eventQueue = [];
  s.lastResult = null;
  return s;
};

YD.stageInfo = (s) => YD.STAGE[s.stage - 1];

YD.clueSlots = function (s) {
  let n = YD.stageInfo(s).clueSlots;
  if (s.employees.some((e) => e.id === 'apprentice')) n += 1;
  if (s.upgrades.uv) n += 1;
  return Math.min(4, n);
};

YD.fakeRate = function (s) {
  return YD.stageInfo(s).fakeRate;
};

YD.makeCustomer = function (s, script) {
  if (script) {
    const itemDef = YD.ITEMS.find((i) => i.id === script.itemId);
    const base = itemDef.base;
    const ask = Math.round(base * (script.askMult || 0.8));
    const floor = Math.round(base * 0.45);
    return {
      scripted: true,
      script,
      name: script.name,
      gender: script.gender,
      story: script.story,
      tip: script.tip || '',
      item: {
        defId: itemDef.id,
        name: itemDef.name,
        cat: itemDef.cat,
        icon: itemDef.icon,
        base,
        ask,
        floor,
        genuine: script.genuine,
        flaws: script.flaws.slice(),
        stolen: script.flaws.includes('wanted') || script.flaws.includes('serial'),
        wanted: script.flaws.includes('wanted'),
        repairable: itemDef.id === 'radio_vintage' || Math.random() < 0.25,
      },
      idCard: YD.makeIdCard(script.name, script.gender, script.flaws),
      patience: YD.NUM.hagglePatience,
    };
  }

  const stage = s.stage;
  const pool = YD.ITEMS.filter((i) => i.stage <= stage);
  const itemDef = YD.pick(pool);
  const isFake = Math.random() < YD.fakeRate(s);
  const gender = Math.random() < 0.55 ? 'male' : 'female';
  const name = YD.pick(YD.NAMES[gender]);
  let flaws = [];
  if (isFake) {
    const count = YD.rand(1, Math.min(3, 1 + Math.floor(stage / 2)));
    const shuffled = YD.FLAWS.slice().sort(() => Math.random() - 0.5);
    flaws = shuffled.slice(0, count).map((f) => f.id);
  } else if (Math.random() < 0.12) {
    // clean item but nervous seller
    flaws = ['rush'];
  }

  const base = itemDef.base;
  const variance = 0.85 + Math.random() * 0.35;
  const ask = Math.round(base * variance * (isFake ? 1.05 : 0.9));
  const floor = Math.round(base * (isFake ? 0.35 : 0.5));

  return {
    scripted: false,
    name,
    gender,
    story: YD.pick(YD.STORIES),
    tip: '',
    item: {
      defId: itemDef.id,
      name: itemDef.name,
      cat: itemDef.cat,
      icon: itemDef.icon,
      base,
      ask,
      floor,
      genuine: !isFake || flaws.length === 0,
      flaws,
      stolen: flaws.includes('serial') || flaws.includes('wanted') || (isFake && Math.random() < 0.3),
      wanted: flaws.includes('wanted'),
      repairable: !isFake && Math.random() < 0.3,
    },
    idCard: YD.makeIdCard(name, gender, flaws),
    patience: YD.NUM.hagglePatience,
  };
};

YD.makeIdCard = function (name, gender, flaws) {
  const photoMismatch = flaws.includes('photo');
  const idName = flaws.includes('name')
    ? (gender === 'male' ? YD.pick(YD.NAMES.male.filter((n) => n !== name)) : YD.pick(YD.NAMES.female.filter((n) => n !== name)))
    : name;
  const year = 19 + YD.rand(70, 95);
  const month = String(YD.rand(1, 12)).padStart(2, '0');
  const day = String(YD.rand(1, 28)).padStart(2, '0');
  let idNo = '3';
  for (let i = 0; i < 17; i++) idNo += String(YD.rand(0, 9));
  return {
    name: idName,
    gender: gender === 'male' ? '男' : '女',
    idNo,
    birth: `${year}-${month}-${day}`,
    photoLabel: photoMismatch ? '照片（疑似）' : '照片',
    photoMismatch,
    wantedMark: flaws.includes('wanted'),
  };
};

YD.startNight = function (s) {
  s.nightLog = [];
  s.nightProfit = 0;
  s.nightDirty = 0;
  s.nightClean = 0;
  s.customerIndex = 0;
  s.foundFlaws = [];
  s.haggle = null;
  s.lastResult = null;

  if (!s.tutorialDone) {
    s.nightQueue = YD.TUTORIAL.map((t) => YD.makeCustomer(s, t));
    // ensure radio in inventory path later via scripted close
  } else {
    const st = YD.stageInfo(s);
    const n = YD.rand(st.customers[0], st.customers[1]);
    s.nightQueue = [];
    for (let i = 0; i < n; i++) s.nightQueue.push(YD.makeCustomer(s));
    // guarantee at least one suspicious
    if (!s.nightQueue.some((c) => c.item.flaws.length)) {
      s.nightQueue[YD.rand(0, s.nightQueue.length - 1)] = YD.makeCustomer(s, {
        name: '可疑客',
        gender: 'male',
        story: '今晚就要钱，别问那么多。',
        itemId: YD.pick(YD.ITEMS.filter((i) => i.stage <= s.stage)).id,
        genuine: false,
        flaws: [YD.pick(YD.FLAWS).id],
        askMult: 1.0,
      });
    }
  }
  s.current = s.nightQueue[0];
  s.phase = 'customer';
  s.foundFlaws = [];
};

YD.nextCustomer = function (s) {
  s.customerIndex += 1;
  s.foundFlaws = [];
  s.haggle = null;
  if (s.customerIndex >= s.nightQueue.length) {
    YD.closeNight(s);
    return;
  }
  s.current = s.nightQueue[s.customerIndex];
  s.phase = 'customer';
};

YD.revealFlaw = function (s, flawId) {
  if (!s.current) return false;
  if (!s.current.item.flaws.includes(flawId)) return false;
  if (s.foundFlaws.includes(flawId)) return false;
  if (s.foundFlaws.length >= YD.clueSlots(s) && !s.foundFlaws.includes(flawId)) {
    // still allow if already under slots — block new beyond slots
    if (s.foundFlaws.length >= YD.clueSlots(s)) return false;
  }
  s.foundFlaws.push(flawId);
  return true;
};

YD.autoRevealForSlots = function (s) {
  // On inspect open, reveal up to clueSlots randomly from actual flaws
  if (!s.current) return;
  const flaws = s.current.item.flaws.slice();
  const slots = YD.clueSlots(s);
  // Player must tap to find — we expose "hotspots" equal to flaws, limited visibility by slots
  s.inspectHotspots = flaws.slice(0, Math.max(flaws.length, 1));
  s.inspectSlotsLeft = slots;
};

YD.startHaggle = function (s, mode) {
  const c = s.current;
  const ask = c.item.ask;
  const floor = c.item.floor;
  const mid = Math.round((ask + floor) / 2);
  s.haggle = {
    mode, // 'buy' or 'press'
    ask,
    floor,
    offer: mid,
    patience: c.patience,
    log: [],
  };
  s.phase = 'haggle';
};

YD.haggleOffer = function (s, price) {
  const h = s.haggle;
  if (!h) return { ok: false, msg: '无议价' };
  h.offer = price;
  if (price >= h.ask) {
    return YD.finishDeal(s, price, false);
  }
  if (price < h.floor) {
    h.patience -= 1;
    h.log.push('对方摇头：太低了。');
    if (h.patience <= 0) {
      s.reputation = YD.clamp(s.reputation - 3, 0, 100);
      s.stats.refused += 1;
      s.lastResult = { type: 'walk', text: '客人摔门走人。口碑下降。', delta: {} };
      s.phase = 'result';
      return { ok: false, walk: true };
    }
    return { ok: false, msg: '太低，耐心−1' };
  }
  // accept chance based on how close to ask
  const ratio = (price - h.floor) / Math.max(1, h.ask - h.floor);
  const chance = 0.35 + ratio * 0.6;
  h.patience -= 1;
  if (Math.random() < chance || price >= h.ask * 0.92) {
    return YD.finishDeal(s, price, h.mode === 'press');
  }
  h.log.push('再加点。');
  if (h.patience <= 0) {
    // last chance: take ask
    h.log.push('对方不耐烦了，坚持原价。');
    return { ok: false, msg: '只接受原价或接近原价', forceAsk: true };
  }
  return { ok: false, msg: '未谈拢' };
};

YD.finishDeal = function (s, price, pressed) {
  const c = s.current;
  const item = c.item;
  const suspicious = item.flaws.length > 0 && !item.genuine;
  const isStolen = item.stolen || item.wanted;
  const hasBadFlaws = item.flaws.some((f) => ['photo', 'wanted', 'serial', 'name'].includes(f));

  // Pay with cash preferentially
  if (s.cash + s.clean < price) {
    return { ok: false, msg: '现金不足' };
  }
  let pay = price;
  if (s.cash >= pay) s.cash -= pay;
  else {
    pay -= s.cash;
    s.cash = 0;
    s.clean -= pay;
  }

  const margin = YD.NUM.marginMin + Math.random() * (YD.NUM.marginMax - YD.NUM.marginMin);
  let sell = Math.round(price * (1 + margin));
  if (!item.genuine && hasBadFlaws) {
    // fake — later sell penalty
    sell = Math.round(price * 0.7);
  }
  if (pressed) sell = Math.round(sell * 1.08);

  const invItem = {
    id: 'inv_' + Date.now() + '_' + Math.random().toString(16).slice(2, 6),
    name: item.name,
    defId: item.defId,
    icon: item.icon,
    cost: price,
    sell,
    genuine: item.genuine,
    flaws: item.flaws.slice(),
    stolen: isStolen,
    repairable: item.repairable,
    repaired: false,
  };
  s.inventory.push(invItem);

  let heatDelta = 0;
  let dirtyGain = 0;
  let note = '收入库，待打烊出货。';

  if (isStolen || hasBadFlaws) {
    heatDelta += YD.HEAT.stolen;
    dirtyGain = price;
    // mark dirty portion
    s.dirty += 0; // dirty accrues on sell
    note = '来路可疑，记入暗账风险。热度上升。';
  } else {
    heatDelta += YD.HEAT.registry;
  }
  if (item.wanted) heatDelta += 4;

  if (c.script && c.script.sympathy && pressed) {
    s.reputation = YD.clamp(s.reputation - 5, 0, 100);
    note += ' 压价伤了人情。';
  } else if (c.script && c.script.sympathy && !pressed) {
    s.reputation = YD.clamp(s.reputation + 4, 0, 100);
    note += ' 口碑上升。';
  }

  s.heat = YD.clamp(s.heat + heatDelta, 0, 100);
  s.stats.dealt += 1;
  s.nightLog.push({ name: c.name, action: '收', price, heatDelta });

  s.lastResult = {
    type: 'buy',
    text: `收进「${item.name}」· 成本 ${YD.fmt(price)}。${note}`,
    delta: { heat: heatDelta, cash: -price },
    invItem,
  };
  s.phase = 'result';
  s.haggle = null;
  return { ok: true };
};

YD.actRefuse = function (s) {
  const c = s.current;
  const item = c.item;
  const bad = item.flaws.length > 0 && (!item.genuine || item.flaws.some((f) => ['photo', 'wanted', 'serial', 'name'].includes(f)));
  let heatDelta = 0;
  let text = `拒绝了「${item.name}」。`;

  if (bad) {
    heatDelta += YD.HEAT.refuseSuspect;
    text += ' 判断正确。';
    if (c.script && c.script.angryOnRefuse) {
      heatDelta += 5;
      text += ' 对方翻脸嚷嚷，引起路人侧目——热度+5。';
    }
  } else {
    s.reputation = YD.clamp(s.reputation - 2, 0, 100);
    s.stats.mistakes += 1;
    text += ' 这是干净货，误拒，口碑−2。';
  }
  s.heat = YD.clamp(s.heat + heatDelta, 0, 100);
  s.stats.refused += 1;
  s.nightLog.push({ name: c.name, action: '拒', price: 0, heatDelta });
  s.lastResult = { type: 'refuse', text, delta: { heat: heatDelta } };
  s.phase = 'result';
};

YD.actReport = function (s) {
  const c = s.current;
  const item = c.item;
  const bad = item.flaws.some((f) => ['photo', 'wanted', 'serial', 'name', 'invoice'].includes(f)) || item.wanted || item.stolen;
  let heatDelta = YD.HEAT.report;
  let text = `报警处理「${item.name}」。`;
  if (bad) {
    text += ' 查有实据，热度下降。';
    s.reputation = YD.clamp(s.reputation + 2, 0, 100);
  } else {
    heatDelta = 2; // false report annoyance
    s.reputation = YD.clamp(s.reputation - 4, 0, 100);
    s.stats.mistakes += 1;
    text += ' 误报，民警不悦。热度微升，口碑下降。';
  }
  s.heat = YD.clamp(s.heat + heatDelta, 0, 100);
  s.stats.reported += 1;
  s.nightLog.push({ name: c.name, action: '警', price: 0, heatDelta });
  s.lastResult = { type: 'report', text, delta: { heat: heatDelta } };
  s.phase = 'result';
};

YD.closeNight = function (s) {
  // Auto-sell inventory at sell price; stolen/fake -> dirty money
  let cleanGain = 0;
  let dirtyGain = 0;
  const sold = [];
  const keep = [];

  for (const it of s.inventory) {
    // sell all non-held for repair choice — MVP sells all at night end except offer 1 repair
    sold.push(it);
  }

  // Tutorial: force include a radio repair beat
  let repairCandidate = null;
  if (!s.tutorialDone) {
    repairCandidate = {
      id: 'tut_radio',
      name: '老式收音机',
      defId: 'radio_vintage',
      icon: '📻',
      cost: 60,
      sell: 120,
      genuine: true,
      flaws: [],
      stolen: false,
      repairable: true,
      repaired: false,
    };
    // grant as if bought cheap earlier
  } else {
    repairCandidate = sold.find((x) => x.repairable && !x.repaired) || null;
  }

  s.pendingRepair = repairCandidate;
  s.pendingSold = sold.filter((x) => x !== repairCandidate);
  s.inventory = [];

  // Apply sales for non-repair
  for (const it of s.pendingSold) {
    const price = it.repaired ? Math.round(it.sell * (s.employees.some((e) => e.id === 'restorer') ? 1.6 : YD.NUM.repairMult)) : it.sell;
    if (it.stolen || (!it.genuine && it.flaws.length)) {
      dirtyGain += price;
    } else {
      cleanGain += price;
    }
  }

  s.pendingClean = cleanGain;
  s.pendingDirty = dirtyGain;

  if (s.pendingRepair) {
    s.phase = 'repair';
  } else {
    // no repair — finalize money immediately
    YD.doRepair(s, false);
  }
};

YD.doRepair = function (s, yes) {
  let cleanGain = s.pendingClean || 0;
  let dirtyGain = s.pendingDirty || 0;
  if (s.pendingRepair) {
    const it = s.pendingRepair;
    if (yes) {
      const cost = Math.round(it.cost * YD.NUM.repairCostRate) || 20;
      if (s.cash + s.clean >= cost) {
        if (s.cash >= cost) s.cash -= cost;
        else {
          const left = cost - s.cash;
          s.cash = 0;
          s.clean -= left;
        }
        const mult = s.employees.some((e) => e.id === 'restorer') ? 1.6 : YD.NUM.repairMult;
        const price = Math.round((it.sell || it.cost * 1.4) * mult);
        if (it.stolen) dirtyGain += price;
        else cleanGain += price;
        s.nightLog.push({ name: '翻新', action: '修', price, heatDelta: 0 });
      } else {
        // can't afford — sell as is
        const price = it.sell || it.cost;
        if (it.stolen) dirtyGain += price;
        else cleanGain += price;
      }
    } else {
      const price = it.sell || it.cost;
      if (it.stolen) dirtyGain += price;
      else cleanGain += price;
    }
  }
  s.clean += cleanGain;
  s.dirty += dirtyGain;
  s.nightClean = cleanGain;
  s.nightDirty = dirtyGain;
  s.nightProfit = cleanGain + dirtyGain;
  s.stats.profit += cleanGain + dirtyGain;
  s.pendingRepair = null;
  s.pendingSold = [];

  // heat decay
  s.heat = YD.clamp(s.heat + YD.HEAT.nightDecay, 0, 100);

  // wash dirty a bit if stage>=2
  if (s.stage >= 2 && s.dirty > 0) {
    const cap = YD.NUM.washNightCap;
    const wash = Math.min(cap, s.dirty);
    const fee = Math.round(wash * YD.NUM.washFee);
    s.dirty -= wash;
    s.clean += wash - fee;
  }

  // debt payment optional small
  if (s.debt > 0 && s.clean > 600) {
    const pay = Math.min(s.debt, Math.round(s.clean * 0.1));
    s.clean -= pay;
    s.debt -= pay;
  }

  s.netWorthPeak = Math.max(s.netWorthPeak, YD.netWorth(s));

  // heat events
  s.eventQueue = [];
  if (s.heat >= YD.HEAT.seal) {
    s.gameOver = true;
    s.gameOverReason = '热度爆表，店铺被查封。';
    s.phase = 'gameover';
    YD.save(s);
    return;
  }
  if (s.heat >= YD.HEAT.raid) {
    s.eventQueue.push({ type: 'raid', text: '突查！连夜盘点，被没收部分暗账货物。' });
    const loss = Math.round(s.dirty * 0.4 + s.cash * 0.1);
    s.dirty = Math.round(s.dirty * 0.6);
    s.cash = Math.max(0, s.cash - Math.round(s.cash * 0.1));
    s.heat = YD.clamp(s.heat - 15, 0, 100);
  } else if (s.heat >= YD.HEAT.ask) {
    s.eventQueue.push({ type: 'ask', text: '民警上门盘问，折腾半宿。热度回落一点。' });
    s.heat = YD.clamp(s.heat - 8, 0, 100);
  }

  if (!s.tutorialDone) {
    s.eventQueue.push({
      type: 'faction',
      text: '码头帮小弟递来一张名片：「想做大，找我们。」',
    });
    s.factionTeased = true;
    s.tutorialDone = true;
    s.tutorialStep = 99;
  } else if (!s.faction && s.stage >= 2 && s.nightInWeek === 7 && Math.random() < 0.5) {
    s.eventQueue.push({ type: 'faction_choice', text: '三方势力都抛来橄榄枝。要不要站队？（MVP 仅预告）' });
  }

  // employee loyalty
  for (const e of s.employees) {
    e.loyalty = YD.clamp(e.loyalty - YD.NUM.loyaltyDecay, 0, 100);
  }

  s.phase = 'settlement';
};

YD.advanceDay = function (s) {
  // end of night -> next day or week
  if (s.gameOver) {
    s.phase = 'gameover';
    return;
  }

  if (s.nightInWeek >= 7) {
    s.phase = 'weekly';
    return;
  }

  s.nightInWeek += 1;
  s.day += 1;
  // move some dirty/clean to cash float for buying
  const float = Math.min(s.clean, 400);
  s.clean -= float;
  s.cash += float;
  YD.save(s);
  YD.startNight(s);
};

YD.resolveWeekly = function (s, choices) {
  // choices: { payRent: true, upgrade: 'stage'|'uv'|'scale'|null, hire: id|null, faction: id|null, raise: bool }
  const st = YD.stageInfo(s);
  let rent = st.rent;
  if (s.faction === 'dock') rent = Math.round(rent * 1.3);
  else if (s.faction === 'guild') rent = Math.round(rent * 1.2);

  // wages
  let wages = s.employees.reduce((sum, e) => sum + e.wage, 0);
  const totalDue = rent + wages;

  const pool = s.clean + s.cash;
  if (pool < totalDue) {
    s.missedRent += 1;
    if (s.missedRent >= 2) {
      s.gameOver = true;
      s.gameOverReason = '连续两周交不起房租与工钱，摊位被清走。';
      s.phase = 'gameover';
      YD.save(s);
      return { ok: false };
    }
    // lose inventory value / cash hit
    s.cash = Math.round(s.cash * 0.5);
    s.eventQueue = [{ type: 'miss', text: '本周没交齐租金，被人砸了招牌。再欠一周就出局。' }];
  } else {
    s.missedRent = 0;
    let due = totalDue;
    if (s.clean >= due) s.clean -= due;
    else {
      due -= s.clean;
      s.clean = 0;
      s.cash -= due;
    }
  }

  if (choices.raise && s.employees.length) {
    for (const e of s.employees) {
      e.wage = Math.round(e.wage * 1.1);
      e.loyalty = YD.clamp(e.loyalty + YD.NUM.raiseLoyalty, 0, 100);
    }
  }

  if (choices.hire) {
    const def = YD.EMPLOYEES.find((e) => e.id === choices.hire);
    if (def && !s.employees.some((e) => e.id === def.id) && s.employees.length < 2) {
      if (s.clean + s.cash >= def.cost) {
        let cost = def.cost;
        if (s.clean >= cost) s.clean -= cost;
        else {
          cost -= s.clean;
          s.clean = 0;
          s.cash -= cost;
        }
        s.employees.push({ ...def });
      }
    }
  }

  if (choices.upgrade === 'uv' && !s.upgrades.uv) {
    const cost = 800;
    if (s.clean + s.cash >= cost) {
      if (s.clean >= cost) s.clean -= cost;
      else {
        const left = cost - s.clean;
        s.clean = 0;
        s.cash -= left;
      }
      s.upgrades.uv = true;
    }
  }
  if (choices.upgrade === 'scale' && !s.upgrades.scale) {
    const cost = 600;
    if (s.clean + s.cash >= cost) {
      if (s.clean >= cost) s.clean -= cost;
      else {
        const left = cost - s.clean;
        s.clean = 0;
        s.cash -= left;
      }
      s.upgrades.scale = true;
      s.idLevel = Math.max(s.idLevel, 2);
    }
  }

  // stage up only when player chooses
  if (choices.upgrade === 'stage') {
    YD.tryStageUp(s);
  }

  if (choices.faction && !s.faction) {
    s.faction = choices.faction;
  }

  s.week += 1;
  s.nightInWeek = 1;
  s.day += 1;
  const float = Math.min(s.clean, 500);
  s.clean -= float;
  s.cash += float;
  YD.save(s);
  s.phase = 'hub';
  return { ok: true };
};

YD.tryStageUp = function (s, silent) {
  if (s.stage >= 3) return false;
  const next = YD.STAGE[s.stage]; // next stage info (0-index: stage 1 -> index 1 is stage 2)
  if (!next) return false;
  const nw = YD.netWorth(s);
  if (nw < next.unlockNet) return false;
  if (next.needIdLv && s.idLevel < next.needIdLv) return false;
  const cost = next.unlockCost || 0;
  if (s.clean + s.cash < cost) return false;
  if (silent && !arguments[1]) {
    // when called as tryStageUp(s, true) meaning auto — still upgrade if affordable
  }
  // spend and upgrade
  let c = cost;
  if (s.clean >= c) s.clean -= c;
  else {
    c -= s.clean;
    s.clean = 0;
    s.cash -= c;
  }
  s.stage += 1;
  if (s.stage >= 2) s.idLevel = Math.max(s.idLevel, 2);
  if (s.stage >= 3) s.idLevel = Math.max(s.idLevel, 2);
  s.eventQueue = s.eventQueue || [];
  s.eventQueue.push({ type: 'stage', text: `店铺升级为「${YD.STAGE[s.stage - 1].name}」！` });
  return true;
};

YD.canStageUp = function (s) {
  if (s.stage >= 3) return { ok: false, reason: '已达 MVP 上限' };
  const next = YD.STAGE[s.stage];
  const nw = YD.netWorth(s);
  if (nw < next.unlockNet) return { ok: false, reason: `净资产需 ${YD.fmt(next.unlockNet)}（现 ${YD.fmt(nw)}）` };
  if (next.needIdLv && s.idLevel < next.needIdLv) return { ok: false, reason: `鉴定等级需 ${next.needIdLv}` };
  if (s.clean + s.cash < (next.unlockCost || 0)) return { ok: false, reason: `升级费 ${YD.fmt(next.unlockCost)}` };
  return { ok: true, cost: next.unlockCost, name: next.name };
};
