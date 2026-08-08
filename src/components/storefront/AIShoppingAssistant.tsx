import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, User } from 'lucide-react';
import { Product } from '../../types/product';
import { chatWithRAG } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export const AIShoppingAssistant: React.FC<Props> = ({ isOpen, onClose, onAddToCart }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hey! I'm ALGUD AI. Ask me anything about our catalog — fits, budgets, gifting, tech, or style."
    }
  ]);
  const chatHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role: 'user', content: userMsg }];
    setLoading(true);

    try {
      const result = await chatWithRAG(userMsg, 4, undefined, chatHistoryRef.current);
      const aiText = result.answer || "I'm not sure about that one. Can you rephrase?";
      setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
      chatHistoryRef.current = [...chatHistoryRef.current, { role: 'assistant', content: aiText }];
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">ALGUD AI Assistant</h3>
            <p className="text-[10px] text-gray-500 font-medium">Online • RAG-powered</p>
          </div>
        </div>

        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`p-3 rounded-xl text-xs max-w-[80%] leading-relaxed whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'bg-red-600 text-white rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 mt-1">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-xl text-xs bg-white border border-gray-200 text-gray-500">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex items-center gap-2 bg-white">
        <input
          type="text"
          placeholder="Ask about products, fits, budgets..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 disabled:opacity-60"
        />
        <button type="submit" disabled={loading || !input.trim()} className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
