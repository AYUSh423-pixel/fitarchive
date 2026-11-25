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
      if (kd.configured) setAiConfigured(true);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const res = await fetch('/api/settings/ai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      });
      const d = await res.json();
      if (res.ok) {
        setMaskedKey(d.maskedKey || '');
        setAiConfigured(d.configured);
        setApiKeyInput('');
        setToast('Gemini API key saved & active for Photo Vision & AI Dietitian!');
      } else {
        setToast(d.error || 'Failed to save key');
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
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* PASTE AI KEY SECTION */}
      <section className="tactile-card-white p-6 space-y-4 border-2 border-[#FB923C]/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFEDD5] text-[#944A00] flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#1B1B1E]">
                Google Gemini AI Key (Photo Vision &amp; Dietitian)
              </h2>
              <p className="text-xs text-[#554337]">
                Paste your API key here or in <code className="bg-[#F2EFE9] px-1 rounded">.env.local</code>
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              aiConfigured ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#FFEDD5] text-[#7C2D12]'
            }`}
          >
            {aiConfigured ? 'Active' : 'Missing Key'}
          </span>
        </div>

        {maskedKey && (
          <p className="text-xs font-semibold text-[#006C4B]">
            Current Active Key: <code className="bg-[#DCFCE7] px-2 py-0.5 rounded">{maskedKey}</code>
          </p>
        )}

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#554337] block mb-1">
              Paste your Google Gemini API Key:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="tactile-input flex-1 px-4 py-2.5 text-xs font-mono"
              />
              <button
                type="submit"
                disabled={!apiKeyInput.trim() || savingKey}
                className="px-5 py-2.5 rounded-full bg-[#FB923C] hover:bg-[#f97316] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingKey ? 'Saving...' : 'Save AI Key'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#71717A] leading-relaxed">
            Need a key? Get one 100% free from Google at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#944A00] font-bold underline"
            >
              aistudio.google.com/apikey
            </a>
            . Your key is kept secure server-side and never exposed to the public browser.
          </p>
        </form>
      </section>

      {/* ANDROID APK DOWNLOAD & INSTALL GUIDE */}
      <section className="tactile-card-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#1B1B1E]">
              Download / Install as Mobile App (APK &amp; PWA)
            </h2>
            <p className="text-xs text-[#554337]">How to run NutriFit as an installed app on your phone</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#554337] leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-[#F5F3F6] space-y-1">
            <p className="font-bold text-[#1B1B1E]">Option 1: Instant Phone Install (PWA — Works on Android &amp; iOS)</p>
            <p>1. Open this website in Chrome on your phone.</p>
            <p>2. Tap the browser menu (<strong>⋮</strong> on Android or <strong>Share</strong> on iPhone) and select <strong>&ldquo;Add to Home Screen&rdquo;</strong> / <strong>&ldquo;Install App&rdquo;</strong>.</p>
            <p>3. It installs directly to your app drawer with the NutriFit logo and runs fullscreen.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5F3F6] space-y-1">
            <p className="font-bold text-[#1B1B1E]">Option 2: Generate Signed Android APK File</p>
            <p>To generate a standalone <code className="bg-[#E4E0D8] px-1 rounded">.apk</code> file to install on any Android phone:</p>
            <p>1. Host or deploy your app (e.g. 1-click on Vercel free).</p>
            <p>2. Go to <strong>PWABuilder.com</strong> (by Microsoft), paste your app URL.</p>
            <p>3. Click <strong>&ldquo;Package for Android&rdquo;</strong> &rarr; Download the compiled <code className="bg-[#E4E0D8] px-1 rounded">.apk</code>!</p>
          </div>
        </div>
      </section>

      {/* System & Integration Status */}
      <section className="tactile-card-white p-6 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Database className="w-5 h-5 text-[#944A00]" /> Backend &amp; Storage Status
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F5F3F6] space-y-1">
            <p className="font-bold text-[#1B1B1E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FB923C]" /> AI Engine
            </p>
            <p className="text-[#554337]">
              {aiConfigured
                ? 'Live Gemini Vision & Dietitian active.'
                : 'Local Smart Fallback active.'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F5F3F6] space-y-1">
            <p className="font-bold text-[#1B1B1E]">Database Storage</p>
            <p className="text-[#554337]">
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
          <Shield className="w-5 h-5 text-[#006C4B]" /> Privacy &amp; Account Security
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
          <button type="submit" className="px-4 py-2 rounded-full bg-[#1B1B1E] text-white text-xs font-semibold cursor-pointer">
            Update Password
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-full bg-[#F5F3F6] hover:bg-[#EAE7EB] text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out of Session
        </button>
      </section>

      {/* Backups & Data Export */}
      <section className="tactile-card-white p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Backups, Export &amp; Account Reset</h2>
        <div className="flex flex-wrap gap-2.5">
          <a
            href="/api/account"
            className="px-4 py-2.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Full JSON Backup
          </a>
          <label className="px-4 py-2.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" /> Restore Backup
            <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
          </label>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2.5 rounded-full bg-[#FFDAD6] text-[#93000A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete &amp; Reset Account
          </button>
        </div>
      </section>
    </div>
  );
}
