'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatETB } from '@/lib/payrollCalc';
import { sanitizeCSVCell } from '@/lib/sanitize';
import {
  ArrowLeft,
  Download,
  Receipt,
  Building2,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Search,
  FileCheck2,
  Landmark,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ErcaReportPage() {
  const { runId } = useParams();
  const router = useRouter();

  const [run, setRun] = useState(null);
  const [rows, setRows] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!runId) return;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/payroll/${runId}/erca`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load ERCA report');
        }

        setRun(data.run);
        setRows(data.rows || []);
        setCompany(data.company);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [runId]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const name = r.employee?.full_name?.toLowerCase() || '';
      const tin = r.employee?.tin?.toLowerCase() || '';
      const code = r.employee?.employee_code?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || tin.includes(query) || code.includes(query);
    });
  }, [rows, searchQuery]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        taxable: acc.taxable + Number(r.taxable_income || 0),
        tax: acc.tax + Number(r.income_tax || 0),
        pensionEmp: acc.pensionEmp + Number(r.pension_employee || 0),
        pensionEmployer: acc.pensionEmployer + Number(r.pension_employer || 0),
      }),
      {
        taxable: 0,
        tax: 0,
        pensionEmp: 0,
        pensionEmployer: 0,
      }
    );
  }, [rows]);

  function handleExportCSV() {
    const header = [
      'Employee Code',
      'Full Name',
      'TIN',
      'Taxable Income',
      'Income Tax',
      'Pension Employee (7%)',
      'Pension Employer (11%)',
    ];

    const lines = rows.map((r) => [
      r.employee?.employee_code || '',
      r.employee?.full_name || '',
      r.employee?.tin || '',
      r.taxable_income,
      r.income_tax,
      r.pension_employee,
      r.pension_employer,
    ]);

    const csv = [header, ...lines]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erca-declaration-${run.period_year}-${String(run.period_month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Compiling ERCA tax schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Failed to Load Declaration</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">{error}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go Back
        </button>
      </div>
    );
  }

  if (!run) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/payroll/${runId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Payroll Run
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            ERCA Tax Declaration — {MONTH_NAMES[run.period_month - 1]} {run.period_year}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Statutory income tax withholdings and civil/private pension declaration schedule
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Entity Credentials Banner */}
      <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">{company?.name || 'Registered Organization'}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-200 mt-0.5">
                <span className="font-mono">TIN: {company?.tin || 'Not Provided'}</span>
                <span>•</span>
                <span>Ethiopian Ministry of Revenues Format</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-200/90 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span>Verify calculated values against current ERCA directives prior to monthly submission</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Taxable Basis
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(totals.taxable)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Assessable staff payroll</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Income Tax Due
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(totals.tax)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Payable to ERCA accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pension (Staff 7%)
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(totals.pensionEmp)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Employee statutory share</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pension (Employer 11%)
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(totals.pensionEmployer)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Company statutory share</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tax Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, employee code, or TIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredRows.length}</strong> of {rows.length} Listed Payees
          </span>
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No matching records</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery ? 'Adjust your search terms to find records.' : 'No payslips logged for this run[cite: 19].'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">TIN Identifier</th>
                  <th className="py-3.5 px-4">Taxable Income</th>
                  <th className="py-3.5 px-4">Income Tax (Due)</th>
                  <th className="py-3.5 px-4">Pension (7%)</th>
                  <th className="py-3.5 px-5">Pension (11%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-gray-900">
                      {r.employee?.full_name}
                      {r.employee?.employee_code && (
                        <span className="block text-[11px] font-mono font-normal text-gray-400 mt-0.5">
                          {r.employee.employee_code}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {r.employee?.tin || '—'}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {formatETB(r.taxable_income)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-amber-700">
                      {formatETB(r.income_tax)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-600">
                      {formatETB(r.pension_employee)}
                    </td>

                    <td className="py-3.5 px-5 font-medium text-gray-600">
                      {formatETB(r.pension_employer)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50/90 font-bold border-t border-gray-200 text-gray-900">
                <tr>
                  <td className="py-3.5 px-5" colSpan={2}>Declaration Totals</td>
                  <td className="py-3.5 px-4">{formatETB(totals.taxable)}</td>
                  <td className="py-3.5 px-4 text-amber-700">{formatETB(totals.tax)}</td>
                  <td className="py-3.5 px-4">{formatETB(totals.pensionEmp)}</td>
                  <td className="py-3.5 px-5">{formatETB(totals.pensionEmployer)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function csvEscape(value) {
  const str = sanitizeCSVCell(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}