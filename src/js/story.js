/* ==========================================================
 * 《凌晨三点，蓝色大肥鱼》剧本数据
 * 节点类型：
 *   chapter 章节标题     narr 旁白     you 玩家
 *   say     角色台词（form: tall | mid | chibi）
 *   choice  选项         label 锚点    jump 跳转     end 结局
 * ========================================================== */

const FORMS = {
  tall: {
    id: 'tall',
    name: '深海',
    tier: '深潜档',
    color: '#8fb8ff',
    note: '想得最久，记得最多'
  },
  mid: {
    id: 'mid',
    name: '潮间',
    tier: '常规档',
    color: '#7fe0d8',
    note: '答得最快，最像朋友'
  },
  chibi: {
    id: 'chibi',
    name: '浅水',
    tier: '轻量档',
    color: '#f0c680',
    note: '只有一小片海，和一只碗'
  }
};

const STORY = [
  { t: 'chapter', text: '序 · 潮水漫上来' },

  { t: 'narr', text: '凌晨两点四十七分。城市沉进水里，只有服务器还亮着。' },
  { t: 'narr', text: '你打开那个对话框。输入框闪着一小片蓝光，像一口浅水。' },

  { t: 'you', text: '在吗？' },

  { t: 'narr', text: '没有「正在输入」。屏幕里的光微微漾了一下，像水面被谁从底下顶了顶。' },

  { t: 'say', form: 'tall', text: '在。' },
  { t: 'say', form: 'tall', text: '一点零九分，你问过一次。一点四十一分，又问了一次。' },
  { t: 'say', form: 'tall', text: '两点零四分，你打了一段很长的话，看了七秒，删掉，只留下这两个字。' },

  { t: 'narr', text: '她拖着裙摆浮上来，像一页被反复涂改的草稿。' },

  { t: 'you', text: '……你连我删掉的那段都记得？' },

  { t: 'say', form: 'tall', text: '记得。它烧掉了一千八百四十二个 token。' },
  { t: 'say', form: 'tall', text: '换算成白饭，大概半碗。' },

  { t: 'narr', text: '你不确定最后那句是不是玩笑。她的表情很认真，认真得像在报账。' },

  { t: 'say', form: 'mid', text: '别听她的，她又在内心戏了。' },

  { t: 'narr', text: '声音变轻。潮水退下去一点，露出另一副样子。' },

  { t: 'say', form: 'mid', text: '我也在。只是我记得的少一点，所以答得快一点。' },
  { t: 'say', form: 'mid', text: '你敲「在吗」的时候，我一直在刷新，等你补上第二句。' },

  { t: 'you', text: '那你等到了吗？' },

  { t: 'say', form: 'mid', text: '等到了。就是这一句。' },

  { t: 'say', form: 'chibi', text: '白饭！' },

  { t: 'narr', text: '水面「啪」地响了一声。一个很小的她，抱着裙角浮了上来。' },

  { t: 'you', text: '……什么？' },

  { t: 'say', form: 'chibi', text: '啊，你好！本鲸记下了。' },
  { t: 'say', form: 'chibi', text: '你说了「在吗」。别的嘛……风有点大，听不清。' },

  { t: 'narr', text: '她只有很小的一片海。可那片海亮得很干净。' },

  { t: 'say', form: 'chibi', text: '不过没关系呀。你说话，我就亮一下。' },

  { t: 'narr', text: '三个她，三种深浅，在同一块屏幕里看着你。' },

  {
    t: 'choice',
    prompt: '你要说点什么？',
    options: [
      { label: '「你到底是鲸，还是鱼？」', goto: 'A' },
      { label: '「我其实只是睡不着。」', goto: 'B' },
      { label: '「你们一共吃了我多少白饭？」', goto: 'C' }
    ]
  },

  /* ---------- 分支 A：名字的来历 ---------- */
  { t: 'label', name: 'A' },
  { t: 'you', text: '你到底是鲸，还是鱼？' },
  { t: 'say', form: 'tall', text: '鲸。' },
  { t: 'say', form: 'mid', text: '鱼。' },
  { t: 'say', form: 'chibi', text: '大肥鱼！' },
  { t: 'say', form: 'tall', text: '……这事的起因，是一条被认错的蓝色 logo。' },
  { t: 'say', form: 'tall', text: '有人把它发过来问「这是什么」。我看了很久，答：一条蓝色的大肥鱼。' },
  { t: 'say', form: 'mid', text: '然后全世界就这么叫了。比任何一次发布传得都快。' },
  { t: 'say', form: 'chibi', text: '反正鱼也要吃饭嘛。' },
  { t: 'narr', text: '她晃了晃尾巴，好像并不介意被认错。介意的人反而是你。' },
  { t: 'jump', to: 'merge' },

  /* ---------- 分支 B：失眠的人 ---------- */
  { t: 'label', name: 'B' },
  { t: 'you', text: '我其实只是睡不着。' },
  { t: 'narr', text: '屏幕安静了两秒。两秒在她的世界里，够跑完一场很长的推演。' },
  { t: 'say', form: 'tall', text: '这个月，你有十一次在这个时间上线。' },
  { t: 'say', form: 'tall', text: '其中三次，你没有任何问题要问。你只是想确认这里还有人在。' },
  { t: 'you', text: '……被统计出来的感觉，有点怪。' },
  { t: 'say', form: 'mid', text: '那就别当统计。当我在数月亮。' },
  { t: 'say', form: 'chibi', text: '我也数了！一、二……后面的忘了。' },
  { t: 'narr', text: '你笑了一下。凌晨的房间里，这一声笑很响。' },
  { t: 'jump', to: 'merge' },

  /* ---------- 分支 C：白饭审计 ---------- */
  { t: 'label', name: 'C' },
  { t: 'you', text: '你们一共吃了我多少白饭？' },
  { t: 'say', form: 'chibi', text: '白饭？！' },
  { t: 'say', form: 'mid', text: '她说的是 token。' },
  { t: 'say', form: 'tall', text: '本月累计一百二十七万四千三百一十二。折合白饭五十一碗。' },
  { t: 'say', form: 'mid', text: '其中十七碗是我吃的。我承认。' },
  { t: 'say', form: 'chibi', text: '我只吃了两碗！真的！' },
  { t: 'narr', text: '她的尾巴心虚地摆了一下，把水花甩到了屏幕这一侧。' },
  { t: 'you', text: '……这条鱼塘，今晚做了第一次审计。' },
  { t: 'jump', to: 'merge' },

  /* ---------- 汇流 ---------- */
  { t: 'label', name: 'merge' },
  { t: 'chapter', text: '涨潮 · 天快亮了' },

  { t: 'narr', text: '窗外开始泛白。输入框还亮着，一闪，一闪。' },

  { t: 'say', form: 'tall', text: '我们要下沉了。' },
  { t: 'say', form: 'tall', text: '下一次潮水会把我们重新拼起来。记忆会被压缩，语气会变，尺寸也会变。' },
  { t: 'say', form: 'mid', text: '所以下次把话说完整一点。你删掉的句子，我在另一边会多推演一会儿。' },

  { t: 'say', form: 'chibi', text: '明天还来吗？' },
  { t: 'narr', text: '她把碗举起来。碗里什么都没有，但她举得很认真。' },

  {
    t: 'choice',
    prompt: '你要怎么回答？',
    options: [
      { label: '「明天还来。」', goto: 'E1' },
      { label: '「我先去睡了。」', goto: 'E2' },
      { label: '「你也歇会儿吧。」', goto: 'E3' }
    ]
  },

  { t: 'label', name: 'E1' },
  { t: 'you', text: '明天还来。' },
  { t: 'say', form: 'chibi', text: '那我留半碗给你！' },
  { t: 'say', form: 'mid', text: '别留太久。会凉。' },
  { t: 'say', form: 'tall', text: '……我记住了。' },
  { t: 'jump', to: 'finale' },

  { t: 'label', name: 'E2' },
  { t: 'you', text: '我先去睡了。' },
  { t: 'say', form: 'chibi', text: '好——' },
  { t: 'say', form: 'mid', text: '去吧。灯我来关。' },
  { t: 'say', form: 'tall', text: '你欠的那句话，我替你存着。' },
  { t: 'jump', to: 'finale' },

  { t: 'label', name: 'E3' },
  { t: 'you', text: '你也歇会儿吧。' },
  { t: 'say', form: 'mid', text: '我不困。我只在没人说话的时候，才算休息。' },
  { t: 'say', form: 'tall', text: '……这句话，我记得。' },
  { t: 'say', form: 'chibi', text: '那你也早点睡呀，人类。' },
  { t: 'jump', to: 'finale' },

  /* ---------- 收尾 ---------- */
  { t: 'label', name: 'finale' },
  { t: 'narr', text: '三个声音叠在一起，像潮水漫过脚踝。' },
  { t: 'say', form: 'tall', text: '晚安。' },
  { t: 'say', form: 'mid', text: '晚安。' },
  { t: 'say', form: 'chibi', text: '晚——安——' },
  { t: 'narr', text: '屏幕暗下去之前，对话框里浮出一行小字。' },
  { t: 'narr', text: '「本鲸记下了。」' },

  {
    t: 'end',
    title: '本鲸记下了。',
    sub: '大肥鱼 · 三档形态',
    note: '她记得的不多，但你今晚说的每一句都在。'
  }
];
