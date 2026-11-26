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

const NAV_GROUPS = [
  {
    label: 'Daily Nutrition',
    items: [
      { href: '/', label: 'Home Dashboard', icon: Home },
      { href: '/diary', label: 'Food Diary', icon: BookOpen },
      { href: '/scanner', label: 'AI Meal Scanner', icon: Camera },
      { href: '/explore', label: 'Indian Food DB', icon: UtensilsCrossed },
      { href: '/coach', label: 'AI Dietitian', icon: Sparkles },
    ],
  },
  {
    label: 'Planning & Fitness',
    items: [
      { href: '/planner', label: 'Meal Planner', icon: CalendarDays },
      { href: '/workouts', label: 'Gym & Workouts', icon: Dumbbell },
      { href: '/progress', label: 'Transformation', icon: Activity },
      { href: '/habits', label: 'Water & Habits', icon: Droplets },
      { href: '/grocery', label: 'Grocery & Budget', icon: ShoppingCart },
    ],
  },
  {
    label: 'Insights & Account',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/profile', label: 'Body Profile', icon: User },
      { href: '/onboarding', label: 'Onboarding', icon: Leaf },
      { href: '/settings', label: 'Settings & Privacy', icon: Settings },
    ],
  },
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

  const pageTitle =
    ROUTE_TITLES[pathname] || (pathname.startsWith('/recipes/') ? 'Recipe Details' : 'NutriFit AI');

  return (
    <div className="min-h-screen flex bg-[#fdfbd4] text-[#38240d]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#e8e4d0]/80 px-4 py-5 z-40 overflow-y-auto no-scrollbar">
        <Link href="/" className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#713600] text-white flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display font-bold text-lg leading-tight text-[#38240d]">NutriFit AI</p>
            <p className="text-[11px] font-semibold text-[#713600]">Pure Veg • Lean Athletic</p>
          </div>
        </Link>

        <nav className="space-y-5 flex-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#a08a6a] mb-1.5">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-[#f5f2e0] text-[#713600] shadow-xs'
                          : 'text-[#713600] hover:bg-[#f0ece0] hover:text-[#38240d]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Column */}
      <div className={`flex-1 lg:pl-64 flex flex-col min-h-screen w-full ${isScannerPage ? 'bg-[#38240d]' : ''}`}>
        {/* Top Header — new clean design, hidden on scanner */}
        {!isScannerPage && (
          <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-xl border-b border-[#e8e4d0]/40 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a08a6a] hover:text-[#38240d] shadow-sm"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-display text-lg sm:text-xl font-bold text-[#38240d] tracking-tight">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/explore"
                aria-label="Search Indian foods"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a08a6a] hover:text-[#38240d] shadow-sm transition-colors"
              >
                <Search className="w-[18px] h-[18px]" />
              </Link>
              <Link
                href="/profile"
                aria-label="Body profile"
                className="w-9 h-9 rounded-full bg-[#713600] text-white flex items-center justify-center shadow-sm font-bold text-sm"
              >
                {auth.name ? auth.name.charAt(0).toUpperCase() : <User className="w-[17px] h-[17px]" />}
              </Link>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={isScannerPage ? "flex-1 w-full" : "flex-1 w-full max-w-2xl mx-auto px-4 sm:px-5 pt-5 pb-36 lg:pb-12"}>
          {children}
        </main>
      </div>

      {/* Mobile Slide-Out Menu Drawer for All 15 Screens */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 max-w-[82vw] bg-white h-full p-5 overflow-y-auto shadow-2xl z-10">
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
            <div className="space-y-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-[#a08a6a] mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Pill Bottom Navigation — Hidden on Scanner Page */}
      {!isScannerPage && (
        <nav
          aria-label="Primary Mobile Navigation"
          className="lg:hidden fixed bottom-4 inset-x-4 z-40 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto bg-white rounded-[28px] px-4 py-2.5 shadow-[0_8px_32px_rgba(56,36,13,0.12)] flex items-center gap-0 w-full max-w-sm">
            <Link
              href="/"
              className={`flex flex-col items-center flex-1 py-1 rounded-2xl text-[11px] font-semibold transition-colors ${
                pathname === '/' ? 'text-[#713600]' : 'text-[#a08a6a] hover:text-[#38240d]'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Today</span>
            </Link>
            <Link
              href="/diary"
              className={`flex flex-col items-center flex-1 py-1 rounded-2xl text-[11px] font-semibold transition-colors ${
                pathname === '/diary' ? 'text-[#713600]' : 'text-[#a08a6a] hover:text-[#38240d]'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span>Diary</span>
            </Link>

            {/* Centre Camera FAB — Prominently elevated above nav bar */}
            <div className="flex flex-col items-center flex-1 -mt-9 relative z-50">
              <Link
                href="/scanner"
                aria-label="Scan Meal"
                className="w-[66px] h-[66px] rounded-full bg-[#713600] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(113,54,0,0.45)] border-[5px] border-white active:scale-95 transition-all"
              >
                <Camera className="w-7 h-7 text-white stroke-[2.2]" />
              </Link>
            </div>

            <Link
              href="/explore"
              className={`flex flex-col items-center flex-1 py-1 rounded-2xl text-[11px] font-semibold transition-colors ${
                pathname === '/explore' ? 'text-[#713600]' : 'text-[#a08a6a] hover:text-[#38240d]'
              }`}
            >
              <Compass className="w-5 h-5 mb-0.5" />
              <span>Explore</span>
            </Link>
            <Link
              href="/coach"
              className={`flex flex-col items-center flex-1 py-1 rounded-2xl text-[11px] font-semibold transition-colors ${
                pathname === '/coach' ? 'text-[#713600]' : 'text-[#a08a6a] hover:text-[#38240d]'
              }`}
            >
              <Sparkles className="w-5 h-5 mb-0.5" />
              <span>Coach</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}