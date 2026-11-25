'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import type { AiMessage } from '@/types/nutrifit';

const QUICK_PROMPTS = [
  'What should I eat for lunch?',
  'How much protein do I still need?',
  'Suggest a vegetarian dinner under 500 calories.',
  'Suggest a high-protein Gujarati meal.',
  'What should I eat before gym?',
  'What should I eat after gym?',
  'Why has my weight not changed?',
  'Can I eat pizza today?',
];

export default function AiDietitianPage() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadChat = async () => {
    const res = await fetch('/api/ai/chat', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages || []);
      setAiConfigured(Boolean(d.aiConfigured));
    }
  };

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    }
  };

  const handleClear = async () => {
    await fetch('/api/ai/chat', { method: 'DELETE' });
    loadChat();
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-11rem)] lg:h-[calc(100vh-7rem)] space-y-3">
      {/* Status Header */}
      <div className="tactile-card-white p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FEF08A] text-[#78350F] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-[#1B1B1E]">
              Personal AI Dietitian (Pure Veg • No Eggs)
            </h2>
            <p className="text-[11px] text-[#554337]">
              {aiConfigured
                ? 'Live Gemini AI connected to your real diary & EVOLT 360 profile'
                : 'Local Smart Dietitian Engine connected to your real diary (Add GEMINI_API_KEY for LLM)'}
            </p>
          </div>
        </div>
        <button
          onClick={handleClear}
          title="Reset conversation"
          className="w-9 h-9 rounded-full bg-[#F5F3F6] flex items-center justify-center text-[#554337] hover:text-[#BA1A1A] cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="px-3.5 py-1.5 rounded-full bg-white border border-[#E4E0D8] hover:border-[#FB923C] text-xs font-semibold text-[#554337] whitespace-nowrap cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  isUser
                    ? 'bg-[#1B1B1E] text-white rounded-br-md'
                    : 'bg-white border border-[#E4E0D8] text-[#1B1B1E] rounded-bl-md shadow-xs'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E4E0D8] rounded-3xl px-4 py-3 text-xs text-[#554337] animate-pulse">
              Checking your food diary &amp; targets...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 pt-1 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about lunch, protein, Gujarati meals, pre/post gym..."
          className="tactile-input flex-1 px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-12 h-12 rounded-full bg-[#FB923C] hover:bg-[#f97316] text-white flex items-center justify-center shadow-md cursor-pointer disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
