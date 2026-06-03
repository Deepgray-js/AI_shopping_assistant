'use client';

import { useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { ProductCard } from '@/components/ProductCard';
import { Message } from '@/components/MessageBubble';
import type { AgentMetadata, Product } from '@/lib/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是朝夕拾画AI导购系统。想要找商品，或者查询最近订单、发货进度，都可以直接问我。',
      timestamp: 1716768000000,
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            products: msg.products,
            orders: msg.orders,
            steps: msg.steps,
            metadata: msg.metadata,
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        products: data.products,
        orders: data.orders,
        steps: data.steps,
        metadata: data.metadata as AgentMetadata | undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.products && data.products.length > 0) {
        setRecommendedProducts(data.products);
      } else {
        setRecommendedProducts([]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，系统出现了一些问题，请稍后再试。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8 flex gap-8 justify-center items-center">
      <div className="w-full max-w-3xl h-[90vh] md:h-[80vh]">
        <ChatWindow 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isTyping={isTyping}
        />
      </div>
      <div className="hidden lg:block w-80 overflow-y-auto h-[90vh] md:h-[80vh] pr-2 custom-scrollbar">
        <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider sticky top-0 bg-gray-100 py-2 z-10">
          {recommendedProducts.length > 0 ? '推荐商品' : '暂无推荐'}
        </h2>
        <div className="flex flex-col gap-4 pb-8">
          {recommendedProducts.map(product => (
            <ProductCard 
              key={product.id}
              product={product} 
              onAddToCart={() => alert(`已将 ${product.name} 加入购物车`)}
              onFavorite={() => alert(`已收藏 ${product.name}`)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
