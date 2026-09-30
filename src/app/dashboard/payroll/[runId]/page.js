'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatETB } from '@/lib/payrollCalc';
import {
  Calendar,
  DollarSign,
  Receipt,
  Users,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Eye,
  Search,
  Check,
  Building,
  Coins,
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

export default function PayrollRunDetailPage() {
  const { runId } = useParams();
  const router = useRouter();

  const [run, setRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    if (!runId) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/payroll/${runId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payroll run.');
      }

      setRun(data.run);
      setPayslips(data.payslips || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load payroll run.');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPayslips = useMemo(() => {
    return payslips.filter((slip) => {
      const name = slip.employee?.full_name?.toLowerCase() || '';
      const code = slip.employee?.employee_code?.toLowerCase() || '';
      const position = slip.employee?.position?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || code.includes(query) || position.includes(query);
    });
  }, [payslips, searchQuery]);

  async function handleFinalize() {
    setError('');

    if (payslips.length === 0) {
      setError(
        'This run has no payslips — delete it and create a new run instead of finalizing an empty one.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Finalize payroll for ${MONTH_NAMES[run.period_month - 1]} ${run.period_year}?`
    );

    if (!confirmed) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/payroll/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to finalize payroll.');
      }

      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to finalize payroll.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkPaid() {
    setError('');

    const confirmed = window.confirm(
      'Mark this run as paid? Only do this once salaries have actually been transferred.'
    );

    if (!confirmed) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/payroll/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'paid' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark payroll as paid.');
      }

      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to mark payroll as paid.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteRun() {
    setError('');

    const confirmed = window.confirm(
      `Delete this draft run for ${MONTH_NAMES[run.period_month - 1]} ${run.period_year}? This removes its ${payslips.length} payslip(s) and cannot be undone.`
    );

    if (!confirmed) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/payroll/${runId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payroll run.');
      }

      router.push('/dashboard/payroll');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete payroll run.');
      setUpdating(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Paid
          </span>
        );
      case 'finalized':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Finalized
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
        <p className="text-sm font-medium text-gray-600">Loading payroll ledger details...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Payroll Run Not Found</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          {error || 'This accounting period record does not exist or has been deleted.'}
        </p>
        <Link
          href="/dashboard/payroll"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Payroll Ledger
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/payroll"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Payroll Ledger
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {MONTH_NAMES[run.period_month - 1]} {run.period_year} Run
            </h1>
            {getStatusBadge(run.status)}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Review disbursements, check ERCA filings, and manage individual payslips
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/dashboard/payroll/${runId}/erca`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-gray-700 hover:text-emerald-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            ERCA Tax Report
          </Link>

          {run.status === 'draft' && (
            <>
              <button
                onClick={handleDeleteRun}
                disabled={updating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Draft
              </button>

              <button
                onClick={handleFinalize}
                disabled={updating || payslips.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finalize Run
                  </>
                )}
              </button>
            </>
          )}

          {run.status === 'finalized' && (
            <button
              onClick={handleMarkPaid}
              disabled={updating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  Mark as Paid
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Breakdown KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Net Payout
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(run.total_net)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Disbursed to bank accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Gross Expense
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(run.total_gross)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Total company payroll liability</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Income Tax (ERCA)
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(run.total_tax)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Withholding tax declaration</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Employee Pension (7%)
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(run.total_pension)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Social security remittance</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payslips Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search employee by name, code, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredPayslips.length}</strong> of{' '}
            {payslips.length} Payslips
          </span>
        </div>

        {/* Payslips List */}
        {filteredPayslips.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No payslips found</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search query.' : 'This run contains no payslips.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Gross Compensation</th>
                  <th className="py-3.5 px-4">ERCA Tax</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-5 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredPayslips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-gray-900">
                        {slip.employee?.full_name || 'Unknown Employee'}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        {slip.employee?.employee_code && (
                          <span className="font-mono text-gray-500">
                            {slip.employee.employee_code}
                          </span>
                        )}
                        {slip.employee?.position && (
                          <>
                            <span>•</span>
                            <span>{slip.employee.position}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {formatETB(slip.gross_salary)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-600">
                      {formatETB(slip.income_tax)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatETB(slip.net_pay)}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/payroll/${runId}/payslip/${slip.employee_id}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium transition-colors text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        View Payslip
                      </button>
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