'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  X,
  BadgeCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const ROLES = [
  {
    value: 'admin',
    label: 'Administrator',
    desc: 'Full company access, billing, and team permission controls',
  },
  {
    value: 'hr',
    label: 'HR Manager',
    desc: 'Employee management, contracts, offer letters, and leave approvals',
  },
  {
    value: 'finance',
    label: 'Finance Specialist',
    desc: 'Payroll runs, tax declarations, pension remits, and ERCA reports',
  },
  {
    value: 'viewer',
    label: 'Read-only Viewer',
    desc: 'Audit view only; cannot initiate runs or edit staff records',
  },
];

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [currentRole, setCurrentRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState(null);

  // Invite Form State
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  // Feedback Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  async function loadTeam() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/team', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load team members.');
      }

      setMembers(data.members || []);
      setInvites(data.invites || []);
      setCurrentRole(data.role || '');
      setCurrentUserId(data.currentUserId || '');
    } catch (err) {
      console.error('Failed to load team:', err);
      setError(err.message || 'Unable to load company team list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function changeRole(memberId, role) {
    try {
      setSavingMemberId(memberId);
      setError('');

      const response = await fetch('/api/team', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update member role.');
      }

      setMembers((previousMembers) =>
        previousMembers.map((member) =>
          member.id === memberId
            ? {
                ...member,
                role: data.member.role,
              }
            : member
        )
      );

      setSuccess('Team member role updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Change role error:', err);
      setError(err.message || 'Failed to update member role.');
    } finally {
      setSavingMemberId(null);
    }
  }

  async function createInvitation(event) {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    try {
      setCreatingInvite(true);

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to create invitation.');
      }

      const invitationLink = data.invite.invitationLink;

      await navigator.clipboard.writeText(invitationLink);
      setCopiedLink(invitationLink);

      setEmail('');
      setInviteRole('viewer');
      setShowInviteModal(false);

      setSuccess(`Invitation link copied to your clipboard: ${invitationLink}`);
      setTimeout(() => setSuccess(''), 6000);

      await loadTeam();
    } catch (err) {
      console.error('Invite error:', err);
      setError(err.message || 'Failed to create invitation.');
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleCopyExisting(link) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch {
      setError('Could not copy link to clipboard.');
    }
  }

  function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="w-3 h-3 text-emerald-600" />
            Admin
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <BadgeCheck className="w-3 h-3 text-teal-600" />
            Finance
          </span>
        );
      case 'hr':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3 h-3 text-blue-600" />
            HR
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Viewer
          </span>
        );
    }
  };

  // Filter Members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const name = member.fullName?.toLowerCase() || '';
      const mail = member.email?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = name.includes(query) || mail.includes(query);
      const matchesRole = roleFilter === 'all' ? true : member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  if (loading && members.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-gray-600">Loading team members and access roles...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Workspace Settings
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Team & Access Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage company administrators, role permissions, and active invitation tokens.
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            onClick={() => {
              setError('');
              setShowInviteModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Members
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{members.length}</h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Registered organization users</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pending Invites
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{invites.length}</h3>
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                Awaiting
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">14-day token expiration</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Administrators
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {members.filter((m) => m.role === 'admin').length}
              </h3>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                Full Control
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Privileged team managers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Your Current Role
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                {currentRole || 'Viewer'}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Active session authorization</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
            <BadgeCheck className="w-5 h-5" />
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

      {/* Members Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search member name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block mr-1" />
            {['all', 'admin', 'finance', 'hr', 'viewer'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  roleFilter === role
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No members found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'all'
                ? 'No team members match your current filter parameters.'
                : 'Your organization currently has no registered members.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Team Member</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Member Since</th>
                  <th className="py-3.5 px-5 text-right">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredMembers.map((member) => {
                  const isCurrentUser = member.id === currentUserId;

                  return (
                    <tr key={member.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {member.fullName
                              ? member.fullName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {member.fullName || 'Registered User'}
                              {isCurrentUser && (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">ID: {member.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-600">
                        {member.email}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(member.role)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                        {formatDate(member.createdAt)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {currentRole === 'admin' && !isCurrentUser ? (
                          <div className="inline-flex items-center gap-1.5">
                            {savingMemberId === member.id && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            )}
                            <select
                              value={member.role}
                              disabled={savingMemberId === member.id}
                              onChange={(e) => changeRole(member.id, e.target.value)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition-colors cursor-pointer"
                            >
                              {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono italic">
                            {isCurrentUser ? 'Locked (Self)' : 'View Only'}
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

      {/* Pending Invites Section */}
      {currentRole === 'admin' && (
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Pending Invitations</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Secure links dispatched to prospective colleagues. Valid for 14 days.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400">
              {invites.length} Pending
            </span>
          </div>

          {invites.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No outstanding invitations. All teammates have completed signup.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Target Email</th>
                    <th className="py-3.5 px-4">Invited Role</th>
                    <th className="py-3.5 px-4">Dispatched On</th>
                    <th className="py-3.5 px-4">Expiration</th>
                    <th className="py-3.5 px-5 text-right">Token Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        {invite.email}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(invite.role)}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {formatDate(invite.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-amber-700 font-medium">
                        {formatDate(invite.expiresAt)}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Awaiting Accept
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Invite Drawer Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowInviteModal(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-emerald-900 text-white">
                <div>
                  <h2 className="text-lg font-bold">Invite New Teammate</h2>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Generate an onboarding link with scoped role permissions.
                  </p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={createInvitation} className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="colleague@habeshapay.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Assign Role & Permissions
                  </label>
                  <div className="space-y-2">
                    {ROLES.filter((r) => r.value !== 'admin').map((r) => (
                      <label
                        key={r.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          inviteRole === r.value
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="invite_role"
                          value={r.value}
                          checked={inviteRole === r.value}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-gray-900">{r.label}</div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                  <div className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                    Automatic Link Dispatch
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Creating an invite automatically copies a 14-day secure registration link to your clipboard.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingInvite}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {creatingInvite ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Generate Invite Link
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