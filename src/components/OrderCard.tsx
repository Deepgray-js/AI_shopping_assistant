import React from 'react';
import { Package, Truck, MapPin, ReceiptText } from 'lucide-react';
import { orderStatusLabels } from '@/lib/orders';
import type { Order, OrderStatus } from '@/lib/types';
import { cn, formatCurrency, formatOrderDateTime } from '@/lib/utils';

const statusBadgeStyles: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  processing: 'bg-violet-100 text-violet-700',
  shipped: 'bg-sky-100 text-sky-700',
  in_transit: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-700',
};

interface OrderCardProps {
  order: Order;
  compact?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, compact = false }) => {
  const latestEvent = order.trackingEvents[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ReceiptText size={16} />
            <span>订单号 {order.orderNo}</span>
          </div>
          <div className="text-xs text-slate-500">
            下单时间：{formatOrderDateTime(order.createdAt)}
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            statusBadgeStyles[order.status]
          )}
        >
          {orderStatusLabels[order.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-700">
        <div className="flex items-start gap-2">
          <Package size={16} className="mt-0.5 text-slate-400" />
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.sku}`}>
                {item.name} x{item.quantity}
              </div>
            ))}
          </div>
        </div>

        {!compact && latestEvent && (
          <div className="flex items-start gap-2">
            <Truck size={16} className="mt-0.5 text-slate-400" />
            <div>
              <div className="font-medium text-slate-800">{latestEvent.label}</div>
              <div className="text-xs text-slate-500">{latestEvent.detail}</div>
              <div className="text-xs text-slate-500">{latestEvent.time}</div>
              {order.carrier && order.trackingNo && (
                <div className="mt-1 text-xs text-slate-500">
                  {order.carrier} | 运单号 {order.trackingNo}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 text-slate-400" />
          <div className="text-xs text-slate-500">
            {order.recipient} | {order.address}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
        <div className="text-xs text-slate-500">{order.merchant}</div>
        <div className="text-sm font-semibold text-slate-900">
          合计 {formatCurrency(order.totalAmount)}
        </div>
      </div>
    </div>
  );
};
