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
    <div className="flex flex-col max-w-2xl mx-auto" style={{ height: 'calc(100dvh - 9rem)' }}>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3 no-scrollbar">
        {!hasMessages && (
          <>
            <div className="bg-white rounded-[18px] p-4 shadow-sm max-w-[85%]">
              <p className="text-[#38240d] text-sm leading-relaxed">
                Hi! I can help you reach 130g protein on a pure-veg, no-egg day. What should we work on?
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#a08a6a] px-1">TRY ASKING</p>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left bg-white rounded-2xl px-4 py-3.5 text-sm text-[#38240d] font-medium shadow-sm hover:bg-[#faf9f5] active:scale-[0.98] transition-all cursor-pointer border border-[#e8e4d0]"
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#fff3e0] flex items-center justify-center mr-2 mt-1 shrink-0 text-[#c05800] text-[10px] font-bold">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-[18px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#c05800] text-white rounded-br-sm'
                  : 'bg-white text-[#38240d] shadow-sm rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#fff3e0] flex items-center justify-center text-[#c05800] text-[10px] font-bold">AI</div>
            <div className="bg-white rounded-[18px] px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#e8e4d0] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center pt-3 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask your dietitian…"
          className="flex-1 bg-white rounded-full px-5 py-3.5 text-sm text-[#38240d] placeholder-[#a08a6a] border border-[#e8e4d0] focus:outline-none focus:border-[#c05800] shadow-sm"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          className="w-12 h-12 rounded-full bg-[#c05800] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(192,88,0,0.4)] disabled:opacity-40 active:scale-95 transition-transform cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}