'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { formatETB } from '@/lib/payrollCalc';
import {
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  Receipt,
  Layers,
  CheckCircle2,
  Clock,
  Coins,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function PayrollListPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPayroll() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/payroll', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load payroll.');
        }

        setRuns(data.runs || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load payroll.');
      } finally {
        setLoading(false);
      }
    }

    loadPayroll();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalDisbursed = runs.reduce(
      (acc, r) => acc + (Number(r.total_net) || 0),
      0
    );
    const totalTaxPaid = runs.reduce(
      (acc, r) => acc + (Number(r.total_tax) || 0),
      0
    );
    const completedCount = runs.filter(
      (r) => r.status === 'paid' || r.status === 'completed' || r.status === 'finalized'
    ).length;
    const draftCount = runs.filter((r) => r.status === 'draft').length;

    return { totalDisbursed, totalTaxPaid, completedCount, draftCount };
  }, [runs]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Paid
          </span>
        );
      case 'finalized':
      case 'completed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading payroll ledger...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Finance & Compensation
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Payroll Runs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review past disbursement cycles, ERCA remittances, and execute new payrolls.
          </p>
        </div>

        <Link
          href="/dashboard/payroll/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          Run Payroll
        </Link>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Cumulative Net Pay
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {formatETB(summary.totalDisbursed)}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Direct employee take-home</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Tax Withholding
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {formatETB(summary.totalTaxPaid)}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">ERCA income tax obligations</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Completed Cycles
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {summary.completedCount}
              </h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Finalized
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Fully closed pay periods</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Draft Runs
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {summary.draftCount}
              </h3>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                Pending
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Requires review & finalization</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Payroll History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Chronological ledger of executed cycles</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {runs.length} {runs.length === 1 ? 'Period' : 'Periods'}
          </span>
        </div>

        {runs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No payroll runs yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Start your first payroll cycle to compute employee net pay, income taxes, and pension deductions.
            </p>
            <Link
              href="/dashboard/payroll/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Run
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Payroll Period</th>
                  <th className="py-3.5 px-4">Gross Outlay</th>
                  <th className="py-3.5 px-4">Income Tax (ERCA)</th>
                  <th className="py-3.5 px-4">Pension Fund</th>
                  <th className="py-3.5 px-4">Net Disbursement</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {MONTH_NAMES[run.period_month - 1]} {run.period_year}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            Cycle {run.period_month}/{run.period_year}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-900">
                      {formatETB(run.total_gross)}
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-600">
                      {formatETB(run.total_tax)}
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-600">
                      {formatETB(run.total_pension)}
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatETB(run.total_net)}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(run.status)}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/payroll/${run.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium transition-colors text-xs"
                      >
                        View Run
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