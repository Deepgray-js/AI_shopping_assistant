import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/order-intent/route';

describe('/api/order-intent', () => {
  it('recognizes a recent order lookup request and returns matching orders', async () => {
    const response = await POST(
      new Request('http://localhost/api/order-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '帮我查最近订单' }],
        }),
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.intent).toBe('order_query');
    expect(body.source).toBe('rules');
    expect(body.filters.limit).toBe(3);
    expect(body.orders).toHaveLength(3);
    expect(body.orders[0].orderNo).toBe('SO202605210001');
  });

  it('marks non-order messages as product or other intent without crashing', async () => {
    const response = await POST(
      new Request('http://localhost/api/order-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '给我推荐一款适合通勤的耳机' }],
        }),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.intent).not.toBe('order_query');
    expect(body.orders).toEqual([]);
  });

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      new Request('http://localhost/api/order-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: 'invalid',
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
