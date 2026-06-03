# 朝夕拾画AI导购系统 - 项目复刻规范文档

## 1. 项目基础信息模块
*   **项目完整名称**：朝夕拾画AI导购系统
*   **核心定位**：基于自然语言交互的智能电商导购平台，通过LLM（大语言模型）理解用户购物意图，提供拟人化导购体验与精准商品卡片推荐。
*   **开发语言版本**：TypeScript / JavaScript (Node.js)
*   **技术栈全清单**：
    *   **前端框架**：Next.js `16.2.6` (App Router 模式), React `19.2.4`, React DOM `19.2.4`
    *   **UI/样式**：Tailwind CSS `^4` (使用 `@tailwindcss/postcss` 插件及内联 `@theme`), Lucide React `^1.16.0` (图标), clsx `^2.1.1`, tailwind-merge `^3.6.0`
    *   **富文本/Markdown**：React Markdown `^10.1.0`, `@tailwindcss/typography` `^0.5.19`
    *   **后端服务**：Next.js API Routes (Serverless Functions)
    *   **LLM SDK**：OpenAI Node.js SDK `^6.39.0` (兼容模式接入阿里云Dashscope)
    *   **数据库**：前端静态 Mock 数据 (`products.ts` 数组形式)
*   **部署运行环境要求**：Node.js `^20` 环境，环境变量需配置 `DASHSCOPE_API_KEY`，可直接部署于 Vercel 或标准 Node.js 容器。
*   **核心应用场景**：用户输入自然语言（如“推荐一款适合户外跑步的耳机”），系统解析意图并在聊天流中返回文本建议及图文并茂的商品推荐卡片。

---

## 2. 项目目录结构规范
```text
/
├── public/                 # 公共静态资源目录
│   └── data/               # 存放商品Mock图片 (如 airpods.png, runningshoes.png等)
├── src/                    # 核心源代码目录
│   ├── app/                # Next.js App Router 目录
│   │   ├── api/            
│   │   │   └── chat/       
│   │   │       └── route.ts # 后端核心路由：处理对话请求、调用LLM、匹配商品
│   │   ├── favicon.ico     
│   │   ├── globals.css     # 全局样式与 Tailwind v4 主题变量、自定义滚动条配置
│   │   ├── layout.tsx      # 全局布局：引入 Geist 字体、定义基础 HTML 结构
│   │   └── page.tsx        # 前端主页面：组装 ChatWindow 与右侧商品侧边栏，管理对话状态
│   ├── components/         # 前端 React 组件库
│   │   ├── ChatWindow.tsx  # 聊天主窗口：包含消息列表、输入框、发送按钮、滚动控制
│   │   ├── MessageBubble.tsx # 消息气泡组件：区分用户/AI，支持 Markdown 渲染及内部商品卡片渲染
│   │   └── ProductCard.tsx # 商品展示卡片：展示图片、标题、价格、简介、加入购物车/收藏按钮
│   ├── lib/                
│   │   └── products.ts     # 数据层：定义 Product 接口与 10 条模拟商品数据清单
├── .env.local              # 环境变量配置 (需包含 DASHSCOPE_API_KEY)
├── next.config.mjs         # Next.js 配置文件
├── package.json            # 项目依赖与脚本
└── tsconfig.json           # TypeScript 配置
```

---

## 3. 核心功能模块拆解

### 3.1 智能对话交互 (Frontend & Backend)
*   **功能描述**：用户输入文本需求，界面展示用户消息并进入 Loading 态，随后展示大模型返回的自然语言回复。
*   **触发条件**：用户在输入框按 `Enter` 键或点击“发送”按钮。
*   **交互流程**：
    1. 前端向 `messages` 状态追加用户消息，开启 `isTyping` 动画。
    2. 将消息历史发送至 `/api/chat`。
    3. 后端组装 System Prompt，通过 OpenAI SDK 请求 Dashscope API。
    4. 接收到 JSON 响应后，前端追加 AI 回复并关闭 `isTyping`。
*   **输入/输出规则**：
    *   输入：`{ "messages": [{ "role": "user", "content": "..." }] }`
    *   输出：`{ "reply": "...", "products": [...] }`
*   **异常处理**：若网络请求失败或解析出错，前端 Catch 异常并追加提示“抱歉，系统出现了一些问题，请稍后再试。”

### 3.2 商品检索与意图解析 (Backend)
*   **功能描述**：结合 LLM 提取购物意图，并在本地 Mock 数据库中找出对应的商品 ID。
*   **核心逻辑**：
    1. System Prompt 注入了完整的 `products.ts` JSON 数据表。
    2. 强制要求 LLM 输出 JSON 格式 (`response_format: { type: 'json_object' }`)，包含 `reply` (自然语言) 和 `productIds` (推荐的商品ID数组)。
    3. 后端根据提取出的 `productIds` 从 `products` 数组中执行 `.filter()`，组合出最终返回给前端的商品对象列表。

### 3.3 混合渲染展示 (Frontend)
*   **功能描述**：在 AI 回复的气泡内，除了 Markdown 文本，还能通过 CSS Grid 动态渲染被推荐的商品卡片。
*   **交互流程**：
    *   `MessageBubble` 接收到包含 `products` 数组的 Message 对象。
    *   先使用 `react-markdown` 渲染 `content` 字段。
    *   在其下方遍历 `products`，复用 `ProductCard` 组件渲染商品。
    *   主页 (`page.tsx`) 右侧的“推荐商品”侧边栏（仅桌面端显示）同步更新为当前推荐的商品。

---

## 4. 视觉与交互规范

### 4.1 布局与响应式断点
*   **整体布局**：全屏高度背景，居中对齐 (`min-h-screen bg-gray-100 p-4 md:p-8 flex justify-center`)。
*   **左侧聊天区**：最大宽度 `max-w-3xl`，高度 `h-[90vh] md:h-[80vh]`。
*   **右侧侧边栏**：宽度 `w-80`，仅在大屏幕 (`lg:block`) 显示，移动端隐藏。
*   **卡片网格**：聊天气泡内的商品使用 `grid grid-cols-1 sm:grid-cols-2 gap-4` 响应式排列。

### 4.2 配色方案 (Tailwind 语义化色值)
*   **主背景**：`bg-gray-100` (#f3f4f6)
*   **聊天窗口背景**：`bg-gray-50/50`
*   **用户气泡**：`bg-indigo-600 text-white` (#4f46e5)
*   **AI 气泡**：`bg-white text-gray-800` (带 `shadow-sm`)
*   **强调/动作按钮**：默认 `bg-indigo-600`，Hover 态 `bg-indigo-700`。
*   **次要文本/时间戳**：`text-gray-400` / `text-gray-500`

### 4.3 字体与排版
*   **字体系列**：Geist Sans / Geist Mono (通过 `next/font/google` 引入)，后备 Arial, sans-serif。
*   **Markdown排版**：使用 `@tailwindcss/typography` (`prose prose-sm prose-indigo`) 处理 AI 返回的富文本间距、粗体、列表等。
*   **字号约束**：聊天文本 `text-[15px]`，商品标题 `text-sm font-semibold`，辅助说明 `text-xs`。

### 4.4 交互组件与动画
*   **打字指示器**：三个 `w-2 h-2 bg-gray-400` 圆点使用 `animate-bounce` 并设置不同 `animationDelay` (0, 150ms, 300ms)。
*   **商品卡片 (ProductCard)**：
    *   **容器**：`rounded-xl shadow-sm border overflow-hidden`，Hover 时触发 `hover:shadow-md transition-all duration-200`。
    *   **图片**：外层 `aspect-square overflow-hidden`，图片自身 Hover 时 `group-hover:scale-105 transition-transform duration-300`。
    *   **按钮**：输入框发送按钮禁用态设为 `disabled:opacity-50 disabled:cursor-not-allowed`。
*   **滚动条**：自定义类 `.custom-scrollbar`，宽度 6px，滑块 `bg-gray-400/50`，Hover `bg-gray-500/80`，圆角 `10px`。

---

## 5. 技术实现标准

### 5.1 API 接口定义 (`/api/chat`)
*   **请求方法**：`POST`
*   **路径**：`/api/chat`
*   **请求头**：`Content-Type: application/json`
*   **请求体参数**：
    ```json
    { "messages": [{ "role": "user" | "assistant", "content": "string" }] }
    ```
*   **LLM 调用配置**：
    *   Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`
    *   模型：`qwen-plus`
    *   输出格式：`response_format: { type: 'json_object' }`
*   **响应体格式 (Success 200)**：
    ```json
    {
      "reply": "为您推荐...",
      "products": [{ "id": "p1", "name": "...", "price": 1299, "imageUrl": "/data/..." }]
    }
    ```
*   **异常状态码**：`400` (格式错误), `500` (内部调用LLM失败)。

### 5.2 数据库结构设计 (`products.ts`)
纯前端静态导出数组，实现 `Product` 接口约束：
*   `id`: `string` (主键，如 "p1")
*   `name`: `string` (商品名称)
*   `description`: `string` (商品简介)
*   `category`: `string` (类目：电子产品、服装、鞋类等)
*   `price`: `number` (价格，数值型)
*   `imageUrl`: `string` (**绝对路径**，必须指向 `/data/*.png`，不可使用反斜杠或相对路径)

### 5.3 第三方服务接入
*   **密钥位置**：根目录 `.env.local` 必须定义 `DASHSCOPE_API_KEY`。
*   **SDK 选用**：必须使用官方 `openai` NPM 包通过更改 `baseURL` 实现阿里云服务的兼容调用。

### 5.4 代码编写规范
*   **模块化拆分**：UI 必须切分为 `ChatWindow` (对话流容器), `MessageBubble` (单条气泡解析), `ProductCard` (独立商品卡片)。
*   **样式类合并**：所有复用组件的 `className` 必须通过 `cn` 工具函数 (`tailwind-merge` + `clsx`) 进行安全合并。
*   **Hooks 约束**：由于使用了 App Router，所有包含状态 (useState/useEffect) 或事件监听的组件及页面文件顶部必须声明 `'use client'`。
*   **资源路径约束**：所有本地静态图片必须放置在 `public/data/` 目录下，代码中通过 `/data/filename.png` 绝对路径引用。
