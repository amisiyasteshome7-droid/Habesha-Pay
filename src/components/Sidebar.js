'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCompany } from '@/hooks/useCompany';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PlayCircle,
  FileCheck2,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Building2,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    category: 'Core Operations',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/payroll', label: 'Payroll Runs', icon: PlayCircle },
      { href: '/dashboard/employees', label: 'Employees', icon: Users },
      { href: '/dashboard/contractors', label: 'Contractors', icon: Briefcase },
    ],
  },
  {
    category: 'HR & Time',
    links: [
      { href: '/dashboard/leave', label: 'Leave', icon: CalendarCheck },
      { href: '/dashboard/overtime', label: 'Overtime', icon: Clock },
      { href: '/dashboard/offer-letters', label: 'Offer Letters', icon: FileCheck2 },
    ],
  },
  {
    category: 'Finance & Compliance',
    links: [
      { href: '/dashboard/reports', label: 'Statutory Reports', icon: FileSpreadsheet },
      { href: '/dashboard/team', label: 'Access Control', icon: ShieldCheck },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const { company, user, role } = useCompany();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-emerald-950 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-emerald-950 font-black shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 fill-emerald-950" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                Habesha Pay
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[140px] font-medium">
                  {company?.name || 'Workspace'}
                </span>
              </div>
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300/70 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {NAV_ITEMS.map((section) => (
            <div key={section.category}>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 block mb-2">
                {section.category}
              </span>
              <nav className="space-y-1">
                {section.links.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/10 font-bold'
                          : 'text-emerald-100/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isActive
                            ? 'text-emerald-950 scale-105'
                            : 'text-emerald-400 group-hover:scale-105'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HP'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Account'}
                </p>
                <span className="text-[10px] uppercase font-mono text-emerald-300/80 block">
                  {role || 'Admin'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-emerald-200/70 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}