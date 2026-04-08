import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Projects Dashboard' },
  { href: '/chat', label: 'AI Chat' },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className = '', onNavigate }: SidebarProps) {
  return (
    <aside
      className={`w-full border-slate-800 bg-slate-900/85 px-4 py-6 backdrop-blur ${className}`}
    >
      <div className="mb-8 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-md">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">ProjectHub</p>
        <h1 className="text-xl font-semibold">Intern Workspace</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
