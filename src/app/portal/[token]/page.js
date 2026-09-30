'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { formatETB } from '@/lib/payrollCalc';
import {
  Receipt,
  Calendar,
  Building2,
  User,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Clock,
  Printer,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarCheck,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PortalTokenPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/portal/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'This link is invalid or has expired.');
        } else {
          setData(json);
        }
      } catch (err) {
        setError('Could not load your information. Check your internet connection.');
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <PortalShell>
        <div className="py-24 flex flex-col items-center justify-center text-stone-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          <p className="text-xs font-semibold tracking-wide text-stone-600">
            Accessing encrypted employee ledger...
          </p>
        </div>
      </PortalShell>
    );
  }

  if (error) {
    return (
      <PortalShell>
        <div className="bg-white border border-stone-200/90 rounded-2xl p-8 max-w-md mx-auto text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-stone-900 tracking-tight">
            Unable to Open Access Link
          </h1>
          <p className="text-xs text-stone-500 mt-1 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="text-[11px] text-stone-400 font-mono bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
            Self-service portal tokens are strictly single-use or expire after 14 days for data protection.
          </div>
        </div>
      </PortalShell>
    );
  }

  // ----------------------------------------------------
  // INDIVIDUAL PAYSLIP VIEW
  // ----------------------------------------------------
  if (selectedPayslip) {
    const month = selectedPayslip.payroll_runs?.period_month;
    const year = selectedPayslip.payroll_runs?.period_year;

    return (
      <PortalShell companyName={data.company?.name}>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPayslip(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Overview
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300/80 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              Print Payslip
            </button>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
            {/* Payslip Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Official Salary Slip
                </span>
                <h1 className="text-lg font-bold text-stone-900 mt-2">
                  {MONTH_NAMES[month - 1]} {year} Statement
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  {data.company?.name}
                </p>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="text-stone-400 block text-[11px]">Payee</span>
                <span className="font-bold text-stone-900 block">{data.employee?.full_name}</span>
                <span className="text-stone-500 text-[11px] font-mono">
                  {data.employee?.employee_code || 'ID not set'}
                </span>
              </div>
            </div>

            {/* Earnings Schedule */}
            <div className="pt-5 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Earnings & Additions
              </span>
              <div className="divide-y divide-stone-100 text-xs">
                <SlipRow label="Basic Monthly Salary" value={selectedPayslip.basic_salary} />
                <SlipRow label="Transport Allowance" value={selectedPayslip.transport_allowance} />
                <SlipRow label="Housing Allowance" value={selectedPayslip.housing_allowance} />
                <SlipRow label="Overtime Compensation" value={selectedPayslip.overtime_pay} />
                <div className="py-2.5 flex justify-between items-center font-bold text-stone-900 bg-stone-50/60 px-3 rounded-lg mt-1">
                  <span>Gross Compensation</span>
                  <span className="font-mono text-emerald-900">
                    {formatETB(selectedPayslip.gross_salary)}
                  </span>
                </div>
              </div>
            </div>

            {/* Statutory Deductions */}
            <div className="pt-6 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Statutory Deductions (ERCA & POESSA)
              </span>
              <div className="divide-y divide-stone-100 text-xs">
                <SlipRow label="Employment Income Tax (ERCA)" value={selectedPayslip.income_tax} negative />
                <SlipRow label="Employee Pension Remittance (7%)" value={selectedPayslip.pension_employee} negative />
              </div>
            </div>

            {/* Net Total Card */}
            <div className="mt-8 p-4 rounded-xl bg-emerald-900 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">
                  Net Take-Home Pay
                </span>
                <span className="text-xs text-emerald-100/70">Disbursed via bank transfer</span>
              </div>
              <span className="text-xl font-mono font-bold text-emerald-300">
                {formatETB(selectedPayslip.net_pay)}
              </span>
            </div>

            <p className="mt-6 text-[10px] text-center text-stone-400 font-mono">
              Generated by Habesha Pay under Ethiopian Labor Proclamation Standards.
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  // ----------------------------------------------------
  // ROSTER & LEAVE OVERVIEW
  // ----------------------------------------------------
  return (
    <PortalShell companyName={data.company?.name}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Banner */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-sm flex-shrink-0 border border-emerald-200/60">
              {data.employee?.full_name
                ? data.employee.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                : 'EM'}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                {data.company?.name}
              </span>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                {data.employee?.full_name}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {data.employee?.position || 'Staff Member'} • {data.employee?.department || 'General'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs font-mono self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified Portal</span>
          </div>
        </div>

        {/* Payslips Ledger */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">Historical Payslips</h2>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {data.payslips?.length || 0} Records
            </span>
          </div>

          {!data.payslips || data.payslips.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No payslips have been issued to this profile yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-stone-100">
                <thead>
                  <tr className="bg-stone-50/75 text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Pay Period</th>
                    <th className="py-3 px-4">Net Take-Home</th>
                    <th className="py-3 px-5 text-right">Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {data.payslips.map((slip) => {
                    const month = slip.payroll_runs?.period_month;
                    const year = slip.payroll_runs?.period_year;

                    return (
                      <tr key={slip.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-stone-900">
                          {month ? `${MONTH_NAMES[month - 1]} ${year}` : 'Current Run'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-900">
                          {formatETB(slip.net_pay)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPayslip(slip)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 font-semibold text-xs transition-colors"
                          >
                            View Breakdown
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leave Requests Ledger */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">Time-off & Leave Log</h2>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {data.leaveRequests?.length || 0} Requests
            </span>
          </div>

          {!data.leaveRequests || data.leaveRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No leave records found on your profile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-stone-100">
                <thead>
                  <tr className="bg-stone-50/75 text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Leave Classification</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-5 text-right">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {data.leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-stone-900 capitalize">
                        {req.leave_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {req.start_date} <span className="text-stone-400">→</span> {req.end_date}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <LeaveBadge status={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Token Expiration Notice */}
        <p className="text-[11px] text-stone-400 text-center font-mono pt-2">
          Encrypted employee session. Valid until{' '}
          {new Date(data.expiresAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          .
        </p>
      </div>
    </PortalShell>
  );
}

// ----------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------
function SlipRow({ label, value, negative }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="py-2.5 flex justify-between items-center">
      <span className="text-stone-600">{label}</span>
      <span className={`font-mono font-medium ${negative ? 'text-rose-700' : 'text-stone-900'}`}>
        {negative ? `- ${formatETB(value)}` : formatETB(value)}
      </span>
    </div>
  );
}

function LeaveBadge({ status }) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Rejected
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending Review
        </span>
      );
  }
}

function PortalShell({ children, companyName }) {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 py-10 px-4 sm:px-6">
      <header className="max-w-3xl mx-auto flex items-center justify-between pb-6 mb-6 border-b border-stone-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
            HP
          </div>
          <div>
            <span className="font-semibold text-xs tracking-tight text-stone-900 block">
              Habesha Pay
            </span>
            <span className="text-[10px] text-stone-400 block -mt-0.5 font-medium">
              Employee Portal {companyName ? `• ${companyName}` : ''}
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-stone-400">
          ETB · Statutory
        </span>
      </header>

      <main>{children}</main>

      <footer className="max-w-3xl mx-auto mt-12 pt-6 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400">
        <span>© {new Date().getFullYear()} Habesha Pay Systems</span>
        <span>Secure Ethiopian Payroll Infrastructure</span>
      </footer>
    </div>
  );
}