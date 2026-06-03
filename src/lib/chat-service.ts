import { runAgentWorkflow } from '@/lib/agent-workflow';
import { runFunctionCallingWorkflow } from '@/lib/function-calling-agent';
import { orderStatusLabels } from '@/lib/orders';
import { detectOrderIntent } from '@/lib/order-intent';
import { queryOrders } from '@/lib/order-query';
import { getProductChatResponse } from '@/lib/product-chat';
import type { ChatMessageInput, ChatResponse, Order } from '@/lib/types';

function summarizeOrder(order: Order) {
  const itemNames = order.items.map((item) => `${item.name} x${item.quantity}`).join('、');
  const latestEvent = order.trackingEvents[0];
  const trackingSummary = latestEvent
    ? `最新进度：${latestEvent.label}（${latestEvent.time}）`
    : '暂无物流节点更新。';

  return `- ${order.orderNo}：${orderStatusLabels[order.status]}，包含 ${itemNames}。${trackingSummary}`;
}

function buildOrderReply(orders: Order[]) {
  if (orders.length === 0) {
    return '暂时没有找到符合条件的订单。你可以补充商品名、订单状态或时间范围，例如“查近 30 天的耳机订单”。';
  }

  if (orders.length === 1) {
    const order = orders[0];
    const latestEvent = order.trackingEvents[0];
    const itemNames = order.items.map((item) => item.name).join('、');
    const trackingSentence = latestEvent
      ? `最新进度是“${latestEvent.label}”，时间为 ${latestEvent.time}。`
      : '当前还没有更多物流节点。';

    return `帮你查到 1 笔订单：${order.orderNo}，状态为 ${orderStatusLabels[order.status]}。商品包含 ${itemNames}。${trackingSentence}`;
  }

  return `帮你找到 ${orders.length} 笔相关订单：\n${orders.map(summarizeOrder).join('\n')}`;
}

export async function resolveOrderQuery(messages: ChatMessageInput[]) {
  const detection = await detectOrderIntent(messages);

  if (detection.intent !== 'order_query') {
    return {
      ...detection,
      reply: '当前消息更像商品咨询或泛化问题，建议继续走通用聊天路由处理。',
      orders: [],
      steps: [],
    };
  }

  const orders = queryOrders(detection.filters);

  return {
    ...detection,
    reply: buildOrderReply(orders),
    orders,
    steps: [],
  };
}

export async function resolveChat(messages: ChatMessageInput[]): Promise<ChatResponse> {
  const functionCallingResult = await runFunctionCallingWorkflow(messages);
  if (functionCallingResult && functionCallingResult.intent !== 'other') {
    return functionCallingResult;
  }

  const agentResult = await runAgentWorkflow(messages);
  if (agentResult.intent !== 'other') {
    return agentResult;
  }

  const orderResult = await resolveOrderQuery(messages);

  if (orderResult.intent === 'order_query') {
    return {
      intent: 'order_query',
      reply: orderResult.reply,
      products: [],
      orders: orderResult.orders,
      steps: orderResult.steps,
    };
  }

  return getProductChatResponse(messages);
}
