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
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Building2,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    category: 'Core Operations',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/payroll', label: 'Payroll Runs', icon: PlayCircle},
      { href: '/dashboard/employees', label: 'Employees', icon: Users },
      { href: '/dashboard/contractors', label: 'Contractors', icon: Briefcase },
    ],
  },
  {
    category: 'HR & Time',
    links: [
      { href: '/dashboard/leave', label: 'Leave Tracking', icon: CalendarCheck },
      { href: '/dashboard/overtime', label: 'Overtime', icon: Clock },
      { href: '/dashboard/offer-letters', label: 'Offer Letters', icon: FileCheck2 },
    ],
  },
  {
    category: 'Compliance & Control',
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

  const getInitials = (name) => {
    if (!name) return 'HP';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Dimmer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-zinc-950 text-zinc-200 border-r border-zinc-800/80 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Organization Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm select-none">
              HP
            </div>
            
            <div className="min-w-0">
              <span className="font-semibold text-sm text-zinc-100 block tracking-tight leading-none">
                Habesha Pay
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                <Building2 className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="truncate max-w-[120px] font-mono">
                  {company?.name || 'Workspace'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_ITEMS.map((section) => (
            <div key={section.category}>
              <div className="px-2 pb-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-zinc-500">
                {section.category}
              </div>
              
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
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/30 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-emerald-400'
                              : 'text-zinc-500 group-hover:text-zinc-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-medium text-zinc-200 truncate">
                  {user?.name || 'Account'}
                </p>
                <span className="text-[10px] font-mono uppercase text-emerald-500/80 block truncate">
                  {role || 'Admin'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
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