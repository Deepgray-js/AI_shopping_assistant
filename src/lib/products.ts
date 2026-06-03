import type { Product } from '@/lib/types';

export const products: Product[] = [
  {
    id: "p1",
    name: "智能降噪耳机",
    description: "高级主动降噪，提供沉浸式音频体验。电池续航长达30小时。",
    category: "电子产品",
    price: 1299,
    imageUrl: "/data/airpods.png",
    tags: ["降噪", "蓝牙", "通勤"],
    scenes: ["通勤", "办公", "运动"]
  },
  {
    id: "p2",
    name: "4K超高清智能电视",
    description: "65英寸无边框设计，支持HDR10+，内置多种流媒体应用。",
    category: "电子产品",
    price: 3999,
    imageUrl: "/data/TV.png",
    tags: ["家庭影音", "大屏"],
    scenes: ["客厅", "家庭"]
  },
  {
    id: "p3",
    name: "轻薄办公笔记本",
    description: "搭载最新一代处理器，16GB内存，512GB SSD，仅重1.2kg。",
    category: "电子产品",
    price: 5499,
    imageUrl: "/data/computer.png",
    tags: ["轻薄", "办公", "便携"],
    scenes: ["办公", "出差"]
  },
  {
    id: "p4",
    name: "经典舒适纯棉T恤",
    description: "100%精梳棉，透气吸汗，多种颜色可选，日常百搭。",
    category: "服装",
    price: 99,
    imageUrl: "/data/Tshirt.png",
    tags: ["纯棉", "舒适", "百搭"],
    scenes: ["日常", "通勤"]
  },
  {
    id: "p5",
    name: "防水户外冲锋衣",
    description: "专业防水透气面料，适合登山、徒步等各种户外运动。",
    category: "服装",
    price: 459,
    imageUrl: "/data/clothes.png",
    tags: ["防水", "户外", "透气"],
    scenes: ["徒步", "登山", "户外"]
  },
  {
    id: "p6",
    name: "云感轻弹跑鞋",
    description: "轻量化减震设计，鞋口柔软不磨脚，适合日常通勤和中短距离步行。",
    category: "鞋类",
    price: 599,
    imageUrl: "/data/runningshoes.png",
    tags: ["鞋类", "不磨脚", "缓震", "轻量"],
    scenes: ["通勤", "步行", "日常"]
  },
  {
    id: "p11",
    name: "轻盈通勤休闲鞋",
    description: "鞋面柔软贴合，后跟包裹舒适，适合通勤久走，减少磨脚感。",
    category: "鞋类",
    price: 399,
    imageUrl: "/data/runningshoes.png",
    tags: ["鞋类", "不磨脚", "轻便", "通勤"],
    scenes: ["通勤", "步行", "日常"]
  },
  {
    id: "p12",
    name: "宽楦健走缓震鞋",
    description: "宽楦设计搭配柔软中底，适合走路较多和长时间站立人群。",
    category: "鞋类",
    price: 459,
    imageUrl: "/data/runningshoes.png",
    tags: ["鞋类", "宽楦", "不磨脚", "缓震"],
    scenes: ["健走", "久站", "通勤"]
  },
  {
    id: "p13",
    name: "平价舒适慢跑鞋",
    description: "入门级缓震和透气鞋面，价格友好，适合作为预算有限的替代选择。",
    category: "鞋类",
    price: 299,
    imageUrl: "/data/runningshoes.png",
    tags: ["鞋类", "平价", "透气", "缓震"],
    scenes: ["日常", "慢跑", "通勤"]
  },
  {
    id: "p14",
    name: "长距离支撑训练鞋",
    description: "更强支撑和耐磨外底，适合每天走路较多或需要长距离通勤的人群。",
    category: "鞋类",
    price: 699,
    imageUrl: "/data/runningshoes.png",
    tags: ["鞋类", "支撑", "耐磨", "不磨脚"],
    scenes: ["长距离步行", "通勤", "训练"]
  },
  {
    id: "p7",
    name: "全自动咖啡机",
    description: "一键制作意式浓缩、卡布奇诺等多种咖啡，易于清洗。",
    category: "家居家电",
    price: 2599,
    imageUrl: "/data/coffemacine.png",
    tags: ["咖啡", "家电"],
    scenes: ["家居"]
  },
  {
    id: "p8",
    name: "多功能电饭煲",
    description: "智能预约，多种烹饪模式，不粘内胆，煮饭更香甜。",
    category: "家居家电",
    price: 299,
    imageUrl: "/data/cook.png",
    tags: ["厨房", "做饭"],
    scenes: ["家居"]
  },
  {
    id: "p9",
    name: "人体工学办公椅",
    description: "可调节腰托和扶手，透气网布，保护脊椎，久坐不累。",
    category: "家居",
    price: 899,
    imageUrl: "/data/chair.png",
    tags: ["办公", "舒适"],
    scenes: ["办公", "家居"]
  },
  {
    id: "p10",
    name: "便携保温杯",
    description: "316不锈钢内胆，24小时长效保温保冷，容量500ml。",
    category: "日常用品",
    price: 129,
    imageUrl: "/data/cup.png",
    tags: ["保温", "便携"],
    scenes: ["通勤", "日常"]
  }
];
