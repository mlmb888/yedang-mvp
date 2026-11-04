/* 《夜当》MVP 配表 — 数值为设计文档提案，已按一周约 8–10 分钟微调 */
window.YD = window.YD || {};

YD.PALETTE = {
  bg: '#16161c',
  panel: '#22222c',
  panel2: '#2c2c38',
  line: '#3a3a48',
  muted: '#7a7a8a',
  text: '#e6e6ee',
  dim: '#a8a8b4',
  accent: '#e89a3c',
  accent2: '#c45c4a',
  good: '#6b9e7a',
  warn: '#c9a24a',
  bad: '#c45c5c',
  clean: '#7a9eb8',
  dirty: '#b08a4a',
  neon: '#ff7a4a',
};

/* 12 种破绽 */
YD.FLAWS = [
  { id: 'serial', name: '序列号不符', desc: '机身序列号与登记不一致', severity: 2 },
  { id: 'photo', name: '证件照换人', desc: '证件照片与本人明显不是同一人', severity: 3 },
  { id: 'wear', name: '包浆/磨损逻辑错', desc: '声称常年使用，磨损却不对称或过新', severity: 1 },
  { id: 'weight', name: '重量不对', desc: '称重与材质标称偏差过大', severity: 2 },
  { id: 'invoice', name: '发票日期矛盾', desc: '发票日期晚于声称的购买时间', severity: 2 },
  { id: 'rush', name: '急着出手', desc: '话术急促、接受超低价也要立刻成交', severity: 1 },
  { id: 'name', name: '刻字与姓名不符', desc: '物品刻名与证件姓名对不上', severity: 2 },
  { id: 'stamp', name: '钢印/章模糊', desc: '品牌钢印边缘糊、像后刻', severity: 1 },
  { id: 'wanted', name: '通缉痕迹', desc: '证件上有未注销的协查标记', severity: 3 },
  { id: 'battery', name: '电池仓痕迹', desc: '声称原装未拆，仓内却有拧花痕迹', severity: 1 },
  { id: 'font', name: '铭牌字体错', desc: '年份铭牌字体与同期产品不符', severity: 2 },
  { id: 'smell', name: '气味不对', desc: '皮革/木器有刺鼻化工胶味，像新仿', severity: 1 },
];

/* 40 件物品 */
YD.ITEMS = [
  { id: 'watch_old', name: '旧机械表', cat: '表', base: 180, stage: 1 },
  { id: 'watch_gold', name: '镀金腕表', cat: '表', base: 420, stage: 1 },
  { id: 'ring_jade', name: '翡翠戒指', cat: '饰', base: 260, stage: 1 },
  { id: 'ring_silver', name: '银戒', cat: '饰', base: 90, stage: 1 },
  { id: 'camera_film', name: '胶片相机', cat: '影', base: 380, stage: 1 },
  { id: 'radio_vintage', name: '老式收音机', cat: '电', base: 120, stage: 1 },
  { id: 'phone_old', name: '旧智能手机', cat: '电', base: 200, stage: 1 },
  { id: 'necklace', name: '细金项链', cat: '饰', base: 340, stage: 1 },
  { id: 'earring', name: '珍珠耳钉', cat: '饰', base: 150, stage: 1 },
  { id: 'bracelet', name: '铜手镯', cat: '饰', base: 70, stage: 1 },
  { id: 'knife_fold', name: '折叠刀', cat: '工', base: 80, stage: 1 },
  { id: 'tool_set', name: '旧工具套装', cat: '工', base: 110, stage: 1 },
  { id: 'bicycle_bell', name: '复古车铃', cat: '杂', base: 40, stage: 1 },
  { id: 'book_stamp', name: '集邮册', cat: '杂', base: 95, stage: 1 },
  { id: 'vinyl', name: '黑胶唱片', cat: '杂', base: 130, stage: 1 },
  { id: 'lamp_desk', name: '旧台灯', cat: '杂', base: 60, stage: 1 },
  { id: 'bag_leather', name: '皮公文包', cat: '服', base: 220, stage: 1 },
  { id: 'coat_wool', name: '呢大衣', cat: '服', base: 280, stage: 1 },
  { id: 'shoes_leather', name: '皮鞋', cat: '服', base: 140, stage: 1 },
  { id: 'hat_felt', name: '毡帽', cat: '服', base: 75, stage: 1 },
  { id: 'tablet', name: '平板', cat: '电', base: 500, stage: 2 },
  { id: 'laptop_old', name: '旧笔记本', cat: '电', base: 680, stage: 2 },
  { id: 'drone_toy', name: '航拍机', cat: '电', base: 900, stage: 2 },
  { id: 'guitar', name: '木吉他', cat: '杂', base: 450, stage: 2 },
  { id: 'statue_buddha', name: '铜佛像', cat: '古', base: 720, stage: 2 },
  { id: 'vase_blue', name: '青花小瓶', cat: '古', base: 560, stage: 2 },
  { id: 'inkstone', name: '砚台', cat: '古', base: 310, stage: 2 },
  { id: 'seal_stone', name: '印章石', cat: '古', base: 240, stage: 2 },
  { id: 'watch_chrono', name: '计时码表', cat: '表', base: 1200, stage: 2 },
  { id: 'lens_camera', name: '相机镜头', cat: '影', base: 850, stage: 2 },
  { id: 'gold_bar_fake', name: '金条样品', cat: '饰', base: 2000, stage: 2 },
  { id: 'coin_set', name: '纪念币套装', cat: '古', base: 400, stage: 2 },
  { id: 'amplifier', name: '吉他音箱', cat: '电', base: 380, stage: 2 },
  { id: 'mic_studio', name: '录音话筒', cat: '电', base: 520, stage: 2 },
  { id: 'scooter_part', name: '电瓶车电芯', cat: '工', base: 300, stage: 2 },
  { id: 'jade_bi', name: '玉璧', cat: '古', base: 1500, stage: 3 },
  { id: 'oil_painting', name: '油画小品', cat: '古', base: 1800, stage: 3 },
  { id: 'porcelain_bowl', name: '粉彩碗', cat: '古', base: 2200, stage: 3 },
  { id: 'role_watch', name: '名表疑似款', cat: '表', base: 2800, stage: 3 },
  { id: 'camera_dslr', name: '单反机身', cat: '影', base: 1600, stage: 3 },
];

/* 客人名池 */
YD.NAMES = {
  male: ['老周','阿强','陈叔','小刘','张工','老马','阿杰','王磊','赵哥','孙涛','钱峰','周凯','吴亮','郑洋','冯磊'],
  female: ['阿敏','李姐','小芳','王姨','陈姐','林娜','赵敏','孙悦','周倩','吴倩','郑琳','冯雪','何静','罗婷','徐慧'],
};

YD.STORIES = [
  '急用钱，家里有事。',
  '搬家清理，用不着了。',
  '朋友托我代卖。',
  '债主天天催，先换点现金。',
  '这是我爸留下的。',
  '刚从地摊收来，转手。',
  '不想走当铺正规流程，嫌慢。',
  '今晚就要钱，别问那么多。',
  '东西是正的，你看着给。',
  '我急着走，你报价就行。',
];

YD.STAGE = [
  { id: 1, name: '路边地摊', rent: 0, unlockNet: 0, clueSlots: 1, customers: [6, 7], fakeRate: 0.15, baseRange: [20, 300] },
  { id: 2, name: '小当铺', rent: 800, unlockNet: 1500, unlockCost: 1200, clueSlots: 2, customers: [7, 8], fakeRate: 0.22, baseRange: [100, 1500] },
  { id: 3, name: '修复工坊', rent: 2500, unlockNet: 6000, unlockCost: 5000, needIdLv: 2, clueSlots: 3, customers: [7, 8], fakeRate: 0.28, baseRange: [200, 3000] },
];

YD.HEAT = {
  stolen: 8,
  wanted: 12,
  report: -6,
  registry: -2,
  refuseSuspect: -1,
  nightDecay: -5,
  ask: 40,
  raid: 70,
  seal: 100,
};

YD.EMPLOYEES = [
  { id: 'apprentice', name: '学徒阿宁', role: '鉴定学徒', wage: 300, skill: 1, loyalty: 70, cost: 500, desc: '每晚多揭示 1 个破绽线索位' },
  { id: 'restorer', name: '修复师老皮', role: '修复师', wage: 1200, skill: 2, loyalty: 60, cost: 2000, desc: '打烊翻新成功率提高，售价×1.6' },
];

YD.FACTIONS = [
  { id: 'dock', name: '码头帮', pitch: '货源多，热度也高。想做大，找我们。', risk: '保护费=周租30%' },
  { id: 'guild', name: '老街商会', pitch: '口碑与洗白通道。做人留一线。', risk: '保护费=周租20%' },
  { id: 'collector', name: '收藏家圈', pitch: '高价古玩，但要求零仿品。', risk: '收错仿品直接绝交' },
];

YD.NUM = {
  startDebt: 2000,
  startCash: 1500,
  startClean: 500,
  marginMin: 0.35,
  marginMax: 0.55,
  hagglePatience: 4,
  repairCostRate: 0.15,
  repairMult: 1.5,
  washNightCap: 2000,
  washFee: 0.15,
  loyaltyDecay: 2,
  raiseLoyalty: 8,
};

/* 教程脚本客人 */
YD.TUTORIAL = [
  {
    name: '阿强', gender: 'male', story: '急用钱，这块表成色还行。',
    itemId: 'watch_old', genuine: true, flaws: [], askMult: 0.7,
    forceBuy: true, tip: '点「收」或「压价」。这单几乎必赚。',
  },
  {
    name: '老周', gender: 'male', story: '家里清理，同款旧表。',
    itemId: 'watch_old', genuine: false, flaws: ['name'], askMult: 0.85,
    tip: '用放大镜点出破绽：刻字与姓名不符。',
    forceInspect: true,
  },
  {
    name: '王姨', gender: 'female', story: '老伴走了，这枚戒指留着难受。',
    itemId: 'ring_jade', genuine: true, flaws: [], askMult: 0.9,
    tip: '无破绽。压价伤口碑，照价收买人情。',
    sympathy: true,
  },
  {
    name: '陈叔', gender: 'male', story: '相机闲置，证件都在。',
    itemId: 'camera_film', genuine: false, flaws: ['photo'], askMult: 1.1,
    tip: '证件照与本人不符——拒绝或报警。拒绝后他会翻脸。',
    angryOnRefuse: true,
  },
];
