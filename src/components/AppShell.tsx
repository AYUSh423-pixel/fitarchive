'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  Compass,
  Dumbbell,
  Droplets,
  Home,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  User,
  UtensilsCrossed,
  X,
  Lock,
  ArrowRight,
  Leaf,
} from 'lucide-react';

interface AuthState {
  checked: boolean;
  authenticated: boolean;
  name?: string;
  email?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Home Dashboard',
  '/diary': 'Food Diary',
  '/scanner': 'Meal Scanner',
  '/explore': 'Indian Food Explore',
  '/coach': 'AI Dietitian',
  '/planner': 'Meal Planner',
  '/workouts': 'Gym & Workouts',
  '/progress': 'Body Transformation',
  '/habits': 'Water & Habits',
  '/grocery': 'Grocery & Budget',
  '/analytics': 'Analytics & Reports',
  '/profile': 'Body Profile',
  '/onboarding': 'Welcome Setup',
  '/settings': 'Settings & Privacy',
};

// Simplified nav items for bottom bar - 5 core destinations
const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/scanner', label: 'Scan', icon: Camera, isCenter: true },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/coach', label: 'Coach', icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isScannerPage = Boolean(pathname?.startsWith('/scanner'));
  const [auth, setAuth] = useState<AuthState>({ checked: false, authenticated: false });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupName, setSignupName] = useState('');
  const [email, setEmail] = useState('personal@nutrifit.local');
  const [password, setPassword] = useState('nutrifit123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth', { cache: 'no-store' });
      const data = await res.json();
      setAuth({
        checked: true,
        authenticated: Boolean(data.authenticated),
        name: data.name,
        email: data.email,
      });
    } catch {
      setAuth({ checked: true, authenticated: false });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleQuickEnter = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quick_personal' }),
      });
      if (res.ok) {
        await checkAuth();
      } else {
        const d = await res.json();
        setAuthError(d.error || 'Failed to start session');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            name: signupName || 'New User',
            email,
            password,
          }),
        });
        const d = await res.json();
        if (res.ok) {
          await checkAuth();
          window.location.href = '/onboarding';
        } else {
          setAuthError(d.error || 'Failed to create account');
        }
      } else {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, password }),
        });
        const d = await res.json();
        if (res.ok) {
          await checkAuth();
        } else {
          setAuthError(d.error || 'Invalid credentials');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (!auth.checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbd4]">
        <div className="tactile-card px-8 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[#713600]/20 text-[#713600] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="font-display font-semibold text-[#38240d]">Loading NutriFit AI...</p>
        </div>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <div className="min-h-screen bg-[#fdfbd4] flex items-center justify-center p-5">
        <div className="tactile-card-white w-full max-w-md p-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#713600] text-white flex items-center justify-center shadow-md">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#713600]">
                Pure Vegetarian • Private Space
              </span>
              <h1 className="font-display text-2xl font-bold text-[#38240d]">NutriFit AI</h1>
            </div>
          </div>

          <p className="text-sm text-[#713600] leading-relaxed">
            Your personal AI dietitian & body transformation companion. Pre-loaded with your{' '}
            <strong className="text-[#38240d]">EVOLT 360 baseline</strong> (76.4 kg • 1,800 kcal • 130g protein) and
            homemade Indian vegetarian food database.
          </p>

          <button
            onClick={handleQuickEnter}
            disabled={authLoading}
            className="w-full py-3.5 px-5 rounded-full bg-[#713600] hover:bg-[#5a2d00] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Continue as {auth.name || 'Ayush'} (Personal Profile)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex p-1 bg-[#f5f2e0] rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-[#38240d] shadow-xs'
                  : 'text-[#a08a6a] hover:text-[#38240d]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-[#38240d] shadow-xs'
                  : 'text-[#a08a6a] hover:text-[#38240d]'
              }`}
            >
              New User (Sign Up)
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-1">Your Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Rahul, Priya, Alex"
                  className="tactile-input w-full px-4 py-2.5 text-sm"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-[#713600] block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="tactile-input w-full px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#713600] block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="tactile-input w-full px-4 py-2.5 text-sm"
                required
                minLength={6}
              />
            </div>
            {authError && <p className="text-xs font-semibold text-[#a04800]">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-full bg-[#38240d] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#4a2f10] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{authMode === 'signup' ? 'Create Account & Start Onboarding' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fdfbd4] text-[#38240d]">
      {/* Main Column - Full width, no sidebar, no top header */}
      <div className={`flex-1 flex flex-col min-h-screen w-full ${isScannerPage ? 'bg-[#38240d]' : ''}`}>
        {/* Page Content - Full width with comfortable padding */}
        <main className={isScannerPage ? "flex-1 w-full" : "flex-1 w-full max-w-2xl mx-auto px-4 sm:px-5 pt-4 pb-28 lg:pb-12"}>
          {children}
        </main>

        {/* Ascending Format Bottom Navigation Bar - Transparent Background */}
        {!isScannerPage && (
          <nav
            aria-label="Primary Mobile Navigation"
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex flex-col items-center pointer-events-none pb-safe"
          >
            {/* Tertiary Row - Smallest (Secondary actions) */}
            <div className="pointer-events-auto flex items-center justify-center gap-4 py-1.5 px-4">
              <Link
                href="/planner"
                aria-label="Meal Planner"
                className="w-8 h-8 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <CalendarDays className="w-4 h-4" />
              </Link>
              <Link
                href="/workouts"
                aria-label="Gym & Workouts"
                className="w-8 h-8 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <Dumbbell className="w-4 h-4" />
              </Link>
              <Link
                href="/progress"
                aria-label="Body Transformation"
                className="w-8 h-8 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <Activity className="w-4 h-4" />
              </Link>
              <Link
                href="/habits"
                aria-label="Water & Habits"
                className="w-8 h-8 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <Droplets className="w-4 h-4" />
              </Link>
              <Link
                href="/grocery"
                aria-label="Grocery & Budget"
                className="w-8 h-8 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <ShoppingCart className="w-4 h-4" />
              </Link>
            </div>

            {/* Secondary Row - Medium (Secondary destinations) */}
            <div className="pointer-events-auto flex items-center justify-center gap-3 py-1 px-4">
              <Link
                href="/settings"
                aria-label="Settings & Privacy"
                className="w-9 h-9 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <Settings className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/profile"
                aria-label="Body Profile"
                className="w-9 h-9 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <User className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/analytics"
                aria-label="Analytics & Reports"
                className="w-9 h-9 rounded-full bg-transparent text-[#a08a6a] hover:text-[#713600] flex items-center justify-center transition-colors active:scale-90"
              >
                <BarChart3 className="w-4.5 h-4.5" />
              </Link>
            </div>

            {/* Primary Row - Largest (Core 5 destinations with center FAB) */}
            <div className="pointer-events-auto w-full max-w-xl mx-auto px-4 pb-safe">
              <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_-4px_24px_rgba(56,36,13,0.08)] border-t border-[#e8e4d0]/40 p-2 flex items-center justify-between">
                {BOTTOM_NAV_ITEMS.map((item, index) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  
                  if (item.isCenter) {
                    // Center FAB - Largest, elevated
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-label={item.label}
                        className="relative z-10 -mt-6"
                      >
                        <div className="w-[72px] h-[72px] rounded-full bg-[#713600] text-white flex items-center justify-center shadow-[0_12px_32px_rgba(113,54,0,0.5)] border-[4px] border-white active:scale-[0.95] transition-all">
                          <Icon className="w-8 h-8 text-white stroke-[2.2]" />
                        </div>
                      </Link>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex flex-col items-center flex-1 py-2.5 px-1 rounded-[24px] text-[11px] font-semibold transition-all ${
                        active
                          ? 'text-[#713600] bg-[#f5f2e0]/80'
                          : 'text-[#a08a6a] hover:text-[#38240d]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-0.5 transition-transform ${active ? 'scale-110' : ''}`} />
                      <span className={active ? 'font-bold' : ''}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile Slide-Out Menu Drawer (Full Navigation) - Accessible via long-press or swipe */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 max-w-[82vw] bg-white h-full p-5 overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#713600] text-white flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-lg">NutriFit AI</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-[#f0ece0] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-5">
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-[#a08a6a] mb-1.5">Core</p>
                <div className="space-y-1">
                  {BOTTOM_NAV_ITEMS.filter(i => !i.isCenter).map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold ${
                          active ? 'bg-[#f5f2e0] text-[#713600]' : 'text-[#713600]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <Link
                    href="/scanner"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600] bg-[#f5f2e0]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>AI Meal Scanner</span>
                  </Link>
                </div>
              </div>
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-[#a08a6a] mb-1.5">Planning & Fitness</p>
                <div className="space-y-1">
                  <Link
                    href="/planner"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Meal Planner</span>
                  </Link>
                  <Link
                    href="/workouts"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span>Gym & Workouts</span>
                  </Link>
                  <Link
                    href="/progress"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Transformation</span>
                  </Link>
                  <Link
                    href="/habits"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <Droplets className="w-4 h-4" />
                    <span>Water & Habits</span>
                  </Link>
                  <Link
                    href="/grocery"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Grocery & Budget</span>
                  </Link>
                </div>
              </div>
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-[#a08a6a] mb-1.5">Insights & Account</p>
                <div className="space-y-1">
                  <Link
                    href="/analytics"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <User className="w-4 h-4" />
                    <span>Body Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#713600]"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings & Privacy</span>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Minimal, accessible via hover or keyboard */}
      <aside className="hidden lg:flex lg:flex-col lg:w-16 lg:fixed lg:inset-y-0 bg-white/60 backdrop-blur-xl border-r border-[#e8e4d0]/40 px-2 py-5 z-30 overflow-y-auto no-scrollbar" role="navigation" aria-label="Main navigation">
        <Link href="/" className="flex flex-col items-center gap-1 px-1 py-3 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-[#713600] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5" />
          </div>
        </Link>
        <nav className="space-y-2 flex-1" style={{ scrollbarGutter: 'stable' }}>
          {BOTTOM_NAV_ITEMS.filter(i => !i.isCenter).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-1 py-3 rounded-2xl text-[10px] font-semibold transition-all ${
                  active
                    ? 'text-[#713600] bg-[#f5f2e0]/80'
                    : 'text-[#a08a6a] hover:text-[#38240d] hover:bg-[#f0ece0]/60'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                <span className={active ? 'font-bold' : ''}>{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/scanner"
            className="flex flex-col items-center gap-1 px-1 py-3 rounded-2xl text-[10px] font-semibold text-[#713600] bg-[#f5f2e0]/80"
            title="AI Meal Scanner"
          >
            <Camera className="w-5 h-5" />
            <span className="font-bold">Scan</span>
          </Link>
        </nav>
        <div className="space-y-2 pt-4 border-t border-[#e8e4d0]/40">
          <Link
            href="/settings"
            className="flex flex-col items-center gap-1 px-1 py-2.5 rounded-2xl text-[10px] font-medium text-[#a08a6a] hover:text-[#713600] hover:bg-[#f0ece0]/60 transition-colors"
            title="Settings & Privacy"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 px-1 py-2.5 rounded-2xl text-[10px] font-medium text-[#a08a6a] hover:text-[#713600] hover:bg-[#f0ece0]/60 transition-colors"
            title="Body Profile"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}