import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { api } from '../services/api';

const STANDARD_TN_SUBJECTS = [
  'Science',
  'Mathematics',
  'English',
  'Social Science',
  'Tamil',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science'
];

export default function PrincipalTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    assigned_subjects: ['Science']
  });
  const [editForm, setEditForm] = useState({
    full_name: '',
    is_active: true,
    assigned_subjects: []
  });
  const [resetPassword, setResetPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPrincipalTeachers();
      setTeachers(res.teachers || []);
    } catch (err) {
      setError(err.message || 'Failed to load teaching staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const toggleCreateSubject = (subj) => {
    setCreateForm((prev) => {
      const exists = prev.assigned_subjects.includes(subj);
      return {
        ...prev,
        assigned_subjects: exists
          ? prev.assigned_subjects.filter((s) => s !== subj)
          : [...prev.assigned_subjects, subj]
      };
    });
  };

  const toggleEditSubject = (subj) => {
    setEditForm((prev) => {
      const exists = prev.assigned_subjects.includes(subj);
      return {
        ...prev,
        assigned_subjects: exists
          ? prev.assigned_subjects.filter((s) => s !== subj)
          : [...prev.assigned_subjects, subj]
      };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (createForm.assigned_subjects.length === 0) {
      setError('Please assign at least one subject to the teacher.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await api.createPrincipalTeacher({
        full_name: createForm.full_name,
        email: createForm.email,
        password: createForm.password,
        subject_specialization: createForm.assigned_subjects.join(', ')
      });
      setSuccessMsg('Teacher account registered with subject authorization');
      setShowCreateModal(false);
      setCreateForm({ full_name: '', email: '', password: '', assigned_subjects: ['Science'] });
      await loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to register teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.updatePrincipalTeacher(selectedTeacher.id, {
        full_name: editForm.full_name,
        is_active: editForm.is_active,
        subject_specialization: editForm.assigned_subjects.join(', ')
      });
      setSuccessMsg(`Updated permissions for ${editForm.full_name || selectedTeacher.email}`);
      setShowEditModal(false);
      setSelectedTeacher(null);
      await loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to update teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.resetPrincipalTeacherPassword(selectedTeacher.id, resetPassword);
      setSuccessMsg(`Password updated for ${selectedTeacher.full_name || selectedTeacher.email}`);
      setShowResetModal(false);
      setSelectedTeacher(null);
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Staff & Subject Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Faculty Subject Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign curriculum subjects to teaching faculty. Teachers can only generate papers and access question banks for authorized subjects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTeachers}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Faculty Member</span>
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

      {/* Access Rule Info Card */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">Strict Subject-Based Access Control Active:</div>
          <p className="text-blue-800/90 leading-relaxed">
            Teachers may only view questions, preview blueprints, and generate question papers for the subjects explicitly assigned below.
            A teacher with <strong>Science</strong> cannot generate <strong>Mathematics</strong> papers. Teachers without assigned subjects cannot generate any papers.
          </p>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Registered Teaching Faculty</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Total {teachers.length} faculty member(s) enrolled in school database.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading faculty members...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No faculty members registered yet. Click "Register Faculty Member" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-6">Faculty Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Subject(s)</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => {
                  const subs = t.assigned_subjects || [];
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-6 font-semibold text-slate-900">{t.full_name || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{t.email}</td>
                      <td className="py-3 px-4">
                        {subs.length === 0 ? (
                          <span className="text-[11px] text-rose-600 font-semibold italic">
                            No subject assigned
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {subs.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {t.is_active ? (
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
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTeacher(t);
                            setEditForm({
                              full_name: t.full_name || '',
                              is_active: t.is_active,
                              assigned_subjects: t.assigned_subjects || []
                            });
                            setShowEditModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Edit subject permissions"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeacher(t);
                            setResetPassword('');
                            setShowResetModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Reset password"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset Pass</span>
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

      {/* Modal: Create Teacher */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Register Teaching Faculty</h3>
            <p className="text-xs text-slate-500">
              Create a faculty account and assign the subject(s) they are authorized to teach.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Mrs. K. Meenakshi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="meenakshi@school.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Subject(s) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {STANDARD_TN_SUBJECTS.map((subj) => {
                    const checked = createForm.assigned_subjects.includes(subj);
                    return (
                      <label key={subj} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCreateSubject(subj)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{subj}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Selected: {createForm.assigned_subjects.join(', ') || 'None (generation blocked)'}
                </div>
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Teacher & Subjects */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Configure Faculty Permissions</h3>
            <p className="text-xs text-slate-500 font-mono">{selectedTeacher.email}</p>

            <form onSubmit={handleEdit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Authorized Subjects (Check all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {STANDARD_TN_SUBJECTS.map((subj) => {
                    const checked = editForm.assigned_subjects.includes(subj);
                    return (
                      <label key={subj} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEditSubject(subj)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{subj}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Active authorization: {editForm.assigned_subjects.join(', ') || 'No subject assigned'}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">Account Active</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5 ml-5">
                  Inactive teachers are blocked from logging in.
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Subject Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Teacher Password</h3>
            <p className="text-xs text-slate-500 font-mono">
              Setting new password for {selectedTeacher.full_name} ({selectedTeacher.email})
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
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

