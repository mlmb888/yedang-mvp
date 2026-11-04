# 《夜当》MVP v2 玩测诊断与调研映射报告

**Live：** https://mlmb888.github.io/yedang-mvp/  
**本地截图：** `/workspace/yedang-mvp/screenshots/`（00-title / 01-tutorial / 02-inspect / 02b-gotcha / 02c-settlement / 03-weekly）  
**Playwright：** `node test/playthrough.mjs` → week2 · stage2 · 无 JS 错误  

时区：Asia/Shanghai · 2026-11-04

---

## 1. v1 诊断（为何「没什么乐趣和目标感」）

| 问题 | 体感 | 对标缺口 |
|---|---|---|
| 无下一目标常驻 UI | 赚了钱不知道干什么 | Balatro Blind 目标永远可见；SI Rank/房产阶梯可见 |
| 打烊结算扁平 | 数字跳一下就过 | TNMN 结果页「抓到了」/评级；PS 晨报多条反馈 |
| 夜客过多 + 鉴定区空 | 重复点击疲劳；鉴定只有小图标 | TNMN 日 5–9 人短局；鉴定区应占大半屏 |
| 无房租爬坡 | 无失败张力 | PS 周日房租约 +5%/周，交不起驱逐 |
| 无每日短目标 | 缺少「今晚再冲一把」 | TNMN 每日通缉海报；Balatro Tag |
| 客人匿名 | 无故事记忆 | PS 长线 NPC；TNMN ~20 邻居档案 |
| 店铺不成长视觉 | 地摊永远地摊 | SI 房产阶梯 Motel→Sweatshop→… |
| 无 juice / SFX | 正确决策无爽感 | Balatro 屏震/音效；TNMN 抓 doppel 反馈 |

---

## 2. v2 改动 ↔ 源游戏机制映射表（中文）

| v2 改动 | 源游戏 | 源机制 / 公开数 | 我方适配数 |
|---|---|---|---|
| 顶栏「下一目标」进度条 | Balatro + Schedule I | Blind 目标始终可见；Rank/房产解锁门槛（Street Rat→…→Kingpin 累计 XP 至 57,000；房产 Motel $75 → Sweatshop ~$800 → Storage $4,000…） | 阶段净资产门槛 **¥900→小当铺 / ¥4,500→工坊**（压缩设计文档 5k/20k 以便首周末可达）；目标条实时 `have/need` |
| 夜客 4–5 人、夜更短 | TNMN + 模板 | TheGamer：日访客约 **5–9**；提案模板日客 **6±1** | 阶段1–2：**[4,5]**；阶段3：**[5,5]**；教程固定 4 客 |
| 破绽 12 种 / 线索位 1→3(+雇/UV) | TNMN | 四维清单 Appearance/ID/Entry/List；档案对照 | 12 破绽映射外观/证件/日期/名单/物件；线索位=阶段 clueSlots + 学徒 +1 + 紫外灯 +1，封顶 4 |
| 「抓到了」结果卡 + 金币粒子 + 屏震 + WebAudio | TNMN + Balatro | 正确呼叫 D.D.D.；屏震设定 0–100%；音效反馈 | `gotcha`/`jackpot` 卡样式；硬币 burst；`#app.shake`；`sfx.gotcha/coin/raid` |
| 每日 3 条悬赏 | TNMN + Balatro | 每日保证通缉海报 doppel；Blind Tag 短目标 | `BOUNTY_POOL` 抽 3；打烊 `claimBounties` 发明账奖 ¥80–200 |
| 房租周涨 +5%、欠租两次出局 | Probably Stolen | Wikily：周日收租，Mark Up 难度起始约 200，**每周约 +5%**；交不起且无 Grace → 驱逐 | `rentInflation=0.05`，`rent×(1.05)^(week-1)`；码头帮 ×1.3 / 商会 ×1.2；`missedRent≥2` game over |
| 双货币现金/明账/暗账 + 夜洗上限 | Schedule I | 现金 vs 余额；洗衣店日产能 **$2,000**；四店合计 $20k/日；ATM 周存 $10k | `washNightCap=2000`，手续费 **15%**；暗账来自赃/赝，阶段≥2 夜洗 |
| 员工签约费/周薪与槽位 | Schedule I | Cleaner $500/$100 … Chemist $1,500/$300；房产员工上限 0→12 | 学徒 **¥500 / 周薪 300**（+1 线索）；修复师 **¥2000 / 1200**（翻新 ×1.6）；最多 2 人 |
| 翻新售价倍率 | Schedule I 混料溢价 | 效果加成约 +0–60% 抬市价；加工增值 | 默认翻新 **×1.55**；修复师 **×1.6**；成本率 12% |
| 明账过夜利息 | Balatro | 利息 **$1 / 持有 $5**，默认封顶 **$5**（持 $25 最优） | 每持有明账 **¥100 → +¥2**，封顶 **¥40**；夜间事件 `interest` |
| 热度阈值 40/70/100、夜衰减 −6 | 设计文档 + 模板 + SI | 提案 40 盘问/70 突查/100 查封；模板日衰减 −8；SI 法律强度随天数升 | `ask40/raid70/seal100`；`nightDecay=-6`；识破额外 **−4** |
| 具名回头客（阿敏/李警官/阿蛇） | PS + TNMN | 长线 NPC、Aug/通缉、派系客；~20 邻居档案 | `CAST` 3 人，约 28% 注入；警官陷阱 55%；码头脏货 ask×0.55、热度+10 |
| 收藏架 / 图鉴 | TNMN 海报收集 + Balatro Collection | 约 32 日保底收齐海报；150 Joker 收集 | `museum[]` 稀有/爆款入库展示，Hub 8 格 |
| 爆款 jackpot ×6–12 | Schedule I 混料天花板 | 八效果理论市价可抬到数倍 base | 阶段≥2 出现率 **8%**；真货倍率 **6–12**；结果卡特效 |
| 店铺三态视觉（stall/pawn/workshop） | SI 房产外观阶梯 | Motel→Sweatshop→Barn… 空间变化强化成长感 | CSS `.shop-bg` 三套背景随 `stage.visual` |
| 夜间事件队列（失窃/贿赂/名片/晨报） | Probably Stolen | 晨报日志、过夜盗窃/破坏、调查；固定日流水线 | `NIGHT_EVENTS` 加权；打烊后事件屏再结算 |
| 势力互斥预告（三选一） | PS 派系声望 | 下层/上层/治安/黑市等；改编要求互斥硬 | 码头/商会/收藏家；保护费抬租；MVP 仅预告+选边 |
| 开局债 ¥2000、现金 900+明账 300 | 设计文档压缩 | 文档欠债 ¥5000；首 5 分钟教目标条 | 债 **2000**；净资产门槛压到 **900** 以便第一周末升级 |
| 鉴定区 ≥280px + 大图标热点 | v1 实测空区 | v1 inspect ~469px 空；TNMN 证件对照占视觉中心 | `.inspect-area min-height:280px`；图标 ×1.35；虚线热点点选 |

---

## 3. Playwright 结果摘要

- 教程夜：收/鉴定拒/同情收/拒 → 翻新 → 事件 → 结算  
- API 快进至第 7 夜 → 周末结算 → **升到阶段 2 小当铺**  
- 状态样例：`week=2 stage=2 assets≈3011 net≈2099 heat=0 bounties=3`，无 pageerror  
- 截到：标题、教程顶栏+悬赏、鉴定热点、抓到了、打烊结算、周末结算  

---

## 4. 仍弱 / 下一刀

1. **图鉴/收藏** 早期几乎为空（museum=0），需保证每周至少 1 件 museumWorthy 真货或强制爆款周。  
2. **势力互斥后果** 仍偏软（仅抬租），缺截货/恶意举报。  
3. **洗白** 是自动夜洗，没有玩家主动「选门面」操作。  
4. **客人话术重复**（PS 差评同构）——需更多 CAST 与脚本客。  
5. **音效** 为 WebAudio 方波占位，非正式 ogg。  
6. **阶段 3 工坊** 可达但内容仍薄（无分店）。  

