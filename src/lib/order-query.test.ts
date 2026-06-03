import { describe, expect, it } from 'vitest';
import { queryOrders } from '@/lib/order-query';

describe('queryOrders', () => {
  it('supports filtering by status', () => {
    const results = queryOrders({
      statuses: ['delivered'],
    });

    expect(results).toHaveLength(1);
    expect(results[0].orderNo).toBe('SO202605040227');
  });

  it('supports filtering by explicit time range', () => {
    const results = queryOrders({
      dateFrom: '2026-05-10T00:00:00.000Z',
      dateTo: '2026-05-20T23:59:59.999Z',
    });

    expect(results.map((order) => order.orderNo)).toEqual([
      'SO202605180019',
      'SO202605160105',
      'SO202605120033',
    ]);
  });

  it('supports fuzzy keyword matching and keeps newest orders first', () => {
    const results = queryOrders({
      keyword: '耳机',
    });

    expect(results.map((order) => order.orderNo)).toEqual([
      'SO202605160105',
      'SO202605120033',
    ]);
  });
});
