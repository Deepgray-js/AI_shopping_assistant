import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { getOpenAIClient } from '@/lib/openai';
import type { ChatMessageInput } from '@/lib/types';

vi.mock('@/lib/openai', () => ({
  getOpenAIClient: vi.fn(),
}));

async function postMessages(messages: ChatMessageInput[]) {
  const response = await POST(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })
  );

  const body = await response.json();
  return { response, body };
}

describe('/api/chat agentic workflow', () => {
  beforeEach(() => {
    vi.mocked(getOpenAIClient).mockReturnValue(null);
  });

  it('checks shoe purchase history through the order tool', async () => {
    const { response, body } = await postMessages([
      { role: 'user', content: '我买过鞋吗？' },
    ]);

    expect(response.status).toBe(200);
    expect(body.intent).toBe('order_query');
    expect(body.orders).toHaveLength(1);
    expect(body.reply).toContain('SO202605040227');
    expect(body.steps.some((step: { title: string }) => step.title.includes('订单查询工具'))).toBe(true);
  });

  it('asks follow-up questions before recommending anti-chafing shoes and uses memory in the second turn', async () => {
    const firstTurn = await postMessages([
      { role: 'user', content: '推荐一双不磨脚的鞋' },
    ]);

    expect(firstTurn.body.intent).toBe('product_recommendation');
    expect(firstTurn.body.reply).toContain('你平时穿什么尺码');
    expect(firstTurn.body.metadata.pendingShoeClarification).toBe(true);

    const secondTurn = await postMessages([
      { role: 'user', content: '推荐一双不磨脚的鞋' },
      {
        role: 'assistant',
        content: firstTurn.body.reply,
        products: firstTurn.body.products,
        orders: firstTurn.body.orders,
        steps: firstTurn.body.steps,
        metadata: firstTurn.body.metadata,
      },
      { role: 'user', content: '我穿 38 码，走路很多，平时通勤为主。' },
    ]);

    expect(secondTurn.response.status).toBe(200);
    expect(secondTurn.body.intent).toBe('product_recommendation');
    expect(secondTurn.body.products.length).toBeGreaterThan(0);
    expect(secondTurn.body.products.every((product: { category: string }) => product.category === '鞋类')).toBe(true);
    expect(secondTurn.body.metadata.pendingShoeClarification).toBe(false);
  });

  it('finds cheaper alternatives based on the previously recommended shoes', async () => {
    const recommendationTurn = await postMessages([
      { role: 'user', content: '推荐一双不磨脚的鞋' },
      {
        role: 'assistant',
        content: '为了给你推荐一双更不容易磨脚的鞋，我还需要两个关键信息：你平时穿什么尺码？走路多吗？',
        metadata: {
          pendingShoeClarification: true,
          shoeProfile: {
            requirements: ['不磨脚'],
          },
          lastInterestCategory: '鞋类',
          lastUserGoal: '推荐一双不磨脚的鞋',
        },
      },
      { role: 'user', content: '我穿 38 码，走路很多，平时通勤为主。' },
    ]);

    const baselinePrice = recommendationTurn.body.products[0].price;

    const cheaperTurn = await postMessages([
      { role: 'user', content: '推荐一双不磨脚的鞋' },
      {
        role: 'assistant',
        content: recommendationTurn.body.reply,
        products: recommendationTurn.body.products,
        orders: recommendationTurn.body.orders,
        steps: recommendationTurn.body.steps,
        metadata: recommendationTurn.body.metadata,
      },
      { role: 'user', content: '算了，太贵了' },
    ]);

    expect(cheaperTurn.response.status).toBe(200);
    expect(cheaperTurn.body.intent).toBe('product_recommendation');
    expect(cheaperTurn.body.products.length).toBeGreaterThan(0);
    expect(cheaperTurn.body.products.every((product: { price: number }) => product.price < baselinePrice)).toBe(true);
    expect(cheaperTurn.body.steps.some((step: { title: string }) => step.title.includes('低价替代工具'))).toBe(true);
  });
});
