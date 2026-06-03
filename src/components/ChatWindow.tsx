'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Paperclip } from 'lucide-react';
import { MessageBubble, Message } from './MessageBubble';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isTyping = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 w-full max-w-4xl mx-auto border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">朝夕拾画AI导购系统</h2>
          <p className="text-xs text-gray-500">支持商品推荐与订单进度查询</p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon size={32} className="text-gray-300" />
            </div>
            <p>可以问我商品推荐，也可以查询订单进度。</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-400 text-sm p-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>AI 正在思考...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
          <button 
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white"
            aria-label="Add attachment"
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入商品需求，或问“我的订单在哪里”"
            className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none py-2 px-2 text-sm text-gray-700 placeholder-gray-400"
            rows={1}
          />
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-gray-400">内容由 AI 生成，请注意甄别</span>
        </div>
      </div>
    </div>
  );
};
