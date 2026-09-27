'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import {
  sanitizeText,
  sanitizePhone,
  sanitizeTIN,
} from '@/lib/sanitize';
import {
  Building2,
  Receipt,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Landmark,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    company,
    role,
    refresh,
    loading: companyLoading,
  } = useCompany();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        ...company,
        pension_scheme: company.pensionScheme || 'private',
      });
    }
  }, [company]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    if (saved) setSaved(false);
    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSaved(false);
    setSaving(true);

    const payload = {
      name: sanitizeText(form.name),
      tin: sanitizeTIN(form.tin) || null,
      address: sanitizeText(form.address) || null,
      city: sanitizeText(form.city) || null,
      phone: sanitizePhone(form.phone) || null,
      pension_scheme: form.pension_scheme || 'private',
    };

    try {
      const response = await fetch('/api/company', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Failed to update company settings'
        );
      }

      setSaved(true);

      if (refresh) {
        await refresh();
      }
    } catch (err) {
      console.error('Settings save error:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (companyLoading || !form) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading company settings...</p>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Organization
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Company Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your legal entity credentials, ERCA tax numbers, and statutory pension profiles.
          </p>
        </div>

        {!isAdmin && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
            <Lock className="w-3.5 h-3.5" />
            Read-Only (Admin Access Required)
          </div>
        )}
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">Company settings updated successfully.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: Business Identity */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Identity & Tax
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Official legal registration name and Ethiopian Revenue (TIN) identifier.
            </p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={!isAdmin}
                required
                placeholder="e.g. Acme Technologies PLC"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tax Identification Number (TIN)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.tin || ''}
                  onChange={(e) => updateField('tin', e.target.value)}
                  disabled={!isAdmin}
                  placeholder="10-digit TIN number"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
                <Receipt className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Required for standard ERCA tax reporting and declaration exports.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Contact & Location
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Physical address printed on generated staff payslips.
            </p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Addis Ababa"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={!isAdmin}
                    placeholder="+251 911 000000"
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
                disabled={!isAdmin}
                placeholder="Sub-city, Woreda, House No. or Office building"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Pension & Statutory Classification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              Pension Scheme
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Determines statutory deduction formulas for pension schemes.
            </p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  form.pension_scheme === 'private'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="pension_scheme"
                  value="private"
                  checked={form.pension_scheme === 'private'}
                  onChange={(e) => updateField('pension_scheme', e.target.value)}
                  disabled={!isAdmin}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">
                    Private Organization
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Private sector employees (11% employer / 7% employee contribution).
                  </span>
                </div>
              </label>

              <label
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  form.pension_scheme === 'government'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="pension_scheme"
                  value="government"
                  checked={form.pension_scheme === 'government'}
                  onChange={(e) => updateField('pension_scheme', e.target.value)}
                  disabled={!isAdmin}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">
                    Public / Government
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Public sector civil service pension rules and agency rates.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}