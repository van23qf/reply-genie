<script setup lang="ts">
import { nextTick, ref } from 'vue'

// ===================== 类型定义 =====================
interface AIResponse {
  analysis: string
  suggestions: string[]
  tip: string
}

interface MessageItem {
  type: 'user' | 'ai'
  scene?: string
  role?: string
  style?: string
  data?: AIResponse
}

// ===================== 页面配置 =====================
definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '社恐回复神器',
  },
})

// ===================== 状态 =====================
const sceneInput = ref('')
const selectedRole = ref('')
const selectedStyle = ref('')
const isLoading = ref(false)
const messages = ref<MessageItem[]>([])
const showEmpty = ref(true)
const toastVisible = ref(false)
const toastText = ref('已复制到剪贴板')
const sceneError = ref(false)
const roleError = ref(false)
const styleError = ref(false)
const chatScrollTop = ref(0)
const showChatPanel = ref(false)
const customRoles = ref<string[]>([])
const customStyles = ref<string[]>([])
const showCustomInput = ref<'role' | 'style' | null>(null)
const customInputText = ref('')

// ===================== 快捷场景 =====================
const quickScenes = [
  { label: '女朋友问加班', text: '女朋友问我怎么又加班，是不是不想陪她' },
  { label: '领导临下班派活', text: '领导在下班前5分钟给我安排了一个紧急任务，让我明天一早交' },
  { label: '朋友借钱', text: '朋友找我借5000块钱说急用，但我自己也不宽裕' },
  { label: '父母催婚', text: '父母又打电话催我找对象结婚，说隔壁谁谁谁孩子都会走了' },
  { label: '同事推活', text: '同事把自己的活推给我做，说是帮我锻炼' },
  { label: '客户投诉', text: '客户对我们交付的产品不满意，要求退款并补偿' },
]

// ===================== 角色选项 =====================
const roles = [
  { label: '女朋友', icon: 'i-carbon-favorite' },
  { label: '朋友', icon: 'i-carbon-group' },
  { label: '公司领导', icon: 'i-carbon-portfolio' },
  { label: '父母', icon: 'i-carbon-home' },
  { label: '同事', icon: 'i-carbon-user' },
  { label: '亲戚', icon: 'i-carbon-tree-view-alt' },
]

// ===================== 风格选项 =====================
const styles = [
  { label: '拒绝', icon: 'i-carbon-close' },
  { label: '冷淡回应', icon: 'i-carbon-snowflake' },
  { label: '热情回应', icon: 'i-carbon-fire' },
  { label: '幽默回应', icon: 'i-carbon-face-satisfied' },
  { label: '真诚回应', icon: 'i-carbon-theater' },
]

const displayRoles = computed(() => [
  ...roles,
  ...customRoles.value.map(label => ({ label, icon: 'i-carbon-user-avatar' })),
])
const displayStyles = computed(() => [
  ...styles,
  ...customStyles.value.map(label => ({ label, icon: 'i-carbon-settings-adjust' })),
])

// ===================== Mock 数据 =====================
const responseData: Record<string, Record<string, AIResponse>> = {
  女朋友: {
    拒绝: {
      analysis: '恋爱关系中，对方提出请求时往往不只是要一个结果，更在意你的态度。拒绝时需要让她感受到你的在意和无奈，而非敷衍。',
      suggestions: [
        '宝贝，我知道你很想这样，但我现在真的有点抽不开身，等我忙完一定好好陪你，好不好？',
        '这次可能不太行，我手头刚好有事走不开。不过我补偿你，周末你想去哪我都陪你！',
        '我也好想答应你啊，但这次真的不太方便。要不我们换个时间？我保证到时候全身心陪你。',
      ],
      tip: '拒绝伴侣的"三明治法则"：先表达理解/共情 → 委婉说明原因 → 主动提供替代方案或补偿。关键是不让她觉得被敷衍。',
    },
    冷淡回应: {
      analysis: '冷淡回应在感情中是一把双刃剑，适度使用可以制造空间感，但过度可能伤害关系。建议保持基本礼貌，不要完全关闭沟通通道。',
      suggestions: ['嗯，知道了。', '行吧，你看着办。', '哦，这样啊。'],
      tip: '冷淡回应如果是为了表达不满，比直接争吵更伤感情。如果只是想降低聊天频率，可以拉长回复间隔而非改变语气。',
    },
    热情回应: {
      analysis: '恋爱中的热情回应能大幅提升对方的安全感和幸福感。关键是让回应既真诚又有感染力，不只是敷衍的"好好好"。',
      suggestions: [
        '当然可以啊！我正好也在想这个呢，太有默契了吧！什么时候？我随时都行！',
        '好呀好呀！你说的我都想尝试！而且我还可以准备一个惊喜给你，你等着！',
        '必须可以！我都迫不及待了！你还有其他想法吗？我们一起规划一下！',
      ],
      tip: '热情回应的关键是"追加信息"——不只是说好，而是主动补充想法或提议，让对方感受到你的真心投入。',
    },
    幽默回应: {
      analysis: '幽默是恋爱中的调味剂，能有效缓解紧张气氛、增进亲密度。但要注意分寸，确保对方能get到你的笑点而不会误解。',
      suggestions: [
        '你是来查岗的吧？坦白从宽，我现在正在想你，证据确凿！',
        '收到指令！作为你的专属男朋友，我将在0.01秒内执行此任务！',
        '等一下，让我先问问我的心……它说："当然同意，而且还要加码！"',
      ],
      tip: '幽默回应的精髓是"自嘲"而非"嘲讽对方"。把自己当笑点，对方会跟着笑；把对方当笑点，对方可能跟着生气。',
    },
    真诚回应: {
      analysis: '真诚是感情中最珍贵的品质。坦诚表达自己的想法和感受，比任何话术都更有力量。对方能感受到你的真心。',
      suggestions: [
        '说实话，我特别感谢你跟我说这些。我的想法是这样的……我希望能和你一起面对。',
        '我很重视你的感受，所以我想认真回应你。对我来说，这件事……',
        '我不想敷衍你，所以认真想了一下。我的真实想法是……希望我们能好好聊聊。',
      ],
      tip: '真诚回应的关键是"具体化"——不要只说"我理解"，而是说出你具体理解了什么；不要只说"我在乎"，而是用行动和细节证明。',
    },
  },
  公司领导: {
    拒绝: {
      analysis: '拒绝领导是职场中最考验沟通技巧的场景。直接拒绝可能影响职业发展，但一味答应又会导致负担过重。关键是要体现你的专业性和责任心。',
      suggestions: [
        '感谢您的信任，我目前手头有A项目和B任务，如果接手这个可能会影响交付时间。您看是否需要调整一下优先级？',
        '这个任务我很想参与，但考虑到当前的工作负荷，我担心无法保证质量。是否可以协调其他同事一起，或者延后一些？',
        '我理解这个任务的重要性，不过以目前的时间和资源，可能难以达到您期望的效果。我建议可以考虑XX方案，您觉得如何？',
      ],
      tip: '拒绝领导的核心策略是"以工作成果为导向"——不是在说"我不想做"，而是在说"我想做好，所以需要调整条件"。把拒绝变成协商。',
    },
    冷淡回应: {
      analysis: '对领导冷淡回应风险极高，可能被视为不尊重或不配合。除非你有意保持距离，否则不建议使用。如必须使用，要保持最基本的职业礼貌。',
      suggestions: ['收到，我会按照要求完成。', '明白了，还有其他指示吗？', '了解了，我这边会处理。'],
      tip: '职场中的冷淡最好通过"控制信息量"来实现——不多说、不主动、不延展，而非用冷淡的语气。保持专业但不过度热情。',
    },
    热情回应: {
      analysis: '对领导热情回应能展示你的积极态度和团队精神，但要注意分寸，过于谄媚会让同事反感，也会降低你的专业形象。',
      suggestions: [
        '好的！这个方向我很认同，我马上着手推进。如果有需要协调的地方，随时跟您汇报。',
        '收到！我正好有一些相关的想法，能不能占用您几分钟简单交流一下？我想确保方向完全对齐。',
        '没问题！这个任务我会优先处理，预计XX时间给到您初步方案。过程中有任何进展会及时同步。',
      ],
      tip: '对领导热情的关键是"主动对齐预期"——不只是答应，而是主动确认标准、时间和资源，让热情转化为可靠的执行力。',
    },
    幽默回应: {
      analysis: '对领导使用幽默需要非常谨慎，取决于你们的关系和公司文化。如果关系较好且氛围轻松，适度幽默可以拉近距离。否则可能适得其反。',
      suggestions: [
        '领导您这效率，我还没缓过神来新任务就来了！我马上安排，保证跟上您的节奏。',
        '收到指令！保证完成任务，不过如果完成得漂亮，能不能申请一杯咖啡作为奖励？',
        '领导出马，肯定没问题！我这就去推进，争取让您刮目相看。',
      ],
      tip: '对领导幽默的安全区是"自嘲式幽默"和"积极型幽默"，绝对避免"讽刺型幽默"和"吐槽型幽默"。拿不准的时候，宁可不要幽默。',
    },
    真诚回应: {
      analysis: '对领导真诚表达想法是职场成熟的表现。好的领导会欣赏坦诚的反馈，但要注意方式方法，真诚不等于口无遮拦。',
      suggestions: [
        '我想坦诚地跟您沟通一下我的想法。关于这件事，我有一些顾虑，但也有一些思路，希望能跟您探讨。',
        '感谢您跟我聊这个，我想真诚地表达我的看法。从执行层面来看，我认为……',
        '我很重视您的意见，也想跟您说实话。目前的情况是……我建议的方案是……',
      ],
      tip: '对领导真诚的要点是"带方案的真诚"——不只是提出问题或困难，而是同时给出你的思考和建议。领导要的不是抱怨，而是解决方案。',
    },
  },
  朋友: {
    拒绝: {
      analysis: '朋友之间的拒绝相对轻松，但也需要照顾对方感受。真正的朋友会理解你的难处，所以不用过于纠结措辞，真诚就好。',
      suggestions: [
        '兄弟/姐妹，这次真去不了，下次我请客！一定补上！',
        '哎，这次有点事儿走不开，你先去，下次咱必须约！',
        '改天吧，最近真的忙得脚不着地。等忙完这阵我主动找你，行不？',
      ],
      tip: '朋友间拒绝最忌讳的是"编理由"——真朋友看得出来。直接说原因，加上一个具体的替代时间或方案，比任何花式借口都管用。',
    },
    冷淡回应: {
      analysis: '对朋友冷淡回应可能暗示你想保持距离，或者对某事不满。如果只是暂时心情不好，最好简单说明，避免误解。',
      suggestions: ['嗯，行。', '知道了。', '再说吧。'],
      tip: '冷淡回应在友情中是危险信号。如果只是偶尔为之，朋友会理解；如果持续冷淡，可能需要思考这段友谊是否还值得维持。',
    },
    热情回应: {
      analysis: '朋友间的热情回应是最自然的，能让友谊升温。不需要太刻意，展现你真实的兴奋就好。',
      suggestions: [
        '走走走！必须去！我早就想去了，你这一说太对了！',
        '可以啊！这主意太棒了！我还能再叫上XX不？人多有意思！',
        '必须安排！时间地点你定，我都行！太期待了！',
      ],
      tip: '朋友间的热情不需要技巧，需要的是"真"——真实的兴奋、真诚的期待，对方一定能感受到。',
    },
    幽默回应: {
      analysis: '朋友间是幽默的最佳使用场景，可以放开了怼、放开了开玩笑。幽默是友谊的粘合剂，让关系更轻松自然。',
      suggestions: [
        '你这是闲得发慌了吧？不过我比你还闲，走！',
        '哟，大忙人今天怎么想起我了？是不是又来借钱？先说好，五毛以上不借！',
        '我掐指一算，今天宜出门，忌加班。天意不可违，走起！',
      ],
      tip: '朋友间幽默的最高境界是"互怼"——你能怼他，他也能怼你，双方都不在意，反而乐在其中。这就是真友情。',
    },
    真诚回应: {
      analysis: '朋友间的真诚是最珍贵的。有些时候，比起花里胡哨的安慰，一句掏心窝子的话更能打动人。',
      suggestions: [
        '说真的，我很感谢你跟我说这些。不管怎样，我都在。',
        '实话跟你说，我觉得这件事……但不管你做什么决定，我都支持你。',
        '我不想说那些客套话。你对我很重要，所以我想认真跟你说……',
      ],
      tip: '朋友间真诚的力量在于"在场感"——不评判、不教做人，只是让对方知道你在这里、你在听、你在乎。',
    },
  },
  父母: {
    拒绝: {
      analysis: '拒绝父母需要特别照顾他们的情感需求。父母的请求背后往往是对关注和陪伴的渴望，拒绝时要注意不伤害他们的感情。',
      suggestions: [
        '爸妈，这次可能不太方便，我这边有点事走不开。不过下周我回去看你们，到时候咱们好好聚聚！',
        '我知道你们想让我去，但我最近真的有点忙。等我忙完这段，一定回去陪你们。',
        '这次可能不行，但我给你们订了个XX，你们先享受着，等我忙完马上到！',
      ],
      tip: '拒绝父母最重要的是"给出盼头"——他们不怕等，怕的是被忽视。一个具体的承诺时间比十句抱歉都管用。',
    },
    冷淡回应: {
      analysis: '对父母冷淡回应容易伤害他们，除非你在刻意保持边界。冷淡往往被解读为"不孝"，需要谨慎使用。',
      suggestions: ['知道了，我会看着办的。', '嗯，行吧。', '我自己有分寸，你们别操心了。'],
      tip: '如果和父母关系紧张需要保持距离，冷淡不如"温和的边界感"——态度温和但立场坚定，比冷漠更有效也更不伤人。',
    },
    热情回应: {
      analysis: '父母最渴望的就是孩子的热情回应。他们的很多行为本质上是想获得关注和认可，你的热情能让他们感到安心和满足。',
      suggestions: [
        '好呀！我正好也想你们了！什么时候？我安排好时间！',
        '没问题！我来安排！这次我要带你们去个特别好的地方！',
        '太好了！我这就订票！你们收拾好东西等着，我来接你们！',
      ],
      tip: '对父母热情的终极技巧是"反客为主"——不等他们提出需求，你主动安排、主动关心。这比任何热情的回应都让他们开心。',
    },
    幽默回应: {
      analysis: '和父母幽默互动能极大改善亲子关系，但要注意代沟。他们可能不熟悉网络梗，选择他们能理解的方式更好。',
      suggestions: [
        '妈，你是不是又想我了？别不好意思承认，我也想你们了！',
        '老爸，你这提议可以啊！没想到你还挺时髦的，比我朋友都潮！',
        '遵命！爸妈大人说什么就是什么，小的这就去办！',
      ],
      tip: '对父母幽默最安全的方式是"夸赞式幽默"——在玩笑中夸他们、表达爱意，他们听了开心，你也自然。',
    },
    真诚回应: {
      analysis: '亲子关系中最缺的往往是坦诚。很多家庭习惯了报喜不报忧，但适时地真诚沟通能消除很多误解和隔阂。',
      suggestions: [
        '爸、妈，其实我一直想跟你们说……我知道你们是为我好，但有时候我也需要你们相信我的判断。',
        '我认真想了想，我想跟你们坦白我的想法。我不希望我们之间有距离感……',
        '谢谢你们一直关心我。我也想对你们说实话，最近……但我希望你们放心，我能处理好。',
      ],
      tip: '对父母真诚最难的是"不演"——不演乖孩子、不演一切都好。你的脆弱和真实，反而能让父母感到被信任、被需要。',
    },
  },
  同事: {
    拒绝: {
      analysis: '同事间的拒绝需要在维护关系和保护自己之间找平衡。过于强硬会树敌，过于软弱会被持续占便宜。',
      suggestions: [
        '不好意思，我现在手头项目比较紧，可能帮不上忙。你要不要问问XX？他这方面比较擅长。',
        '这个我可能不太合适，建议可以找XX部门协调一下，他们更专业。',
        '理解你的需求，但我这边实在排不开。如果真的很急，要不我们跟领导协调一下资源？',
      ],
      tip: '拒绝同事的黄金法则：永远给出替代方案——另一个人选、另一个渠道、另一个时间。让对方觉得你在帮他想办法，而不是在推他走。',
    },
    冷淡回应: {
      analysis: '对同事冷淡回应是保持职场边界的常见方式。适度冷淡可以避免被过度打扰，但要注意不影响工作协作。',
      suggestions: ['收到。', '了解了，按流程走吧。', '嗯，我看一下。'],
      tip: '职场冷淡的最佳实践是"高效冷淡"——回复简短但内容完整，不闲聊但事办到位。冷淡但不失职。',
    },
    热情回应: {
      analysis: '对同事热情可以建立良好的协作关系，但要注意别成为"老好人"。热情应该用在关键人际关系上，而非无差别地释放。',
      suggestions: [
        '没问题！这个我可以帮忙，你把资料发我，我尽快看！',
        '好的！正好我也有类似的想法，我们可以一起讨论一下，说不定能碰撞出更好的方案！',
        '太好了，这个项目我一直很感兴趣！有什么需要配合的尽管说，我全力支持！',
      ],
      tip: '对同事热情要有"交换意识"——你的热情应该换来对方的尊重和配合，而不是变成理所当然的免费劳动力。',
    },
    幽默回应: {
      analysis: '同事间幽默可以缓解工作压力，增进团队氛围。但要避免涉及敏感话题，保持职场安全边界。',
      suggestions: [
        '你这需求提得比我加班还频繁！开玩笑的，我看看怎么帮你。',
        '收到了！保证完成任务，如果不能……那就再来一次！',
        '又来活了！我这工位是不是写着"有求必应"四个字？哈哈，说说看，什么情况？',
      ],
      tip: '同事间幽默的安全公式："先自嘲/夸张 + 再认真回应"。幽默是开场白，不是全部内容。',
    },
    真诚回应: {
      analysis: '同事间真诚沟通能建立深度信任，但要区分"职场真诚"和"交心真诚"。前者是对事不对人，后者需要建立在友谊基础上。',
      suggestions: [
        '说实话，我觉得这个方案还有一些可以优化的地方。我想跟你分享一些想法，你看行不行。',
        '我想跟你坦诚沟通一下。之前那个项目上，我有一些不同的看法……',
        '直说吧，这件事我觉得这样做可能更好……希望你不要介意我直言。',
      ],
      tip: '同事间真诚的底线是"对事不对人"——可以真诚地评价工作和方案，但不要真诚地评价对方的人格和能力。',
    },
  },
  客户: {
    拒绝: {
      analysis: '拒绝客户是商业沟通中最棘手的场景。直接拒绝可能丢失订单，但无底线答应会损害利益。需要在维护关系的同时守住底线。',
      suggestions: [
        '非常感谢您的信任，根据目前的情况，这个需求我们可能需要调整一下方案。我给您提供一个替代方案，您看是否合适？',
        '理解您的需求，不过按照目前的项目周期，这个时间节点可能有些紧张。我们可以分阶段交付，您看如何？',
        '您提的需求我记录了，不过以目前的产品能力，可能需要做一些调整才能实现。我可以给您演示一下目前的最佳实现方式。',
      ],
      tip: '拒绝客户的核心技巧是"从不说不，只说怎么调整"——把拒绝变成方案优化，把"不行"变成"可以，但是……"',
    },
    冷淡回应: {
      analysis: '对客户冷淡回应风险很大，除非是对方无理取闹你需要划清界限。一般商业场景中，冷淡会被解读为不专业。',
      suggestions: ['收到您的反馈，我们会按合同约定执行。', '感谢您的建议，我们会评估可行性。', '好的，如有进一步需求请提交工单。'],
      tip: '对客户冷淡的唯一合理场景是"对方越界"——提出合同外的要求、态度不尊重等。此时冷淡是职业边界，不是失礼。',
    },
    热情回应: {
      analysis: '对客户热情是商业关系中的基本态度。但热情要有价值——不是态度好就行，而是让客户感到被重视、被理解。',
      suggestions: [
        '非常感谢您的反馈！这个建议很有价值，我马上安排团队评估。预计明天给您回复初步方案。',
        '太好了，这个方向我非常认同！我这边马上推进，同时也会准备几个增值方案供您选择。',
        '感谢您的信任！这个项目我们非常重视，我会亲自跟进，确保每一个环节都达到您的要求。',
      ],
      tip: '对客户热情的核心是"让热情有落地感"——不只是嘴上说好，而是立刻给出行动和时间节点。热情+执行=专业。',
    },
    幽默回应: {
      analysis: '对客户使用幽默需要非常了解对方的性格和文化背景。关系不够深时，幽默可能被误解为不专业。',
      suggestions: [
        '您这个需求可真是给我们出了个好题！不过别担心，我们就喜欢有挑战的项目。',
        '哈哈，您说得太对了！看来我们的想法不谋而合，这合作不签都对不起这份默契。',
        '您这眼光，简直是行业标杆级别的！能跟您合作，我们也是沾光了。',
      ],
      tip: '对客户幽默最安全的类型是"赞美式幽默"——在轻松氛围中顺便夸了客户，既活跃了气氛又不失分寸。',
    },
    真诚回应: {
      analysis: '对客户真诚是建立长期合作关系的基石。适度展示透明度，能增加客户信任，但要注意不要过度暴露内部信息。',
      suggestions: [
        '感谢您的理解。坦率地说，目前我们在XX方面确实存在一些限制，但我们的解决方案是……',
        '我想跟您坦诚地沟通一下目前的进展。有些地方比预期慢了一些，原因是……但我们的应对措施是……',
        '说实话，这个需求超出了目前的合同范围，但我非常重视您的体验。我们可以这样处理……',
      ],
      tip: '对客户真诚的关键是"透明的态度+可控的信息"——展示你愿意坦诚的态度，但控制信息的颗粒度。真诚不等于全盘托出。',
    },
  },
  亲戚: {
    拒绝: {
      analysis: '亲戚之间的拒绝需要注意人情世故，既要维护面子，又要表达清楚自己的难处。中国式亲戚交往讲究"和为贵"，委婉比直接更有效。',
      suggestions: [
        '叔/姨，这事儿我确实考虑过，但最近实在腾不出手，等忙完这阵我主动联系您，咱再好好说。',
        '哎呀，您说的这个我记下了，不过我目前的情况可能不太合适。您看要不这样……',
        '我知道您是为我好，但我这边确实有些难处，希望您能理解。',
      ],
      tip: '拒绝亲戚的要点是"态度要软、立场要稳"——先表达感谢和理解，再委婉说明原因，最后给出替代方案。',
    },
    冷淡回应: {
      analysis: '对亲戚冷淡容易留下"不懂事"的印象，尤其是在家族聚会等场合。若非必要，建议保持基本礼貌。',
      suggestions: ['嗯，知道了，谢谢您关心。', '好的，有需要我会找您的。', '行，我记下了。'],
      tip: '如果确实不想和某位亲戚走太近，冷淡不如"保持距离但有礼貌"——客套但不深入，既不失礼节又保持边界。',
    },
    热情回应: {
      analysis: '对亲戚热情能营造和谐的大家庭氛围，长辈尤其喜欢热情主动的孩子。热情但要自然，别让人觉得假客气。',
      suggestions: [
        '好啊好啊！好久没聚了，您定时间，我肯定到！',
        '谢谢您惦记着！这事儿我特别上心，您放心，有什么需要我帮忙的尽管说！',
        '太好啦！正好我也有段时间没见大家了，这次一定好好聚聚！',
      ],
      tip: '对亲戚热情的关键是"主动融入"——不只是嘴上说好，而是表现出真的期待和参与感。',
    },
    幽默回应: {
      analysis: '和亲戚幽默互动能活跃气氛，但要尊重长辈。幽默用在平辈亲戚间更合适，对长辈则要把握分寸。',
      suggestions: [
        '您这消息比我妈都灵通！行，您说怎么办就怎么办，我听着呢！',
        '哎哟，您这一开口我就知道跑不掉了！说吧，让我干啥？',
        '您这是要把我培养成十项全能啊！哈哈，我尽力，可别抱太大期望！',
      ],
      tip: '对亲戚幽默的安全方式是和年龄相近的亲戚开玩笑，对长辈用"卖乖式"幽默更讨喜。',
    },
    真诚回应: {
      analysis: '亲戚关系中真诚能建立更深的信任，但也需注意场合。私下真诚沟通效果最好，公众场合还是留些余地。',
      suggestions: [
        '说实话，您对我一直很好，我很感激。关于这件事，我想跟您说真心话……',
        '我不想跟您说场面话，真心觉得您的建议挺好的，但我也有自己的考虑……',
        '谢谢您总是这么关心我。我也说实话，这事儿我有自己的想法，希望您能理解。',
      ],
      tip: '对亲戚真诚的要点是"感恩先行"——先表达对关心的感谢，再坦诚自己的想法，这样亲戚更容易接受。',
    },
  },
}

// ===================== 方法 =====================

/** 选择角色 */
function selectRole(role: string) {
  selectedRole.value = role
  roleError.value = false
}

/** 选择风格 */
function selectStyle(style: string) {
  selectedStyle.value = style
  styleError.value = false
}

function openCustomInput(type: 'role' | 'style') {
  customInputText.value = ''
  showCustomInput.value = type
}

function confirmCustomInput() {
  const text = customInputText.value.trim()
  if (!text)
    return

  if (showCustomInput.value === 'role') {
    if (!customRoles.value.includes(text) && !roles.some(r => r.label === text)) {
      customRoles.value.push(text)
    }
    selectedRole.value = text
    roleError.value = false
  }
  else if (showCustomInput.value === 'style') {
    if (!customStyles.value.includes(text) && !styles.some(s => s.label === text)) {
      customStyles.value.push(text)
    }
    selectedStyle.value = text
    styleError.value = false
  }
  showCustomInput.value = null
}

function cancelCustomInput() {
  showCustomInput.value = null
}

/** 填充快捷场景 */
function fillScene(text: string) {
  sceneInput.value = text
  sceneError.value = false
}

/** 提交 */
function handleSubmit() {
  if (isLoading.value)
    return

  // 验证
  let hasError = false
  if (!sceneInput.value.trim()) {
    sceneError.value = true
    hasError = true
  }
  if (!selectedRole.value) {
    roleError.value = true
    hasError = true
  }
  if (!selectedStyle.value) {
    styleError.value = true
    hasError = true
  }
  if (hasError)
    return

  // 隐藏空状态
  showEmpty.value = false

  // 清空旧消息
  messages.value = []

  // 添加用户消息
  messages.value.push({
    type: 'user',
    scene: sceneInput.value.trim(),
    role: selectedRole.value,
    style: selectedStyle.value,
  })

  // 滚动到底部
  scrollToBottom()

  // 显示加载状态
  isLoading.value = true
  showChatPanel.value = true

  // 模拟 AI 思考延迟
  setTimeout(() => {
    const data = responseData[selectedRole.value]?.[selectedStyle.value] || {
      analysis: `你选择了「${selectedRole.value}」作为交流对象，使用「${selectedStyle.value}」的沟通风格。AI 已根据你的场景进行分析。`,
      suggestions: [
        '根据你的场景，建议保持冷静和礼貌，清晰表达自己的想法，避免情绪化回应。',
        '可以先肯定对方的感受，再委婉地表达自己的立场，这样对方更容易接受。',
        '如果气氛紧张，可以适当转移话题或提出折中方案，给双方台阶下。',
      ],
      tip: '自定义角色的通用建议：真诚最重要。了解对方的性格和处境，选择合适的沟通方式，比任何话术都有效。',
    }
    messages.value.push({
      type: 'ai',
      data,
    })
    isLoading.value = false
    scrollToBottom()
  }, 1200 + Math.random() * 800)
}

/** 清空对话 */
function clearChat() {
  messages.value = []
  showEmpty.value = true
  sceneInput.value = ''
  selectedRole.value = ''
  selectedStyle.value = ''
  sceneError.value = false
  roleError.value = false
  styleError.value = false
  showChatPanel.value = false
}

/** 返回输入面板 */
function backToInput() {
  showChatPanel.value = false
}

/** 复制文本 */
function copyText(text: string, index: number) {
  uni.setClipboardData({
    data: text,
    success: () => {
      showToast('已复制到剪贴板')
    },
  })
}

/** 显示 Toast */
function showToast(text: string) {
  toastText.value = text
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query.select('.chat-messages').boundingClientRect()
    query.select('.chat-area').boundingClientRect()
    query.exec((res) => {
      if (res && res[0] && res[1]) {
        const messagesHeight = res[0].height
        const areaHeight = res[1].height
        if (messagesHeight > areaHeight) {
          chatScrollTop.value = messagesHeight - areaHeight + 100
        }
      }
    })
  })
}
</script>

<template>
  <view class="page-container">
    <!-- 背景光斑 -->
    <view class="orb orb-1" />
    <view class="orb orb-2" />
    <view class="orb orb-3" />

    <!-- 主内容 -->
    <view class="main-content">
      <!-- 头部 -->
      <view class="header">
        <view class="header-title">
          <view class="header-icon">
            <view class="i-carbon-magic-wand inline-block" />
          </view>
          <text class="title-gradient">
            社恐回复神器
          </text>
        </view>
        <text class="header-subtitle">
          描述你的社交场景，AI 帮你找到最合适的回应方式
        </text>
      </view>

      <!-- 主体 -->
      <view class="body-content">
        <!-- 输入面板 -->
        <view v-if="!showChatPanel" class="input-panel">
          <view class="glass-card input-card">
            <!-- 场景描述 -->
            <view class="section">
              <view class="section-label">
                <view class="i-carbon-tools inline-block" />
                <text>描述你的场景</text>
              </view>
              <textarea
                v-model="sceneInput"
                class="scene-input"
                placeholder="比如：女朋友看到我手机里和女同事的聊天记录，质问我为什么大半夜还在聊工作..."
                :maxlength="500"
                @input="sceneError = false"
              />
              <text v-if="sceneError" class="error-msg visible">
                请先描述你遇到的社交场景
              </text>
            </view>

            <!-- 快捷场景 -->
            <view class="quick-tags">
              <text
                v-for="scene in quickScenes"
                :key="scene.label"
                class="quick-tag"
                @click="fillScene(scene.text)"
              >
                {{ scene.label }}
              </text>
            </view>

            <!-- 交流对象 -->
            <view class="section">
              <view class="section-label">
                <view class="i-carbon-user inline-block" />
                <text>交流对象</text>
              </view>
              <view class="pill-group">
                <view
                  v-for="role in displayRoles"
                  :key="role.label"
                  class="pill"
                  :class="{ active: selectedRole === role.label }"
                  @click="selectRole(role.label)"
                >
                  <view :class="role.icon" class="inline-block" />
                  <text>{{ role.label }}</text>
                </view>
                <view class="pill pill-other" @click="openCustomInput('role')">
                  <view class="i-carbon-add inline-block" />
                  <text>其他</text>
                </view>
              </view>
              <text v-if="roleError" class="error-msg visible">
                请选择交流对象
              </text>
            </view>

            <!-- 回答风格 -->
            <view class="section">
              <view class="section-label">
                <view class="i-carbon-masks inline-block" />
                <text>回答风格</text>
              </view>
              <view class="pill-group">
                <view
                  v-for="style in displayStyles"
                  :key="style.label"
                  class="pill"
                  :class="{ active: selectedStyle === style.label }"
                  @click="selectStyle(style.label)"
                >
                  <view :class="style.icon" class="inline-block" />
                  <text>{{ style.label }}</text>
                </view>
                <view class="pill pill-other" @click="openCustomInput('style')">
                  <view class="i-carbon-add inline-block" />
                  <text>其他</text>
                </view>
              </view>
              <text v-if="styleError" class="error-msg visible">
                请选择回答风格
              </text>
            </view>

            <!-- 提交按钮 -->
            <button
              class="submit-btn"
              :disabled="isLoading"
              @click="handleSubmit"
            >
              <view class="i-carbon-send inline-block" />
              <text>{{ isLoading ? '正在分析...' : '获取回话建议' }}</text>
            </button>
          </view>
        </view>

        <!-- 聊天面板（覆盖层） -->
        <view v-if="showChatPanel" class="chat-panel">
          <view class="glass-card chat-card">
            <!-- 顶部栏 -->
            <view class="chat-header">
              <view class="back-btn" @click="backToInput">
                <view class="i-carbon-arrow-left inline-block" />
                <text>返回</text>
              </view>
              <view class="chat-header-center">
                <view class="chat-avatar">
                  <view class="i-carbon-bot inline-block" />
                </view>
                <view>
                  <text class="chat-title">回话顾问 AI</text>
                </view>
              </view>
              <view class="clear-btn" @click="clearChat">
                <view class="i-carbon-trash-can inline-block" />
                <text>清空</text>
              </view>
            </view>

            <!-- 聊天区域 -->
            <scroll-view
              class="chat-area"
              scroll-y
              :scroll-top="chatScrollTop"
              scroll-with-animation
            >
              <view class="chat-messages">
                <!-- 空状态 -->
                <view v-if="showEmpty" class="empty-state">
                  <view class="i-carbon-chat empty-icon inline-block" />
                  <text class="empty-title">描述你的社交场景</text>
                  <text class="empty-subtitle">选择对象和风格，获取专业回话建议</text>
                </view>

                <!-- 消息列表 -->
                <template v-for="(msg, index) in messages" :key="index">
                  <!-- 用户消息 -->
                  <view v-if="msg.type === 'user'" class="msg-user-wrapper">
                    <view class="user-bubble">
                      <view class="user-meta">
                        <text class="user-meta-tag">
                          <view class="i-carbon-user inline-block" />
                          {{ msg.role }}
                        </text>
                        <text class="user-meta-sep">|</text>
                        <text class="user-meta-tag">
                          <view class="i-carbon-masks inline-block" />
                          {{ msg.style }}
                        </text>
                      </view>
                      <text class="user-text">{{ msg.scene }}</text>
                    </view>
                  </view>

                  <!-- AI 回复 -->
                  <view v-else-if="msg.type === 'ai' && msg.data" class="msg-ai-wrapper">
                    <view class="ai-avatar">
                      <view class="i-carbon-bot inline-block" />
                    </view>
                    <view class="ai-card">
                      <!-- 场景分析 -->
                      <view class="ai-section">
                        <view class="ai-section-title">
                          <view class="i-carbon-idea inline-block" />
                          <text>场景分析</text>
                        </view>
                        <text class="ai-section-text">{{ msg.data.analysis }}</text>
                      </view>

                      <!-- 回话建议 -->
                      <view class="ai-section">
                        <view class="ai-section-title">
                          <view class="i-carbon-chat inline-block" />
                          <text>回话建议</text>
                          <text class="ai-section-hint">点击即可复制</text>
                        </view>
                        <view
                          v-for="(suggestion, sIndex) in msg.data.suggestions"
                          :key="sIndex"
                          class="suggest-item"
                          @click="copyText(suggestion, sIndex)"
                        >
                          <view class="suggest-num">
                            {{ sIndex + 1 }}
                          </view>
                          <text class="suggest-text">{{ suggestion }}</text>
                          <view class="copy-btn">
                            <view class="i-carbon-copy inline-block" />
                          </view>
                        </view>
                      </view>

                      <!-- 小贴士 -->
                      <view class="ai-tip">
                        <view class="ai-tip-title">
                          <view class="i-carbon-star inline-block" />
                          <text>小贴士</text>
                        </view>
                        <text class="ai-tip-text">{{ msg.data.tip }}</text>
                      </view>
                    </view>
                  </view>
                </template>

                <!-- 打字动画 -->
                <view v-if="isLoading" class="typing-wrapper">
                  <view class="ai-avatar">
                    <view class="i-carbon-bot inline-block" />
                  </view>
                  <view class="typing-dots">
                    <view class="typing-dot" />
                    <view class="typing-dot" />
                    <view class="typing-dot" />
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>
        </view>
      </view>
    </view>

    <!-- Toast -->
    <view class="toast" :class="{ show: toastVisible }">
      <view class="i-carbon-checkmark inline-block" />
      <text>{{ toastText }}</text>
    </view>

    <!-- 自定义输入弹窗 -->
    <view v-if="showCustomInput" class="modal-overlay" @click="cancelCustomInput">
      <view class="modal-card" @click.stop>
        <text class="modal-title">自定义{{ showCustomInput === 'role' ? '交流对象' : '回答风格' }}</text>
        <input
          v-model="customInputText"
          class="modal-input"
          :placeholder="showCustomInput === 'role' ? '如：邻居、老师、网友...' : '如：委婉拒绝、敷衍回应...'"
          :maxlength="20"
          @confirm="confirmCustomInput"
        >
        <view class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="cancelCustomInput">
            取消
          </button>
          <button class="modal-btn modal-btn-confirm" @click="confirmCustomInput">
            确定
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* ===================== 基础变量 ===================== */
.page-container {
  min-height: 100vh;
  background: #060b09;
  color: #e8f5f0;
  position: relative;
  overflow-x: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===================== 背景光斑 ===================== */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.orb-1 {
  width: 650rpx;
  height: 650rpx;
  background: radial-gradient(circle, #00e8a2, transparent);
  top: -220rpx;
  right: -120rpx;
  animation: orbFloat1 26s ease-in-out infinite;
}

.orb-2 {
  width: 420rpx;
  height: 420rpx;
  background: radial-gradient(circle, #00b4d8, transparent);
  bottom: -120rpx;
  left: -80rpx;
  animation: orbFloat2 22s ease-in-out infinite;
}

.orb-3 {
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, #00e8a2, transparent);
  top: 45%;
  left: 38%;
  animation: orbFloat3 30s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(-60rpx, 90rpx);
  }
  66% {
    transform: translate(40rpx, -50rpx);
  }
}

@keyframes orbFloat2 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(70rpx, -60rpx);
  }
  66% {
    transform: translate(-40rpx, 40rpx);
  }
}

@keyframes orbFloat3 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(-50rpx, -70rpx);
  }
  66% {
    transform: translate(60rpx, 50rpx);
  }
}

/* ===================== 主内容 ===================== */
.main-content {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===================== 头部 ===================== */
.header {
  text-align: center;
  padding: 100rpx 32rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.header-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
}

.title-gradient {
  font-size: 48rpx;
  font-weight: 900;
  background: linear-gradient(135deg, #00e8a2, #00b4d8, #00e8a2);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.header-subtitle {
  font-size: 24rpx;
  color: rgba(232, 245, 240, 0.45);
}

/* ===================== 主体布局 ===================== */
.body-content {
  flex: 1;
  padding: 0 32rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ===================== 毛玻璃卡片 ===================== */
.glass-card {
  background: rgba(10, 25, 18, 0.6);
  border: 1px solid rgba(0, 232, 162, 0.1);
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 232, 162, 0.25), transparent);
}

/* ===================== 输入面板 ===================== */
.input-card {
  padding: 32rpx;
}

.section {
  margin-bottom: 28rpx;
}

.section-label {
  font-size: 26rpx;
  font-weight: 600;
  color: rgba(232, 245, 240, 0.45);
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

/* ===================== 文本域 ===================== */
.scene-input {
  width: 100%;
  min-height: 200rpx;
  max-height: 400rpx;
  background: rgba(0, 232, 162, 0.04);
  border: 1px solid rgba(0, 232, 162, 0.1);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  color: #e8f5f0;
  font-size: 28rpx;
  line-height: 1.7;
  box-sizing: border-box;
  transition:
    border-color 0.25s,
    box-shadow 0.25s;
}

.scene-input::placeholder {
  color: rgba(232, 245, 240, 0.25);
}

/* ===================== 快捷标签 ===================== */
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 28rpx;
}

.quick-tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  color: rgba(232, 245, 240, 0.45);
  background: rgba(0, 232, 162, 0.05);
  border: 1px solid rgba(0, 232, 162, 0.08);
  transition: all 0.2s;
}

.quick-tag:active {
  background: rgba(0, 232, 162, 0.12);
  color: #e8f5f0;
}

/* ===================== 药丸选择器 ===================== */
.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  border-radius: 14rpx;
  font-size: 24rpx;
  font-weight: 500;
  background: rgba(0, 232, 162, 0.06);
  border: 1px solid rgba(0, 232, 162, 0.1);
  color: rgba(232, 245, 240, 0.45);
  transition: all 0.25s;
  user-select: none;
  white-space: nowrap;
}

.pill.active {
  background: rgba(0, 232, 162, 0.18);
  border-color: #00e8a2;
  color: #00e8a2;
  box-shadow: 0 0 20rpx rgba(0, 232, 162, 0.1);
}

/* ===================== 提交按钮 ===================== */
.submit-btn {
  width: 100%;
  padding: 20rpx;
  border: none;
  border-radius: 14rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #060b09;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  box-shadow: 0 4rpx 24rpx rgba(0, 232, 162, 0.25);
  transition: all 0.3s;
}

.submit-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 8rpx 32rpx rgba(0, 232, 162, 0.35);
}

.submit-btn:disabled {
  opacity: 0.5;
}

/* ===================== 错误提示 ===================== */
.error-msg {
  color: #ff6b6b;
  font-size: 22rpx;
  margin-top: 8rpx;
  opacity: 0;
  transition: opacity 0.25s;
}

.error-msg.visible {
  opacity: 1;
}

/* ===================== 聊天面板 ===================== */
.chat-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 0 32rpx;
  padding-top: calc(env(safe-area-inset-top) + 100rpx);
  padding-bottom: env(safe-area-inset-bottom);
  background: #060b09;
  display: flex;
  flex-direction: column;
}

.chat-card {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid rgba(0, 232, 162, 0.1);
}

.chat-header-center {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  color: #00e8a2;
  background: rgba(0, 232, 162, 0.06);
  border: 1px solid rgba(0, 232, 162, 0.08);
}

.back-btn:active {
  background: rgba(0, 232, 162, 0.12);
}

.chat-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
  flex-shrink: 0;
}

.chat-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #e8f5f0;
  display: block;
}

.chat-status {
  font-size: 22rpx;
  color: #00e8a2;
  display: block;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  color: rgba(232, 245, 240, 0.45);
  background: rgba(0, 232, 162, 0.06);
  border: 1px solid rgba(0, 232, 162, 0.08);
}

.clear-btn:active {
  background: rgba(0, 232, 162, 0.12);
}

/* ===================== 聊天区域 ===================== */
.chat-area {
  flex: 1;
  overflow-y: auto;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ===================== 空状态 ===================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 96rpx;
  color: rgba(0, 232, 162, 0.15);
  margin-bottom: 32rpx;
}

.empty-title {
  font-size: 28rpx;
  color: rgba(232, 245, 240, 0.45);
  margin-bottom: 12rpx;
  display: block;
}

.empty-subtitle {
  font-size: 24rpx;
  color: rgba(232, 245, 240, 0.25);
  display: block;
}

/* ===================== 用户消息气泡 ===================== */
.msg-user-wrapper {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  max-width: 85%;
  padding: 20rpx 28rpx;
  background: rgba(0, 232, 162, 0.12);
  border: 1px solid rgba(0, 232, 162, 0.15);
  border-radius: 24rpx 24rpx 6rpx 24rpx;
  margin-left: auto;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  font-size: 22rpx;
}

.user-meta-tag {
  color: #00e8a2;
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
}

.user-meta-sep {
  color: rgba(0, 232, 162, 0.3);
}

.user-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #e8f5f0;
  display: block;
  word-break: break-all;
}

/* ===================== AI 回复 ===================== */
.msg-ai-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.ai-card {
  flex: 1;
  padding: 28rpx;
  background: rgba(0, 232, 162, 0.04);
  border: 1px solid rgba(0, 232, 162, 0.08);
  border-radius: 20rpx;
}

.ai-section {
  margin-bottom: 24rpx;
}

.ai-section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #00e8a2;
}

.ai-section-text {
  font-size: 26rpx;
  line-height: 1.7;
  color: rgba(232, 245, 240, 0.6);
  display: block;
}

.ai-section-hint {
  font-size: 22rpx;
  color: rgba(232, 245, 240, 0.2);
  margin-left: auto;
  font-weight: normal;
}

/* ===================== 建议卡片 ===================== */
.suggest-item {
  padding: 20rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(0, 232, 162, 0.04);
  border: 1px solid rgba(0, 232, 162, 0.06);
  margin-bottom: 16rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  position: relative;
  transition: all 0.25s;
}

.suggest-item:active {
  background: rgba(0, 232, 162, 0.1);
  border-color: rgba(0, 232, 162, 0.2);
}

.suggest-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(0, 232, 162, 0.12);
  color: #00e8a2;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.suggest-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: #e8f5f0;
  word-break: break-all;
}

.copy-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 232, 162, 0.1);
  color: #00e8a2;
  font-size: 22rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

/* ===================== 小贴士 ===================== */
.ai-tip {
  padding: 20rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(0, 180, 216, 0.06);
  border: 1px solid rgba(0, 180, 216, 0.1);
}

.ai-tip-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #00b4d8;
}

.ai-tip-text {
  font-size: 22rpx;
  line-height: 1.7;
  color: rgba(232, 245, 240, 0.6);
  display: block;
}

/* ===================== 打字动画 ===================== */
.typing-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 32rpx;
  border-radius: 20rpx;
  background: rgba(0, 232, 162, 0.06);
}

.typing-dot {
  display: inline-block;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #00e8a2;
  animation: typing 1.2s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-12rpx);
  }
}

/* ===================== Toast ===================== */
.toast {
  position: fixed;
  bottom: 80rpx;
  left: 50%;
  transform: translateX(-50%) translateY(160rpx);
  padding: 20rpx 40rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 500;
  background: rgba(0, 232, 162, 0.15);
  border: 1px solid rgba(0, 232, 162, 0.25);
  color: #00e8a2;
  display: flex;
  align-items: center;
  gap: 12rpx;
  transition:
    transform 0.35s ease,
    opacity 0.35s;
  opacity: 0;
  z-index: 100;
  pointer-events: none;
  white-space: nowrap;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* ===================== 其他按钮 ===================== */
.pill-other {
  border-style: dashed;
  color: rgba(232, 245, 240, 0.3);
}

.pill-other:active {
  border-color: #00e8a2;
  color: #00e8a2;
  background: rgba(0, 232, 162, 0.1);
}

/* ===================== 自定义输入弹窗 ===================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  background: rgba(6, 11, 9, 0.75);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.modal-card {
  width: 100%;
  padding: 40rpx 32rpx;
  background: rgba(10, 25, 18, 0.95);
  border: 1px solid rgba(0, 232, 162, 0.15);
  border-radius: 24rpx;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #e8f5f0;
  display: block;
  margin-bottom: 28rpx;
  text-align: center;
}

.modal-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background: rgba(0, 232, 162, 0.05);
  border: 1px solid rgba(0, 232, 162, 0.12);
  border-radius: 14rpx;
  color: #e8f5f0;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 32rpx;
}

.modal-input::placeholder {
  color: rgba(232, 245, 240, 0.25);
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  padding: 14rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.modal-btn-cancel {
  background: rgba(232, 245, 240, 0.06);
  color: rgba(232, 245, 240, 0.45);
  border: 1px solid rgba(232, 245, 240, 0.08);
}

.modal-btn-confirm {
  background: linear-gradient(135deg, #00e8a2, #00b4d8);
  color: #060b09;
}

/* ===================== 响应式 ===================== */
@media (min-width: 1024px) {
  .chat-area {
    max-height: calc(100vh - 240rpx);
  }
}
</style>
