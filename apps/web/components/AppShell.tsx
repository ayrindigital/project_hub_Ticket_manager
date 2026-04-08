'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm font-medium text-slate-100 shadow-lg transition hover:border-slate-600 hover:bg-slate-800"
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M3 5h14v1.5H3zM3 9.25h14v1.5H3zM3 13.5h14V15H3z" />
        </svg>
        Menu
      </button>

      {isDrawerOpen ? (
        <button
          type="button"
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[1px]"
          aria-label="Close navigation"
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-200 ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={() => setIsDrawerOpen(false)} className="h-full w-full border-r" />
      </div>

      <main className="w-full px-4 pb-6 pt-20 md:px-8">{children}</main>
    </div>
  );
}
