'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import type { AiMessage } from '@/types/nutrifit';

const QUICK_PROMPTS = [
  'Plan today around 1,800 kcal',
  'High-protein pure-veg dinner ideas',
  'Cut body fat, keep muscle',
];

export default function AiDietitianPage() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadChat = async () => {
    const res = await fetch('/api/ai/chat', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages || []);
    }
  };

  useEffect(() => { loadChat(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      if (res.ok) {
        const d = await res.json();
        setMessages((prev) => [...prev, d.userMsg, d.assistantMsg]);
      }
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col max-w-2xl mx-auto" style={{ height: 'calc(100dvh - 8.5rem)' }}>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3 no-scrollbar">
        {!hasMessages && (
          <div className="space-y-4 animate-fade-in">
            <div className="card-minimal p-4 max-w-[90%]">
              <p className="text-[#1C1917] text-sm leading-relaxed">
                Namaste! I am your AI Indian Dietitian. I can help you reach your protein and calorie goals with 100% pure vegetarian, satvik, or Jain options. What would you like to plan today?
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#8C827A] px-1">TRY ASKING</p>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left card-minimal px-4 py-3 text-sm text-[#1C1917] font-medium tactile-press hover:border-[#B45309]/50 transition-all cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-scale-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center mr-2 mt-1 shrink-0 text-[#B45309] text-[10px] font-bold shadow-xs">
                AI
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-[18px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#B45309] text-white rounded-br-xs shadow-sm'
                  : 'card-minimal text-[#1C1917] rounded-bl-xs'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#B45309] text-[10px] font-bold">
              AI
            </div>
            <div className="card-minimal px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#B45309]/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center pt-2 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask your dietitian…"
          className="flex-1 bg-white rounded-full px-5 py-3 text-sm text-[#1C1917] placeholder-[#8C827A] border border-[#E7E3D8] focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15 shadow-sm transition-all"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full bg-[#B45309] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(180,83,9,0.3)] disabled:opacity-40 tactile-press transition-all cursor-pointer shrink-0"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}