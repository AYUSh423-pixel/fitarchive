'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Database,
  Download,
  Key,
  LogOut,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

export default function SettingsPrivacyPage() {
  const [aiConfigured, setAiConfigured] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq' | 'openrouter' | 'custom'>('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState('');

  const loadStatus = async () => {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setAiConfigured(Boolean(d.aiConfigured));
      setSupabaseConfigured(Boolean(d.supabaseConfigured));
    }

    const keyRes = await fetch('/api/settings/ai-key', { cache: 'no-store' });
    if (keyRes.ok) {
      const kd = await keyRes.json();
      setMaskedKey(kd.maskedKey || '');
      if (kd.provider) setProvider(kd.provider);
      if (kd.model) setModel(kd.model);
      if (kd.baseUrl) setBaseUrl(kd.baseUrl);
      if (kd.configured) setAiConfigured(true);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleProviderChange = (p: 'gemini' | 'openai' | 'groq' | 'openrouter' | 'custom') => {
    setProvider(p);
    if (p === 'gemini') {
      setModel('gemini-2.5-flash');
      setBaseUrl('');
    } else if (p === 'openai') {
      setModel('gpt-4o-mini');
      setBaseUrl('https://api.openai.com/v1');
    } else if (p === 'groq') {
      setModel('llama-3.3-70b-versatile');
      setBaseUrl('https://api.groq.com/openai/v1');
    } else if (p === 'openrouter') {
      setModel('deepseek/deepseek-chat');
      setBaseUrl('https://openrouter.ai/api/v1');
    } else if (p === 'custom') {
      setModel('default');
      setBaseUrl('https://api.deepseek.com/v1');
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const res = await fetch('/api/settings/ai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKeyInput,
          model,
          baseUrl,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMaskedKey(d.maskedKey || (apiKeyInput ? `${apiKeyInput.slice(0, 4)}...${apiKeyInput.slice(-4)}` : ''));
        setAiConfigured(d.configured);
        setApiKeyInput('');
        setToast(`AI Provider (${provider}) configured and active!`);
      } else {
        setToast(d.error || 'Failed to save configuration');
      }
    } finally {
      setSavingKey(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    window.location.href = '/';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', newPassword }),
    });
    if (res.ok) {
      setNewPassword('');
      setToast('Password updated securely!');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const res = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore_backup', data: parsed.data || parsed }),
        });
        if (res.ok) setToast('Backup restored successfully!');
      } catch {
        setToast('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Reset and delete all personal food logs, body scans, and workouts?')) return;
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_account' }),
    });
    if (res.ok) {
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {toast && (
        <div className="p-3 rounded-2xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* PASTE AI KEY SECTION - MULTI PROVIDER SUPPORT */}
      <section className="tactile-card-white p-6 space-y-4 border-2 border-[#c05800]/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fff3e0] text-[#c05800] flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#38240d]">
                Connect AI API (Gemini, OpenAI, Groq, OpenRouter, Custom)
              </h2>
              <p className="text-xs text-[#a08a6a]">
                Use any AI API provider for the AI Dietitian Chat and Food Photo Scanner
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              aiConfigured ? 'bg-[#f5f2e0] text-[#713600]' : 'bg-[#fff3e0] text-[#c05800]'
            }`}
          >
            {aiConfigured ? `Active (${provider})` : 'No Key Configured'}
          </span>
        </div>

        {maskedKey && (
          <p className="text-xs font-semibold text-[#c05800]">
            Current Active Key: <code className="bg-[#f5f2e0] px-2 py-0.5 rounded">{maskedKey}</code> • Provider: <strong className="uppercase">{provider}</strong> • Model: <code>{model}</code>
          </p>
        )}

        <form onSubmit={handleSaveApiKey} className="space-y-3.5">
          {/* Provider selector */}
          <div>
            <label className="text-xs font-semibold text-[#713600] block mb-1">
              Select AI Provider:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini' },
                { id: 'openai', label: 'OpenAI (ChatGPT)' },
                { id: 'groq', label: 'Groq (Free/Fast)' },
                { id: 'openrouter', label: 'OpenRouter' },
                { id: 'custom', label: 'Custom Website' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleProviderChange(p.id as any)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    provider === p.id
                      ? 'bg-[#c05800] text-white border-[#c05800] shadow-xs'
                      : 'bg-[#f5f2e0] text-[#713600] border-[#e8e4d0] hover:bg-[#e8e4d0]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Base URL if custom or openrouter */}
          {(provider === 'custom' || provider === 'openrouter') && (
            <div>
              <label className="text-xs font-semibold text-[#713600] block mb-1">
                API Base URL (e.g. https://api.deepseek.com/v1, https://api.together.xyz/v1, or https://openrouter.ai/api/v1):
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="tactile-input w-full px-4 py-2.5 text-xs font-mono"
              />
            </div>
          )}

          {/* Model Name */}
          <div>
            <label className="text-xs font-semibold text-[#713600] block mb-1">
              Model Name:
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'}
              className="tactile-input w-full px-4 py-2.5 text-xs font-mono"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-semibold text-[#713600] block mb-1">
              Paste your {provider === 'gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : provider === 'groq' ? 'Groq' : provider === 'openrouter' ? 'OpenRouter' : 'Website'} API Key:
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-... or gsk_...'}
                className="tactile-input flex-1 px-4 py-2.5 text-xs font-mono"
              />
              <button
                type="submit"
                disabled={!apiKeyInput.trim() || savingKey}
                className="px-5 py-2.5 rounded-full bg-[#c05800] hover:bg-[#a04800] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingKey ? 'Saving...' : 'Save AI Key'}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#a08a6a] leading-relaxed bg-[#f5f2e0] p-3 rounded-xl space-y-1">
            <p><strong>Where to get keys:</strong></p>
            <p>• <strong>Google Gemini (Free):</strong> <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">aistudio.google.com/apikey</a></p>
            <p>• <strong>Groq (Free & Ultra-fast):</strong> <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">console.groq.com/keys</a></p>
            <p>• <strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">platform.openai.com/api-keys</a></p>
            <p>• <strong>OpenRouter:</strong> <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">openrouter.ai/keys</a></p>
            <p className="pt-1">Your key is stored securely server-side and never exposed to the client browser.</p>
          </div>
        </form>
      </section>

      {/* ANDROID APK DOWNLOAD & INSTALL GUIDE */}
      <section className="tactile-card-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#fff3e0] text-[#c05800] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#38240d]">
              Download / Install as Mobile App (APK & PWA)
            </h2>
            <p className="text-xs text-[#a08a6a]">How to run NutriFit as an installed app on your phone</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#a08a6a] leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-[#f5f2e0] space-y-1">
            <p className="font-bold text-[#38240d]">Option 1: Instant Phone Install (PWA — Works on Android & iOS)</p>
            <p>1. Open this website in Chrome on your phone.</p>
            <p>2. Tap the browser menu (<strong>⋮</strong> on Android or <strong>Share</strong> on iPhone) and select <strong>&ldquo;Add to Home Screen&rdquo;</strong> / <strong>&ldquo;Install App&rdquo;</strong>.</p>
            <p>3. It installs directly to your app drawer with the NutriFit logo and runs fullscreen.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f5f2e0] space-y-1">
            <p className="font-bold text-[#38240d]">Option 2: Generate Signed Android APK File</p>
            <p>To generate a standalone <code className="bg-[#e8e4d0] px-1 rounded">.apk</code> file to install on any Android phone:</p>
            <p>1. Host or deploy your app (e.g. 1-click on Vercel free).</p>
            <p>2. Go to <strong>PWABuilder.com</strong> (by Microsoft), paste your app URL.</p>
            <p>3. Click <strong>&ldquo;Package for Android&rdquo;</strong> &rarr; Download the compiled <code className="bg-[#e8e4d0] px-1 rounded">.apk</code>!</p>
          </div>
        </div>
      </section>

      {/* System & Integration Status */}
      <section className="tactile-card-white p-6 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Database className="w-5 h-5 text-[#c05800]" /> Backend & Storage Status
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#f5f2e0] space-y-1">
            <p className="font-bold text-[#38240d] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#c05800]" /> AI Engine
            </p>
            <p className="text-[#a08a6a]">
              {aiConfigured
                ? 'Live Gemini Vision & Dietitian active.'
                : 'Local Smart Fallback active.'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#f5f2e0] space-y-1">
            <p className="font-bold text-[#38240d]">Database Storage</p>
            <p className="text-[#a08a6a]">
              {supabaseConfigured
                ? 'Supabase PostgreSQL + RLS connected.'
                : 'Local encrypted server-side JSON store (./data/nutrifit-db.json).'}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="tactile-card-white p-6 space-y-4">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#c05800]" /> Privacy & Account Security
        </h2>

        <form onSubmit={handleChangePassword} className="flex gap-2">
          <input
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (6+ chars)"
            className="tactile-input flex-1 px-3.5 py-2 text-sm"
          />
          <button type="submit" className="px-4 py-2 rounded-full bg-[#38240d] text-white text-xs font-semibold cursor-pointer">
            Update Password
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-full bg-[#f5f2e0] hover:bg-[#e8e4d0] text-xs font-semibold text-[#713600] flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out of Session
        </button>
      </section>

      {/* Backups & Data Export */}
      <section className="tactile-card-white p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Backups, Export & Account Reset</h2>
        <div className="flex flex-wrap gap-2.5">
          <a
            href="/api/account"
            className="px-4 py-2.5 rounded-full bg-[#f5f2e0] text-[#713600] text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Full JSON Backup
          </a>
          <label className="px-4 py-2.5 rounded-full bg-[#fff3e0] text-[#c05800] text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" /> Restore Backup
            <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
          </label>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2.5 rounded-full bg-[#fee2e2] text-[#dc2626] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete & Reset Account
          </button>
        </div>
      </section>
    </div>
  );
}