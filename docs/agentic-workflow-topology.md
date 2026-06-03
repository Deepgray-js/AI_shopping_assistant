# Agentic Workflow Topology

## 概述
当前项目在原有聊天路由基础上增加了一层真实的 tool/function calling 编排器，并保留轻量规划器作为兜底，用最少改动实现三类自主决策场景：
- 历史订单追溯
- 信息缺口追问
- 低价替代检索

## 拓扑图
```mermaid
flowchart TD
    A[用户输入] --> B[/api/chat]
    B --> C[resolveChat]
    C --> D[runFunctionCallingWorkflow]
    D --> E[上下文记忆恢复]
    E --> F[LLM Planner with Tools]

    F -->|tool: query_order_history| G[订单查询工具 queryOrders]
    F -->|无工具 直接追问| H[追问信息收集]
    F -->|tool: recommend_shoes| I[鞋类推荐工具 recommendShoes]
    F -->|tool: find_cheaper_shoes| J[低价替代工具 findCheaperAlternatives]
    F -->|HANDOFF_PRODUCT_CHAT| K[轻量规划器/通用商品回退链路]

    G --> L[结果整理与溯源回复]
    H --> L
    I --> L
    J --> L
    K --> L

    L --> M[返回 reply/products/orders/steps/metadata]
    M --> N[前端消息流]
    N --> O[订单卡片/商品卡片/步骤轨迹]
    N --> P[下一轮请求回传 metadata]
    P --> E
```

## 关键节点说明
- `runFunctionCallingWorkflow`：真实 function calling 主编排入口，由模型决定是否调用工具。
- `runAgentWorkflow`：当模型不可用或 function calling 未命中时的本地兜底编排器。
- `metadata`：在多轮对话间传递用户鞋码、走路强度、场景、上轮推荐商品等记忆。
- `steps`：记录本轮智能体执行轨迹，前端直接展示，便于追溯。
- `queryOrders`：订单查询工具。
- `recommendShoes`：鞋类推荐工具。
- `findCheaperAlternatives`：低价替代工具。

## 当前实现边界
- 智能体场景目前重点覆盖鞋类购买追溯、鞋类推荐追问、低价替代。
- 其他商品咨询仍保留原有通用推荐链路。
