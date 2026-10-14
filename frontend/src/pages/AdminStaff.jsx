import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  BookOpen,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'teacher',
    subject_specialization: '',
    password: 'Staff@2026'
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('ExamForge@2026');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.getStaff();
      setStaff(res.staff || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch staff members.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.createStaff(formData);
      setSuccess(res.message || 'Staff account created successfully.');
      setShowAddModal(false);
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        role: 'teacher',
        subject_specialization: '',
        password: 'Staff@2026'
      });
      loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to create staff account.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setError('');
    setSuccess('');
    try {
      await api.updateStaff(selectedStaff.id, {
        full_name: selectedStaff.full_name,
        phone: selectedStaff.phone,
        role: selectedStaff.role,
        subject_specialization: selectedStaff.subject_specialization,
        is_active: selectedStaff.is_active
      });
      setSuccess('Staff profile updated successfully.');
      setShowEditModal(false);
      loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to update staff account.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.resetStaffPassword(selectedStaff.id, resetPasswordVal);
      setSuccess(res.message || 'Password reset successfully.');
      setShowResetModal(false);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await api.updateStaff(member.id, { is_active: !member.is_active });
      setSuccess(`Account status updated for ${member.full_name || member.email}.`);
      loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to toggle account status.');
    }
  };

  const filteredStaff = staff.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.subject_specialization && s.subject_specialization.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Faculty & Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage teacher accounts, assign roles, reset credentials, and monitor institutional permissions.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredStaff.length}</span> staff members
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading staff directory...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No faculty or staff accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Subject Specialization</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          member.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.full_name ? member.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{member.full_name || 'Unnamed Faculty'}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        member.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {member.subject_specialization ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span>{member.subject_specialization}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Curriculum</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {member.phone ? (
                        <span className="text-slate-600 font-mono text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{member.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                          member.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{member.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowEditModal(true);
                          }}
                          title="Edit Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowResetModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add Faculty Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. K. Ramanathan"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g., ramanathan@examforge.ai"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics"
                    value={formData.subject_specialization}
                    onChange={(e) => setFormData({ ...formData, subject_specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g., 9840012345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Password will be hashed securely using PBKDF2:SHA256.
                </span>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Edit Staff Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={selectedStaff.full_name || ''}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={selectedStaff.role}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={selectedStaff.subject_specialization || ''}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, subject_specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={selectedStaff.phone || ''}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={selectedStaff.is_active}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, is_active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activeCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Account is Active and authorized to login
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Reset Credentials</h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Assign a secure new password for <b>{selectedStaff.full_name || selectedStaff.email}</b>.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
