'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  sanitizeTIN,
} from '@/lib/sanitize';
import { formatETB } from '@/lib/payrollCalc';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Receipt,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  SlidersHorizontal,
  Building,
  CreditCard,
  Percent,
} from 'lucide-react';

const EMPTY_FORM = {
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
  tin: '',
  service_description: '',
  rate: '',
  rate_type: 'fixed',
  withholding_tax_rate: '2',
};

export default function ContractorsPage() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contractors');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load contractors');
      }

      setContractors(data.contractors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  }

  // Filtered List
  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      const matchesSearch =
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.service_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tin?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contractors, searchQuery, statusFilter]);

  // Aggregate Metrics
  const activeCount = contractors.filter((c) => c.status === 'active').length;
  const inactiveCount = contractors.filter((c) => c.status !== 'active').length;
  const totalMonthlyCommitment = contractors
    .filter((c) => c.status === 'active' && c.rate_type === 'fixed')
    .reduce((sum, c) => sum + (Number(c.rate) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeText(form.full_name);
    if (!cleanName) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        full_name: cleanName,
        company_name: sanitizeText(form.company_name),
        email: sanitizeEmail(form.email),
        phone: sanitizePhone(form.phone),
        tin: sanitizeTIN(form.tin),
        service_description: sanitizeText(form.service_description),
        rate: sanitizeNumber(form.rate, { min: 0 }),
        rate_type: form.rate_type,
        withholding_tax_rate: sanitizeNumber(form.withholding_tax_rate, {
          min: 0,
          max: 100,
        }),
      };

      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contractor');
      }

      setForm(EMPTY_FORM);
      setShowDrawer(false);
      setSuccess(`Contractor ${cleanName} created successfully.`);
      setTimeout(() => setSuccess(''), 4000);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    setError('');
    setTogglingId(id);

    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch('/api/contractors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contractor status');
      }

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  if (loading && contractors.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading contractors roster...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            External Workforce
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Contractors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage outsourced vendors, consultants, and service withholding compliance.
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
          Add Contractor
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Contracts
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{activeCount}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Engaged
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fixed Monthly Outlay
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {formatETB(totalMonthlyCommitment)}
              </h3>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Inactive / Archived
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{inactiveCount}</h3>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                Historical
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm">{error}</p>
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

      {/* Data Table Panel */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, company, service, or TIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block mr-1" />
            {['all', 'active', 'inactive'].map((status) => (
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

        {/* Table View */}
        {filteredContractors.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No contractors found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No records match the active search filters.'
                : 'No contractors registered yet. Add vendors to manage tax withholding separately.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Contractor Details</th>
                  <th className="py-3.5 px-4">Contact & TIN</th>
                  <th className="py-3.5 px-4">Scope / Service</th>
                  <th className="py-3.5 px-4">Agreed Rate</th>
                  <th className="py-3.5 px-4">Withholding</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredContractors.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-900 text-sm">{c.full_name}</div>
                      {c.company_name && (
                        <div className="text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                          <Building className="w-3 h-3 text-gray-400" />
                          {c.company_name}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.tin && (
                        <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px]">
                          <Receipt className="w-3 h-3 text-gray-400" />
                          <span>TIN: {c.tin}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 max-w-[200px]">
                      <span className="text-gray-900 font-medium block truncate">
                        {c.service_description || 'General Consulting'}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        {formatETB(c.rate)}
                      </div>
                      <div className="text-[11px] text-gray-400 capitalize">
                        {c.rate_type?.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                        <Percent className="w-3 h-3 text-amber-600" />
                        {c.withholding_tax_rate}%
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        {c.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        disabled={togglingId === c.id}
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          c.status === 'active'
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        } disabled:opacity-50`}
                      >
                        {togglingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                        ) : c.status === 'active' ? (
                          'Deactivate'
                        ) : (
                          'Reactivate'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Form Drawer */}
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
                  <h2 className="text-lg font-bold">New Contractor</h2>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Register vendor details for statutory ERCA filing.
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alazar Tadesse"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Registered Business Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Atlas Consulting PLC"
                    value={form.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="vendor@company.et"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+251 9..."
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">TIN</label>
                    <input
                      type="text"
                      placeholder="10 digits"
                      value={form.tin}
                      onChange={(e) => updateField('tin', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Withholding Tax (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.withholding_tax_rate}
                      onChange={(e) => updateField('withholding_tax_rate', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Service Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Legal Advisory, UI/UX Design, IT Support"
                    value={form.service_description}
                    onChange={(e) => updateField('service_description', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Agreed Rate (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.rate}
                      onChange={(e) => updateField('rate', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Rate Type
                    </label>
                    <select
                      value={form.rate_type}
                      onChange={(e) => updateField('rate_type', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="fixed">Fixed Monthly</option>
                      <option value="hourly">Hourly</option>
                      <option value="per_project">Per Project</option>
                    </select>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-6 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Contractor'}
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