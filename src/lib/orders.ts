import type { Order, OrderStatus } from '@/lib/types';

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: '待付款',
  processing: '待发货',
  shipped: '已发货',
  in_transit: '运输中',
  delivered: '已签收',
  cancelled: '已取消',
};

export const mockOrders: Order[] = [
  {
    id: 'o1',
    orderNo: 'SO202605210001',
    createdAt: '2026-05-21T09:12:00+08:00',
    updatedAt: '2026-05-21T09:12:00+08:00',
    status: 'pending_payment',
    items: [
      { sku: 'sku-p9', name: '人体工学办公椅', quantity: 1, price: 899 },
    ],
    totalAmount: 899,
    recipient: '张三',
    address: '上海市浦东新区张江路 168 号',
    merchant: '居家精选旗舰店',
    keywords: ['办公椅', '椅子', '人体工学'],
    trackingEvents: [
      {
        label: '订单已创建',
        detail: '等待完成支付后安排发货',
        time: '2026-05-21 09:12',
      },
    ],
  },
  {
    id: 'o2',
    orderNo: 'SO202605180019',
    createdAt: '2026-05-18T14:30:00+08:00',
    updatedAt: '2026-05-19T08:50:00+08:00',
    status: 'processing',
    items: [
      { sku: 'sku-p10', name: '便携保温杯', quantity: 2, price: 129 },
    ],
    totalAmount: 258,
    recipient: '张三',
    address: '上海市浦东新区张江路 168 号',
    merchant: '生活家居馆',
    keywords: ['保温杯', '杯子', '水杯'],
    trackingEvents: [
      {
        label: '商家备货中',
        detail: '仓库正在拣货打包',
        time: '2026-05-19 08:50',
      },
      {
        label: '订单已支付',
        detail: '支付成功，等待发货',
        time: '2026-05-18 14:31',
      },
    ],
  },
  {
    id: 'o3',
    orderNo: 'SO202605160105',
    createdAt: '2026-05-16T11:24:00+08:00',
    updatedAt: '2026-05-17T07:20:00+08:00',
    status: 'shipped',
    items: [
      { sku: 'sku-p1', name: '智能降噪耳机', quantity: 1, price: 1299 },
    ],
    totalAmount: 1299,
    recipient: '张三',
    address: '上海市浦东新区张江路 168 号',
    merchant: '数码优选旗舰店',
    carrier: '顺丰速运',
    trackingNo: 'SF103948562001',
    eta: '预计 2026-05-28 送达',
    keywords: ['耳机', '降噪耳机', '蓝牙耳机'],
    trackingEvents: [
      {
        label: '包裹已揽收',
        detail: '快件已由上海浦东张江站点揽收',
        time: '2026-05-17 07:20',
      },
      {
        label: '商品已出库',
        detail: '仓库完成打包，等待承运商接收',
        time: '2026-05-16 20:10',
      },
    ],
  },
  {
    id: 'o4',
    orderNo: 'SO202605120033',
    createdAt: '2026-05-12T16:42:00+08:00',
    updatedAt: '2026-05-14T10:20:00+08:00',
    status: 'in_transit',
    items: [
      { sku: 'sku-p3', name: '轻薄办公笔记本', quantity: 1, price: 5499 },
      { sku: 'sku-p1', name: '智能降噪耳机', quantity: 1, price: 1299 },
    ],
    totalAmount: 6798,
    recipient: '张三',
    address: '上海市浦东新区张江路 168 号',
    merchant: '办公数码专营店',
    carrier: '京东物流',
    trackingNo: 'JDVB202605140887',
    eta: '预计今日 18:00 前送达',
    keywords: ['笔记本', '电脑', '耳机', '办公'],
    trackingEvents: [
      {
        label: '快件运输中',
        detail: '包裹已离开上海转运中心，正在派送站点分拨',
        time: '2026-05-14 10:20',
      },
      {
        label: '包裹已发出',
        detail: '上海仓已完成出库',
        time: '2026-05-13 19:06',
      },
    ],
  },
  {
    id: 'o5',
    orderNo: 'SO202605040227',
    createdAt: '2026-05-04T19:06:00+08:00',
    updatedAt: '2026-05-07T12:08:00+08:00',
    status: 'delivered',
    items: [
      { sku: 'sku-p6', name: '运动跑鞋', quantity: 1, price: 599 },
    ],
    totalAmount: 599,
    recipient: '张三',
    address: '上海市浦东新区张江路 168 号',
    merchant: '运动潮流旗舰店',
    carrier: '中通快递',
    trackingNo: 'ZTO202605071568',
    keywords: ['跑鞋', '运动鞋', '鞋子'],
    trackingEvents: [
      {
        label: '已签收',
        detail: '包裹已由前台代收',
        time: '2026-05-07 12:08',
      },
      {
        label: '派送中',
        detail: '快递员正在派送',
        time: '2026-05-07 09:34',
      },
    ],
  },
  {
    id: 'o6',
    orderNo: 'SO202604280012',
    createdAt: '2026-04-28T08:30:00+08:00',
    updatedAt: '2026-04-28T12:16:00+08:00',
    status: 'cancelled',
    items: [
      { sku: 'sku-p7', name: '全自动咖啡机', quantity: 1, price: 2599 },
    ],
    totalAmount: 2599,
    recipient: '张三',
    address: '上海市浦东新区张江路 168 号',
    merchant: '品质家电旗舰店',
    keywords: ['咖啡机', '咖啡', '家电'],
    trackingEvents: [
      {
        label: '订单已取消',
        detail: '用户申请取消并已原路退款',
        time: '2026-04-28 12:16',
      },
      {
        label: '订单已支付',
        detail: '支付成功，等待发货',
        time: '2026-04-28 08:31',
      },
    ],
  },
];
