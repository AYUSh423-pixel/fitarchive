'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // The main AppShell handles the authentication gate on root
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F6F4EE] flex items-center justify-center p-4">
      <div className="card-minimal max-w-sm w-full p-6 text-center space-y-3 animate-fade-in">
        <div className="w-10 h-10 rounded-2xl bg-[#B45309] text-white flex items-center justify-center mx-auto shadow-md">
          <span className="font-bold text-lg">N</span>
        </div>
        <h2 className="font-display font-bold text-lg text-[#1C1917]">Redirecting to Login…</h2>
        <p className="text-xs text-[#78716C]">Please wait a moment.</p>
      </div>
    </div>
  );
}
