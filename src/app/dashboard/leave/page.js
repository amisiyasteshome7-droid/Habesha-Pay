'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { sanitizeText } from '@/lib/sanitize';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users,
  Search,
  SlidersHorizontal,
  X,
  Check,
  Plane,
  HeartPulse,
  Baby,
  UserCheck,
  CalendarDays,
} from 'lucide-react';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', icon: CalendarDays, desc: 'Statutory paid vacation days' },
  { value: 'sick', label: 'Sick Leave', icon: HeartPulse, desc: 'Medical absence with certificate' },
  { value: 'maternity', label: 'Maternity Leave', icon: Baby, desc: 'Prenatal and postnatal rest' },
  { value: 'paternity', label: 'Paternity Leave', icon: UserCheck, desc: 'Parental leave for fathers' },
  { value: 'unpaid', label: 'Unpaid Leave', icon: Plane, desc: 'Authorized leave without compensation' },
  { value: 'other', label: 'Other Leave', icon: Clock, desc: 'Bereavement, civic, or study leave' },
];

const EMPTY_FORM = {
  employee_id: '',
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  reason: '',
};

export default function LeavePage() {
  const { companyId, loading: companyLoading } = useCompany();

  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
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
    if (!companyId) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/leave');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load leave data.');
      }

      setEmployees(data.employees || []);
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Leave load error:', err);
      setError(err.message || 'Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  // Calculate inclusive calendar days
  function daysBetween(start, end) {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
    return diff > 0 ? Math.floor(diff) : 0;
  }

  // Submit new leave request
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.employee_id) {
      setError('Select an employee.');
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError('Select both start and end dates.');
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError('End date must be after start date.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: form.employee_id,
          leave_type: form.leave_type,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: sanitizeText(form.reason) || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create leave request.');
      }

      setForm(EMPTY_FORM);
      setShowDrawer(false);
      setSuccess('Leave request recorded successfully.');
      setTimeout(() => setSuccess(''), 4000);
      await load();
    } catch (err) {
      console.error('Leave submit error:', err);
      setError(err.message || 'Failed to create leave request.');
    } finally {
      setSaving(false);
    }
  }

  // Approve / reject review handler
  async function handleReview(id, status) {
    try {
      setError('');
      setActionId(id);

      const response = await fetch('/api/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update leave request.');
      }

      await load();
    } catch (err) {
      console.error('Leave review error:', err);
      setError(err.message || 'Failed to update leave request.');
    } finally {
      setActionId(null);
    }
  }

  // KPI Metrics
  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending');
    const approved = requests.filter((r) => r.status === 'approved');

    const pendingDays = pending.reduce((acc, curr) => acc + (Number(curr.days_requested) || 0), 0);
    const approvedDays = approved.reduce((acc, curr) => acc + (Number(curr.days_requested) || 0), 0);

    return {
      pendingCount: pending.length,
      pendingDays,
      approvedCount: approved.length,
      approvedDays,
    };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const name = req.employees?.full_name?.toLowerCase() || '';
      const type = req.leave_type?.toLowerCase() || '';
      const reason = req.reason?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = name.includes(query) || type.includes(query) || reason.includes(query);
      const matchesStatus = statusFilter === 'all' ? true : req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Cancelled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Review
          </span>
        );
    }
  };

  if (companyLoading || (loading && requests.length === 0)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading leave ledger...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Time & Attendance
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track statutory annual, medical, and parental leaves across your workforce.
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
          Request Leave
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
                {metrics.pendingDays} days
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Awaiting management action</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Approved Absence
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{metrics.approvedDays}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Days total
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Across {metrics.approvedCount} approved requests</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Recorded
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{requests.length}</h3>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                Requests
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Lifecycle leave history</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Workforce
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{employees.length}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Eligible
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Active roster payees</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Ledger Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by employee, leave type, or reason..."
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

        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No leave requests found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No records match your active search filters.'
                : 'Employee leave requests will appear here for review and balance logging.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Schedule Period</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-gray-900">
                        {req.employees?.full_name || 'Unnamed Employee'}
                      </div>
                      {req.reason && (
                        <span className="text-[11px] text-gray-500 italic block mt-0.5 max-w-[240px] truncate">
                          "{req.reason}"
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 font-medium text-gray-800 text-[11px] capitalize">
                        {req.leave_type} Leave
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{req.start_date || '—'}</span>
                        <span className="text-gray-400">→</span>
                        <span>{req.end_date || '—'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-900">
                      {req.days_requested} Days
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {req.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            disabled={actionId === req.id}
                            onClick={() => handleReview(req.id, 'approved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                          >
                            {actionId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>

                          <button
                            disabled={actionId === req.id}
                            onClick={() => handleReview(req.id, 'rejected')}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Request Drawer */}
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
                  <h2 className="text-lg font-bold">Submit Leave Request</h2>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Schedule time off and calculate total inclusive days.
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

                {/* Leave Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Leave Category
                  </label>
                  <div className="space-y-2">
                    {LEAVE_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <label
                          key={type.value}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            form.leave_type === type.value
                              ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="leave_type"
                            value={type.value}
                            checked={form.leave_type === type.value}
                            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-gray-900">
                              <Icon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{type.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{type.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Inclusive Days Computed Callout */}
                {form.start_date && form.end_date && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-medium">
                      Total Calculated Duration:
                    </span>
                    <span className="text-sm font-bold text-emerald-900">
                      {daysBetween(form.start_date, form.end_date)} Calendar Day(s)
                    </span>
                  </div>
                )}

                {/* Reason Note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reason / Supporting Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Annual family travel, doctor recommendation on file"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Actions */}
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
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submit Request
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