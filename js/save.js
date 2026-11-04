window.YD = window.YD || {};
YD.SAVE_KEY = 'yedang_mvp_v1';

YD.save = function (state) {
  try {
    const payload = {
      v: 1,
      ts: Date.now(),
      state: YD.serialize(state),
    };
    localStorage.setItem(YD.SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.warn('save failed', e);
    return false;
  }
};

YD.load = function () {
  try {
    const raw = localStorage.getItem(YD.SAVE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || payload.v !== 1) return null;
    return payload.state;
  } catch (e) {
    return null;
  }
};

YD.clearSave = function () {
  localStorage.removeItem(YD.SAVE_KEY);
};

YD.hasSave = function () {
  return !!localStorage.getItem(YD.SAVE_KEY);
};

YD.serialize = function (s) {
  return {
    day: s.day,
    week: s.week,
    nightInWeek: s.nightInWeek,
    stage: s.stage,
    cash: s.cash,
    clean: s.clean,
    dirty: s.dirty,
    debt: s.debt,
    heat: s.heat,
    idLevel: s.idLevel,
    reputation: s.reputation,
    netWorthPeak: s.netWorthPeak,
    inventory: s.inventory,
    employees: s.employees,
    faction: s.faction,
    factionTeased: s.factionTeased,
    tutorialStep: s.tutorialStep,
    tutorialDone: s.tutorialDone,
    missedRent: s.missedRent,
    upgrades: s.upgrades,
    stats: s.stats,
    gameOver: s.gameOver,
    gameOverReason: s.gameOverReason,
  };
};
