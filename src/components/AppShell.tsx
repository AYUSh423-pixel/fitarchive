'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
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
  Leaf,
  MoreVertical,
  LogOut,
} from 'lucide-react';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

interface AuthState {
  checked: boolean;
  authenticated: boolean;
  name?: string;
  email?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Today',
  '/diary': 'Diary',
  '/scanner': 'Scan Meal',
  '/explore': 'Explore',
  '/coach': 'AI Coach',
  '/planner': 'Meal Planner',
  '/workouts': 'Workouts',
  '/progress': 'Transformation',
  '/habits': 'Habits & Water',
  '/grocery': 'Grocery & Budget',
  '/analytics': 'Analytics',
  '/profile': 'Body Profile',
  '/onboarding': 'Welcome Setup',
  '/settings': 'Settings',
};

const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/scanner', label: 'Scan', icon: Camera, isCenter: true },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/coach', label: 'Coach', icon: Sparkles },
];

const DRAWER_GROUPS = [
  {
    label: 'Nutrition & Daily',
    items: [
      { href: '/', label: 'Today Dashboard', icon: Home },
      { href: '/diary', label: 'Food Diary', icon: BookOpen },
      { href: '/scanner', label: 'AI Meal Scanner', icon: Camera },
      { href: '/explore', label: 'Indian Food DB', icon: UtensilsCrossed },
      { href: '/coach', label: 'AI Dietitian Coach', icon: Sparkles },
    ],
  },
  {
    label: 'Planning & Fitness',
    items: [
      { href: '/planner', label: 'Meal Planner', icon: CalendarDays },
      { href: '/workouts', label: 'Gym & Workouts', icon: Dumbbell },
      { href: '/progress', label: 'Body Transformation', icon: Activity },
      { href: '/habits', label: 'Water & Habits', icon: Droplets },
      { href: '/grocery', label: 'Grocery & Budget', icon: ShoppingCart },
    ],
  },
  {
    label: 'Account & Insights',
    items: [
      { href: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
      { href: '/profile', label: 'Body Profile (EVOLT)', icon: User },
      { href: '/settings', label: 'Settings & Privacy', icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isScannerPage = Boolean(pathname?.startsWith('/scanner'));
  const [auth, setAuth] = useState<AuthState>({ checked: false, authenticated: false });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setAuth({ checked: true, authenticated: false });
    } catch {
      setAuth({ checked: true, authenticated: false });
    }
  };

  const handleQuickEnter = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quick_enter' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quick access failed');
      setAuth({
        checked: true,
        authenticated: true,
        name: data.user.name,
        email: data.user.email,
      });
    } catch (err: unknown) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode === 'signup' ? 'signup' : 'login',
          name: authMode === 'signup' ? signupName : undefined,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      setAuth({
        checked: true,
        authenticated: true,
        name: data.user.name,
        email: data.user.email,
      });
    } catch (err: unknown) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth gate for non-authenticated users
  if (auth.checked && !auth.authenticated) {
    return (
      <div className="min-h-screen bg-[#F6F4EE] flex items-center justify-center p-4">
        <div className="card-minimal max-w-sm w-full p-6 space-y-5 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B45309] text-white flex items-center justify-center shadow-md animate-pulse-glow">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-[#1C1917]">NutriFit AI</h1>
              <p className="text-xs text-[#78716C]">Personal Indian Vegetarian Coach</p>
            </div>
          </div>

          <button
            onClick={handleQuickEnter}
            disabled={authLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#B45309] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(180,83,9,0.3)] active:scale-95 transition-all cursor-pointer tactile-press"
          >
            <span>{authLoading ? 'Entering…' : 'One-Tap Demo Enter'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E7E3D8] w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-[#78716C] uppercase tracking-wider absolute">
              or sign in with password
            </span>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3 pt-1">
            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Your Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Ayush"
                  className="tactile-input w-full px-3.5 py-2.5 text-sm"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="tactile-input w-full px-3.5 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tactile-input w-full px-3.5 py-2.5 text-sm"
                required
                minLength={6}
              />
            </div>
            {authError && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-xl">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-2xl bg-[#1C1917] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-[#78716C]">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-[#B45309] font-semibold underline cursor-pointer"
            >
              {authMode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  const pageTitle = ROUTE_TITLES[pathname] || 'NutriFit AI';
  const isRootToday = pathname === '/';

  return (
    <div className="min-h-screen flex bg-[#F6F4EE] text-[#1C1917]">
      {/* Desktop Sidebar (Only visible on large screens) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#E7E3D8]/80 px-4 py-6 z-40 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-[#B45309] text-white flex items-center justify-center shadow-sm">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-[#1C1917] block">NutriFit AI</span>
            <span className="text-[10px] text-[#78716C] uppercase tracking-wider block">Indian Pure Veg</span>
          </div>
        </div>

        <nav className="space-y-6 flex-1">
          {DRAWER_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] mb-2">
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all tactile-press-sm ${
                        active
                          ? 'bg-[#FEF3C7] text-[#B45309] font-bold shadow-xs'
                          : 'text-[#78716C] hover:bg-[#F6F4EE] hover:text-[#1C1917]'
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

        <div className="pt-4 border-t border-[#E7E3D8] px-2 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#B45309] text-white flex items-center justify-center font-bold text-xs">
              {auth.name ? auth.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <span className="text-xs font-semibold text-[#1C1917] truncate max-w-[120px]">
              {auth.name || 'Member'}
            </span>
          </Link>
          <Link href="/settings" className="w-8 h-8 rounded-full hover:bg-[#F6F4EE] flex items-center justify-center text-[#78716C]">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 lg:pl-64 flex flex-col min-h-screen w-full ${isScannerPage ? 'bg-[#0D1F18]' : ''}`}>
        {/* Subtle Minimal Header on All Pages (mobile) - includes Today page */}
        {!isScannerPage && (
          <header className="sticky top-0 z-30 h-14 bg-[#F6F4EE]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between lg:hidden border-b border-[#E7E3D8]/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#78716C] shadow-xs tactile-press"
              >
                <Menu className="w-4 h-4" />
              </button>
              <h1 className="font-display text-base font-bold text-[#1C1917]">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 relative">
              <Link
                href="/explore"
                aria-label="Explore foods"
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#78716C] shadow-xs tactile-press hover:text-[#B45309] transition-colors"
              >
                <Search className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setMoreMenuOpen((v) => !v)}
                aria-label="More options"
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1C1917] shadow-xs tactile-press hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Functional 3-Dots Quick Actions Popover Menu */}
              {moreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-56 card-minimal p-1.5 bg-white shadow-xl border border-[#E7E3D8] animate-scale-in space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#B45309]" />
                      <span>My Profile & Goals</span>
                    </Link>
                    <button
                      onClick={async () => {
                        setMoreMenuOpen(false);
                        try {
                          await fetch('/api/water', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amountMl: 250 }),
                          });
                          window.location.reload();
                        } catch {}
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5] transition-colors text-left cursor-pointer"
                    >
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span>Quick Log +250ml Water</span>
                    </button>
                    <Link
                      href="/coach"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5] transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-[#B45309]" />
                      <span>Ask AI Dietitian</span>
                    </Link>
                    <Link
                      href="/diary"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5] transition-colors"
                    >
                      <CalendarDays className="w-4 h-4 text-[#78716C]" />
                      <span>Food Diary</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#78716C]" />
                      <span>Settings</span>
                    </Link>
                    <div className="border-t border-[#F1EFEA] my-1" />
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>
        )}

        {/* Page Content View */}
        <main
          className={
            isScannerPage
              ? 'flex-1 w-full'
              : 'flex-1 w-full max-w-2xl mx-auto px-4 sm:px-5 pt-3 pb-28 lg:pb-12 animate-fade-in'
          }
        >
          {!isScannerPage && <PwaInstallPrompt />}
          {children}
        </main>

        {/* Single Minimalist Floating Pill Bottom Navigation (Mobile PWA) */}
        {!isScannerPage && (
          <nav
            aria-label="Primary Mobile Navigation"
            className="lg:hidden fixed inset-x-3 z-40 flex justify-center pointer-events-none"
            style={{ bottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
          >
            <div className="pointer-events-auto bg-white/95 backdrop-blur-xl rounded-[32px] px-3 py-1.5 shadow-[0_8px_32px_rgba(28,25,23,0.12)] border border-[#E7E3D8]/80 flex items-center justify-between w-full max-w-sm mx-auto">
              {BOTTOM_NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                if (item.isCenter) {
                  // Center Elevated Camera FAB with breathing animated glow
                  return (
                    <div key={item.href} className="flex flex-col items-center flex-1 -mt-7 relative z-50">
                      <Link
                        href={item.href}
                        aria-label="Scan Meal with AI"
                        className="w-[60px] h-[60px] rounded-full bg-[#B45309] text-white flex items-center justify-center shadow-[0_10px_24px_rgba(180,83,9,0.45)] border-[4px] border-[#F6F4EE] active:scale-90 transition-all hover:scale-105 animate-pulse-glow cursor-pointer"
                      >
                        <Camera className="w-6 h-6 text-white stroke-[2.3]" />
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center flex-1 py-1 px-1.5 rounded-2xl text-[10.5px] font-semibold transition-all tactile-press ${
                      active
                        ? 'text-[#B45309] bg-[#FEF3C7]/90 font-bold scale-105'
                        : 'text-[#A8A29E] hover:text-[#1C1917]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-0.5 transition-transform ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* Slide-out Drawer for All Secondary Pages (Mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-[#FAF8F5] h-full p-5 overflow-y-auto shadow-2xl z-10 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#B45309] text-white flex items-center justify-center shadow-xs">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-display font-bold text-base text-[#1C1917] block">NutriFit AI</span>
                  <span className="text-[10px] text-[#78716C]">Navigation</span>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#78716C] shadow-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {DRAWER_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] mb-1.5">
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
                          className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all tactile-press-sm ${
                            active ? 'bg-[#FEF3C7] text-[#B45309] font-bold' : 'text-[#78716C] hover:bg-white'
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
    </div>
  );
}
