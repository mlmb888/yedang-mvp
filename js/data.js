/* 《夜当》MVP v2 配表 — 数值锚定调研提案/公开表，见报告映射 */
window.YD = window.YD || {};
YD.VERSION = 'v2';

YD.PALETTE = {
  bg:'#16161c', panel:'#22222c', panel2:'#2c2c38', line:'#3a3a48',
  muted:'#7a7a8a', text:'#e6e6ee', dim:'#a8a8b4',
  accent:'#e89a3c', accent2:'#c45c4a', good:'#6b9e7a', warn:'#c9a24a',
  bad:'#c45c5c', clean:'#7a9eb8', dirty:'#b08a4a', neon:'#ff7a4a',
};

/* 12 破绽 — TNMN 外观/证件/日期/名单四维 → 物件化 */
YD.FLAWS = [
  { id:'serial', name:'序列号不符', desc:'机身序列号与登记不一致', severity:2, dim:'证件' },
  { id:'photo', name:'证件照换人', desc:'证件照片与本人不是同一人', severity:3, dim:'外观' },
  { id:'wear', name:'包浆逻辑错', desc:'声称常用，磨损却不对称', severity:1, dim:'外观' },
  { id:'weight', name:'重量不对', desc:'称重与材质标称偏差过大', severity:2, dim:'物件' },
  { id:'invoice', name:'发票日期矛盾', desc:'发票日期晚于声称购买时间', severity:2, dim:'日期' },
  { id:'rush', name:'急着出手', desc:'接受超低价也要立刻成交', severity:1, dim:'话术' },
  { id:'name', name:'刻字与姓名不符', desc:'物品刻名与证件姓名对不上', severity:2, dim:'证件' },
  { id:'stamp', name:'钢印模糊', desc:'品牌钢印边缘糊，像后刻', severity:1, dim:'物件' },
  { id:'wanted', name:'通缉痕迹', desc:'证件上有未注销协查标记', severity:3, dim:'名单' },
  { id:'battery', name:'电池仓拧花', desc:'声称未拆，仓内有拧花', severity:1, dim:'物件' },
  { id:'font', name:'铭牌字体错', desc:'年份铭牌字体与同期不符', severity:2, dim:'物件' },
  { id:'smell', name:'气味不对', desc:'皮革/木器有刺鼻化工胶味', severity:1, dim:'外观' },
];

/* 40 件 + 稀有/爆款标记 — SI 混料溢价灵感：真货修复可 × 倍率 */
YD.ITEMS = [
  { id:'watch_old', name:'旧机械表', cat:'表', base:180, stage:1 },
  { id:'watch_gold', name:'镀金腕表', cat:'表', base:420, stage:1 },
  { id:'ring_jade', name:'翡翠戒指', cat:'饰', base:260, stage:1 },
  { id:'ring_silver', name:'银戒', cat:'饰', base:90, stage:1 },
  { id:'camera_film', name:'胶片相机', cat:'影', base:380, stage:1 },
  { id:'radio_vintage', name:'老式收音机', cat:'电', base:120, stage:1, repairable:true },
  { id:'phone_old', name:'旧智能手机', cat:'电', base:200, stage:1 },
  { id:'necklace', name:'细金项链', cat:'饰', base:340, stage:1 },
  { id:'earring', name:'珍珠耳钉', cat:'饰', base:150, stage:1 },
  { id:'bracelet', name:'铜手镯', cat:'饰', base:70, stage:1 },
  { id:'knife_fold', name:'折叠刀', cat:'工', base:80, stage:1 },
  { id:'tool_set', name:'旧工具套装', cat:'工', base:110, stage:1 },
  { id:'bicycle_bell', name:'复古车铃', cat:'杂', base:40, stage:1 },
  { id:'book_stamp', name:'集邮册', cat:'杂', base:95, stage:1 },
  { id:'vinyl', name:'黑胶唱片', cat:'杂', base:130, stage:1 },
  { id:'lamp_desk', name:'旧台灯', cat:'杂', base:60, stage:1 },
  { id:'bag_leather', name:'皮公文包', cat:'服', base:220, stage:1 },
  { id:'coat_wool', name:'呢大衣', cat:'服', base:280, stage:1 },
  { id:'shoes_leather', name:'皮鞋', cat:'服', base:140, stage:1 },
  { id:'hat_felt', name:'毡帽', cat:'服', base:75, stage:1 },
  { id:'tablet', name:'平板', cat:'电', base:500, stage:2 },
  { id:'laptop_old', name:'旧笔记本', cat:'电', base:680, stage:2 },
  { id:'drone_toy', name:'航拍机', cat:'电', base:900, stage:2 },
  { id:'guitar', name:'木吉他', cat:'杂', base:450, stage:2 },
  { id:'statue_buddha', name:'铜佛像', cat:'古', base:720, stage:2 },
  { id:'vase_blue', name:'青花小瓶', cat:'古', base:560, stage:2 },
  { id:'inkstone', name:'砚台', cat:'古', base:310, stage:2 },
  { id:'seal_stone', name:'印章石', cat:'古', base:240, stage:2 },
  { id:'watch_chrono', name:'计时码表', cat:'表', base:1200, stage:2 },
  { id:'lens_camera', name:'相机镜头', cat:'影', base:850, stage:2 },
  { id:'gold_bar_fake', name:'金条样品', cat:'饰', base:2000, stage:2, risky:true },
  { id:'coin_set', name:'纪念币套装', cat:'古', base:400, stage:2 },
  { id:'amplifier', name:'吉他音箱', cat:'电', base:380, stage:2 },
  { id:'mic_studio', name:'录音话筒', cat:'电', base:520, stage:2 },
  { id:'scooter_part', name:'电瓶车电芯', cat:'工', base:300, stage:2, risky:true },
  { id:'jade_bi', name:'玉璧', cat:'古', base:1500, stage:3, jackpot:true, jackpotMult:8 },
  { id:'oil_painting', name:'油画小品', cat:'古', base:1800, stage:3, jackpot:true, jackpotMult:6 },
  { id:'porcelain_bowl', name:'粉彩碗', cat:'古', base:2200, stage:3, jackpot:true, jackpotMult:10 },
  { id:'role_watch', name:'名表疑似款', cat:'表', base:2800, stage:3, jackpot:true, jackpotMult:12, risky:true },
  { id:'camera_dslr', name:'单反机身', cat:'影', base:1600, stage:3 },
];

YD.NAMES = {
  male:['老周','阿强','陈叔','小刘','张工','老马','阿杰','王磊','赵哥','孙涛','钱峰','周凯','吴亮','郑洋','冯磊'],
  female:['阿敏','李姐','小芳','王姨','陈姐','林娜','赵敏','孙悦','周倩','吴倩','郑琳','冯雪','何静','罗婷','徐慧'],
};
YD.STORIES = [
  '急用钱，家里有事。','搬家清理，用不着了。','朋友托我代卖。','债主天天催，先换点现金。',
  '这是我爸留下的。','刚从地摊收来，转手。','不想走正规流程，嫌慢。','今晚就要钱，别问那么多。',
  '东西是正的，你看着给。','我急着走，你报价就行。',
];

/* 阶段 — 设计文档 + PS 房租压力；夜客数改 TNMN/模板的短局 4–5 */
YD.STAGE = [
  { id:1, name:'路边地摊', rent:0, unlockNet:0, clueSlots:1, customers:[4,5], fakeRate:0.22, visual:'stall',
    look:'油布·手电·纸箱招牌' },
  { id:2, name:'小当铺', rent:800, unlockNet:900, unlockCost:600, clueSlots:2, customers:[4,5], fakeRate:0.28, visual:'pawn',
    look:'铁栅柜台·日光灯·挂钟' },
  { id:3, name:'修复工坊', rent:2500, unlockNet:4500, unlockCost:3500, needIdLv:2, clueSlots:3, customers:[5,5], fakeRate:0.35, visual:'workshop',
    look:'后屋焊灯·工作台·零件墙' },
];

/* 热度 — 设计文档阈值；模板日衰减 −8 作参考，夜衰减用 −6 */
YD.HEAT = {
  stolen:8, wanted:12, report:-6, registry:-2, refuseSuspect:-1,
  nightDecay:-6, ask:40, raid:70, seal:100,
  gotchaBonus:-4, /* 识破赝品额外降温，对标 TNMN 正确呼叫 */
};

YD.EMPLOYEES = [
  { id:'apprentice', name:'学徒阿宁', role:'鉴定学徒', wage:300, skill:1, loyalty:70, cost:500, desc:'每晚多 1 线索位' },
  { id:'restorer', name:'修复师老皮', role:'修复师', wage:1200, skill:2, loyalty:60, cost:2000, desc:'翻新售价×1.6' },
];

YD.FACTIONS = [
  { id:'dock', name:'码头帮', pitch:'货源多，热度也高。', risk:'保护费=周租30%' },
  { id:'guild', name:'老街商会', pitch:'口碑与洗白通道。', risk:'保护费=周租20%' },
  { id:'collector', name:'收藏家圈', pitch:'高价古玩，零仿品。', risk:'收错仿品绝交' },
];

/* 具名回头客 — PS 长线 NPC / TNMN 档案邻居 */
YD.CAST = [
  { id:'regular_min', name:'阿敏', gender:'female', role:'regular',
    intro:'楼下便利店店员，隔三差五来换闲置。',
    stories:['这耳机闲着。','帮室友卖个包。','工资日，想换点现金应急。'],
    preferGenuine:true, heatOnWrongRefuse:0, loyaltyDelta:3 },
  { id:'cop_li', name:'李警官', gender:'male', role:'cop',
    intro:'穿着便衣，眼神却像在盘点你的柜台。',
    stories:['例行抽查，有没有来路不明的货？','听说这片赃货多。','别紧张，随便看看。'],
    isCop:true, trapChance:0.55 },
  { id:'gang_snake', name:'阿蛇', gender:'male', role:'gang',
    intro:'码头帮跑腿。货脏、价高、别问来处。',
    stories:['弟兄们清仓，你敢收吗？','这批相机，半价，今晚清。','老板说你够意思，给口肉。'],
    dirtyBoost:true, askMult:0.55, heatOnAccept:10, payoutMult:1.8 },
];

/* 每日悬赏 — TNMN 每日通缉海报保底 + Balatro Tag 短目标 */
YD.BOUNTY_POOL = [
  { id:'catch_fake', name:'识破赝品', desc:'今晚正确拒收或报警 ≥1 件赝品', need:1, key:'caughtFake', reward:120, rewardType:'clean' },
  { id:'earn_night', name:'夜入账', desc:'本夜明账+暗账合计 ≥ ¥400', need:400, key:'nightProfit', reward:80, rewardType:'clean' },
  { id:'low_heat', name:'压住热度', desc:'打烊时热度 ≤ 25', need:25, key:'heatAtMost', reward:100, rewardType:'clean' },
  { id:'haggle_win', name:'砍成', desc:'压价成交 ≥ 2 单', need:2, key:'pressedDeals', reward:90, rewardType:'clean' },
  { id:'report_right', name:'有效报警', desc:'正确报警 ≥ 1 次', need:1, key:'goodReports', reward:110, rewardType:'clean' },
  { id:'no_mistake', name:'零误判', desc:'本夜误拒/误报 = 0', need:0, key:'mistakesAtMost', reward:150, rewardType:'clean' },
  { id:'museum_find', name:'淘到稀货', desc:'收进任意稀有/爆款件', need:1, key:'jackpotGot', reward:200, rewardType:'clean' },
];

/* 夜间突发事件 — PS 晨报/夜盗/调查；模板日终事件 */
YD.NIGHT_EVENTS = [
  { id:'news_rent', w:2, text:'晨报：城管要严查路边摊，想稳住得尽快挪进正经门面。', effect:{ tip:'goal' } },
  { id:'news_heat', w:2, text:'街坊议论：昨晚有人被抄了摊。热度高的店今晚小心。', effect:{ heat:3 } },
  { id:'thief', w:1, text:'过夜失窃！暗账货少了一截。', effect:{ dirtyLoss:0.15 } },
  { id:'bribe_ask', w:1, text:'穿制服的人伸手：意思意思，少查你两天。', effect:{ choice:'bribe' } },
  { id:'regular_gift', w:1, text:'阿敏送来一盒便宜零件：翻新能省点。', effect:{ repairDiscount:true } },
  { id:'gang_card', w:1, text:'阿蛇把名片拍在柜台上：想做大，找码头。', effect:{ factionTease:true } },
  { id:'jackpot_rumor', w:1, text:'传闻：有件粉彩碗流到这片，真的能换半个月房租。', effect:{ tip:'jackpot' } },
  { id:'interest', w:2, text:'明账过夜生息到账（学 Balatro 利息）。', effect:{ interest:true } },
];

YD.NUM = {
  startDebt:2000,
  startCash:900,
  startClean:300,
  /* 毛利 — SI 混料加成区间压缩到当铺差价 */
  marginMin:0.5,
  marginMax:0.85,
  hagglePatience:4,
  repairCostRate:0.12,
  repairMult:1.55,
  washNightCap:2000, /* SI 洗衣店日产能 $2000 */
  washFee:0.15,
  loyaltyDecay:2,
  raiseLoyalty:8,
  /* Balatro 利息：$1/持有$5 封顶$5 → 按持有明账每 ¥100 得 ¥2，封顶 ¥40 */
  interestPer100:2,
  interestCap:40,
  /* PS 房租周涨约 +5%：从第 2 周起对当前阶段房租叠加 */
  rentInflation:0.05,
  /* 爆款出现率（阶段≥2） */
  jackpotChance:0.08,
};

YD.TUTORIAL = [
  { name:'阿强', gender:'male', story:'急用钱，这块表成色还行。',
    itemId:'watch_old', genuine:true, flaws:[], askMult:0.7,
    tip:'点「收」。看顶栏：还差多少就能开小当铺。' },
  { name:'老周', gender:'male', story:'家里清理，同款旧表。',
    itemId:'watch_old', genuine:false, flaws:['name'], askMult:0.85,
    tip:'点破绽！识破赝品有「抓到了」反馈和悬赏进度。', forceInspect:true },
  { name:'王姨', gender:'female', story:'老伴走了，这枚戒指留着难受。',
    itemId:'ring_jade', genuine:true, flaws:[], askMult:0.9,
    tip:'无破绽。压价伤口碑，照价收买人情。', sympathy:true },
  { name:'陈叔', gender:'male', story:'相机闲置，证件都在。',
    itemId:'camera_film', genuine:false, flaws:['photo'], askMult:1.1,
    tip:'证件照换人——拒绝或报警。他会翻脸，热度会动。', angryOnRefuse:true },
];
