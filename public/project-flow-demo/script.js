const stageDefinitions = [
  {
    id: "context",
    stage: "第一阶段",
    title: "上下文理解与记忆",
    summary:
      "系统接收用户文本、历史对话、推荐结果和订单查询记录，并通过信息抽取与记忆水合形成可供决策使用的上下文快照。",
    theme: "theme-indigo",
    capabilities: ["多源上下文采集", "关键信息提取", "短时记忆水合", "标签分类归档"],
    tech: [
      "前端请求会把 messages、products、orders、steps、metadata 一并回传给后端。",
      "服务端通过 hydrateMemory 遍历历史消息，抽取鞋码、走路强度、场景、需求标签等关键字段。",
      "抽取结果被组装为 MemoryState，再写入 system prompt 供模型理解当前完整语境。",
    ],
    metrics: [
      { value: "4+ 源", label: "上下文来源" },
      { value: "毫秒级", label: "记忆组装" },
      { value: "多轮", label: "会话继承" },
    ],
    scenarios: ["鞋类推荐追问", "订单进度追踪", "低价替代连续咨询"],
    render(node) {
      return `
        <div class="stage-layer active">
          <div class="grid-pattern"></div>
          <div class="context-flow">
            <div class="flow-row columns-3">
              <div class="glass-card">
                <h3>输入采集层</h3>
                <p class="card-caption">${node.canvas.inputText}</p>
                <div class="token-cloud">
                  ${node.canvas.tokens.map((token) => `<span class="token">${token}</span>`).join("")}
                </div>
              </div>
              <div class="glass-card">
                <h3>信息解析层</h3>
                <p class="card-caption">${node.canvas.parseText}</p>
                <div class="memory-grid">
                  ${node.canvas.memoryCards
                    .map(
                      (card) => `
                        <div class="memory-card">
                          <strong>${card.title}</strong>
                          <span>${card.value}</span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
              <div class="glass-card">
                <h3>记忆存储层</h3>
                <p class="card-caption">${node.canvas.storeText}</p>
                <div class="memory-grid">
                  ${node.canvas.storeCards
                    .map(
                      (card) => `
                        <div class="memory-card">
                          <strong>${card.title}</strong>
                          <span>${card.value}</span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
            </div>
            <div class="connector-line"></div>
          </div>
        </div>
      `;
    },
  },
  {
    id: "decision",
    stage: "第二阶段",
    title: "智能决策与工具调用",
    summary:
      "大模型读取带记忆的 system prompt 后，自主判断是否调用工具、是否追问补充信息，形成真实的 function calling 决策闭环。",
    theme: "theme-cyan",
    capabilities: ["Function Calling", "意图规划", "工具触发", "工具结果回灌"],
    tech: [
      "系统向模型传入 tools 定义，包括 query_order_history、recommend_shoes、find_cheaper_shoes。",
      "模型若判断当前消息需要查单或推荐，会返回 tool_calls 而不是直接自然语言。",
      "本地执行工具后，系统把结果以 tool 消息继续喂回模型，由模型生成最终用户可读回复。",
    ],
    metrics: [
      { value: "3 个", label: "核心工具" },
      { value: "≤ 4 轮", label: "工具迭代上限" },
      { value: "自动", label: "追问判定" },
    ],
    scenarios: ["我买过鞋吗？", "推荐一双不磨脚的鞋", "算了，太贵了"],
    render(node) {
      return `
        <div class="stage-layer active">
          <div class="grid-pattern"></div>
          <div class="decision-flow">
            ${node.canvas.toolCards
              .map(
                (card, index) => `
                  <div class="tool-node context-${String.fromCharCode(97 + index)}">
                    <strong>${card.title}</strong>
                    <span>${card.text}</span>
                  </div>
                `
              )
              .join("")}

            <div class="decision-core">
              <div>
                <strong>${node.canvas.coreTitle}</strong>
                <span>${node.canvas.coreText}</span>
              </div>
            </div>

            <div class="decision-connectors">
              <div class="decision-link link-a"></div>
              <div class="decision-link link-b"></div>
              <div class="decision-link link-c"></div>
              <div class="decision-link link-d"></div>
            </div>
          </div>
        </div>
      `;
    },
  },
  {
    id: "result",
    stage: "第三阶段",
    title: "结果整合与多模态展示",
    summary:
      "工具返回的分散结构化结果会与模型生成的自然语言总结合并，最终以前端富文本、商品卡片、订单卡片和可扩展多模态输出统一呈现。",
    theme: "theme-teal",
    capabilities: ["结果聚合", "自然语言总结", "结构化卡片渲染", "多模态输出扩展"],
    tech: [
      "后端统一返回 reply、products、orders、steps、metadata 等结构化字段。",
      "前端用 ReactMarkdown 渲染总结文本，并根据 products / orders 条件挂载商品卡片和订单卡片。",
      "右侧推荐区会同步展示当前推荐商品，后续也可扩展到图像讲解和音频播报通道。",
    ],
    metrics: [
      { value: "1 次返回", label: "统一聚合" },
      { value: "文本 + 卡片", label: "主要输出形态" },
      { value: "响应式", label: "桌面 / 平板适配" },
    ],
    scenarios: ["推荐结果讲解", "订单结果展示", "流程演示与培训讲解"],
    render(node) {
      return `
        <div class="stage-layer active">
          <div class="grid-pattern"></div>
          <div class="result-flow">
            ${node.canvas.sources
              .map(
                (item, index) => `
                  <div class="result-source source-${String.fromCharCode(97 + index)}">
                    <strong>${item.title}</strong>
                    <span>${item.text}</span>
                  </div>
                `
              )
              .join("")}

            <div class="result-hub">
              <div>
                <strong>${node.canvas.hubTitle}</strong>
                <span>${node.canvas.hubText}</span>
              </div>
            </div>

            ${node.canvas.outputs
              .map(
                (item, index) => `
                  <div class="result-output output-${String.fromCharCode(97 + index)}">
                    <strong>${item.title}</strong>
                    <span>${item.text}</span>
                  </div>
                `
              )
              .join("")}

            <div class="result-connectors">
              <div class="result-link a"></div>
              <div class="result-link b"></div>
              <div class="result-link c"></div>
              <div class="result-link d"></div>
              <div class="result-link e"></div>
            </div>
          </div>
        </div>
      `;
    },
  },
];

const demoCases = [
  {
    id: "case-order-history",
    label: "示例 01",
    name: "鞋类购买历史追溯",
    overview: "用户询问“我买过鞋吗？”，系统需检索历史订单并返回可追溯结果。",
    nodes: [
      {
        stageId: "context",
        stateLabel: "上下文已采集",
        owner: { name: "消息聚合器", role: "前端会话层", type: "输入接收" },
        info: [
          { label: "会话编号", value: "CHAT-20260527-001" },
          { label: "用户标识", value: "U10086" },
          { label: "当前请求", value: "我买过鞋吗？" },
          { label: "节点状态", value: "READY_FOR_MEMORY" },
        ],
        fields: [
          "historyMessages: 6 条",
          "keywordHint: 鞋 / 鞋类",
          "lastIntent: order_query",
          "traceableOrderIds: SO202605040227",
        ],
        canvas: {
          inputText: "用户问句、历史订单卡片与上一轮 metadata 一并注入上下文入口。",
          tokens: ["“我买过鞋吗？”", "历史消息", "订单记录", "metadata", "用户ID: U10086"],
          parseText: "系统从用户问题中抽出订单检索意图，并识别出关键词“鞋”。",
          memoryCards: [
            { title: "意图候选", value: "order_query" },
            { title: "检索关键词", value: "鞋 / 鞋类" },
            { title: "最近订单", value: "SO202605040227" },
          ],
          storeText: "上下文被整理为可追溯的 MemoryState，并准备送入模型与工具层。",
          storeCards: [
            { title: "lastInterestCategory", value: "鞋类" },
            { title: "pendingShoeClarification", value: "false" },
            { title: "traceSnapshot", value: "1 笔鞋类订单可追溯" },
          ],
        },
      },
      {
        stageId: "decision",
        stateLabel: "工具调用中",
        owner: { name: "Function Calling Agent", role: "智能决策层", type: "工具编排" },
        info: [
          { label: "工具选择", value: "query_order_history" },
          { label: "处理方式", value: "函数调用" },
          { label: "节点状态", value: "IN_PROGRESS" },
          { label: "执行人", value: "本地订单查询工具" },
        ],
        fields: [
          'tool.arguments: {"keyword":"鞋","limit":5}',
          "modelDecision: 必须先查单再回复",
          "toolResultCount: 1",
          "handler: order-query.ts",
        ],
        canvas: {
          toolCards: [
            { title: "订单查询工具", text: "检索鞋类购买记录、物流状态与订单号。" },
            { title: "工具结果回灌", text: "查询到 1 笔鞋类订单并回传给模型。" },
            { title: "追问分支", text: "本次无需追问，直接进入订单回答生成。" },
            { title: "可追溯校验", text: "保留订单号与状态，确保结果可溯源。" },
          ],
          coreTitle: "模型决策中枢",
          coreText: "读取到“鞋类历史购买”意图后，发起 query_order_history 调用。",
        },
      },
      {
        stageId: "result",
        stateLabel: "结果已输出",
        owner: { name: "结果装配器", role: "前端渲染层", type: "结果整合" },
        info: [
          { label: "输出类型", value: "自然语言 + 订单卡片" },
          { label: "返回状态", value: "COMPLETED" },
          { label: "结果条数", value: "1 笔订单" },
          { label: "展示区域", value: "聊天区 / 订单卡片" },
        ],
        fields: [
          "reply: 已找到 1 笔鞋类相关订单",
          "orderNo: SO202605040227",
          "status: 已签收",
          "renderTarget: MessageBubble + OrderCard",
        ],
        canvas: {
          sources: [
            { title: "自然语言总结", text: "“我帮你查到 1 笔鞋类相关订单，可继续追踪。”" },
            { title: "结构化订单数据", text: "订单号、状态、商品名称和物流事件一并返回。" },
            { title: "展示素材", text: "订单卡片组件与对话富文本统一渲染。" },
          ],
          hubTitle: "标准化输出装配器",
          hubText: "把订单数据与自然语言整合为统一前端协议。",
          outputs: [
            { title: "聊天结果", text: "输出可理解的查单总结，供老师讲解与用户阅读。" },
            { title: "订单卡片", text: "展示订单号、状态、物流时间和商品摘要。" },
          ],
        },
      },
    ],
  },
  {
    id: "case-shoe-recommend",
    label: "示例 02",
    name: "不磨脚鞋款推荐",
    overview: "用户提出鞋类推荐请求，系统先判断信息缺口，再补齐画像后生成推荐。",
    nodes: [
      {
        stageId: "context",
        stateLabel: "上下文已采集",
        owner: { name: "记忆水合器", role: "上下文理解层", type: "画像构建" },
        info: [
          { label: "会话编号", value: "CHAT-20260527-002" },
          { label: "当前请求", value: "推荐一双不磨脚的鞋" },
          { label: "历史补充", value: "38 码 / 通勤 / 走路多" },
          { label: "节点状态", value: "READY_FOR_PROFILE" },
        ],
        fields: [
          "shoeProfile.size: 38",
          "shoeProfile.walkingAmount: high",
          "shoeProfile.scene: 通勤",
          "requirements: 不磨脚 / 缓震",
        ],
        canvas: {
          inputText: "推荐请求与用户画像补充信息被合并进入上下文通道。",
          tokens: ["推荐鞋子", "38 码", "通勤", "走路多", "不磨脚", "缓震"],
          parseText: "系统识别出推荐对象、用户尺码、出行场景和舒适性要求。",
          memoryCards: [
            { title: "用户画像", value: "38 码 / high / 通勤" },
            { title: "需求标签", value: "不磨脚 / 缓震" },
            { title: "最近兴趣", value: "鞋类推荐" },
          ],
          storeText: "画像快照会写入 metadata，供推荐工具直接使用。",
          storeCards: [
            { title: "pendingShoeClarification", value: "false" },
            { title: "shoeProfile", value: "size / walkingAmount / scene" },
            { title: "lastUserGoal", value: "推荐一双不磨脚的鞋" },
          ],
        },
      },
      {
        stageId: "decision",
        stateLabel: "工具调用中",
        owner: { name: "Function Calling Agent", role: "智能推荐层", type: "推荐编排" },
        info: [
          { label: "工具选择", value: "recommend_shoes" },
          { label: "输入画像", value: "38 码 / 通勤 / high" },
          { label: "节点状态", value: "IN_PROGRESS" },
          { label: "处理方式", value: "函数调用 + 本地评分" },
        ],
        fields: [
          'tool.arguments: {"size":"38","walkingAmount":"high","scene":"通勤","requirements":["不磨脚","缓震"]}',
          "candidatePool: 鞋类商品 5 双",
          "rankingLogic: tag + scene + price score",
          "handler: recommendShoes",
        ],
        canvas: {
          toolCards: [
            { title: "鞋类推荐工具", text: "根据尺码、场景和需求标签对鞋款进行评分。" },
            { title: "候选集过滤", text: "只保留鞋类商品，并按价格和标签重排。" },
            { title: "追问补全分支", text: "本次画像已完整，因此不再追问用户。" },
            { title: "结果回灌", text: "将 Top 3 推荐结果回传给模型生成摘要。" },
          ],
          coreTitle: "模型决策中枢",
          coreText: "当前信息已经足够，直接触发 recommend_shoes 输出推荐结果。",
        },
      },
      {
        stageId: "result",
        stateLabel: "结果已输出",
        owner: { name: "多模态装配器", role: "前端输出层", type: "卡片渲染" },
        info: [
          { label: "输出类型", value: "总结文本 + 商品卡片" },
          { label: "返回状态", value: "COMPLETED" },
          { label: "推荐数量", value: "3 双鞋" },
          { label: "展示区域", value: "聊天区 / 右侧推荐区" },
        ],
        fields: [
          "reply: 结合 38 码、通勤、久走场景推荐 3 双鞋",
          "products: p11 / p12 / p13",
          "renderTarget: MessageBubble + ProductCard",
          "sidePanelSync: true",
        ],
        canvas: {
          sources: [
            { title: "自然语言总结", text: "“结合你的尺码和通勤场景，我优先挑了更不磨脚的鞋款。”" },
            { title: "推荐商品结果", text: "返回商品 ID、标题、价格、图片和标签。" },
            { title: "展示素材", text: "商品卡片、侧边推荐栏和执行轨迹同步刷新。" },
          ],
          hubTitle: "标准化输出装配器",
          hubText: "将推荐商品列表与解释文本打包成统一展示结果。",
          outputs: [
            { title: "聊天气泡富文本", text: "先给出推荐逻辑，再展示具体鞋款。" },
            { title: "商品卡片", text: "支持图片、价格、收藏与加入购物车交互。" },
          ],
        },
      },
    ],
  },
  {
    id: "case-cheaper",
    label: "示例 03",
    name: "低价替代商品检索",
    overview: "用户觉得上一轮推荐太贵，系统基于保留的画像与历史商品找到更低价替代款。",
    nodes: [
      {
        stageId: "context",
        stateLabel: "上下文已采集",
        owner: { name: "会话追踪器", role: "上下文记忆层", type: "历史继承" },
        info: [
          { label: "当前请求", value: "算了，太贵了" },
          { label: "上轮主推", value: "轻盈通勤休闲鞋 ¥399" },
          { label: "保留需求", value: "不磨脚 / 通勤 / 38 码" },
          { label: "节点状态", value: "READY_FOR_ALTERNATIVE" },
        ],
        fields: [
          "lastRecommendedProducts: p11",
          "baselinePrice: 399",
          "lastInterestCategory: 鞋类",
          "requirements: 不磨脚 / 通勤",
        ],
        canvas: {
          inputText: "本轮输入很短，但系统会结合上一轮推荐商品与已保存的画像一起理解。",
          tokens: ["“太贵了”", "上一轮推荐", "¥399", "不磨脚", "通勤", "38 码"],
          parseText: "系统识别出这是对上一轮推荐的价格反馈，而不是新的独立需求。",
          memoryCards: [
            { title: "价格锚点", value: "¥399" },
            { title: "继承画像", value: "38 码 / 通勤 / 不磨脚" },
            { title: "当前意图", value: "低价替代" },
          ],
          storeText: "系统保留上一轮推荐商品主键，后续用作替代检索基准。",
          storeCards: [
            { title: "baselineProduct", value: "轻盈通勤休闲鞋" },
            { title: "baselinePrice", value: "399" },
            { title: "fallbackNeeded", value: "false" },
          ],
        },
      },
      {
        stageId: "decision",
        stateLabel: "工具调用中",
        owner: { name: "Function Calling Agent", role: "替代推荐层", type: "价格策略" },
        info: [
          { label: "工具选择", value: "find_cheaper_shoes" },
          { label: "检索条件", value: "price < 399" },
          { label: "节点状态", value: "IN_PROGRESS" },
          { label: "处理方式", value: "相似度 + 价格过滤" },
        ],
        fields: [
          'tool.arguments: {"maxPrice":399,"scene":"通勤","requirements":["不磨脚"]}',
          "baselineTags: 鞋类 / 通勤 / 不磨脚",
          "resultLimit: 3",
          "handler: findCheaperAlternatives",
        ],
        canvas: {
          toolCards: [
            { title: "低价替代工具", text: "围绕上一轮鞋款画像，筛选价格更低的同类商品。" },
            { title: "相似标签匹配", text: "比较场景、舒适度和基础功能要求是否保持一致。" },
            { title: "价格过滤", text: "只保留价格低于 ¥399 的商品作为候选。" },
            { title: "结果回灌", text: "把低价备选列表回传给模型生成解释说明。" },
          ],
          coreTitle: "模型决策中枢",
          coreText: "识别到价格反馈后，自动触发更低价替代检索链路。",
        },
      },
      {
        stageId: "result",
        stateLabel: "结果已输出",
        owner: { name: "推荐展示器", role: "前端结果层", type: "替代商品展示" },
        info: [
          { label: "输出类型", value: "替代解释 + 商品卡片" },
          { label: "返回状态", value: "COMPLETED" },
          { label: "替代数量", value: "2 双鞋" },
          { label: "价格结果", value: "¥299 / ¥359" },
        ],
        fields: [
          "reply: 已筛出更低价且保留通勤舒适特性的鞋款",
          "products: p13 / p12",
          "priceDelta: -100 ~ -40",
          "renderTarget: 推荐区同步更新",
        ],
        canvas: {
          sources: [
            { title: "自然语言总结", text: "“我帮你筛了更低价但仍适合通勤久走的替代鞋款。”" },
            { title: "替代商品结果", text: "返回价格更低的候选鞋款，并保留标签说明。" },
            { title: "展示素材", text: "聊天区说明 + 商品卡片 + 价格对比信息。" },
          ],
          hubTitle: "标准化输出装配器",
          hubText: "将价格替代逻辑与商品卡片统一整合输出。",
          outputs: [
            { title: "价格替代说明", text: "清晰解释为何这些鞋款更便宜且仍满足要求。" },
            { title: "替代商品卡片", text: "帮助用户继续比较并做选择。" },
          ],
        },
      },
    ],
  },
  {
    id: "case-order-status",
    label: "示例 04",
    name: "订单发货进度追踪",
    overview: "用户询问“我买的东西发货了吗？”，系统结合订单状态和物流节点返回阶段性答复。",
    nodes: [
      {
        stageId: "context",
        stateLabel: "上下文已采集",
        owner: { name: "消息聚合器", role: "前端会话层", type: "订单追踪" },
        info: [
          { label: "当前请求", value: "我买的东西发货了吗？" },
          { label: "历史订单池", value: "最近 6 笔订单" },
          { label: "状态线索", value: "待发货 / 已发货 / 运输中" },
          { label: "节点状态", value: "READY_FOR_STATUS_CHECK" },
        ],
        fields: [
          "statusHint: processing / shipped / in_transit",
          "recentWindow: 30 天",
          "messageCount: 5",
          "traceMode: shipping_progress",
        ],
        canvas: {
          inputText: "系统同时读取用户问句、最近订单列表和可用物流状态标签。",
          tokens: ["发货了吗", "最近订单", "待发货", "已发货", "运输中", "物流节点"],
          parseText: "系统识别出用户关注的并不是商品，而是订单履约进度。",
          memoryCards: [
            { title: "订单范围", value: "最近 30 天" },
            { title: "状态候选", value: "待发货 / 已发货 / 运输中" },
            { title: "查询目标", value: "物流进度追踪" },
          ],
          storeText: "相关状态过滤器被写入查询上下文，等待工具层执行。",
          storeCards: [
            { title: "dateWindow", value: "最近 30 天" },
            { title: "statuses", value: "processing / shipped / in_transit" },
            { title: "trackingSnapshot", value: "多笔订单待过滤" },
          ],
        },
      },
      {
        stageId: "decision",
        stateLabel: "工具调用中",
        owner: { name: "Function Calling Agent", role: "履约决策层", type: "订单筛选" },
        info: [
          { label: "工具选择", value: "query_order_history" },
          { label: "查询条件", value: "发货相关状态过滤" },
          { label: "节点状态", value: "IN_PROGRESS" },
          { label: "处理方式", value: "状态筛选 + 限量返回" },
        ],
        fields: [
          'tool.arguments: {"statuses":["processing","shipped","in_transit"],"limit":3}',
          "toolResultCount: 3",
          "summaryMode: shipping_status",
          "handler: queryOrders",
        ],
        canvas: {
          toolCards: [
            { title: "订单查询工具", text: "使用发货相关状态过滤最近订单。" },
            { title: "状态归并", text: "对待发货、已发货、运输中订单做统一摘要。" },
            { title: "结果裁剪", text: "只展示最相关的 3 笔订单供前端演示。" },
            { title: "回灌模型", text: "将状态结果回喂给模型生成自然语言说明。" },
          ],
          coreTitle: "模型决策中枢",
          coreText: "识别到“发货了吗”属于订单履约查询，转入 query_order_history。",
        },
      },
      {
        stageId: "result",
        stateLabel: "结果已输出",
        owner: { name: "订单展示器", role: "前端结果层", type: "状态呈现" },
        info: [
          { label: "输出类型", value: "履约总结 + 订单卡片" },
          { label: "返回状态", value: "COMPLETED" },
          { label: "结果条数", value: "3 笔订单" },
          { label: "重点信息", value: "待发货 / 已发货 / 运输中" },
        ],
        fields: [
          "reply: 已为你找到 3 笔发货相关订单",
          "orders: SO202605180019 / SO202605160105 / SO202605120033",
          "renderTarget: MessageBubble + OrderCard",
          "trackingInfo: 最新物流节点已展示",
        ],
        canvas: {
          sources: [
            { title: "自然语言总结", text: "“帮你找到 3 笔发货相关订单，包含待发货、已发货和运输中状态。”" },
            { title: "结构化订单结果", text: "订单号、状态和最新物流节点被统一装配。" },
            { title: "展示素材", text: "订单卡片保留状态追踪，支持演示讲解。" },
          ],
          hubTitle: "标准化输出装配器",
          hubText: "将物流状态与订单卡片统一输出，帮助用户快速理解履约进度。",
          outputs: [
            { title: "履约总结", text: "用户先看到总体发货情况，再查看各订单细节。" },
            { title: "订单卡片", text: "分笔展示状态和节点，便于流程追溯。" },
          ],
        },
      },
    ],
  },
];

const state = {
  currentScenarioIndex: 0,
  currentStepIndex: 0,
};

const timelineEl = document.getElementById("timeline");
const scenarioTabsEl = document.getElementById("scenarioTabs");
const stageCanvasEl = document.getElementById("stageCanvas");
const storyTitleEl = document.getElementById("storyTitle");
const storySummaryEl = document.getElementById("storySummary");
const progressPillEl = document.getElementById("progressPill");
const statusRingFillEl = document.getElementById("statusRingFill");
const statusCaptionEl = document.getElementById("statusCaption");
const capabilityTagsEl = document.getElementById("capabilityTags");
const techListEl = document.getElementById("techList");
const metricsGridEl = document.getElementById("metricsGrid");
const scenarioListEl = document.getElementById("scenarioList");
const nodeCounterEl = document.getElementById("nodeCounter");
const businessInfoGridEl = document.getElementById("businessInfoGrid");
const ownerCardEl = document.getElementById("ownerCard");
const fieldListEl = document.getElementById("fieldList");
const prevBtnEl = document.getElementById("prevBtn");
const nextBtnEl = document.getElementById("nextBtn");
const resetBtnEl = document.getElementById("resetBtn");
const completionModalEl = document.getElementById("completionModal");
const completionTitleEl = document.getElementById("completionTitle");
const completionSummaryEl = document.getElementById("completionSummary");
const completionPrevScenarioBtnEl = document.getElementById("completionPrevScenarioBtn");
const completionResetBtnEl = document.getElementById("completionResetBtn");

function getCurrentScenario() {
  return demoCases[state.currentScenarioIndex];
}

function getCurrentNode() {
  return getCurrentScenario().nodes[state.currentStepIndex];
}

function triggerStageTransition() {
  stageCanvasEl.classList.remove("stage-advance");
  window.requestAnimationFrame(() => {
    stageCanvasEl.classList.add("stage-advance");
  });
}

function hideCompletionModal() {
  completionModalEl.classList.remove("visible");
  completionModalEl.setAttribute("aria-hidden", "true");
}

function showCompletionModal() {
  const scenario = getCurrentScenario();
  completionTitleEl.textContent = `${scenario.name}演示完成`;
  completionSummaryEl.textContent = `当前案例已完成全部 ${scenario.nodes.length} 个业务节点演示。您可以重新演示当前案例，或切换到下一个业务示例继续讲解。`;
  completionModalEl.classList.add("visible");
  completionModalEl.setAttribute("aria-hidden", "false");
}

function renderScenarioTabs() {
  scenarioTabsEl.innerHTML = demoCases
    .map(
      (scenario, index) => `
        <button
          type="button"
          class="scenario-tab ${index === state.currentScenarioIndex ? "active" : ""}"
          data-scenario-index="${index}"
        >
          <span>${scenario.label}</span>
          <strong>${scenario.name}</strong>
        </button>
      `
    )
    .join("");

  document.querySelectorAll("[data-scenario-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentScenarioIndex = Number(button.getAttribute("data-scenario-index"));
      state.currentStepIndex = 0;
      hideCompletionModal();
      triggerStageTransition();
      render();
    });
  });
}

function getTimelineStatus(index) {
  if (index < state.currentStepIndex) {
    return "completed";
  }
  if (index === state.currentStepIndex) {
    return "active";
  }
  return "pending";
}

function renderTimeline() {
  const scenario = getCurrentScenario();
  timelineEl.innerHTML = scenario.nodes
    .map((node, index) => {
      const definition = stageDefinitions.find((item) => item.id === node.stageId);
      const status = getTimelineStatus(index);
      const statusLabel =
        status === "completed" ? "已完成" : status === "active" ? "当前节点" : "待执行";

      return `
        <button
          type="button"
          class="timeline-item timeline-${status} ${status === "active" ? definition.theme : ""}"
          data-stage-index="${index}"
        >
          <span class="timeline-stage">${definition.stage}</span>
          <span class="timeline-title">${definition.title}</span>
          <span class="timeline-desc">${node.stateLabel}</span>
          <span class="timeline-status-badge">${statusLabel}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll("[data-stage-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentStepIndex = Number(button.getAttribute("data-stage-index"));
      hideCompletionModal();
      triggerStageTransition();
      render();
    });
  });
}

function renderDetailPanel(definition) {
  capabilityTagsEl.innerHTML = definition.capabilities.map((item) => `<span>${item}</span>`).join("");
  techListEl.innerHTML = definition.tech.map((item) => `<li>${item}</li>`).join("");
  metricsGridEl.innerHTML = definition.metrics
    .map(
      (item) => `
        <div class="metric-card">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </div>
      `
    )
    .join("");
  scenarioListEl.innerHTML = definition.scenarios.map((item) => `<li>${item}</li>`).join("");
}

function renderBusinessPanel(node) {
  businessInfoGridEl.innerHTML = node.info
    .map(
      (item) => `
        <div class="business-info-card">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `
    )
    .join("");

  ownerCardEl.innerHTML = `
    <div class="owner-meta">
      <span class="owner-role">${node.owner.type}</span>
      <strong>${node.owner.name}</strong>
      <p>${node.owner.role}</p>
    </div>
  `;

  fieldListEl.innerHTML = node.fields.map((item) => `<li>${item}</li>`).join("");
}

function render() {
  const scenario = getCurrentScenario();
  const node = getCurrentNode();
  const definition = stageDefinitions.find((item) => item.id === node.stageId);
  const progress = Math.round(((state.currentStepIndex + 1) / scenario.nodes.length) * 100);

  renderScenarioTabs();
  renderTimeline();
  stageCanvasEl.innerHTML = definition.render(node);
  storyTitleEl.textContent = `${scenario.name} · ${definition.title}`;
  storySummaryEl.textContent = `${scenario.overview} 当前展示：${node.stateLabel}。`;
  progressPillEl.textContent = `${scenario.label} / ${definition.stage}`;
  statusRingFillEl.textContent = `${progress}%`;
  statusCaptionEl.textContent = `${node.stateLabel} · ${node.owner.name}`;
  nodeCounterEl.textContent = `节点 ${state.currentStepIndex + 1} / ${scenario.nodes.length}`;
  renderDetailPanel(definition);
  renderBusinessPanel(node);

  prevBtnEl.disabled = state.currentStepIndex === 0;
  nextBtnEl.textContent =
    state.currentStepIndex === scenario.nodes.length - 1 ? "完成本案例演示" : "点击推进到下一节点";
}

function nextStep() {
  const scenario = getCurrentScenario();
  if (state.currentStepIndex === scenario.nodes.length - 1) {
    showCompletionModal();
    return;
  }

  state.currentStepIndex += 1;
  hideCompletionModal();
  triggerStageTransition();
  render();
}

function prevStep() {
  if (state.currentStepIndex === 0) {
    return;
  }
  state.currentStepIndex -= 1;
  hideCompletionModal();
  triggerStageTransition();
  render();
}

function resetScenario() {
  state.currentStepIndex = 0;
  hideCompletionModal();
  triggerStageTransition();
  render();
}

function goToNextScenario() {
  state.currentScenarioIndex = (state.currentScenarioIndex + 1) % demoCases.length;
  state.currentStepIndex = 0;
  hideCompletionModal();
  triggerStageTransition();
  render();
}

nextBtnEl.addEventListener("click", nextStep);
prevBtnEl.addEventListener("click", prevStep);
resetBtnEl.addEventListener("click", resetScenario);
stageCanvasEl.addEventListener("click", () => {
  if (!completionModalEl.classList.contains("visible")) {
    nextStep();
  }
});
stageCanvasEl.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && !completionModalEl.classList.contains("visible")) {
    event.preventDefault();
    nextStep();
  }
});
completionResetBtnEl.addEventListener("click", resetScenario);
completionPrevScenarioBtnEl.addEventListener("click", goToNextScenario);
completionModalEl.addEventListener("click", (event) => {
  if (event.target === completionModalEl) {
    hideCompletionModal();
  }
});

render();
