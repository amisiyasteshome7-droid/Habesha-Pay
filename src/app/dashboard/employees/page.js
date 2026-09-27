'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useCompany } from '@/hooks/useCompany';
import { formatETB } from '@/lib/payrollCalc';
import {
  Users,
  UserPlus,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Briefcase,
  Layers,
} from 'lucide-react';

export default function EmployeesPage() {
  const { companyId, loading: companyLoading } = useCompany();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!companyId) return;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/employees', {
          method: 'GET',
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load employees.');
        }

        setEmployees(result.employees || []);
      } catch (err) {
        console.error('Employees loading error:', err);
        setError(err.message || 'Unable to load employees.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [companyId]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const text = `${e.full_name || ''} ${e.employee_code || ''} ${e.department || ''} ${e.position || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const summary = useMemo(() => {
    const active = employees.filter((e) => e.status === 'active').length;
    const onLeave = employees.filter((e) => e.status === 'on_leave').length;
    const totalPayroll = employees.reduce(
      (acc, e) => acc + (Number(e.basic_salary) || 0),
      0
    );
    return { active, onLeave, totalPayroll, total: employees.length };
  }, [employees]);

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

  if (companyLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading workforce roster...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Human Resources
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Employees Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain permanent and contract personnel profiles, statutory TIN identifiers, and salary schedules.
          </p>
        </div>

        <Link
          href="/dashboard/employees/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Headcount
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{summary.total}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                All staff
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">On company roster</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Employees
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{summary.active}</h3>
              <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-md">
                Payroll ready
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Eligible for period run</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              On Leave
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{summary.onLeave}</h3>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                Temporary
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Approved time off</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Monthly Base Outlay
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900">{formatETB(summary.totalPayroll)}</h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Total active basic salary</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Directory Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              placeholder="Search name, code, department, position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block mr-1" />
            {['all', 'active', 'on_leave', 'terminated'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No employees found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No staff members match your filter criteria.'
                : 'Add your first employee to initiate payroll disbursements and ERCA filings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Basic Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {emp.full_name
                            ? emp.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{emp.full_name}</div>
                          <span className="text-[11px] font-mono text-gray-400">
                            {emp.employee_code || 'ID not set'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {emp.position || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      {emp.department ? (
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {emp.department}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {formatETB(emp.basic_salary)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(emp.status)}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/employees/${emp.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium transition-colors text-xs"
                      >
                        Profile
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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