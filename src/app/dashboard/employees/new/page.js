'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCompany } from '@/hooks/useCompany';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  sanitizeTIN,
} from '@/lib/sanitize';
import {
  ArrowLeft,
  User,
  Briefcase,
  DollarSign,
  Landmark,
  Save,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

const EMPTY_FORM = {
  employee_code: '',
  full_name: '',
  email: '',
  phone: '',
  tin: '',
  position: '',
  department: '',
  employment_type: 'permanent',
  start_date: '',
  basic_salary: '',
  transport_allowance: '',
  housing_allowance: '',
  other_allowance: '',
  bank_name: '',
  bank_account: '',
  pension_number: '',
};

export default function NewEmployeePage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeText(form.full_name);

    if (!cleanName) {
      setError('Full name is required.');
      return;
    }

    if (!companyId) {
      setError('Could not determine your company identity. Try reloading.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        employeeCode: sanitizeText(form.employee_code) || undefined,
        fullName: cleanName,
        email: sanitizeEmail(form.email) || undefined,
        phone: sanitizePhone(form.phone) || undefined,
        tin: sanitizeTIN(form.tin) || undefined,
        position: sanitizeText(form.position) || undefined,
        department: sanitizeText(form.department) || undefined,
        employmentType: form.employment_type,
        startDate: form.start_date || undefined,
        basicSalary: sanitizeNumber(form.basic_salary, { min: 0 }),
        transportAllowance: sanitizeNumber(form.transport_allowance, { min: 0 }),
        housingAllowance: sanitizeNumber(form.housing_allowance, { min: 0 }),
        otherAllowance: sanitizeNumber(form.other_allowance, { min: 0 }),
        bankName: sanitizeText(form.bank_name) || undefined,
        bankAccount: sanitizeText(form.bank_account) || undefined,
        pensionNumber: sanitizeText(form.pension_number) || undefined,
      };

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to register employee.');
      }

      router.push('/dashboard/employees');
    } catch (err) {
      console.error('Create employee error:', err);
      setError(err.message || 'Unable to register employee.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <Link
            href="/dashboard/employees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Employee Directory
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Register personnel records for compensation calculations, ERCA reports, and employee portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/employees"
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form="new-employee-form"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Employee Record
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold">Registration Issue</h4>
            <p className="text-xs mt-0.5 text-rose-600">{error}</p>
          </div>
        </div>
      )}

      <form id="new-employee-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Personal Profile */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Personal & Legal Identity</h2>
              <p className="text-xs text-gray-500">Government identity and contact details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="full_name"
                required
                placeholder="e.g. Almaz Tadesse"
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="employee_code" className="block text-xs font-semibold text-gray-700 mb-1">
                Employee Code (Internal ID)
              </label>
              <input
                id="employee_code"
                placeholder="EMP-0012"
                value={form.employee_code}
                onChange={(e) => update('employee_code', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-colors"
              />
            </div>

            <div>
              <label htmlFor="tin" className="block text-xs font-semibold text-gray-700 mb-1">
                Tax Identification Number (TIN)
              </label>
              <input
                id="tin"
                placeholder="10-digit TIN"
                value={form.tin}
                onChange={(e) => update('tin', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                Work Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="almaz@organization.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                placeholder="+251 9XX XXX XXX"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="start_date" className="block text-xs font-semibold text-gray-700 mb-1">
                Official Start Date
              </label>
              <input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Role & Department */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Position & Contract</h2>
              <p className="text-xs text-gray-500">Organizational hierarchy and employment basis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-gray-700 mb-1">
                Job Title / Position
              </label>
              <input
                id="position"
                placeholder="e.g. Lead Accountant"
                value={form.position}
                onChange={(e) => update('position', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-xs font-semibold text-gray-700 mb-1">
                Department / Team
              </label>
              <input
                id="department"
                placeholder="e.g. Finance & Auditing"
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="employment_type" className="block text-xs font-semibold text-gray-700 mb-1">
                Employment Basis
              </label>
              <select
                id="employment_type"
                value={form.employment_type}
                onChange={(e) => update('employment_type', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
              >
                <option value="permanent">Permanent Agreement</option>
                <option value="contract">Fixed Contract</option>
                <option value="probation">Probation Period</option>
              </select>
            </div>
          </div>
        </div>

        {/* Monthly Compensation */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Compensation Package (ETB / Month)</h2>
              <p className="text-xs text-gray-500">Base earnings and tax-adjusted allowances</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="basic_salary" className="block text-xs font-semibold text-gray-700 mb-1">
                Basic Monthly Salary <span className="text-rose-500">*</span>
              </label>
              <input
                id="basic_salary"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="e.g. 25000"
                value={form.basic_salary}
                onChange={(e) => update('basic_salary', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="transport_allowance" className="block text-xs font-semibold text-gray-700 mb-1">
                Transport Allowance
              </label>
              <input
                id="transport_allowance"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 2200"
                value={form.transport_allowance}
                onChange={(e) => update('transport_allowance', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
              <span className="text-[11px] text-gray-400 mt-1 block flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-600" /> Up to ETB 2,200 non-taxable
              </span>
            </div>

            <div>
              <label htmlFor="housing_allowance" className="block text-xs font-semibold text-gray-700 mb-1">
                Housing Allowance
              </label>
              <input
                id="housing_allowance"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 3000"
                value={form.housing_allowance}
                onChange={(e) => update('housing_allowance', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="other_allowance" className="block text-xs font-semibold text-gray-700 mb-1">
                Other Allowance
              </label>
              <input
                id="other_allowance"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1000"
                value={form.other_allowance}
                onChange={(e) => update('other_allowance', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Banking & Pension */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Banking & Statutory Pension</h2>
              <p className="text-xs text-gray-500">Direct deposit account and social security tracking</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bank_name" className="block text-xs font-semibold text-gray-700 mb-1">
                Disbursement Bank
              </label>
              <input
                id="bank_name"
                placeholder="e.g. Commercial Bank of Ethiopia"
                value={form.bank_name}
                onChange={(e) => update('bank_name', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="bank_account" className="block text-xs font-semibold text-gray-700 mb-1">
                Account Number
              </label>
              <input
                id="bank_account"
                placeholder="1000XXXXXXXX"
                value={form.bank_account}
                onChange={(e) => update('bank_account', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-colors"
              />
            </div>

            <div>
              <label htmlFor="pension_number" className="block text-xs font-semibold text-gray-700 mb-1">
                Social Security / Pension ID
              </label>
              <input
                id="pension_number"
                placeholder="PEN-XXXXX"
                value={form.pension_number}
                onChange={(e) => update('pension_number', e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-colors"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}