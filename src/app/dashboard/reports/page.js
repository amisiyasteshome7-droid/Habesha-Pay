'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';

// Cohesive Habesha Pay emerald/green theme palette
const EMERALD_PALETTE = [
  '#059669', // Emerald 600
  '#10b981', // Emerald 500
  '#34d399', // Emerald 400
  '#0d9488', // Teal 600
  '#14b8a6', // Teal 500
  '#047857', // Emerald 700
  '#6ee7b7'  // Emerald 300
];

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function ReportsPage() {
  const [data, setData] = useState({ runs: [], departmentBreakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error('Failed to load reports data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching reports');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const formatETB = (val) => `${Number(val || 0).toLocaleString()} ETB`;

  // Parse chronological labels from database records
  const trendData = (data.runs || []).map((run) => {
    const month = MONTH_NAMES[run.period_month] || `M${run.period_month}`;
    const yearShort = String(run.period_year).slice(-2);
    return {
      id: run.id,
      label: `${month} '${yearShort}`,
      total_net: run.total_net,
    };
  });

  const departmentData = data.departmentBreakdown || [];

  // Summary statistics computed directly from DB data
  const totalEmployees = departmentData.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const totalBasePayroll = departmentData.reduce((acc, curr) => acc + (curr.totalSalary || 0), 0);
  const latestRun = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const prevRun = trendData.length > 1 ? trendData[trendData.length - 2] : null;

  let payrollDelta = null;
  if (latestRun && prevRun && prevRun.total_net > 0) {
    payrollDelta = (((latestRun.total_net - prevRun.total_net) / prevRun.total_net) * 100).toFixed(1);
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-emerald-100 p-3 rounded-xl shadow-lg">
          <p className="text-xs font-semibold text-gray-500 mb-1">{label || payload[0]?.name}</p>
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center gap-2 text-xs py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-gray-600">
                {entry.name === 'total_net' ? 'Net Disbursed' : entry.name === 'totalSalary' ? 'Basic Salary' : entry.name}:
              </span>
              <span className="font-semibold text-gray-900">
                {formatETB(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading payroll reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <h3 className="text-sm font-medium">Failed to load reports</h3>
            <p className="text-xs mt-1 text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historical payroll runs, compensation structures, and departmental distributions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Latest Net Run</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {latestRun ? formatETB(latestRun.total_net) : '0 ETB'}
            </h3>
            {payrollDelta !== null && (
              <span className={`text-xs flex items-center font-semibold ${Number(payrollDelta) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {Number(payrollDelta) >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {payrollDelta}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {latestRun ? `Run for ${latestRun.label}` : 'No records logged'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Monthly Base Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-gray-900">{formatETB(totalBasePayroll)}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Total active basic salary obligations</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Active Staff</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-gray-900">{totalEmployees}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Across all organizational teams</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Departments</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-gray-900">{departmentData.length}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Functional operating divisions</p>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Payroll Historical Trend */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Net Payroll Disbursements</h2>
              <p className="text-xs text-gray-500 mt-0.5">Historical trend across executed payroll cycles</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Calendar className="w-3.5 h-3.5" />
              Past 12 Cycles
            </span>
          </div>

          <div className="h-[300px] w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 border border-dashed border-gray-200 rounded-lg">
                <Layers className="w-8 h-8 opacity-40" />
                <p className="text-xs">No payroll runs found to chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total_net"
                    name="Net Pay"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#emeraldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Salary Share Donut */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Salary by Department</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribution of base salary spend</p>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center my-2">
            {departmentData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
                No active employee department records.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="totalSalary"
                    nameKey="department"
                  >
                    {departmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={EMERALD_PALETTE[index % EMERALD_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
            {departmentData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EMERALD_PALETTE[idx % EMERALD_PALETTE.length] }}
                  />
                  <span className="text-gray-600 truncate">{item.department}</span>
                </div>
                <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">
                  {formatETB(item.totalSalary)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Breakdown Bar Chart & Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">Department Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Headcount allocation and aggregate compensation</p>
        </div>

        <div className="h-[260px] w-full mb-6">
          {departmentData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
              No department data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalSalary"
                  name="Total Salary"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Detailed Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Active Staff</th>
                <th className="py-3 px-4">Monthly Base Payroll</th>
                <th className="py-3 px-4">Avg. Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {departmentData.map((dept, index) => {
                const avgSalary = dept.count > 0 ? Math.round(dept.totalSalary / dept.count) : 0;
                return (
                  <tr key={index} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: EMERALD_PALETTE[index % EMERALD_PALETTE.length] }}
                      />
                      {dept.department}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{dept.count} members</td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">{formatETB(dept.totalSalary)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatETB(avgSalary)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}