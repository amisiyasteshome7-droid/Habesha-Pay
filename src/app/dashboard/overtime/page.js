'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { sanitizeText, sanitizeNumber } from '@/lib/sanitize';
import { calculateOvertimePay, formatETB } from '@/lib/payrollCalc';
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  User,
  SlidersHorizontal,
  Search,
  X,
  Sparkles,
  HelpCircle,
  Check,
} from 'lucide-react';

const OT_TYPES = [
  { value: 'weekday', label: 'Weekday (1.5x)', multiplier: 1.5, desc: 'Normal overtime after regular 8h shift' },
  { value: 'rest_day', label: 'Weekly Rest Day (2.0x)', multiplier: 2.0, desc: 'Mandatory weekly rest hours' },
  { value: 'public_holiday', label: 'Public Holiday (2.5x)', multiplier: 2.5, desc: 'Statutory Ethiopian official holidays' },
  { value: 'night', label: 'Night Shift (1.25x)', multiplier: 1.25, desc: 'Work between 10:00 PM and 6:00 AM' },
];

const RATE_MULTIPLIERS = {
  weekday: 1.5,
  rest_day: 2.0,
  public_holiday: 2.5,
  night: 1.25,
};

const EMPTY_FORM = {
  employee_id: '',
  work_date: '',
  hours: '',
  ot_type: 'weekday',
  note: '',
};

export default function OvertimePage() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/overtime');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load overtime data');
      }

      const emps = data.employees || [];
      const rows = data.entries || [];

      setEmployees(emps);
      setEntries(rows);

      const map = {};
      emps.forEach((emp) => {
        map[emp.id] = emp;
      });
      setEmployeeMap(map);
    } catch (err) {
      console.error('Failed to load overtime:', err);
      setError(err.message || 'Failed to load overtime data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live Overtime Calculation Preview
  const liveEstimatedPay = useMemo(() => {
    if (!form.employee_id || !form.hours) return 0;
    const basic = employeeMap[form.employee_id]?.basic_salary || 0;
    return calculateOvertimePay(basic, Number(form.hours), form.ot_type);
  }, [form.employee_id, form.hours, form.ot_type, employeeMap]);

  // Submit New Overtime
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.employee_id) {
      setError('Select an employee.');
      return;
    }

    if (!form.work_date) {
      setError('Select a work date.');
      return;
    }

    const hours = sanitizeNumber(form.hours, { min: 0.25, max: 24 });
    if (!hours) {
      setError('Enter valid hours worked (between 0.25 and 24).');
      return;
    }

    const rateMultiplier = RATE_MULTIPLIERS[form.ot_type];
    setSaving(true);

    try {
      const response = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: form.employee_id,
          work_date: form.work_date,
          hours,
          rate_multiplier: rateMultiplier,
          note: sanitizeText(form.note) || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log overtime entry');
      }

      setForm(EMPTY_FORM);
      setShowDrawer(false);
      setSuccess('Overtime entry submitted for approval.');
      setTimeout(() => setSuccess(''), 4000);
      await load();
    } catch (err) {
      console.error('Failed to save overtime:', err);
      setError(err.message || 'Failed to save overtime entry');
    } finally {
      setSaving(false);
    }
  }

  // Approve / Reject Entry
  async function handleUpdateStatus(id, newStatus) {
    try {
      setError('');
      setActionId(id);

      const response = await fetch('/api/overtime', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to mark overtime as ${newStatus}`);
      }

      await load();
    } catch (err) {
      console.error(`Failed to update overtime to ${newStatus}:`, err);
      setError(err.message || 'Failed to update overtime status');
    } finally {
      setActionId(null);
    }
  }

  // Filtered Entries List
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const name = item.employee_name?.toLowerCase() || '';
      const code = item.employee_code?.toLowerCase() || '';
      const note = item.note?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = name.includes(query) || code.includes(query) || note.includes(query);
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [entries, searchQuery, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const pending = entries.filter((e) => e.status === 'pending');
    const approved = entries.filter((e) => e.status === 'approved');

    const pendingHours = pending.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);
    const approvedHours = approved.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);

    const approvedAmount = approved.reduce(
      (acc, curr) =>
        acc +
        (Number(curr.amount) ||
          calculateOvertimePay(
            curr.basic_salary,
            curr.hours,
            Object.keys(RATE_MULTIPLIERS).find(
              (t) => RATE_MULTIPLIERS[t] === Number(curr.rate_multiplier)
            ) || 'weekday'
          )),
      0
    );

    return {
      pendingCount: pending.length,
      pendingHours,
      approvedHours,
      approvedAmount,
    };
  }, [entries]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Check className="w-3 h-3 text-teal-600" />
            Disbursed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending Review
          </span>
        );
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading overtime records...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Payroll Operations
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Overtime Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track, approve, and disburse extra hours according to Ethiopian Labor Proclamation rates.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowDrawer(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Overtime
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pending Approvals
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{metrics.pendingCount}</h3>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                {metrics.pendingHours}h queued
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Awaiting manager review</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Approved Overtime
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{metrics.approvedHours}h</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Ready for next payroll run</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Committed Outlay
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                {formatETB(metrics.approvedAmount)}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Verified overtime expenditure</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Logged
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{entries.length}</h3>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                Entries
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Recorded employee shifts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
            <Calendar className="w-5 h-5" />
          </div>
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

      {/* Table Container */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by employee name, code, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block mr-1" />
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No overtime records found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No records match your active search filters.'
                : 'Log approved overtime hours to automatically compute compensation in the next payroll run.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Date of Work</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Category & Rate</th>
                  <th className="py-3.5 px-4">Calculated Pay</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredEntries.map((entry) => {
                  const otTypeKey =
                    Object.keys(RATE_MULTIPLIERS).find(
                      (k) => RATE_MULTIPLIERS[k] === Number(entry.rate_multiplier)
                    ) || 'weekday';

                  const estPay =
                    Number(entry.amount) ||
                    calculateOvertimePay(entry.basic_salary, entry.hours, otTypeKey);

                  return (
                    <tr key={entry.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-gray-900">
                          {entry.employee_name || 'Staff Member'}
                        </div>
                        {entry.employee_code && (
                          <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                            {entry.employee_code}
                          </span>
                        )}
                        {entry.note && (
                          <span className="text-[11px] text-gray-500 italic block mt-0.5 max-w-[200px] truncate">
                            "{entry.note}"
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-700">
                        {entry.work_date || '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-900">
                        {entry.hours} Hours
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 font-medium text-gray-800 text-[11px]">
                          <span className="capitalize">{otTypeKey.replace('_', ' ')}</span>
                          <span className="text-emerald-700 font-bold">({entry.rate_multiplier}x)</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {formatETB(estPay)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(entry.status)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {entry.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              disabled={actionId === entry.id}
                              onClick={() => handleUpdateStatus(entry.id, 'approved')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                            >
                              {actionId === entry.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              disabled={actionId === entry.id}
                              onClick={() => handleUpdateStatus(entry.id, 'rejected')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono italic">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Logging Overtime */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-emerald-900 text-white">
                <div>
                  <h2 className="text-lg font-bold">Log Overtime Entry</h2>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Records overtime hours subject to Ethiopian statutory multipliers.
                  </p>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Employee Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
                  >
                    <option value="">Choose team member...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.position || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date Worked <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.work_date}
                      onChange={(e) => setForm({ ...form, work_date: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Hours Worked <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0.25"
                      max="24"
                      step="0.25"
                      placeholder="e.g. 3.5"
                      value={form.hours}
                      onChange={(e) => setForm({ ...form, hours: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Overtime Category Radios */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Overtime Type / Rate Multiplier
                  </label>
                  <div className="space-y-2">
                    {OT_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          form.ot_type === type.value
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ot_type"
                          value={type.value}
                          checked={form.ot_type === type.value}
                          onChange={(e) => setForm({ ...form, ot_type: e.target.value })}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>{type.label}</span>
                            <span className="text-emerald-700 font-mono">
                              {type.multiplier}x Rate
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reason Note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Operational Reason / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Month-end financial closing, urgent system maintenance"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Calculation Callout Banner */}
                {form.employee_id && form.hours && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Estimated Overtime Payout:</span>
                      <span className="text-sm font-bold text-emerald-800">
                        {formatETB(liveEstimatedPay)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Computed as (Monthly Base / 160h) × {form.hours}h ×{' '}
                      {RATE_MULTIPLIERS[form.ot_type]}x multiplier.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Log Overtime
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}