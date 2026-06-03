import { getOpenAIClient } from '@/lib/openai';
import { queryOrders } from '@/lib/order-query';
import { products } from '@/lib/products';
import type {
  AgentMetadata,
  AgentStep,
  ChatMessageInput,
  ChatResponse,
  Product,
  ShoeProfile,
} from '@/lib/types';
import { formatCurrency, normalizeSearchText } from '@/lib/utils';

interface MemoryState {
  shoeProfile: ShoeProfile;
  pendingShoeClarification: boolean;
  lastRecommendedProducts: Product[];
  lastInterestCategory?: string;
  lastUserGoal?: string;
}

interface RecommendArgs {
  size?: string;
  walkingAmount?: 'low' | 'medium' | 'high';
  scene?: string;
  requirements?: string[];
  limit?: number;
  maxPrice?: number;
}

interface CheaperArgs {
  limit?: number;
  maxPrice?: number;
  requirements?: string[];
  scene?: string;
}

function createStep(id: string, title: string, detail: string, status: AgentStep['status'] = 'completed'): AgentStep {
  return { id, title, detail, status };
}

function mergeUnique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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

function hydrateMemory(messages: ChatMessageInput[]): MemoryState {
  const memory: MemoryState = {
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

function buildMetadata(memory: MemoryState): AgentMetadata {
  return {
    pendingShoeClarification: memory.pendingShoeClarification,
    shoeProfile: memory.shoeProfile,
    lastRecommendedProductIds: memory.lastRecommendedProducts.map((product) => product.id),
    lastInterestCategory: memory.lastInterestCategory,
    lastUserGoal: memory.lastUserGoal,
  };
}

function scoreShoe(product: Product, profile: ShoeProfile) {
  if (product.category !== '鞋类') {
    return -1;
  }

  let score = 0;
  const corpus = normalizeSearchText([
    product.name,
    product.description,
    ...(product.tags ?? []),
    ...(product.scenes ?? []),
  ].join(' '));

  if (profile.requirements?.includes('不磨脚') && corpus.includes(normalizeSearchText('不磨脚'))) {
    score += 4;
  }

  if (profile.scene && corpus.includes(normalizeSearchText(profile.scene))) {
    score += 3;
  }

  if (
    profile.walkingAmount === 'high' &&
    /(缓震|支撑|耐磨|健走|久站)/.test(product.description + (product.tags ?? []).join(' '))
  ) {
    score += 3;
  }

  if (
    profile.walkingAmount === 'medium' &&
    /(轻便|通勤|日常)/.test(product.description + (product.tags ?? []).join(' '))
  ) {
    score += 2;
  }

  if (product.price <= 500) {
    score += 1;
  }

  return score;
}

function recommendShoes(args: RecommendArgs, memory: MemoryState) {
  const profile: ShoeProfile = {
    ...memory.shoeProfile,
    ...args,
    requirements: mergeUnique([
      ...(memory.shoeProfile.requirements ?? []),
      ...(args.requirements ?? []),
    ]),
  };
  const limit = args.limit ?? 3;
  const maxPrice = args.maxPrice;

  const result = products
    .filter((product) => product.category === '鞋类')
    .filter((product) => (maxPrice ? product.price <= maxPrice : true))
    .map((product) => ({ product, score: scoreShoe(product, profile) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.product.price - right.product.price;
    })
    .slice(0, limit)
    .map((entry) => entry.product);

  memory.shoeProfile = profile;
  memory.pendingShoeClarification = false;
  memory.lastInterestCategory = '鞋类';
  memory.lastRecommendedProducts = result;

  return result;
}

function findCheaperAlternatives(args: CheaperArgs, memory: MemoryState) {
  const baselineProduct = memory.lastRecommendedProducts[0];
  const baselinePrice = args.maxPrice ?? baselineProduct?.price ?? 699;
  const requirements = mergeUnique([
    ...(memory.shoeProfile.requirements ?? []),
    ...(args.requirements ?? []),
  ]);
  const scene = args.scene ?? memory.shoeProfile.scene;
  const limit = args.limit ?? 3;

  const baselineTags = new Set([
    ...(baselineProduct?.tags ?? []),
    ...requirements,
    ...(scene ? [scene] : []),
  ]);

  const result = products
    .filter((product) => product.category === '鞋类' && product.price < baselinePrice)
    .map((product) => {
      const corpus = normalizeSearchText([
        product.name,
        product.description,
        ...(product.tags ?? []),
        ...(product.scenes ?? []),
      ].join(' '));
      const overlap = [...baselineTags].filter((tag) => corpus.includes(normalizeSearchText(tag))).length;
      return { product, score: overlap };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.product.price - right.product.price;
    })
    .slice(0, limit)
    .map((entry) => entry.product);

  memory.lastRecommendedProducts = result;
  memory.lastInterestCategory = '鞋类';

  return result;
}

function systemPrompt(memory: MemoryState) {
  return `你是朝夕拾画AI导购系统中的工具编排智能体。你必须通过 function/tool calling 自主决定是否调用工具。

你只重点处理以下三类鞋类场景：
1. 用户问“我买过鞋吗/鞋的订单/鞋发货了吗”这类历史购买与订单追溯问题：必须调用 query_order_history。
2. 用户说“推荐一双不磨脚的鞋”：如果缺少鞋码或走路强度，必须先主动追问，不要直接调用推荐工具；信息足够后再调用 recommend_shoes。
3. 用户说“算了，太贵了/便宜点”：如果上下文里已有上一轮鞋类推荐，必须调用 find_cheaper_shoes。

如果请求不属于以上三类，请只返回纯文本 HANDOFF_PRODUCT_CHAT，不要调用任何工具。

当你需要追问时，问题要简洁明确，优先问：你平时穿什么尺码？走路多吗？
当你完成工具调用后，请直接用自然语言回答用户，不要暴露函数名，但要让结果可追溯。

当前记忆快照：
- pendingShoeClarification: ${memory.pendingShoeClarification}
- shoeProfile: ${JSON.stringify(memory.shoeProfile)}
- lastInterestCategory: ${memory.lastInterestCategory ?? ''}
- lastUserGoal: ${memory.lastUserGoal ?? ''}
- lastRecommendedProducts: ${JSON.stringify(
    memory.lastRecommendedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      tags: product.tags,
    }))
  )}`;
}

export async function runFunctionCallingWorkflow(messages: ChatMessageInput[]): Promise<ChatResponse | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  const memory = hydrateMemory(messages);
  const steps: AgentStep[] = [createStep('intent', 'Function Calling 规划', '已将当前消息交给模型自主决定是否调用工具')];
  let selectedProducts: Product[] = [];
  let selectedOrders = [] as ReturnType<typeof queryOrders>;

  const conversation: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt(memory) },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'query_order_history',
        description: '查询用户历史订单，适用于是否买过鞋、订单在哪里、鞋类物流等问题。',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string' },
            statuses: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['pending_payment', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
              },
            },
            dateFrom: { type: 'string' },
            dateTo: { type: 'string' },
            limit: { type: 'number' },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'recommend_shoes',
        description: '在鞋类商品中按尺码、走路强度、场景与需求进行推荐。',
        parameters: {
          type: 'object',
          properties: {
            size: { type: 'string' },
            walkingAmount: { type: 'string', enum: ['low', 'medium', 'high'] },
            scene: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } },
            limit: { type: 'number' },
            maxPrice: { type: 'number' },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_cheaper_shoes',
        description: '基于上一轮关注的鞋款和用户画像，找到更低价的同类替代商品。',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            maxPrice: { type: 'number' },
            requirements: { type: 'array', items: { type: 'string' } },
            scene: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
  ];

  for (let index = 0; index < 4; index += 1) {
    const completion = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: conversation as never,
      tools: tools as never,
      tool_choice: 'auto',
    });

    const assistantMessage = completion.choices[0]?.message as {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };

    conversation.push({
      role: 'assistant',
      content: assistantMessage.content ?? '',
      tool_calls: assistantMessage.tool_calls,
    });

    const toolCalls = assistantMessage.tool_calls ?? [];
    if (!toolCalls.length) {
      const reply = assistantMessage.content?.trim() ?? '';
      if (reply === 'HANDOFF_PRODUCT_CHAT' || !reply) {
        return {
          intent: 'other',
          reply: '当前消息更适合走通用商品咨询流程。',
          products: [],
          orders: [],
          steps,
          metadata: buildMetadata(memory),
        };
      }

      const requiresInput = /尺码|走路多吗|补充/.test(reply) && !selectedProducts.length && !selectedOrders.length;
      if (requiresInput) {
        memory.pendingShoeClarification = true;
        steps.push(createStep('clarify', '主动追问缺失信息', '模型判断当前推荐缺少关键画像，已向用户发起补充提问', 'requires_input'));
      }

      return {
        intent: selectedOrders.length ? 'order_query' : 'product_recommendation',
        reply,
        products: selectedProducts,
        orders: selectedOrders,
        steps,
        metadata: buildMetadata(memory),
      };
    }

    for (const toolCall of toolCalls) {
      let parsedArguments: Record<string, unknown> = {};
      try {
        parsedArguments = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      } catch {
        parsedArguments = {};
      }

      if (toolCall.function.name === 'query_order_history') {
        const filters = {
          keyword: typeof parsedArguments.keyword === 'string' ? parsedArguments.keyword : '鞋',
          statuses: Array.isArray(parsedArguments.statuses) ? parsedArguments.statuses : undefined,
          dateFrom: typeof parsedArguments.dateFrom === 'string' ? parsedArguments.dateFrom : undefined,
          dateTo: typeof parsedArguments.dateTo === 'string' ? parsedArguments.dateTo : undefined,
          limit: typeof parsedArguments.limit === 'number' ? parsedArguments.limit : 5,
        };
        selectedOrders = queryOrders(filters);
        memory.lastInterestCategory = '鞋类';
        steps.push(createStep('tool-order', '调用订单查询工具', `已通过 function calling 查询鞋类历史订单，共命中 ${selectedOrders.length} 笔`));

        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            filters,
            orders: selectedOrders.map((order) => ({
              orderNo: order.orderNo,
              status: order.status,
              items: order.items,
              trackingEvents: order.trackingEvents.slice(0, 1),
            })),
          }),
        });
      }

      if (toolCall.function.name === 'recommend_shoes') {
        const recommendArgs: RecommendArgs = {
          size: typeof parsedArguments.size === 'string' ? parsedArguments.size : undefined,
          walkingAmount:
            parsedArguments.walkingAmount === 'low' ||
            parsedArguments.walkingAmount === 'medium' ||
            parsedArguments.walkingAmount === 'high'
              ? parsedArguments.walkingAmount
              : undefined,
          scene: typeof parsedArguments.scene === 'string' ? parsedArguments.scene : undefined,
          requirements: Array.isArray(parsedArguments.requirements)
            ? parsedArguments.requirements.filter((item): item is string => typeof item === 'string')
            : undefined,
          limit: typeof parsedArguments.limit === 'number' ? parsedArguments.limit : 3,
          maxPrice: typeof parsedArguments.maxPrice === 'number' ? parsedArguments.maxPrice : undefined,
        };
        selectedProducts = recommendShoes(recommendArgs, memory);
        steps.push(createStep('tool-recommend', '调用鞋类推荐工具', `已通过 function calling 推荐 ${selectedProducts.length} 双鞋款`));

        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            criteria: recommendArgs,
            products: selectedProducts.map((product) => ({
              id: product.id,
              name: product.name,
              price: product.price,
              tags: product.tags,
            })),
          }),
        });
      }

      if (toolCall.function.name === 'find_cheaper_shoes') {
        const cheaperArgs: CheaperArgs = {
          limit: typeof parsedArguments.limit === 'number' ? parsedArguments.limit : 3,
          maxPrice: typeof parsedArguments.maxPrice === 'number' ? parsedArguments.maxPrice : undefined,
          requirements: Array.isArray(parsedArguments.requirements)
            ? parsedArguments.requirements.filter((item): item is string => typeof item === 'string')
            : undefined,
          scene: typeof parsedArguments.scene === 'string' ? parsedArguments.scene : undefined,
        };
        selectedProducts = findCheaperAlternatives(cheaperArgs, memory);
        steps.push(createStep('tool-cheaper', '调用低价替代工具', `已通过 function calling 找到 ${selectedProducts.length} 双更低价鞋款`));

        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            cheaperThan: formatCurrency(cheaperArgs.maxPrice ?? memory.lastRecommendedProducts[0]?.price ?? 699),
            products: selectedProducts.map((product) => ({
              id: product.id,
              name: product.name,
              price: product.price,
              tags: product.tags,
            })),
          }),
        });
      }
    }
  }

  return {
    intent: 'other',
    reply: '当前工具调用链路未完成，已回退到默认处理流程。',
    products: [],
    orders: [],
    steps,
    metadata: buildMetadata(memory),
  };
}
