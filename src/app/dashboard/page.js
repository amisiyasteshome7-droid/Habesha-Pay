'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCompany } from '@/hooks/useCompany';
import { formatETB } from '@/lib/payrollCalc';
import {
  Users,
  Briefcase,
  Clock,
  DollarSign,
  ArrowRight,
  Play,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function DashboardOverview() {
  const { profile, loading: companyLoading } = useCompany();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingLeave, setPendingLeave] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (companyLoading) return;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/dashboard', {
          method: 'GET',
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to load dashboard data.'
          );
        }

        setStats(result.stats);
        setPendingLeave(result.pendingLeave || []);
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [companyLoading]);

  if (companyLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading workspace overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Unable to load dashboard</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : '';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-8 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Habesha Pay Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Monitor active workforce metrics, review pending leave requests, and trigger your statutory Ethiopian payroll cycle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payroll/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-emerald-950" />
              Run Payroll
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Employees
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.employeeCount || 0}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                On Roster
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Eligible for salary runs</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Contractors
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.contractorCount || 0}</h3>
              <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-md">
                External
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Independent retainers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pending Overtime
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.pendingOvertimeCount || 0}</h3>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                Awaiting
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Extra hours for approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Last Payroll Outlay
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {stats?.lastRun ? formatETB(stats.lastRun.totalNet) : '—'}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Total net disbursed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Section */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Pending Leave Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Staff submissions requiring administrative review
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/leave"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            All Requests
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingLeave.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Nothing waiting on you</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              All employee leave requests are currently up to date. New submissions will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Days</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {pendingLeave.map((req) => (
                  <tr key={req.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-gray-900">
                      {req.employees?.full_name || '—'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 font-medium text-gray-800 text-[11px] capitalize">
                        {req.leave_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                      {req.start_date
                        ? new Date(req.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}{' '}
                      <span className="text-gray-400">→</span>{' '}
                      {req.end_date
                        ? new Date(req.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-900">
                      {req.days_requested}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <Link
                        href="/dashboard/leave"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors text-xs"
                      >
                        Review
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}