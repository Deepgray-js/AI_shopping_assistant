# Agentic Workflow Scenario Test Report

## 测试范围
- 场景一：`我买过鞋吗？`
- 场景二：`推荐一双不磨脚的鞋` -> 追问 -> 用户补充画像 -> 推荐
- 场景三：`算了，太贵了`
- 自动化测试 + 本地构建 + 浏览器联调

## 自动化测试

### 真实 Function Calling 回归
- 文件：`src/lib/function-calling-agent.test.ts`
- 覆盖内容：
  - 模型通过 `query_order_history` tool call 查询鞋类购买历史
  - 模型在资料不足时不调用工具而直接追问
  - 模型通过 `find_cheaper_shoes` tool call 生成低价替代鞋款

### `/api/chat` 场景回归
- 文件：`src/app/api/chat/route.test.ts`
- 覆盖内容：
  - 在 mock 掉模型客户端后，验证轻量兜底工作流仍能覆盖三类核心场景

### 既有测试
- `src/app/api/order-intent/route.test.ts`
- `src/lib/order-query.test.ts`
- `src/lib/utils.test.ts`

## 本地执行结果
- `npm run test`：通过
- `npm run build`：通过
- `npm run lint`：通过

## 场景结果摘要

### 1. 我买过鞋吗？
- 识别结果：`order_query`
- 调用工具：`query_order_history` -> `queryOrders`
- 返回结果：命中鞋类历史订单 `SO202605040227`
- 可追溯性：回复中直接包含订单号，可继续追查

### 2. 推荐一双不磨脚的鞋
- 第一轮：
  - 识别结果：`clarify_shoe`
  - 行为：主动追问“你平时穿什么尺码？走路多吗？”
- 第二轮：
  - 用户补充：尺码 + 通勤 + 走路较多
  - 识别结果：`product_recommendation`
  - 调用工具：`recommend_shoes` -> 本地鞋类推荐
  - 返回结果：输出鞋类推荐卡片列表

### 3. 算了，太贵了
- 识别结果：`cheaper_alternative`
- 上下文来源：读取上一轮推荐商品和用户鞋类画像
- 调用工具：`find_cheaper_shoes` -> 本地低价替代筛选
- 返回结果：返回更低价格的鞋类替代商品

## 浏览器联调结论
- 三类核心场景均可从聊天框直接触发
- 前端能正常显示：
  - 智能体执行轨迹
  - 订单卡片
  - 商品推荐卡片
- 多轮对话时能够保持上下文连贯，继续使用前一轮收集到的尺码、场景和上轮推荐商品

## 风险与说明
- 当前“95% 准确率”没有独立标注语料的离线评测集，只能通过规则覆盖和场景回归保证核心路径稳定。
- 当前主链路已升级为真实 function calling，轻量规划器保留为兜底，因此在模型不可用时核心场景仍可用。
- 智能体主流程对鞋类场景覆盖较深，其他品类仍主要走通用推荐链路。
- 浏览器中仍可能看到外部注入导致的 hydration 提示，但不影响当前工作流逻辑与结果正确性。
