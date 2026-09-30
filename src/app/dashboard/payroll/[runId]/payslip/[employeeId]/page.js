'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatETB } from '@/lib/payrollCalc';
import {
  ArrowLeft,
  Printer,
  Building2,
  User,
  CreditCard,
  Briefcase,
  Hash,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  CheckCircle2,
  Receipt,
  Wallet,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PayslipPage() {
  const { runId, employeeId, empId } = useParams();
  const router = useRouter();

  const actualEmployeeId = employeeId || empId;

  const [payslip, setPayslip] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [run, setRun] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!runId || !actualEmployeeId) return;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/payroll/${runId}/payslip/${actualEmployeeId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load payslip');
        }

        setPayslip(data.payslip);
        setEmployee(data.employee);
        setRun(data.run);
        setCompany(data.company);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [runId, actualEmployeeId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Generating payslip view...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Payslip Unavailable</h3>
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

  if (!payslip || !employee || !run) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center py-20">
        <p className="text-sm text-gray-500">Payslip record not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>
    );
  }

  const totalDeductions =
    (Number(payslip.income_tax) || 0) +
    (Number(payslip.pension_employee) || 0) +
    (Number(payslip.other_deductions) || 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top Header - Hidden on Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link
            href={`/dashboard/payroll/${runId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Payroll Run
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Payslip — {employee.full_name}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {MONTH_NAMES[run.period_month - 1]} {run.period_year} Cycle
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Payslip Document Canvas */}
      <div
        id="payslip-printable"
        className="bg-white border border-gray-200/90 rounded-2xl p-8 shadow-sm print:border-none print:shadow-none print:p-0"
      >
        {/* Company & Cycle Banner */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-emerald-600">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              Habesha Pay Verified
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {company?.name || 'Company Organization PLC'}
            </h2>
            {company?.address && (
              <p className="text-xs text-gray-500">{company.address}</p>
            )}
            <p className="text-xs font-mono text-gray-600 font-medium">
              TIN: {company?.tin || 'Not Registered'}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Official Statement
            </span>
            <div className="text-xs text-gray-400 mt-2">Pay Period</div>
            <div className="text-base font-bold text-gray-900">
              {MONTH_NAMES[run.period_month - 1]} {run.period_year}
            </div>
          </div>
        </div>

        {/* Employee Particulars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-100 bg-gray-50/50 -mx-8 px-8 my-1 rounded-none">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400" /> Employee
            </span>
            <p className="text-xs font-bold text-gray-900">{employee.full_name}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Hash className="w-3 h-3 text-gray-400" /> Staff ID
            </span>
            <p className="text-xs font-mono font-bold text-gray-900">
              {employee.employee_code || '—'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-gray-400" /> Role / Position
            </span>
            <p className="text-xs font-bold text-gray-900">
              {employee.position || 'Staff Member'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-gray-400" /> Bank Account
            </span>
            <p className="text-xs font-mono font-bold text-gray-900">
              {employee.bank_account || 'Cash / Unassigned'}
            </p>
          </div>
        </div>

        {/* Split Ledger: Earnings vs Deductions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          {/* Earnings Column */}
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-emerald-100 mb-3">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Gross Earnings
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Basic Salary</span>
                <span className="font-semibold text-gray-900">
                  {formatETB(payslip.basic_salary)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Transport Allowance</span>
                <span className="font-semibold text-gray-900">
                  {formatETB(payslip.transport_allowance)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Housing Allowance</span>
                <span className="font-semibold text-gray-900">
                  {formatETB(payslip.housing_allowance)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Other Allowances</span>
                <span className="font-semibold text-gray-900">
                  {formatETB(payslip.other_allowance)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Approved Overtime</span>
                <span className="font-semibold text-emerald-700">
                  {formatETB(payslip.overtime_pay)}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900 text-sm">
                <span>Total Gross Earnings</span>
                <span className="text-emerald-700">
                  {formatETB(payslip.gross_salary)}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions Column */}
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-rose-100 mb-3">
              <Receipt className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Statutory Deductions
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Income Tax (ERCA)</span>
                <span className="font-semibold text-rose-600">
                  {formatETB(payslip.income_tax)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Employee Pension (7%)</span>
                <span className="font-semibold text-rose-600">
                  {formatETB(payslip.pension_employee)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Other Deductions</span>
                <span className="font-semibold text-rose-600">
                  {formatETB(payslip.other_deductions)}
                </span>
              </div>

              {/* Blank filler rows to match height */}
              <div className="flex justify-between items-center opacity-0 select-none">
                <span>Spacer</span>
                <span>0.00</span>
              </div>
              <div className="flex justify-between items-center opacity-0 select-none">
                <span>Spacer</span>
                <span>0.00</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900 text-sm">
                <span>Total Deductions</span>
                <span className="text-rose-600">{formatETB(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay Callout */}
        <div className="mt-4 p-5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">
              Net Payable Take-Home
            </span>
            <p className="text-[11px] text-emerald-100/80 mt-0.5">
              Net credit deposited directly into declared employee bank account
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatETB(payslip.net_pay)}
          </div>
        </div>

        {/* Employer Pension Footnote */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
          <span>
            Employer Statutory Contribution (11%):{' '}
            <strong className="text-gray-600">
              {formatETB(payslip.pension_employer)}
            </strong>{' '}
            (Paid on your behalf, not deducted from gross salary)
          </span>
      
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .sidebar,
          nav,
          header,
          button,
          .print\\:hidden {
            display: none !important;
          }
          #payslip-printable {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}