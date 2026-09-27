'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useCompany } from '@/hooks/useCompany';
import { formatETB } from '@/lib/payrollCalc';
import { sanitizeNumber, sanitizeText } from '@/lib/sanitize';
import {
  ArrowLeft,
  User,
  Building2,
  DollarSign,
  Landmark,
  CreditCard,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Receipt,
  AlertCircle,
  Loader2,
  Calendar,
  Save,
  X,
  Copy,
  Check,
} from 'lucide-react';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { companyId, role } = useCompany();

  const [employee, setEmployee] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalCopied, setPortalCopied] = useState(false);

  const load = useCallback(async () => {
    if (!companyId || !id) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load employee details.');
      }

      setEmployee(result.employee);
      setForm(result.employee);
      setPayslips(result.payslips || []);
    } catch (err) {
      console.error('Load employee error:', err);
      setError(err.message || 'Unable to load employee details.');
    } finally {
      setLoading(false);
    }
  }, [companyId, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        fullName: sanitizeText(form.full_name),
        position: sanitizeText(form.position) || undefined,
        department: sanitizeText(form.department) || undefined,
        basicSalary: sanitizeNumber(form.basic_salary, { min: 0 }),
        transportAllowance: sanitizeNumber(form.transport_allowance, { min: 0 }),
        housingAllowance: sanitizeNumber(form.housing_allowance, { min: 0 }),
        otherAllowance: sanitizeNumber(form.other_allowance, { min: 0 }),
        status: form.status,
      };

      const response = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to update employee.');
      }

      setEditing(false);
      setSuccess('Employee details updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
      await load();
    } catch (err) {
      console.error('Update employee error:', err);
      setError(err.message || 'Unable to update employee.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePortalLink() {
    setPortalLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/employees/${id}/portal-link`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.message || 'Failed to generate employee portal link.'
        );
      }

      await navigator.clipboard.writeText(data.portalUrl);
      setPortalCopied(true);
      setSuccess('Portal link copied to clipboard. Valid for 14 days.');
      setTimeout(() => {
        setPortalCopied(false);
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Portal link generation error:', err);
      setError(err.message || 'Failed to generate employee portal link.');
    } finally {
      setPortalLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            On Leave
          </span>
        );
      case 'terminated':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Terminated
          </span>
        );
    }
  };

  if (loading || !employee || !form) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading personnel ledger...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <Link
            href="/dashboard/employees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
            {getStatusBadge(employee.status)}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {employee.position || 'Staff Member'} • {employee.department || 'General Organization'} •{' '}
            <span className="font-mono">{employee.employee_code || 'No Code'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {role !== 'viewer' && (
            <>
              <button
                type="button"
                onClick={handleGeneratePortalLink}
                disabled={portalLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {portalCopied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                )}
                {portalLoading ? 'Generating...' : portalCopied ? 'Link Copied' : 'Employee Portal Link'}
              </button>

              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                {editing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editable Form or Static Details */}
      {editing ? (
        <form onSubmit={handleSave} className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Update Employee Particulars</h2>
            <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                value={form.full_name || ''}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={form.status || 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Position</label>
              <input
                value={form.position || ''}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <input
                value={form.department || ''}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Basic Salary (ETB)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.basic_salary ?? ''}
                onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transport Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.transport_allowance ?? ''}
                onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Housing Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.housing_allowance ?? ''}
                onChange={(e) => setForm({ ...form, housing_allowance: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Other Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.other_allowance ?? ''}
                onChange={(e) => setForm({ ...form, other_allowance: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity & Department */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
              <User className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Personnel & Contract Details</h2>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              <DetailRow label="Staff Code" value={employee.employee_code} mono />
              <DetailRow label="Designation" value={employee.position} />
              <DetailRow label="Department" value={employee.department} />
              <DetailRow
                label="Contract Basis"
                value={employee.employment_type?.replace('_', ' ')}
                capitalize
              />
              <DetailRow label="Contact Email" value={employee.email} />
              <DetailRow label="Phone Contact" value={employee.phone} />
              <DetailRow label="TIN" value={employee.tin} mono />
              <DetailRow
                label="Joining Date"
                value={
                  employee.start_date
                    ? new Date(employee.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'
                }
              />
            </div>
          </div>

          {/* Compensation & Bank */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-gray-900">Compensation & Banking</h2>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              <DetailRow
                label="Basic Monthly Salary"
                value={formatETB(employee.basic_salary)}
                highlight
              />
              <DetailRow
                label="Transport Allowance"
                value={formatETB(employee.transport_allowance)}
                mono
              />
              <DetailRow
                label="Housing Allowance"
                value={formatETB(employee.housing_allowance)}
                mono
              />
              <DetailRow
                label="Other Allowance"
                value={formatETB(employee.other_allowance)}
                mono
              />
              <DetailRow label="Bank Name" value={employee.bank_name} />
              <DetailRow label="Account Number" value={employee.bank_account} mono />
              <DetailRow label="Pension ID" value={employee.pension_number} mono />
            </div>
          </div>
        </div>
      )}

      {/* Historical Payslips Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Disbursement & Payslip History</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Past payroll runs and individual statements for this staff member
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {payslips.length} Statements
          </span>
        </div>

        {payslips.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-gray-700">No payslips issued yet</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
              Generated payslips will appear here once included in an executed payroll cycle.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Pay Period</th>
                  <th className="py-3.5 px-4">Gross Compensation</th>
                  <th className="py-3.5 px-4">Net Take-Home</th>
                  <th className="py-3.5 px-4">Cycle Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {payslips.map((slip) => {
                  const month =
                    slip.payroll_runs?.period_month || slip.payrollRun?.periodMonth;
                  const year =
                    slip.payroll_runs?.period_year || slip.payrollRun?.periodYear;
                  const runStatus =
                    slip.payroll_runs?.status || slip.payrollRun?.status || 'finalized';
                  const runId = slip.payroll_run_id || slip.payrollRunId;

                  return (
                    <tr key={slip.id || slip._id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        {month ? `Cycle ${month}/${year}` : 'Standard Period'}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-700">
                        {formatETB(slip.gross_salary ?? slip.grossSalary)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        {formatETB(slip.net_pay ?? slip.netPay)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium capitalize text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {runStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/payroll/${runId}/payslip/${employee.id || employee._id}`
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium transition-colors text-xs"
                        >
                          View Payslip
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
    </div>
  );
}

function DetailRow({ label, value, mono, highlight, capitalize }) {
  return (
    <div className="py-2.5 flex justify-between items-center">
      <span className="text-gray-500 font-medium">{label}</span>
      <span
        className={`font-medium ${mono ? 'font-mono' : ''} ${
          highlight ? 'text-sm font-bold text-emerald-800' : 'text-gray-900'
        } ${capitalize ? 'capitalize' : ''}`}
      >
        {value || '—'}
      </span>
    </div>
  );
}