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
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_account' }),
    });
    if (res.ok) {
      window.location.href = '/';
    }
    setShowDeleteConfirm(false);
  };

  const providers = [
    { id: 'gemini' as const, label: 'Google Gemini', icon: '🔮' },
    { id: 'openai' as const, label: 'OpenAI (ChatGPT)', icon: '🤖' },
    { id: 'groq' as const, label: 'Groq (Free/Fast)', icon: '⚡' },
    { id: 'openrouter' as const, label: 'OpenRouter', icon: '🔀' },
    { id: 'custom' as const, label: 'Custom Website', icon: '🌐' },
  ];

  const getProviderLabel = (p: string) => {
    switch (p) {
      case 'gemini': return 'Google Gemini';
      case 'openai': return 'OpenAI';
      case 'groq': return 'Groq';
      case 'openrouter': return 'OpenRouter';
      default: return 'Website';
    }
  };

  const getKeyPlaceholder = (p: string) => {
    return p === 'gemini' ? 'AIzaSy...' : 'sk-... or gsk_...';
  };

  const getModelPlaceholder = (p: string) => {
    switch (p) {
      case 'gemini': return 'gemini-2.5-flash';
      case 'groq': return 'llama-3.3-70b-versatile';
      default: return 'gpt-4o-mini';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      {toast && (
        <div className="p-3 rounded-2xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* PASTE AI KEY SECTION - MULTI PROVIDER SUPPORT */}
      <Card variant="white" padding="lg" className="space-y-5 border-2 border-[#c05800]/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#fff3e0] text-[#c05800] flex items-center justify-center shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Connect AI API</CardTitle>
                <CardDescription>
                  Use any AI API provider for the AI Dietitian Chat and Food Photo Scanner
                </CardDescription>
              </div>
            </div>

            <Badge variant={aiConfigured ? 'default' : 'secondary'} size="sm">
              {aiConfigured ? `Active (${provider})` : 'No Key Configured'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {maskedKey && (
            <div className="p-3 rounded-2xl bg-[#fff3e0] border border-[#ffe0b2]">
              <p className="text-xs font-semibold text-[#c05800]">
                Current Active Key:{' '}
                <code className="bg-[#f5f2e0] px-2 py-0.5 rounded">{maskedKey}</code>{' '}
                • Provider: <strong className="uppercase">{provider}</strong>{' '}
                • Model: <code>{model}</code>
              </p>
            </div>
          )}

          <form onSubmit={handleSaveApiKey} className="space-y-5">
            {/* Provider selector */}
            <div>
              <label className="text-xs font-semibold text-[#713600] block mb-2">
                Select AI Provider:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="AI Provider">
                {providers.map((p) => (
                  <Chip
                    key={p.id}
                    variant="default"
                    size="sm"
                    selected={provider === p.id}
                    onSelect={() => handleProviderChange(p.id)}
                    role="radio"
                    aria-checked={provider === p.id}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <span aria-hidden="true">{p.icon}</span>
                    <span>{p.label}</span>
                  </Chip>
                ))}
              </div>
            </div>

            {/* Custom Base URL if custom or openrouter */}
            {(provider === 'custom' || provider === 'openrouter') && (
              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-1">
                  API Base URL (e.g. https://api.deepseek.com/v1, https://api.together.xyz/v1, or https://openrouter.ai/api/v1):
                </label>
                <Input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  size="sm"
                />
              </div>
            )}

            {/* Model Name */}
            <div>
              <label className="text-xs font-semibold text-[#713600] block mb-1">
                Model Name:
              </label>
              <Input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={getModelPlaceholder(provider)}
                size="sm"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs font-semibold text-[#713600] block mb-1">
                Paste your {getProviderLabel(provider)} API Key:
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={getKeyPlaceholder(provider)}
                  size="sm"
                  className="flex-1"
                />
                <Button type="submit" disabled={!apiKeyInput.trim() || savingKey} isLoading={savingKey} size="sm">
                  Save AI Key
                </Button>
              </div>
            </div>

            <div className="text-[11px] text-[#a08a6a] leading-relaxed bg-[#f5f2e0] p-3 rounded-2xl space-y-1">
              <p><strong>Where to get keys:</strong></p>
              <p>• <strong>Google Gemini (Free):</strong> <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">aistudio.google.com/apikey</a></p>
              <p>• <strong>Groq (Free & Ultra-fast):</strong> <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">console.groq.com/keys</a></p>
              <p>• <strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">platform.openai.com/api-keys</a></p>
              <p>• <strong>OpenRouter:</strong> <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[#c05800] font-bold underline">openrouter.ai/keys</a></p>
              <p className="pt-1">Your key is stored securely server-side and never exposed to the client browser.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ANDROID APK DOWNLOAD & INSTALL GUIDE */}
      <Card variant="white" padding="lg" className="space-y-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fff3e0] text-[#c05800] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Download / Install as Mobile App (APK & PWA)</CardTitle>
              <CardDescription>How to run NutriFit as an installed app on your phone</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-xs text-[#a08a6a] leading-relaxed">
          <div className="p-4 rounded-2xl bg-[#f5f2e0] space-y-1.5">
            <p className="font-bold text-[#38240d]">Option 1: Instant Phone Install (PWA — Works on Android & iOS)</p>
            <p>1. Open this website in Chrome on your phone.</p>
            <p>2. Tap the browser menu (<strong>⋮</strong> on Android or <strong>Share</strong> on iPhone) and select <strong>&ldquo;Add to Home Screen&rdquo;</strong> / <strong>&ldquo;Install App&rdquo;</strong>.</p>
            <p>3. It installs directly to your app drawer with the NutriFit logo and runs fullscreen.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f2e0] space-y-1.5">
            <p className="font-bold text-[#38240d]">Option 2: Generate Signed Android APK File</p>
            <p>To generate a standalone <code className="bg-[#e8e4d0] px-1 rounded">.apk</code> file to install on any Android phone:</p>
            <p>1. Host or deploy your app (e.g. 1-click on Vercel free).</p>
            <p>2. Go to <strong>PWABuilder.com</strong> (by Microsoft), paste your app URL.</p>
            <p>3. Click <strong>&ldquo;Package for Android&rdquo;</strong> &rarr; Download the compiled <code className="bg-[#e8e4d0] px-1 rounded">.apk</code>!</p>
          </div>
        </CardContent>
      </Card>

      {/* System & Integration Status */}
      <Card variant="white" padding="lg" className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#c05800]" /> Backend & Storage Status
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#f5f2e0] space-y-1">
              <p className="font-bold text-[#38240d] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c05800]" /> AI Engine
              </p>
              <p className="text-[#a08a6a]">
                {aiConfigured
                  ? 'Live Gemini Vision & Dietitian active.'
                  : 'Local Smart Fallback active.'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#f5f2e0] space-y-1">
              <p className="font-bold text-[#38240d]">Database Storage</p>
              <p className="text-[#a08a6a]">
                {supabaseConfigured
                  ? 'Supabase PostgreSQL + RLS connected.'
                  : 'Local encrypted server-side JSON store (./data/nutrifit-db.json).'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card variant="white" padding="lg" className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#c05800]" /> Privacy & Account Security
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <form onSubmit={handleChangePassword} className="flex gap-2">
            <Input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (6+ chars)"
              size="sm"
              className="flex-1"
            />
            <Button type="submit" size="sm">Update Password</Button>
          </form>

          <Button variant="ghost" size="sm" leftIcon={<LogOut className="w-4 h-4" />} onClick={handleLogout} className="w-full justify-start">
            Sign Out of Session
          </Button>
        </CardContent>
      </Card>

      {/* Backups & Data Export */}
      <Card variant="white" padding="lg" className="space-y-4">
        <CardHeader>
          <CardTitle>Backups, Export & Account Reset</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-2.5">
          <a
            href="/api/account"
            className="flex items-center"
          >
            <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Export Full JSON Backup
            </Button>
          </a>
          <label className="flex items-center cursor-pointer">
            <Button variant="ghost" size="sm" leftIcon={<Upload className="w-4 h-4" />} className="bg-[#fff3e0] text-[#c05800] hover:bg-[#ffe0b2]">
              Restore Backup
            </Button>
            <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
          </label>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete & Reset Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete & Reset Account"
        message="This will permanently delete all your personal food logs, body scans, workouts, and settings. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}