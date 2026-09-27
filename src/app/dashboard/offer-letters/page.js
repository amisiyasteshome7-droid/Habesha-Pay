'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { sanitizeText, sanitizeNumber } from '@/lib/sanitize';
import { formatETB } from '@/lib/payrollCalc';
import {
  FileText,
  Plus,
  Printer,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  User,
  AlertCircle,
  Loader2,
  Eye,
  SlidersHorizontal,
  Sparkles,
  Layers,
} from 'lucide-react';

const EMPTY_FORM = {
  candidate_name: '',
  position: '',
  department: '',
  start_date: '',
  basic_salary: '',
  employment_type: 'permanent',
  probation_months: '2',
};

export default function OfferLetterPage() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/offer-letters');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load offer letters');
      }

      setLetters(data.letters || []);
      if (data.company?.name) {
        setCompanyName(data.company.name);
      }
    } catch (err) {
      console.error('Failed to load offer letters:', err);
      setError(err.message || 'Failed to load offer letters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function buildLetterBody(f) {
    const startDateFormatted = f.start_date
      ? new Date(f.start_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '[Start Date]';

    return `Dear ${f.candidate_name || '[Candidate Name]'},

We are pleased to offer you the position of ${f.position || '[Position]'} at ${
      companyName || '[Company Name]'
    }${f.department ? `, within the ${f.department} department` : ''}.

Your employment will commence on ${startDateFormatted}, on a ${
      f.employment_type
    } basis${
      f.employment_type === 'probation'
        ? ` with an initial probationary period of ${f.probation_months || 2} months`
        : ''
    }.

Your monthly compensation will be a basic salary of ${formatETB(
      f.basic_salary || 0
    )}, subject to statutory ERCA income tax deductions and employee pension remittances (7%) as mandated under Ethiopian labor proclamation rules.

Please confirm your acceptance of this appointment by signing and returning a copy of this letter.

We look forward to having you join our team.

Sincerely,
${companyName || 'Management'}
Human Resources Department`;
  }

  function handlePreview(e) {
    e.preventDefault();
    setError('');

    if (!sanitizeText(form.candidate_name)) {
      setError('Candidate name is required.');
      return;
    }

    if (!sanitizeText(form.position)) {
      setError('Position is required.');
      return;
    }

    setPreview(buildLetterBody(form));
  }

  async function handleSave() {
    if (!preview) {
      setError('Generate a letter preview before saving.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const basicSalary = sanitizeNumber(form.basic_salary, { min: 0 });
      const probationMonths = sanitizeNumber(form.probation_months, {
        min: 0,
        max: 12,
      });

      const payload = {
        candidate_name: sanitizeText(form.candidate_name),
        position: sanitizeText(form.position),
        department: sanitizeText(form.department) || null,
        start_date: form.start_date || null,
        basic_salary: basicSalary || 0,
        employment_type: form.employment_type,
        probation_months: probationMonths || 0,
        letter_body: preview,
      };

      const response = await fetch('/api/offer-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save offer letter');
      }

      setForm(EMPTY_FORM);
      setPreview(null);
      setSuccess(`Offer letter for ${payload.candidate_name} created as draft.`);
      setTimeout(() => setSuccess(''), 4000);

      await load();
    } catch (err) {
      console.error('Failed to save offer letter:', err);
      setError(err.message || 'Failed to save offer letter');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    try {
      setError('');
      setUpdatingId(id);

      const response = await fetch('/api/offer-letters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to mark offer letter as ${newStatus}`);
      }

      await load();
    } catch (err) {
      console.error(`Failed to update letter to ${newStatus}:`, err);
      setError(err.message || 'Failed to update offer letter');
    } finally {
      setUpdatingId(null);
    }
  }

  function handlePrint(letterBody) {
    const win = window.open('', '_blank');
    if (!win) {
      setError('Please allow pop-ups to print the letter.');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employment Offer Letter</title>
          <style>
            @page { size: A4 portrait; margin: 25mm 20mm; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 13pt;
              line-height: 1.65;
              color: #111827;
              max-width: 720px;
              margin: 40px auto;
              padding: 0 20px;
            }
            .content { white-space: pre-wrap; word-break: break-word; }
            .footer-sign {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="content">${escapeHtml(letterBody || '')}</div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  }

  // Filtered List
  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      const matchesSearch =
        l.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.position?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true : l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [letters, searchQuery, statusFilter]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      draft: letters.filter((l) => l.status === 'draft').length,
      sent: letters.filter((l) => l.status === 'sent').length,
      accepted: letters.filter((l) => l.status === 'accepted').length,
      total: letters.length,
    };
  }, [letters]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Accepted
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Send className="w-3 h-3 text-teal-600" />
            Dispatched
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Declined
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Draft
          </span>
        );
    }
  };

  if (loading && letters.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading offer letter templates...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Human Resources
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Offer Letters</h1>
          <p className="text-sm text-gray-500 mt-1">
            Issue, track, and print Ethiopian compliant employment agreements for prospective hires.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span> <strong className="text-gray-900">{companyName || 'Habesha Pay'}</strong></span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Created
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{counts.total}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Lifetime candidate offers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Accepted Offers
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{counts.accepted}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Confirmed
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Ready for employee onboarding</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Awaiting Reply
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{counts.sent}</h3>
              <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-md">
                Outbox
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Dispatched to candidate</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Draft Letters
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{counts.draft}</h3>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                Pending
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Internal review stage</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Two-Column Form & Real-Time Preview Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creation Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Generate Offer Letter</h2>
              <p className="text-xs text-gray-500">Configure appointment terms and compensation</p>
            </div>
          </div>

          <form onSubmit={handlePreview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Candidate Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yohannes Bekele"
                  value={form.candidate_name}
                  onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Position Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Engineering"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Start Date
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Monthly Basic Salary (ETB)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 45000"
                  value={form.basic_salary}
                  onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Employment Basis
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors"
                >
                  <option value="permanent">Permanent Contract</option>
                  <option value="contract">Fixed-Term Contract</option>
                  <option value="probation">Probationary Period</option>
                </select>
              </div>
            </div>

            {form.employment_type === 'probation' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Probation Duration (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.probation_months}
                  onChange={(e) => setForm({ ...form, probation_months: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Ethiopian Labor Law statutory default probation is up to 60 working days (2 months).
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-gray-600" />
                Render Document Preview
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Paper */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Document Canvas</h2>
                  <p className="text-xs text-gray-500">Official legal correspondence layout</p>
                </div>
              </div>

              {preview && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Ready to Issue
                </span>
              )}
            </div>

            {preview ? (
              <div className="bg-gray-50/75 border border-gray-200/80 rounded-xl p-5 font-serif text-xs leading-relaxed text-gray-800 whitespace-pre-wrap max-h-[350px] overflow-y-auto shadow-inner">
                {preview}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h3 className="text-xs font-semibold text-gray-700">No active preview rendered</h3>
                <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs mx-auto">
                  Complete candidate details on the left and click render to view letter draft
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100 mt-6 flex gap-3">
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setPreview(null);
              }}
              disabled={!preview || saving}
              className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!preview || saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Agreement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Offer Letter
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block mr-1" />
            {['all', 'draft', 'sent', 'accepted', 'rejected'].map((status) => (
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

        {filteredLetters.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No offer letters found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No records match your active search filters.'
                : 'Create your first candidate offer letter using the generator above'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Candidate</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Offered Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredLetters.map((letter) => (
                  <tr key={letter.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-4 px-5 font-semibold text-gray-900">
                      {letter.candidate_name}
                      {letter.start_date && (
                        <div className="text-[11px] font-normal text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Start: {letter.start_date}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-700">
                      {letter.position}
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {formatETB(letter.basic_salary || 0)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(letter.status)}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handlePrint(letter.letter_body)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium transition-colors text-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        Print
                      </button>

                      {letter.status === 'draft' && (
                        <button
                          disabled={updatingId === letter.id}
                          onClick={() => handleUpdateStatus(letter.id, 'sent')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors text-xs disabled:opacity-50"
                        >
                          {updatingId === letter.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Mark Sent
                        </button>
                      )}

                      {letter.status === 'sent' && (
                        <button
                          disabled={updatingId === letter.id}
                          onClick={() => handleUpdateStatus(letter.id, 'accepted')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors text-xs disabled:opacity-50"
                        >
                          {updatingId === letter.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Accepted
                        </button>
                      )}
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

function escapeHtml(str) {
  if (typeof document === 'undefined') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}