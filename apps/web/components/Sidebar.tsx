import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Projects Dashboard' },
  { href: '/chat', label: 'AI Chat (Later)' },
];

export function Sidebar() {
  return (
    <aside className="w-full border-r border-slate-200 bg-white/70 px-4 py-6 backdrop-blur md:w-72">
      <div className="mb-8 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-md">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">ProjectHub</p>
        <h1 className="text-xl font-semibold">Intern Workspace</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <p className="mt-8 text-xs text-slate-500">
        Day 6 goal: show projects from API in a simple dashboard.
      </p>
    </aside>
  );
}
