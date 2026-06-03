# Agentic Workflow Core Module Calls

## 模块清单

### 1. 聊天路由
- 文件：`src/app/api/chat/route.ts`
- 责任：接收前端消息，调用 `resolveChat`，统一返回智能体执行结果。
- 输入：`messages`
- 输出：`intent`、`reply`、`products`、`orders`、`steps`、`metadata`

### 2. 聊天编排服务
- 文件：`src/lib/chat-service.ts`
- 责任：优先执行真实 function calling 工作流，未命中时再回退到轻量智能体与原有订单/商品推荐链路。
- 主要调用：
  - `runFunctionCallingWorkflow(messages)`
  - `runAgentWorkflow(messages)`
  - `resolveOrderQuery(messages)`
  - `getProductChatResponse(messages)`

### 3. Function Calling 工作流
- 文件：`src/lib/function-calling-agent.ts`
- 责任：
  - 将多轮上下文整理为模型可理解的记忆快照
  - 使用 `tools` / `tool_calls` 机制让模型自主决定是否调用工具
  - 执行本地工具并把结果回灌给模型，直至产出最终自然语言回复
- 主要工具：
  - `query_order_history`
  - `recommend_shoes`
  - `find_cheaper_shoes`

### 4. 轻量兜底工作流
- 文件：`src/lib/agent-workflow.ts`
- 责任：
  - 当模型未配置、工具调用未命中或发生异常时，继续保障三类核心场景可用
- 主要函数：
  - `runAgentWorkflow(messages)`

### 5. 订单查询工具
- 文件：`src/lib/order-query.ts`
- 责任：对本地订单数据执行状态、时间、关键词、数量等组合筛选。

### 6. 订单意图识别
- 文件：`src/lib/order-intent.ts`
- 责任：处理通用订单查询类意图，作为智能体未命中时的后备链路。

### 7. 商品推荐后备链路
- 文件：`src/lib/product-chat.ts`
- 责任：在非鞋类智能体场景下调用商品推荐引擎，兼容原有聊天能力。

### 8. 本地记忆与共享类型
- 文件：`src/lib/types.ts`
- 责任：定义 `AgentMetadata`、`AgentStep`、`ShoeProfile`、`ChatResponse` 等共享协议。

## 三类核心场景调用路径

### 场景一：我买过鞋吗？
1. `/api/chat`
2. `resolveChat`
3. `runFunctionCallingWorkflow`
4. LLM 选择 `query_order_history`
5. 本地执行 `queryOrders({ keyword: '鞋', limit: 5 })`
6. 返回订单结果、执行步骤、溯源回复

### 场景二：推荐一双不磨脚的鞋
1. `/api/chat`
2. `resolveChat`
3. `runFunctionCallingWorkflow`
4. LLM 读取记忆快照，判断缺少鞋码/走路强度
5. 直接追问，不调用工具
6. 下一轮带着 `metadata` 再次进入 `/api/chat`
7. LLM 选择 `recommend_shoes`
8. 本地执行鞋类推荐工具
9. 返回鞋类推荐列表

### 场景三：算了，太贵了
1. `/api/chat`
2. `resolveChat`
3. `runFunctionCallingWorkflow`
4. LLM 读取上轮推荐商品和用户画像
5. LLM 选择 `find_cheaper_shoes`
6. 本地执行低价替代工具
7. 返回更低价格的同类鞋款

## 记忆机制说明
- 前端会把上一轮 assistant message 的 `products`、`orders`、`steps`、`metadata` 一并回传。
- 服务端会先把历史消息整理为 function calling 可读取的记忆快照，并在兜底工作流中继续通过 `hydrateMemory` 合并以下信息：
  - 用户历史消息中的鞋码、场景、步行强度
  - 上一轮 assistant message 中的 `pendingShoeClarification`
  - 上一轮推荐过的商品
  - 最近一次鞋类目标

## 最小改动原则
- 保留原有 `/api/chat` 路由入口与前端布局。
- 只在响应协议中增加 `steps` 和 `metadata`。
- 真实 function calling 逻辑集中在新增的 `src/lib/function-calling-agent.ts`，避免大范围侵入原有文件。
- 既有 `src/lib/agent-workflow.ts` 继续作为兜底层保留。
