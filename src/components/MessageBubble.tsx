import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentMetadata, AgentStep, Order, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { OrderCard } from './OrderCard';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  products?: Product[];
  orders?: Order[];
  steps?: AgentStep[];
  metadata?: AgentMetadata;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const orders = message.orders ?? [];
  const products = message.products ?? [];
  const steps = message.steps ?? [];

  return (
    <div className={cn("flex w-full gap-4 mb-6", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-indigo-100 text-indigo-600" : "bg-teal-100 text-teal-600"
      )}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message Content */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
        isUser 
          ? 'bg-indigo-600 text-white rounded-tr-sm' 
          : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
      )}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800">
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
            {steps.length > 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">智能体执行轨迹</div>
                <div className="mt-2 flex flex-col gap-2">
                  {steps.map((step) => (
                    <div key={step.id} className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{step.title}</span>
                      {' · '}
                      <span>{step.detail}</span>
                      {step.status === 'requires_input' && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          需补充信息
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={() => alert(`已将 ${product.name} 加入购物车`)}
                    onFavorite={() => alert(`已收藏 ${product.name}`)}
                  />
                ))}
              </div>
            )}
            {orders.length > 0 && (
              <div className="grid grid-cols-1 gap-3 mt-2">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    compact={orders.length > 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
