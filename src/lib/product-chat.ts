import { products } from '@/lib/products';
import { getOpenAIClient } from '@/lib/openai';
import type { ChatMessageInput, ChatResponse } from '@/lib/types';

const productSystemPrompt = `你是朝夕拾画AI导购系统。你的任务是理解用户的购物意图，推荐合适的商品，并解答相关问题。
我们有以下商品列表：
${JSON.stringify(products, null, 2)}

请根据用户的输入，找到最匹配的商品，并给用户一个有帮助的回复。
你必须返回严格的 JSON 格式数据。JSON 对象应该包含以下两个字段：
1. "reply": 你给用户的自然语言回复，可以使用 Markdown 格式。
2. "productIds": 一个字符串数组，包含你推荐的商品 ID。如果没有推荐的商品，请返回空数组。
`;

export async function getProductChatResponse(messages: ChatMessageInput[]): Promise<ChatResponse> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      intent: 'product_recommendation',
      reply: '当前商品推荐模型未配置，可继续咨询订单进度，或稍后再试商品推荐。',
      products: [],
      orders: [],
      steps: [
        {
          id: 'fallback-product',
          title: '商品推荐引擎未启用',
          detail: '未检测到可用模型配置，返回了降级提示。',
          status: 'completed',
        },
      ],
    };
  }

  const response = await client.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      { role: 'system', content: productSystemPrompt },
      ...messages,
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from LLM');
  }

  const parsedContent = JSON.parse(content) as {
    reply?: string;
    productIds?: string[];
  };

  const reply = parsedContent.reply || '抱歉，我暂时没能理解您的商品需求。';
  const productIds = Array.isArray(parsedContent.productIds) ? parsedContent.productIds : [];
  const matchedProducts = products.filter((product) => productIds.includes(product.id));

  return {
    intent: 'product_recommendation',
    reply,
    products: matchedProducts,
    orders: [],
    steps: [
      {
        id: 'product-intent',
        title: '识别商品推荐意图',
        detail: '当前消息未命中订单或鞋类智能体流程，进入通用商品推荐分支。',
        status: 'completed',
      },
      {
        id: 'product-tool',
        title: '调用商品推荐模型',
        detail: '已根据商品库和用户输入生成推荐结果。',
        status: 'completed',
      },
    ],
  };
}
