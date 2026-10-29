import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  BarChart3,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Edit2,
  Lock,
  RefreshCw,
  Building2,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function ChairmanDashboard() {
  const [principals, setPrincipals] = useState([]);
  const [teacherStats, setTeacherStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '' });
  const [editForm, setEditForm] = useState({ full_name: '', is_active: true });
  const [resetPassword, setResetPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [principalsRes, statsRes] = await Promise.all([
        api.getChairmanPrincipals(),
        api.getChairmanTeacherStats()
      ]);
      setPrincipals(principalsRes.principals || []);
      setTeacherStats(statsRes.stats || statsRes);
    } catch (err) {
      setError(err.message || 'Failed to load institutional data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createChairmanPrincipal(createForm);
      setSuccessMsg('Principal account created successfully');
      setShowCreateModal(false);
      setCreateForm({ full_name: '', email: '', password: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create principal account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedPrincipal) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.updateChairmanPrincipal(selectedPrincipal.id, editForm);
      setSuccessMsg('Principal account updated successfully');
      setShowEditModal(false);
      setSelectedPrincipal(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update principal account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedPrincipal) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.resetChairmanPrincipalPassword(selectedPrincipal.id, resetPassword);
      setSuccessMsg(`Password reset for ${selectedPrincipal.full_name || selectedPrincipal.email}`);
      setShowResetModal(false);
      setSelectedPrincipal(null);
      setResetPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
            <Building2 className="w-4 h-4" />
            <span>Highest Institutional Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Chairman Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee school principal appointments and monitor aggregate faculty statistics across academic subjects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Appoint Principal</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Aggregate Institutional Stats (Teacher counts only - no PII) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Appointed Principals</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {principals.length}
          </div>
          <div className="text-[11px] text-slate-400">Institutional administrators</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Faculty Count</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {teacherStats?.total_teachers ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Registered teaching positions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Faculty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-600">
            {teacherStats?.active_teachers ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Authorized for paper generation</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inactive Faculty</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-500">
            {teacherStats?.inactive_teachers ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Suspended or unassigned</div>
        </div>
      </div>

      {/* Subject-wise Teacher Distribution Card (Strictly Counts Only) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Faculty Strength by Subject Specialization</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live count of teachers authorized by subject (aggregated without personal credentials).
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {Object.keys(teacherStats?.subject_breakdown || {}).length} Subjects Active
          </span>
        </div>

        {Object.keys(teacherStats?.subject_breakdown || {}).length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No subject assignments recorded in faculty database.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(teacherStats?.subject_breakdown || {}).map(([subject, count]) => (
              <div key={subject} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700 truncate" title={subject}>
                  {subject}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-purple-900">{count}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Teachers</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Principal Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Institutional Principals</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators authorized to manage school teachers and allocate subject permissions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading principal records...</div>
        ) : principals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No principals appointed yet. Click "Appoint Principal" above to create an account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {principals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-6 font-semibold text-slate-900">{p.full_name || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPrincipal(p);
                          setEditForm({ full_name: p.full_name || '', is_active: p.is_active });
                          setShowEditModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                        title="Edit status"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrincipal(p);
                          setResetPassword('');
                          setShowResetModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors cursor-pointer"
                        title="Reset password"
                      >
                        <Key className="w-3 h-3" />
                        <span>Reset Pass</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Principal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Appoint Institutional Principal</h3>
            <p className="text-xs text-slate-500">
              Create an institutional administrator account authorized to manage teaching staff.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Dr. S. Ramanathan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="principal@school.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Appoint Principal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Principal */}
      {showEditModal && selectedPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Principal Account</h3>
            <p className="text-xs text-slate-500 font-mono">{selectedPrincipal.email}</p>

            <form onSubmit={handleEdit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">Account Active</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5 ml-5">
                  Deactivated principals cannot log in or manage faculty.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetModal && selectedPrincipal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Principal Password</h3>
            <p className="text-xs text-slate-500 font-mono">
              Setting new password for {selectedPrincipal.full_name} ({selectedPrincipal.email})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

