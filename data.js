/* ============================================================
 * Feather Trace 观鸟交流移动平台 —— 数据层
 * 说明：本文件内置"可完全离线"运行所需的全部数据
 *   - 鸟类物种库（含识别特征、习性、鸣声、装备推荐）
 *   - 武汉及周边观鸟点（观测点推荐的数据来源）
 *   - 种子帖子（交流区演示内容）
 * ============================================================ */

/* ---------- 1. 鸟类物种库 ---------- */
// group: 水鸟 / 林鸟 / 城市常见  |  rarity: 常见/较常见/少见/稀有
// color: 用于鸟类头像底色，按科属区分
const BIRDS = [
  {
    id: 'huangfu', name: '黄腹树莺', latin: 'Horornis diphone', family: '树莺科',
    group: '林鸟', rarity: '较常见', color: '#7CB342',
    features: '上体橄榄褐色，腹部偏黄，眉纹不明显；体型小巧圆润，常在灌丛中躲藏。',
    habitat: '常出现于低地阔叶林灌丛、竹林中。',
    behavior: '藏匿在灌丛深处，仅闻其声难见其形；鸣声似人咳嗽声，鸣唱很长，带拖尾的颤音。',
    voice: '咳嗽声般的短促叫声，接着一串拖尾颤音',
    tips: '在灌丛不远处静立，用其鸣声定位，耐心等待它跳上枝头。',
    equipment: '入门8×42双筒望远镜、便携三脚架',
    location: '东湖磨山、武汉植物园、龟山灌丛',
    audio: '“咳——咯噜噜噜噜……”'
  },
  {
    id: 'baitoubei', name: '白头鹎', latin: 'Pycnonotus sinensis', family: '鹎科',
    group: '城市常见', rarity: '常见', color: '#78909C',
    features: '头后枕部有一大块白色斑，上体橄榄绿，腹白；叫声婉转多变。',
    habitat: '公园、小区、行道树等城市绿地几乎都有分布。',
    behavior: '喜欢成群活动，常在树冠层边跳边叫，叫声清脆响亮。',
    voice: '婉转多变的“叽啾啾”鸣唱',
    tips: '清晨和傍晚最活跃，常站在电线上高声鸣唱，最容易观察。',
    equipment: '手机长焦即可拍摄、8×42望远镜',
    location: '解放公园、沙湖公园、几乎所有城市公园',
    audio: '“叽啾啾——叽啾——啾”'
  },
  {
    id: 'wudong', name: '乌鸫', latin: 'Turdus mandarinus', family: '鸫科',
    group: '城市常见', rarity: '常见', color: '#37474F',
    features: '全身黑色，嘴和眼圈橙黄色，雄鸟鸣唱极动听，被誉为"百舌鸟"。',
    habitat: '城市公园、庭院、林地。',
    behavior: '常在草坪上低头觅食蚯蚓，受惊后低飞入树丛；清晨鸣唱婉转悠长。',
    voice: '模仿力强，鸣唱复杂婉转，清晨尤甚',
    tips: '草坪翻土后容易见到，保持安静缓慢靠近即可。',
    equipment: '8×42望远镜',
    location: '解放公园、武汉植物园、校园草坪',
    audio: '模仿各种鸟声的长鸣唱'
  },
  {
    id: 'zhuijing', name: '珠颈斑鸠', latin: 'Spilopelia chinensis', family: '鸠鸽科',
    group: '城市常见', rarity: '常见', color: '#8D6E63',
    features: '颈侧有黑色并缀以白点的"珠链"斑，体羽灰褐，尾长。',
    habitat: '城市公园、居民区、农田。',
    behavior: '在地面步行觅食谷物，飞行时翅声大；叫声低沉三连音。',
    voice: '低沉浑厚的“咕咕—咕”三连音',
    tips: '地面觅食时最易观察，慢慢走不会惊飞。',
    equipment: '无需设备，肉眼即可',
    location: '解放公园、沙湖公园、人行道边',
    audio: '“咕咕—咕……”'
  },
  {
    id: 'mashu', name: '树麻雀', latin: 'Passer montanus', family: '雀科',
    group: '城市常见', rarity: '常见', color: '#A1887F',
    features: '脸颊有显著黑斑，头顶栗褐色，比家麻雀更常见于中国城市。',
    habitat: '城市、乡村居民点附近。',
    behavior: '成群活动，叽叽喳喳不停，爱在灌丛和屋檐下跳跃。',
    voice: '短促的“唧唧喳喳”',
    tips: '任何公园草地都能见到，观察群居行为和沙浴很有趣。',
    equipment: '无需设备',
    location: '武汉全城、校园、公园',
    audio: '“唧唧喳喳……”'
  },
  {
    id: 'huixique', name: '灰喜鹊', latin: 'Cyanopica cyanus', family: '鸦科',
    group: '城市常见', rarity: '常见', color: '#42A5F5',
    features: '头顶黑色，体羽蓝灰，尾羽长而蓝，飞羽末端白色。',
    habitat: '公园树林、行道树。',
    behavior: '成群结队活动，叫声粗哑响亮，非常机警。',
    voice: '粗哑的“嘎—嘎”声',
    tips: '群体活动明显，常集群飞过，抬头看树冠层。',
    equipment: '8×42望远镜',
    location: '东湖绿道、武汉植物园、龟山',
    audio: '“嘎—嘎—嘎！”'
  },
  {
    id: 'cuiniao', name: '普通翠鸟', latin: 'Alcedo atthis', family: '翠鸟科',
    group: '水鸟', rarity: '较常见', color: '#26C6DA',
    features: '上体宝蓝色带金属光泽，喉白，下体橙棕色；体型小，嘴长而尖。',
    habitat: '池塘、湖泊、河流岸边。',
    behavior: '常站在水边树枝或石头上注视水面，发现鱼后俯冲入水捕鱼。',
    voice: '飞行时发出尖细的“吱——”声',
    tips: '盯住水边固定的栖枝，等待它入水捕鱼的精彩瞬间。',
    equipment: '长焦镜头200mm以上、三脚架、快门优先',
    location: '东湖听涛、沙湖、府河湿地',
    audio: '“吱——”的一声尖叫'
  },
  {
    id: 'bailu', name: '白鹭', latin: 'Egretta garzetta', family: '鹭科',
    group: '水鸟', rarity: '常见', color: '#EEEEEE',
    features: '全身洁白，腿和嘴黑色，脚趾黄色；繁殖期枕部有两条长饰羽。',
    habitat: '湖泊、稻田、湿地浅水区。',
    behavior: '浅水中慢步觅食，脚搅动水面惊起小鱼；集群营巢。',
    voice: '一般无声，受惊时发出短促叫声',
    tips: '清晨和傍晚觅食活跃，浅滩处最容易接近。',
    equipment: '长焦镜头300mm、三脚架',
    location: '府河湿地、沉湖湿地、汤逊湖',
    audio: '受惊时“嘎”一声'
  },
  {
    id: 'yelu', name: '夜鹭', latin: 'Nycticorax nycticorax', family: '鹭科',
    group: '水鸟', rarity: '常见', color: '#546E7A',
    features: '成鸟顶冠和背部蓝黑，翅灰，眼红色；亚成鸟褐色带白斑。',
    habitat: '湖泊、池塘、城市公园水边。',
    behavior: '白天常缩颈站立树上一动不动，黄昏后活跃觅食，故称"夜鹭"。',
    voice: '受惊时发出粗哑的“呱”声',
    tips: '白天在树上站桩发呆的常是它，黄昏可看到群飞觅食。',
    equipment: '8×42望远镜、长焦镜头',
    location: '沙湖、东湖、解放公园水边',
    audio: '“呱——”'
  },
  {
    id: 'canglu', name: '苍鹭', latin: 'Ardea cinerea', family: '鹭科',
    group: '水鸟', rarity: '较常见', color: '#90A4AE',
    features: '体型最大的鹭类之一，灰蓝色羽毛，头颈细长，飞行时缩颈呈"S"形。',
    habitat: '湿地、湖泊、鱼塘。',
    behavior: '长时间静立水边等待鱼虾，被称为"老等"；飞行姿态优雅。',
    voice: '一般无声，繁殖期发出沙哑叫声',
    tips: '站在水边像雕塑一样的就是它，耐心等待它起飞瞬间。',
    equipment: '长焦镜头300mm以上、三脚架',
    location: '府河湿地、沉湖湿地、涨渡湖',
    audio: '沙哑的“嘎啊”'
  },
  {
    id: 'xiaopiti', name: '小䴙䴘', latin: 'Tachybaptus ruficollis', family: '䴙䴘科',
    group: '水鸟', rarity: '常见', color: '#8D6E63',
    features: '体小圆胖，颈栗红色，尾羽极短，常潜水不见影。',
    habitat: '湖泊、池塘、水库等淡水水域。',
    behavior: '擅长潜水，受惊即潜入水中，片刻后出现在远处水面。',
    voice: '颤抖的“呲呲呲”叫声',
    tips: '水面上一只"小鸭子"突然消失又冒出，多半是它。',
    equipment: '8×42望远镜',
    location: '沙湖、金银湖、汤逊湖',
    audio: '“呲呲呲……”'
  },
  {
    id: 'heishuiji', name: '黑水鸡', latin: 'Gallinula chloropus', family: '秧鸡科',
    group: '水鸟', rarity: '较常见', color: '#424242',
    features: '全身黑褐色，嘴和额甲红色，嘴尖黄色；脚绿色。',
    habitat: '湖泊、沼泽、水田等有芦苇的水域。',
    behavior: '在水面游动时头一点一点，常进入芦苇丛；遇险会短距离"踩水"起飞。',
    voice: '尖锐的“咕咕咕”叫声',
    tips: '注意红嘴红额甲的特征，与黑水鸡类区分看额甲颜色。',
    equipment: '8×42望远镜',
    location: '东湖、沙湖、府河湿地',
    audio: '“咕咕咕—咕！”'
  },
  {
    id: 'hongzuilanque', name: '红嘴蓝鹊', latin: 'Urocissa erythrorhyncha', family: '鸦科',
    group: '林鸟', rarity: '较常见', color: '#EF5350',
    features: '头颈黑色，上体紫蓝色，尾特长，嘴和脚红色，非常艳丽。',
    habitat: '山地森林、公园大片林地。',
    behavior: '成小群活动，叫声粗哑；飞行时长尾飘曳，如凤凰般优雅。',
    voice: '粗哑的“嘎嘎”叫声',
    tips: '磨山竹林和树林中常见，注意观察其鲜艳的红嘴长尾。',
    equipment: '8×42望远镜、长焦镜头',
    location: '东湖磨山、武汉植物园',
    audio: '“嘎嘎—嘎”'
  },
  {
    id: 'daisheng', name: '戴胜', latin: 'Upupa epops', family: '戴胜科',
    group: '林鸟', rarity: '少见', color: '#FFB74D',
    features: '头顶具扇形羽冠，体羽棕橙色，翅和尾黑白相间；嘴细长下弯。',
    habitat: '开阔林地、草地、耕地。',
    behavior: '在草地啄食昆虫，受惊时羽冠张开如扇；叫声低沉"呼呼呼"。',
    voice: '低沉的“呼—呼—呼”',
    tips: '看到"啄木鸟一样的花鸟"在草地上点头啄食，多半是戴胜。',
    equipment: '长焦镜头200mm、8×42望远镜',
    location: '府河湿地周边草地、江滩',
    audio: '“呼—呼—呼”'
  },
  {
    id: 'lvtouya', name: '绿头鸭', latin: 'Anas platyrhynchos', family: '鸭科',
    group: '水鸟', rarity: '常见', color: '#2E7D32',
    features: '雄鸟头颈绿色带金属光泽，颈有白环，胸栗色；雌鸟褐色斑驳。',
    habitat: '湖泊、河流、湿地。',
    behavior: '成群在水面游弋，觅食时尾部上翘"倒栽葱"；为家鸭祖先。',
    voice: '雌鸟响亮的“嘎嘎”声',
    tips: '城市公园水面最常见，冬季数量大增。',
    equipment: '8×42望远镜',
    location: '金银湖、沙湖、梁子湖',
    audio: '“嘎嘎嘎——”'
  },
  {
    id: 'banduanya', name: '斑嘴鸭', latin: 'Anas zonorhyncha', family: '鸭科',
    group: '水鸟', rarity: '较常见', color: '#5D4037',
    features: '嘴端黄色，嘴基黑色，眉纹明显，体羽褐色；常与绿头鸭混群。',
    habitat: '湖泊、水库、湿地。',
    behavior: '成对或小群活动，警觉性比绿头鸭高，受惊即起飞。',
    voice: '低沉的“嘎嘎”声',
    tips: '注意看它的黄嘴尖，这是与绿头鸭雌鸟区分的关键。',
    equipment: '8×42望远镜',
    location: '沉湖湿地、府河湿地',
    audio: '“嘎—嘎—”'
  },
  {
    id: 'hongtou', name: '红头长尾山雀', latin: 'Aegithalos concinnus', family: '山雀科',
    group: '林鸟', rarity: '较常见', color: '#FF8A65',
    features: '头顶栗红，颈圈白色，体型极小，尾长；脸颊黑斑，腹部白。',
    habitat: '山地树林、竹林、公园。',
    behavior: '成群在树枝间敏捷跳跃，边叫边移动，极难拍摄。',
    voice: '细碎的“吱吱”声',
    tips: '听到细碎叫声抬头找，一群小毛球在树枝间翻飞就是它们。',
    equipment: '长焦镜头、快速对焦',
    location: '武汉植物园、磨山、龟山',
    audio: '“吱吱吱……”'
  },
  {
    id: 'zongbei', name: '棕背伯劳', latin: 'Lanius schach', family: '伯劳科',
    group: '林鸟', rarity: '较常见', color: '#FFA000',
    features: '头顶黑，背棕红，腹白，眼周黑色"蒙面"斑；尾长。',
    habitat: '开阔田野、灌丛、公园边缘。',
    behavior: '站在高处枝头巡视，捕食昆虫和小鸟；有"屠夫鸟"之称，会把猎物挂在树枝上。',
    voice: '模仿其他鸟叫的粗哑鸣声',
    tips: '注意看它的"黑眼罩"，站在电线上的"小猛禽"就是它。',
    equipment: '8×42望远镜、长焦镜头',
    location: '府河湿地、江滩灌丛',
    audio: '模仿各种鸟声'
  },
  {
    id: 'beihong', name: '北红尾鸲', latin: 'Phoenicurus auroreus', family: '鹟科',
    group: '林鸟', rarity: '较常见', color: '#FB8C00',
    features: '雄鸟头顶银灰，脸喉黑，翅有白斑，腰和尾橙红；尾常颤动。',
    habitat: '树林、公园、村庄附近。',
    behavior: '常站在低枝或屋顶，尾羽上下颤动不停；冬季到城市越冬。',
    voice: '单调的“吱—吱”声',
    tips: '看到不断颤尾的小鸟，多半是北红尾鸲；秋冬在武汉很常见。',
    equipment: '8×42望远镜',
    location: '解放公园、校园、磨山',
    audio: '“吱—吱—”'
  },
  {
    id: 'huangyao', name: '黄腰柳莺', latin: 'Phylloscopus proregulus', family: '柳莺科',
    group: '林鸟', rarity: '少见', color: '#AED581',
    features: '体型极小，上体橄榄绿，腰部和头顶中央有黄色纵纹；眉纹黄色。',
    habitat: '针阔混交林、公园树林。',
    behavior: '在树冠层快速移动觅食昆虫，总在动，很难看清。',
    voice: '清脆的“嘀嗒嘀嗒”鸣唱',
    tips: '秋天过境期在武汉树冠层常见，靠声音定位再耐心追踪。',
    equipment: '长焦镜头、8×42望远镜',
    location: '武汉植物园、磨山',
    audio: '“嘀嗒嘀嗒……”'
  },
  {
    id: 'jinqiao', name: '金翅雀', latin: 'Chloris sinica', family: '雀科',
    group: '城市常见', rarity: '较常见', color: '#F9A825',
    features: '翅上有醒目的金黄色斑，嘴粗短；雄鸟体羽黄绿色。',
    habitat: '城市绿地、公园、农田边。',
    behavior: '常成群在空中盘旋后落树，叫声金属般"嘀哩嘀哩"。',
    voice: '金属感的“嘀哩嘀哩”',
    tips: '抬头看空中成群盘旋的鸟群，落树后找金黄色翅斑。',
    equipment: '8×42望远镜',
    location: '解放公园、龟山、武汉植物园',
    audio: '“嘀哩嘀哩——”'
  },
  {
    id: 'quequ', name: '鹊鸲', latin: 'Copsychus saularis', family: '鹟科',
    group: '城市常见', rarity: '较常见', color: '#455A64',
    features: '雄鸟头胸黑色，翅有白斑，腹白，尾长常翘起；似小喜鹊。',
    habitat: '城市公园、庭院、村庄。',
    behavior: '喜欢站在高处翘尾鸣唱，叫声婉转动听；在电线、屋顶常见。',
    voice: '婉转的鸣唱，常在天亮前后开唱',
    tips: '清晨屋顶上的"小喜鹊"就是它，注意白腹黑背的配色。',
    equipment: '无需设备，肉眼可观察',
    location: '武汉城区、校园、公园',
    audio: '清晨婉转鸣唱'
  },
  {
    id: 'bailing', name: '白鹡鸰', latin: 'Motacilla alba', family: '鹡鸰科',
    group: '城市常见', rarity: '常见', color: '#B0BEC5',
    features: '黑白配色，尾长，行走时尾巴上下摆动，飞行呈波浪状。',
    habitat: '水边、道路、操场、屋顶。',
    behavior: '边走边点尾，追捕飞虫；飞行时一起一伏如波浪。',
    voice: '清脆的“唧铃铃”声',
    tips: '校园操场和湖边最常见，看它波浪式飞行和点尾很有趣。',
    equipment: '无需设备',
    location: '校园操场、东湖绿道、沙湖',
    audio: '“唧铃铃——”'
  },
  {
    id: 'heilian', name: '黑脸噪鹛', latin: 'Garrulax perspicillatus', family: '噪鹛科',
    group: '林鸟', rarity: '较常见', color: '#616161',
    features: '脸部黑色连成片，体羽灰褐，眼后无白斑；叫声嘈杂响亮。',
    habitat: '灌丛、竹林、公园。',
    behavior: '成群在灌丛地面翻找落叶觅食，叫声非常吵闹。',
    voice: '嘈杂的“哇哇哇”合唱',
    tips: '林下落叶堆里传来吵吵闹闹的叫声，八成是黑脸噪鹛群。',
    equipment: '8×42望远镜',
    location: '磨山、武汉植物园、龟山',
    audio: '“哇哇哇哇——”'
  },
  {
    id: 'dashan', name: '大山雀', latin: 'Parus cinereus', family: '山雀科',
    group: '林鸟', rarity: '常见', color: '#5C6BC0',
    features: '头黑，脸颊白，喉黑，胸腹黄色带黑纵带；叫声"吱吱啾"。',
    habitat: '树林、公园、庭院。',
    behavior: '在树枝上倒挂觅食，动作灵活；鸣声洪亮清脆。',
    voice: '洪亮的“吱吱啾—吱吱啾”',
    tips: '听到响亮的三音节叫声抬头找，倒挂在树枝上的一定是它。',
    equipment: '8×42望远镜',
    location: '武汉植物园、磨山、龟山、解放公园',
    audio: '“吱吱啾—吱吱啾”'
  }
];

/* ---------- 2. 观鸟点数据库（观测点推荐） ---------- */
// 来源标注：平台活跃用户上传 + 网络资料整理（与方案一致）
// lat/lng 为武汉及周边真实地点的近似坐标
const SPOTS = [
  { id: 'lyd', name: '东湖落雁岛', lat: 30.543, lng: 114.428, env: '湿地公园', level: '新手友好', birds: ['bailu', 'yelu', 'xiaopiti', 'heishuiji', 'baitoubei'], desc: '东湖东北岸湿地，栈道深入湖中，水鸟密度高，观鸟条件好。', uploads: 342 },
  { id: 'ms', name: '东湖磨山', lat: 30.563, lng: 114.396, env: '山林公园', level: '进阶', birds: ['hongzuilanque', 'huangfu', 'dashan', 'hongtou', 'heilian'], desc: '山林灌丛密布，林鸟丰富，红嘴蓝鹊与黄腹树莺的经典观察点。', uploads: 287 },
  { id: 'fw', name: '府河湿地', lat: 30.722, lng: 114.284, env: '湿地', level: '进阶', birds: ['bailu', 'canglu', 'lvtouya', 'cuiniao', 'zongbei'], desc: '候鸟迁徙通道，秋冬候鸟种类多，适合拍摄水鸟大群。', uploads: 511 },
  { id: 'ch', name: '沉湖湿地', lat: 30.29, lng: 113.83, env: '湿地', level: '资深', birds: ['bailu', 'canglu', 'banduanya', 'lvtouya', 'heishuiji'], desc: '国际重要湿地，越冬水鸟数量巨大，观鸟发烧友必去。', uploads: 203 },
  { id: 'jyh', name: '金银湖', lat: 30.68, lng: 114.17, env: '城市湖泊', level: '新手友好', birds: ['lvtouya', 'xiaopiti', 'baitoubei', 'wudong'], desc: '城市湖泊，绿头鸭与小䴙䴘常年可见，交通便利。', uploads: 156 },
  { id: 'gs', name: '龟山', lat: 30.57, lng: 114.29, env: '山林公园', level: '进阶', birds: ['huangfu', 'hongtou', 'heilian', 'dashan', 'jinqiao'], desc: '闹市中的山林，林鸟种类不少，清晨鸟鸣最佳。', uploads: 98 },
  { id: 'sh', name: '沙湖公园', lat: 30.56, lng: 114.33, env: '城市湖泊', level: '新手友好', birds: ['cuiniao', 'yelu', 'xiaopiti', 'bailing', 'baitoubei'], desc: '市中心湿地公园，翠鸟与夜鹭稳定出没，通勤顺路可看。', uploads: 189 },
  { id: 'jf', name: '解放公园', lat: 30.61, lng: 114.30, env: '城市公园', level: '新手友好', birds: ['mashu', 'zhuijing', 'baitoubei', 'beihong', 'quequ'], desc: '老牌城市公园，城市常见鸟齐全，新手入门第一站。', uploads: 74 },
  { id: 'tyh', name: '汤逊湖', lat: 30.42, lng: 114.37, env: '城市湖泊', level: '进阶', birds: ['bailu', 'xiaopiti', 'lvtouya', 'wudong'], desc: '亚洲最大城中湖，浅滩芦苇带是白鹭觅食地。', uploads: 131 },
  { id: 'lzh', name: '梁子湖', lat: 30.16, lng: 114.53, env: '湖泊', level: '资深', birds: ['banduanya', 'canglu', 'heishuiji', 'lvtouya'], desc: '大型淡水湖，水鸟栖息地，适合全天观鸟。', uploads: 87 },
  { id: 'zdh', name: '涨渡湖湿地', lat: 30.57, lng: 114.88, env: '湿地', level: '资深', birds: ['canglu', 'bailu', 'banduanya', 'cuiniao'], desc: '武汉东部湿地，池杉林水鸟景观独特，冬季候鸟多。', uploads: 66 },
  { id: 'zwy', name: '武汉植物园', lat: 30.54, lng: 114.41, env: '园林', level: '新手友好', birds: ['huangfu', 'hongtou', 'heilian', 'dashan', 'huangyao'], desc: '植物种类多，鸟种丰富，四季皆宜，设施完善。', uploads: 264 }
];

/* ---------- 3. 种子帖子（交流区演示数据） ---------- */
// type: share分享 / guide攻略 / qa问答 / region地区
const SEED_POSTS = [
  {
    id: 'p1', type: 'share', author: '望江楼老周', avatar: '🌳', time: '2小时前',
    title: '这又是哪种鸟呢？', content: '国庆在望江楼观鸟，白天站在树上打盹的特别多，一大群！一抬头就看到十几只，有认识的大佬吗？',
    likes: 156, comments: 23, fish: 18, images: 0, hot: true
  },
  {
    id: 'p2', type: 'guide', author: '镜头里的风', avatar: '📷', time: '昨天',
    title: '到底哪种摄像机比较适合新手？', content: '我用过很多款摄像机，最近总结一下哪些适合入门：①手机长焦（最省钱，先确认兴趣）②入门长焦DC（轻便）③微单+200mm（一步到位）。预算和需求匹配最重要，别一上来就上大炮。',
    likes: 289, comments: 45, fish: 36, images: 0, hot: true
  },
  {
    id: 'p3', type: 'qa', author: '刚入坑的小白', avatar: '🐣', time: '3天前',
    title: '刚接触野外摄影，求适合新手的入门设备', content: '刚接触野外摄影不久，准备往这个方向钻研。最近想拍翠鸟，求大佬推荐设备组合，预算5000以内。',
    likes: 67, comments: 31, fish: 0, images: 0
  },
  {
    id: 'p4', type: 'region', author: '湛江观鸟人', avatar: '🦆', time: '5天前',
    title: '国庆去湛江观鸟，收获满满！', content: '国庆去湛江观鸟，白天夜里在树上睡觉的特别多，一些夜鹭直接站满了树枝。附上行程：观海长廊→湖光岩→雷州湾，三天看了40+种。',
    likes: 132, comments: 18, fish: 12, images: 0
  },
  {
    id: 'p5', type: 'share', author: '东湖漫游者', avatar: '🌿', time: '1周前',
    title: '沙湖公园的翠鸟终于蹲到了', content: '连续三个周末蹲沙湖，今天终于拍到翠鸟入水瞬间！经验：早上7点前到位，选有固定栖枝的位置，快门1/2000以上。',
    likes: 98, comments: 12, fish: 8, images: 0
  },
  {
    id: 'p6', type: 'guide', author: '鸟导阿强', avatar: '🪶', time: '2周前',
    title: '武汉秋冬观鸟点位攻略（干货）', content: '武汉秋冬观鸟优先级：①府河湿地（候鸟大群）②涨渡湖（池杉林）③沉湖（数量之王）。装备建议：8×42望远镜+防风外套+雨靴。新手先走府河，路好走鸟也多。',
    likes: 412, comments: 67, fish: 55, images: 0, hot: true
  },
  {
    id: 'p7', type: 'qa', author: '新手小观', avatar: '🔭', time: '3周前',
    title: '怎么区分夜鹭和苍鹭？', content: '在府河看到一只灰色大鸟站水里一动不动，是夜鹭还是苍鹭？求大神教区分方法。',
    likes: 45, comments: 20, fish: 0, images: 0
  }
];

/* ---------- 4. 成就系统配置 ---------- */
const ACHIEVEMENTS = [
  { id: 'a1', cat: '观鸟', name: '十鸟观', desc: '收录10种鸟类', target: 10, icon: '🐤' },
  { id: 'a2', cat: '观鸟', name: '伍鸟观', desc: '收录50种鸟类', target: 50, icon: '🐦' },
  { id: 'a3', cat: '观鸟', name: '百鸟观', desc: '收录100种鸟类', target: 100, icon: '🦅' },
  { id: 'a4', cat: '观鸟', name: '千鸟观', desc: '收录1000种鸟类（鸟类学家之路）', target: 1000, icon: '🦉' },
  { id: 'a5', cat: '获赞', name: '百赞', desc: '帖子累计获赞100', target: 100, icon: '👍' },
  { id: 'a6', cat: '获赞', name: '千赞', desc: '帖子累计获赞1000', target: 1000, icon: '🔥' },
  { id: 'a7', cat: '获赞', name: '三千赞', desc: '帖子累计获赞3000', target: 3000, icon: '🏆' },
  { id: 'a8', cat: '互动', name: '首帖', desc: '发布第一帖', target: 1, icon: '📝' },
  { id: 'a9', cat: '互动', name: '热帖达人', desc: '单帖获赞达到100', target: 100, icon: '💥' }
];

/* ---------- 5. 装备库（售卖区·软广导流） ---------- */
const GEAR = [
  { id: 'g1', name: '观鸟入门双筒望远镜 8×42', brand: '星特朗', price: '¥399', cat: '望远镜', match: '水鸟/林鸟通用', desc: '性价比入门首选，ED镜片，清晰度够用', rec: '新手第一支' },
  { id: 'g2', name: '专业ED观鸟镜 65mm', brand: '施华洛世奇', price: '¥8,999', cat: '望远镜', match: '资深观鸟', desc: '高亮度ED镜片，目镜可换，湿地远距离观察利器', rec: '进阶发烧' },
  { id: 'g3', name: '长焦数码相机 600mm', brand: '尼康', price: '¥6,999', cat: '相机', match: '拍摄记录', desc: '一镜走天下的超长焦，拍鸟入门推荐', rec: '拍鸟入门' },
  { id: 'g4', name: '碳纤维三脚架', brand: '曼富图', price: '¥1,299', cat: '配件', match: '稳定拍摄', desc: '轻量稳固，配合长焦拍鸟必备', rec: '稳定利器' },
  { id: 'g5', name: '防风防泼水冲锋衣', brand: '迪卡侬', price: '¥499', cat: '户外', match: '湿地环境', desc: '湿地观鸟防风防潮，口袋多方便装图鉴', rec: '秋冬必备' },
  { id: 'g6', name: '《中国鸟类野外手册》', brand: '商务印书馆', price: '¥88', cat: '图鉴', match: '识别学习', desc: '经典中文图鉴，收录1400+种，随身翻查', rec: '人手一本' }
];

/* ---------- 6. 排行榜（本地模拟） ---------- */
const RANK_SEED = [
  { name: '望江楼老周', birds: 132, likes: 2864, icon: '🌳' },
  { name: '镜头里的风', birds: 98, likes: 1932, icon: '📷' },
  { name: '鸟导阿强', birds: 87, likes: 1501, icon: '🪶' },
  { name: '湛江观鸟人', birds: 76, likes: 1105, icon: '🦆' },
  { name: '东湖漫游者', birds: 64, likes: 876, icon: '🌿' }
];

/* ---------- 7. AI 知识库（识别结果讲解 + AI对话） ---------- */
const AI_KNOWLEDGE = {
  '识别结果模板': '根据您上传的图片特征分析，最可能为【{name}】。识别要点：{features}。它常见于{location}，观察建议：{tips}。',
  '翠鸟怎么拍': '拍翠鸟要点：①清晨7点前到位②选有固定栖枝的岸边③快门优先1/2000s④开启连拍，等待俯冲瞬间。',
  '入门设备': '新手推荐：8×42双筒望远镜（¥300-600）→ 入门长焦相机（¥3000-7000）→ 微单+200mm镜头。别一上来就买大炮。',
  '武汉去哪里': '武汉观鸟优先级：新手去沙湖公园/解放公园，进阶去东湖落雁岛、府河湿地，资深去沉湖湿地、涨渡湖。',
  '夜鹭和苍鹭区别': '夜鹭：体型小、头背蓝黑、眼红、白天树上站桩。苍鹭：体型大、灰蓝色、颈细长、水边静立如"老等"。',
  '观鸟守则': '①不诱拍不驱赶②保持安全距离③不破坏栖息地④稀有鸟点不公开坐标（保护生态）。'
};
