import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runFunctionCallingWorkflow } from '@/lib/function-calling-agent';
import { getOpenAIClient } from '@/lib/openai';
import type { ChatMessageInput } from '@/lib/types';

vi.mock('@/lib/openai', () => ({
  getOpenAIClient: vi.fn(),
}));

function createMockClient(responses: Array<Record<string, unknown>>) {
  const create = vi.fn();
  responses.forEach((response) => create.mockResolvedValueOnce(response));

  return {
    chat: {
      completions: {
        create,
      },
    },
  };
}

describe('runFunctionCallingWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses query_order_history tool calls to answer whether the user bought shoes', async () => {
    vi.mocked(getOpenAIClient).mockReturnValue(
      createMockClient([
        {
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call-order-1',
                    type: 'function',
                    function: {
                      name: 'query_order_history',
                      arguments: JSON.stringify({ keyword: '鞋', limit: 5 }),
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '我帮你查到 1 笔鞋类相关订单：SO202605040227（运动跑鞋）。这些结果都来自本地订单数据，可根据订单号继续追溯。',
              },
            },
          ],
        },
      ]) as never
    );

    const result = await runFunctionCallingWorkflow([
      { role: 'user', content: '我买过鞋吗？' },
    ]);

    expect(result?.intent).toBe('order_query');
    expect(result?.orders).toHaveLength(1);
    expect(result?.reply).toContain('SO202605040227');
    expect(result?.steps.some((step) => step.title.includes('订单查询工具'))).toBe(true);
  });

  it('asks a follow-up question without tool calls when shoe profile is incomplete', async () => {
    vi.mocked(getOpenAIClient).mockReturnValue(
      createMockClient([
        {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '你平时穿什么尺码？走路多吗？',
              },
            },
          ],
        },
      ]) as never
    );

    const result = await runFunctionCallingWorkflow([
      { role: 'user', content: '推荐一双不磨脚的鞋' },
    ]);

    expect(result?.intent).toBe('product_recommendation');
    expect(result?.reply).toContain('尺码');
    expect(result?.metadata?.pendingShoeClarification).toBe(true);
    expect(result?.steps.some((step) => step.status === 'requires_input')).toBe(true);
  });

  it('uses find_cheaper_shoes tool calls to produce lower-price alternatives', async () => {
    const messages: ChatMessageInput[] = [
      { role: 'user', content: '推荐一双不磨脚的鞋' },
      {
        role: 'assistant',
        content: '结合你提供的信息，我优先挑了更偏舒适、不易磨脚的鞋款。先看这 3 双：',
        products: [
          {
            id: 'p11',
            name: '轻盈通勤休闲鞋',
            description: '鞋面柔软贴合，后跟包裹舒适，适合通勤久走，减少磨脚感。',
            category: '鞋类',
            price: 399,
            imageUrl: '/data/runningshoes.png',
          },
        ],
        metadata: {
          pendingShoeClarification: false,
          shoeProfile: {
            size: '38',
            walkingAmount: 'high',
            scene: '通勤',
            requirements: ['不磨脚'],
          },
          lastInterestCategory: '鞋类',
          lastUserGoal: '推荐一双不磨脚的鞋',
          lastRecommendedProductIds: ['p11'],
        },
      },
      { role: 'user', content: '算了，太贵了' },
    ];

    vi.mocked(getOpenAIClient).mockReturnValue(
      createMockClient([
        {
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call-cheaper-1',
                    type: 'function',
                    function: {
                      name: 'find_cheaper_shoes',
                      arguments: JSON.stringify({ maxPrice: 399, scene: '通勤', requirements: ['不磨脚'] }),
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '我帮你筛了几双更低价、但仍保留通勤和舒适特性的替代鞋款，你可以重点看看。',
              },
            },
          ],
        },
      ]) as never
    );

    const result = await runFunctionCallingWorkflow(messages);

    expect(result?.intent).toBe('product_recommendation');
    expect(result?.products.length).toBeGreaterThan(0);
    expect(result?.products.every((product) => product.price < 399)).toBe(true);
    expect(result?.steps.some((step) => step.title.includes('低价替代工具'))).toBe(true);
  });
});
