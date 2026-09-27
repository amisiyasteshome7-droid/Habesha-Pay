'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  calculatePayslip,
  calculateOvertimePay,
  formatETB,
} from '@/lib/payrollCalc';
import {
  Calendar,
  DollarSign,
  Receipt,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldAlert,
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

export default function NewPayrollRunPage() {
  const router = useRouter();
  const now = new Date();

  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());

  const [employees, setEmployees] = useState([]);
  const [overtimeByEmployee, setOvertimeByEmployee] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/payroll?preview=true&month=${periodMonth}&year=${periodYear}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load payroll preview.');
        }

        if (cancelled) return;

        setEmployees(data.employees || []);
        setOvertimeByEmployee(data.overtimeByEmployee || {});
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setEmployees([]);
        setOvertimeByEmployee({});
        setError(err.message || 'Failed to load payroll preview.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [periodMonth, periodYear]);

  const preview = useMemo(() => {
    return employees.map((emp) => {
      const employeeId = emp.id || String(emp._id);
      const otEntries = overtimeByEmployee[employeeId] || [];

      const overtimePay = otEntries.reduce(
        (sum, entry) =>
          sum +
          calculateOvertimePay(
            Number(emp.basicSalary ?? emp.basic_salary ?? 0),
            Number(entry.hours || 0),
            entry.otType ?? entry.ot_type
          ),
        0
      );

      const calc = calculatePayslip({
        basicSalary: Number(emp.basicSalary ?? emp.basic_salary ?? 0),
        transportAllowance: Number(
          emp.transportAllowance ?? emp.transport_allowance ?? 0
        ),
        housingAllowance: Number(
          emp.housingAllowance ?? emp.housing_allowance ?? 0
        ),
        otherAllowance: Number(
          emp.otherAllowance ?? emp.other_allowance ?? 0
        ),
        overtimePay,
      });

      return {
        employee: emp,
        otEntries,
        ...calc,
      };
    });
  }, [employees, overtimeByEmployee]);

  const totals = useMemo(() => {
    return preview.reduce(
      (acc, row) => ({
        gross: acc.gross + Number(row.grossSalary ?? row.gross_salary ?? 0),
        tax: acc.tax + Number(row.incomeTax ?? row.income_tax ?? 0),
        pension:
          acc.pension +
          Number(row.pensionEmployee ?? row.pension_employee ?? 0),
        overtime: acc.overtime + Number(row.overtimePay ?? 0),
        net: acc.net + Number(row.netPay ?? row.net_pay ?? 0),
      }),
      {
        gross: 0,
        tax: 0,
        pension: 0,
        overtime: 0,
        net: 0,
      }
    );
  }, [preview]);

  async function handleCreateRun() {
    setError('');

    if (preview.length === 0) {
      setError('No active employees to run payroll for.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodMonth,
          periodYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payroll run.');
      }

      router.push(`/dashboard/payroll/${data.run.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create payroll run.');
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/payroll"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Payroll Ledger
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Execute Payroll Run</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure the accounting period and review statutory tax and pension deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/payroll"
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleCreateRun}
            disabled={saving || loading || preview.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Payslips...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Confirm & Create Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Period Selector Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Target Accounting Period</h2>
            <p className="text-xs text-gray-500">Select the pay cycle to compute</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Cycle Month
            </label>
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name} ({idx + 1 < 10 ? `0${idx + 1}` : idx + 1})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Cycle Year
            </label>
            <input
              type="number"
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
              min={2020}
              max={2035}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Projection Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Est. Net Pay
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(totals.net)}</h3>
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
              Total Gross Pay
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(totals.gross)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Base + Allowances + Overtime</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tax & Pension Withholding
            </span>
            <div className="mt-1.5">
              <h3 className="text-xl font-bold text-gray-900">
                {formatETB(totals.tax + totals.pension)}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">ERCA & pension authority</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Included Payees
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">{preview.length}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Eligible active team members</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold">Payroll Computation Notice</h4>
            <p className="text-xs mt-0.5 text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {/* Computation Preview Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Calculation Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live breakdown of gross allowances, tax brackets, and take-home compensation[cite: 17]
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            {MONTH_NAMES[periodMonth - 1]} {periodYear} Run
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-500 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Re-calculating breakdown and approved overtime...</p>
          </div>
        ) : preview.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No active employees found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              You need at least one active employee on your roster before executing a payroll run[cite: 17].
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Gross Salary</th>
                  <th className="py-3.5 px-4">Overtime Pay</th>
                  <th className="py-3.5 px-4">Income Tax</th>
                  <th className="py-3.5 px-4">Pension (7%)</th>
                  <th className="py-3.5 px-5 text-right font-bold text-gray-900">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {preview.map((row) => {
                  const employeeId = row.employee.id || String(row.employee._id);
                  const employeeName =
                    row.employee.fullName ??
                    row.employee.full_name ??
                    'Unnamed Employee';
                  const position = row.employee.position || 'Staff';

                  const gross = row.grossSalary ?? row.gross_salary ?? 0;
                  const tax = row.incomeTax ?? row.income_tax ?? 0;
                  const pension =
                    row.pensionEmployee ?? row.pension_employee ?? 0;
                  const overtime = row.overtimePay ?? 0;
                  const net = row.netPay ?? row.net_pay ?? 0;

                  return (
                    <tr key={employeeId} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-gray-900">{employeeName}</div>
                        <span className="text-[11px] text-gray-400">{position}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {formatETB(gross)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {overtime > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {formatETB(overtime)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-600">
                        {formatETB(tax)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-600">
                        {formatETB(pension)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-emerald-700 text-sm">
                        {formatETB(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50/90 font-bold border-t border-gray-200 text-gray-900">
                <tr>
                  <td className="py-3.5 px-5">Total Aggregate</td>
                  <td className="py-3.5 px-4">{formatETB(totals.gross)}</td>
                  <td className="py-3.5 px-4 text-emerald-700">{formatETB(totals.overtime)}</td>
                  <td className="py-3.5 px-4">{formatETB(totals.tax)}</td>
                  <td className="py-3.5 px-4">{formatETB(totals.pension)}</td>
                  <td className="py-3.5 px-5 text-right text-emerald-700 text-sm">
                    {formatETB(totals.net)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}