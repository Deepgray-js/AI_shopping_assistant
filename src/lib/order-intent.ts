import { mockOrders, orderStatusLabels } from '@/lib/orders';
import { getOpenAIClient } from '@/lib/openai';
import type {
  AssistantIntent,
  ChatMessageInput,
  OrderQueryFilters,
  OrderStatus,
} from '@/lib/types';
import { normalizeSearchText } from '@/lib/utils';

type DetectionSource = 'rules' | 'llm' | 'fallback';

export interface OrderIntentDetection {
  intent: AssistantIntent;
  filters: OrderQueryFilters;
  confidence: 'high' | 'medium' | 'low';
  source: DetectionSource;
}

const ORDER_SIGNAL_PATTERNS = [
  /订单/,
  /物流/,
  /快递/,
  /发货/,
  /签收/,
  /配送/,
  /包裹/,
  /运单/,
  /到哪/,
  /在哪/,
  /什么时候到/,
  /退货/,
  /退款/,
  /催发货/,
];

const STATUS_KEYWORDS: Array<{ status: OrderStatus; patterns: RegExp[] }> = [
  { status: 'pending_payment', patterns: [/待付款/, /未付款/, /没付款/, /未支付/] },
  { status: 'processing', patterns: [/待发货/, /未发货/, /没发货/, /备货中/, /催发货/] },
  { status: 'shipped', patterns: [/已发货/, /刚发货/, /揽收/, /出库/] },
  { status: 'in_transit', patterns: [/运输中/, /派送中/, /物流/, /快递到哪/, /在路上/] },
  { status: 'delivered', patterns: [/已签收/, /收到了/, /到了没/, /送到了/, /妥投/] },
  { status: 'cancelled', patterns: [/已取消/, /取消订单/, /退款成功/] },
];

const ORDER_TOPIC_HINTS = [
  '我的订单在哪里',
  '查最近订单',
  '发货了吗',
  '物流到哪了',
  '帮我查订单',
];

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toIsoDate(date: Date) {
  return date.toISOString();
}

function extractStatusFilters(text: string) {
  const statuses = new Set<OrderStatus>();
  STATUS_KEYWORDS.forEach(({ status, patterns }) => {
    if (patterns.some((pattern) => pattern.test(text))) {
      statuses.add(status);
    }
  });

  if (/发货了吗|发货没|有没有发货|什么时候发货/.test(text) && statuses.size === 0) {
    ['processing', 'shipped', 'in_transit', 'delivered'].forEach((status) => {
      statuses.add(status as OrderStatus);
    });
  }

  if (/订单在哪里|到哪了|在哪了|物流到哪/.test(text) && statuses.size === 0) {
    ['processing', 'shipped', 'in_transit', 'delivered'].forEach((status) => {
      statuses.add(status as OrderStatus);
    });
  }

  return [...statuses];
}

function extractDateRange(text: string) {
  const today = startOfToday();

  if (/今天/.test(text)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { dateFrom: toIsoDate(today), dateTo: toIsoDate(tomorrow) };
  }

  if (/昨天/.test(text)) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { dateFrom: toIsoDate(yesterday), dateTo: toIsoDate(today) };
  }

  if (/近7天|最近7天|一周内/.test(text)) {
    const from = new Date(today);
    from.setDate(today.getDate() - 7);
    const to = new Date(today);
    to.setDate(today.getDate() + 1);
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(to) };
  }

  if (/近30天|最近30天|一个月内/.test(text)) {
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    const to = new Date(today);
    to.setDate(today.getDate() + 1);
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(to) };
  }

  if (/本月/.test(text)) {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(to) };
  }

  return {};
}

function extractLimit(text: string) {
  if (/最近一单|最新一单|最后一单/.test(text)) {
    return 1;
  }

  if (/最近|最新/.test(text)) {
    return 3;
  }

  return undefined;
}

function extractKeyword(text: string) {
  const normalizedText = normalizeSearchText(text);

  const aliases = mockOrders.flatMap((order) => [
    ...order.items.map((item) => item.name),
    ...order.keywords,
    order.orderNo,
  ]);

  const matchedAlias = aliases
    .sort((left, right) => right.length - left.length)
    .find((alias) => normalizedText.includes(normalizeSearchText(alias)));

  return matchedAlias;
}

export function detectOrderIntentByRules(messages: ChatMessageInput[]): OrderIntentDetection {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const latestContent = latestUserMessage?.content?.trim() ?? '';

  if (!latestContent) {
    return {
      intent: 'other',
      filters: {},
      confidence: 'low',
      source: 'fallback',
    };
  }

  const hasOrderSignal = ORDER_SIGNAL_PATTERNS.some((pattern) => pattern.test(latestContent));

  if (!hasOrderSignal) {
    return {
      intent: 'other',
      filters: {},
      confidence: 'low',
      source: 'fallback',
    };
  }

  const statuses = extractStatusFilters(latestContent);
  const dateRange = extractDateRange(latestContent);
  const keyword = extractKeyword(latestContent);
  const limit = extractLimit(latestContent) ?? 3;

  return {
    intent: 'order_query',
    filters: {
      ...dateRange,
      ...(statuses.length ? { statuses } : {}),
      ...(keyword ? { keyword } : {}),
      limit,
    },
    confidence: ORDER_TOPIC_HINTS.some((hint) => latestContent.includes(hint)) ? 'high' : 'medium',
    source: 'rules',
  };
}

function isValidStatus(status: string): status is OrderStatus {
  return Object.keys(orderStatusLabels).includes(status);
}

async function detectOrderIntentByLlm(messages: ChatMessageInput[]): Promise<OrderIntentDetection> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      intent: 'other',
      filters: {},
      confidence: 'low',
      source: 'fallback',
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const response = await client.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content: `你是电商助手的意图识别器。今天是 ${today}。
请识别用户消息是否在查询订单/物流。
返回严格 JSON：
{
  "intent": "order_query" | "product_recommendation" | "other",
  "filters": {
    "statuses": ["processing"],
    "keyword": "智能降噪耳机",
    "dateFrom": "2026-05-01T00:00:00.000Z",
    "dateTo": "2026-06-01T00:00:00.000Z",
    "limit": 3
  }
}
仅当用户明确在查询订单、物流、发货、签收、退款、包裹状态时，intent 才返回 order_query。`,
      },
      ...messages,
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      intent: 'other',
      filters: {},
      confidence: 'low',
      source: 'fallback',
    };
  }

  const parsed = JSON.parse(content) as {
    intent?: AssistantIntent;
    filters?: {
      statuses?: string[];
      keyword?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    };
  };

  const statuses = parsed.filters?.statuses?.filter(isValidStatus);

  return {
    intent:
      parsed.intent === 'order_query' ||
      parsed.intent === 'product_recommendation' ||
      parsed.intent === 'other'
        ? parsed.intent
        : 'other',
    filters: {
      ...(statuses?.length ? { statuses } : {}),
      ...(parsed.filters?.keyword ? { keyword: parsed.filters.keyword } : {}),
      ...(parsed.filters?.dateFrom ? { dateFrom: parsed.filters.dateFrom } : {}),
      ...(parsed.filters?.dateTo ? { dateTo: parsed.filters.dateTo } : {}),
      ...(parsed.filters?.limit ? { limit: parsed.filters.limit } : {}),
    },
    confidence: parsed.intent === 'order_query' ? 'medium' : 'low',
    source: 'llm',
  };
}

export async function detectOrderIntent(messages: ChatMessageInput[]) {
  const ruleBased = detectOrderIntentByRules(messages);
  if (ruleBased.intent === 'order_query') {
    return ruleBased;
  }

  try {
    return await detectOrderIntentByLlm(messages);
  } catch {
    return ruleBased;
  }
}
