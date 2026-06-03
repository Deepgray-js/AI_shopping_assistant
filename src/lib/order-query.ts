import { mockOrders } from '@/lib/orders';
import type { Order, OrderQueryFilters } from '@/lib/types';
import { normalizeSearchText } from '@/lib/utils';

function matchesKeyword(order: Order, keyword?: string) {
  if (!keyword) {
    return true;
  }

  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  const haystack = normalizeSearchText(
    [
      order.orderNo,
      order.recipient,
      order.address,
      order.merchant,
      order.trackingNo ?? '',
      ...order.keywords,
      ...order.items.map((item) => item.name),
      ...order.trackingEvents.flatMap((event) => [event.label, event.detail]),
    ].join(' ')
  );

  return haystack.includes(normalizedKeyword);
}

function matchesDateRange(order: Order, filters: OrderQueryFilters) {
  const orderTime = new Date(order.createdAt).getTime();

  if (filters.dateFrom) {
    const fromTime = new Date(filters.dateFrom).getTime();
    if (orderTime < fromTime) {
      return false;
    }
  }

  if (filters.dateTo) {
    const toTime = new Date(filters.dateTo).getTime();
    if (orderTime > toTime) {
      return false;
    }
  }

  return true;
}

export function queryOrders(
  filters: OrderQueryFilters = {},
  sourceOrders: Order[] = mockOrders
) {
  const filtered = sourceOrders
    .filter((order) => {
      if (filters.statuses?.length && !filters.statuses.includes(order.status)) {
        return false;
      }

      if (!matchesDateRange(order, filters)) {
        return false;
      }

      return matchesKeyword(order, filters.keyword);
    })
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  if (filters.limit && filters.limit > 0) {
    return filtered.slice(0, filters.limit);
  }

  return filtered;
}
