import { queryOrders } from '@/lib/order-query';
import { products } from '@/lib/products';
import type {
  AgentStep,
  AssistantIntent,
  ChatMessageInput,
  ChatResponse,
  Order,
  Product,
  ShoeProfile,
} from '@/lib/types';
import { formatCurrency, normalizeSearchText } from '@/lib/utils';

interface AgentMemory {
  shoeProfile: ShoeProfile;
  pendingShoeClarification: boolean;
  lastRecommendedProducts: Product[];
  lastInterestCategory?: string;
  lastUserGoal?: string;
}

function createStep(id: string, title: string, detail: string, status: AgentStep['status'] = 'completed'): AgentStep {
  return { id, title, detail, status };
}

function getLatestUserMessage(messages: ChatMessageInput[]) {
  return [...messages].reverse().find((message) => message.role === 'user');
}

function extractSize(text: string) {
  const match = text.match(/(3[4-9]|4[0-6])\s*码/);
  return match?.[1];
}

function extractWalkingAmount(text: string): ShoeProfile['walkingAmount'] {
  if (/走路多|走很多|久站|暴走|通勤远|每天走/.test(text)) {
    return 'high';
  }

  if (/偶尔走|开车为主|走路少/.test(text)) {
    return 'low';
  }

  if (/通勤|日常|散步|逛街|旅行|慢跑/.test(text)) {
    return 'medium';
  }

  return undefined;
}

function extractScene(text: string) {
  const candidates = ['通勤', '跑步', '健走', '慢跑', '旅行', '逛街', '久站', '训练', '日常'];
  return candidates.find((candidate) => text.includes(candidate));
}

function extractRequirements(text: string) {
  const requirements = ['不磨脚', '缓震', '透气', '轻便', '支撑', '耐磨', '宽楦', '平价'];
  return requirements.filter((requirement) => text.includes(requirement));
}

function mergeUnique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function hydrateMemory(messages: ChatMessageInput[]): AgentMemory {
  const memory: AgentMemory = {
    shoeProfile: {},
    pendingShoeClarification: false,
    lastRecommendedProducts: [],
  };

  messages.forEach((message) => {
    if (message.role === 'assistant' && message.metadata) {
      memory.pendingShoeClarification =
        message.metadata.pendingShoeClarification ?? memory.pendingShoeClarification;
      memory.shoeProfile = {
        ...memory.shoeProfile,
        ...message.metadata.shoeProfile,
        requirements: mergeUnique([
          ...(memory.shoeProfile.requirements ?? []),
          ...(message.metadata.shoeProfile?.requirements ?? []),
        ]),
      };
      memory.lastInterestCategory = message.metadata.lastInterestCategory ?? memory.lastInterestCategory;
      memory.lastUserGoal = message.metadata.lastUserGoal ?? memory.lastUserGoal;
      if (message.products?.length) {
        memory.lastRecommendedProducts = message.products;
      }
    }

    if (message.role === 'user') {
      const size = extractSize(message.content);
      const walkingAmount = extractWalkingAmount(message.content);
      const scene = extractScene(message.content);
      const requirements = extractRequirements(message.content);

      if (size) {
        memory.shoeProfile.size = size;
      }
      if (walkingAmount) {
        memory.shoeProfile.walkingAmount = walkingAmount;
      }
      if (scene) {
        memory.shoeProfile.scene = scene;
      }
      if (requirements.length) {
        memory.shoeProfile.requirements = mergeUnique([
          ...(memory.shoeProfile.requirements ?? []),
          ...requirements,
        ]);
      }
      if (/鞋/.test(message.content)) {
        memory.lastInterestCategory = '鞋类';
        memory.lastUserGoal = message.content;
      }
    }
  });

  return memory;
}

function detectIntent(messages: ChatMessageInput[], memory: AgentMemory): AssistantIntent | 'clarify_shoe' | 'cheaper_alternative' {
  const latestContent = getLatestUserMessage(messages)?.content ?? '';

  if (/太贵了|贵了点|便宜点|更便宜|低价|平价/.test(latestContent) && memory.lastInterestCategory === '鞋类') {
    return 'cheaper_alternative';
  }

  if (
    /买过.*鞋|鞋.*买过|鞋子.*订单|鞋.*发货|鞋.*到哪|鞋.*签收|鞋.*物流/.test(latestContent)
  ) {
    return 'order_query';
  }

  if (/推荐.*鞋|鞋.*推荐|不磨脚.*鞋|鞋子/.test(latestContent) || memory.pendingShoeClarification) {
    const hasProfile = Boolean(memory.shoeProfile.size && memory.shoeProfile.walkingAmount);
    return hasProfile ? 'product_recommendation' : 'clarify_shoe';
  }

  return 'other';
}

function scoreShoe(product: Product, memory: AgentMemory) {
  if (product.category !== '鞋类') {
    return -1;
  }

  let score = 0;
  const joinedText = normalizeSearchText([
    product.name,
    product.description,
    ...(product.tags ?? []),
    ...(product.scenes ?? []),
  ].join(' '));

  if (memory.shoeProfile.requirements?.includes('不磨脚') && joinedText.includes(normalizeSearchText('不磨脚'))) {
    score += 4;
  }

  if (memory.shoeProfile.scene) {
    if (joinedText.includes(normalizeSearchText(memory.shoeProfile.scene))) {
      score += 3;
    }
    if (
      memory.shoeProfile.scene === '通勤' &&
      /(通勤|步行|日常|久站)/.test([...(product.scenes ?? []), ...(product.tags ?? [])].join(' '))
    ) {
      score += 2;
    }
  }

  if (memory.shoeProfile.walkingAmount === 'high' && /(缓震|支撑|耐磨|健走|久站)/.test(product.description + (product.tags ?? []).join(' '))) {
    score += 3;
  }

  if (memory.shoeProfile.walkingAmount === 'medium' && /(轻便|通勤|日常)/.test(product.description + (product.tags ?? []).join(' '))) {
    score += 2;
  }

  if (product.price <= 500) {
    score += 1;
  }

  return score;
}

function recommendShoes(memory: AgentMemory, limit = 3) {
  return products
    .filter((product) => product.category === '鞋类')
    .map((product) => ({ product, score: scoreShoe(product, memory) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.product.price - right.product.price;
    })
    .slice(0, limit)
    .map((entry) => entry.product);
}

function findCheaperAlternatives(memory: AgentMemory) {
  const baselineProduct = memory.lastRecommendedProducts[0];
  const baselinePrice = baselineProduct?.price ?? 699;
  const baselineTags = new Set([
    ...(baselineProduct?.tags ?? []),
    ...(memory.shoeProfile.requirements ?? []),
    ...(memory.shoeProfile.scene ? [memory.shoeProfile.scene] : []),
  ]);

  return products
    .filter((product) => product.category === '鞋类' && product.price < baselinePrice)
    .map((product) => {
      const overlap = [...baselineTags].filter((tag) =>
        normalizeSearchText([product.name, product.description, ...(product.tags ?? []), ...(product.scenes ?? [])].join(' '))
          .includes(normalizeSearchText(tag))
      ).length;
      return { product, score: overlap };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.product.price - right.product.price;
    })
    .slice(0, 3)
    .map((entry) => entry.product);
}

function buildOrderAnswer(orders: Order[]) {
  if (orders.length === 0) {
    return '我帮你查了历史订单，目前没有找到鞋类购买记录。';
  }

  return `我帮你查到 ${orders.length} 笔鞋类相关订单：${orders
    .map((order) => `${order.orderNo}（${order.items.map((item) => item.name).join('、')}）`)
    .join('，')}。这些结果都来自本地订单数据，可根据订单号继续追溯。`;
}

function buildRecommendationReply(productsToRecommend: Product[], memory: AgentMemory) {
  if (productsToRecommend.length === 0) {
    return '我暂时没有找到特别匹配的鞋款，你可以再补充一下预算或主要使用场景。';
  }

  const sizeText = memory.shoeProfile.size ? `${memory.shoeProfile.size} 码` : '常规尺码';
  const walkingText =
    memory.shoeProfile.walkingAmount === 'high'
      ? '走路较多'
      : memory.shoeProfile.walkingAmount === 'low'
        ? '走路较少'
        : '日常通勤';
  const sceneText = memory.shoeProfile.scene ? `，场景偏${memory.shoeProfile.scene}` : '';

  return `结合你提供的 ${sizeText}、${walkingText}${sceneText} 信息，我优先挑了更偏舒适、不易磨脚的鞋款。先看这 ${productsToRecommend.length} 双：`;
}

function buildCheaperReply(productsToRecommend: Product[], memory: AgentMemory) {
  const baselineProduct = memory.lastRecommendedProducts[0];
  const baselinePriceText = baselineProduct ? `上一轮你关注的主推价位大约是 ${formatCurrency(baselineProduct.price)}。` : '';

  if (productsToRecommend.length === 0) {
    return `${baselinePriceText} 我暂时没有找到更便宜且同类的替代鞋款。`;
  }

  return `${baselinePriceText} 我帮你筛了几双更低价、但仍保留通勤/舒适/不易磨脚特性的替代鞋款，你可以重点看看：`;
}

export async function runAgentWorkflow(messages: ChatMessageInput[]): Promise<ChatResponse> {
  const steps: AgentStep[] = [];
  const memory = hydrateMemory(messages);
  const latestUserMessage = getLatestUserMessage(messages);
  const latestContent = latestUserMessage?.content ?? '';
  const intent = detectIntent(messages, memory);

  steps.push(createStep('intent', '意图识别', `识别当前用户诉求为 ${intent === 'clarify_shoe' ? '信息补全' : intent}`));

  if (intent === 'order_query') {
    steps.push(createStep('tool-order', '调用订单查询工具', '根据“鞋类/鞋子”关键词检索历史订单'));
    const orders = queryOrders({ keyword: '鞋', limit: 5 });

    return {
      intent: 'order_query',
      reply: buildOrderAnswer(orders),
      products: [],
      orders,
      steps,
      metadata: {
        pendingShoeClarification: false,
        shoeProfile: memory.shoeProfile,
        lastInterestCategory: '鞋类',
        lastUserGoal: latestContent,
      },
    };
  }

  if (intent === 'clarify_shoe') {
    steps.push(
      createStep(
        'memory-gap',
        '识别信息缺口',
        '当前缺少鞋码或日常步行强度，先补齐关键画像后再推荐',
        'requires_input'
      )
    );

    return {
      intent: 'product_recommendation',
      reply: '为了给你推荐一双更不容易磨脚的鞋，我还需要两个关键信息：你平时穿什么尺码？走路多吗？',
      products: [],
      orders: [],
      steps,
      metadata: {
        pendingShoeClarification: true,
        shoeProfile: {
          ...memory.shoeProfile,
          requirements: mergeUnique([...(memory.shoeProfile.requirements ?? []), '不磨脚']),
        },
        lastInterestCategory: '鞋类',
        lastUserGoal: memory.lastUserGoal ?? latestContent,
      },
    };
  }

  if (intent === 'product_recommendation') {
    steps.push(createStep('memory', '读取上下文记忆', '已读取用户尺码、步行强度和历史追问结果'));
    steps.push(createStep('tool-recommend', '调用商品推荐工具', '基于鞋类偏好和场景筛选候选商品'));
    const recommendedProducts = recommendShoes({
      ...memory,
      shoeProfile: {
        ...memory.shoeProfile,
        requirements: mergeUnique([...(memory.shoeProfile.requirements ?? []), '不磨脚']),
      },
    });

    return {
      intent: 'product_recommendation',
      reply: buildRecommendationReply(recommendedProducts, memory),
      products: recommendedProducts,
      orders: [],
      steps,
      metadata: {
        pendingShoeClarification: false,
        shoeProfile: {
          ...memory.shoeProfile,
          requirements: mergeUnique([...(memory.shoeProfile.requirements ?? []), '不磨脚']),
        },
        lastRecommendedProductIds: recommendedProducts.map((product) => product.id),
        lastInterestCategory: '鞋类',
        lastUserGoal: memory.lastUserGoal ?? latestContent,
      },
    };
  }

  if (intent === 'cheaper_alternative') {
    steps.push(createStep('memory', '读取最近关注商品', '从上下文中恢复上轮鞋款与用户画像'));
    steps.push(createStep('tool-cheaper', '调用低价替代工具', '按同品类、相似需求、更低价格筛选替代鞋款'));
    const cheaperProducts = findCheaperAlternatives(memory);

    return {
      intent: 'product_recommendation',
      reply: buildCheaperReply(cheaperProducts, memory),
      products: cheaperProducts,
      orders: [],
      steps,
      metadata: {
        pendingShoeClarification: false,
        shoeProfile: memory.shoeProfile,
        lastRecommendedProductIds: cheaperProducts.map((product) => product.id),
        lastInterestCategory: '鞋类',
        lastUserGoal: memory.lastUserGoal ?? latestContent,
      },
    };
  }

  return {
    intent: 'other',
    reply: '当前这条消息更适合走通用商品咨询流程。',
    products: [],
    orders: [],
    steps,
    metadata: {
      pendingShoeClarification: memory.pendingShoeClarification,
      shoeProfile: memory.shoeProfile,
      lastRecommendedProductIds: memory.lastRecommendedProducts.map((product) => product.id),
      lastInterestCategory: memory.lastInterestCategory,
      lastUserGoal: memory.lastUserGoal,
    },
  };
}
