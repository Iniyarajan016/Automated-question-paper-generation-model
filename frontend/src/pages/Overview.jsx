import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  BookOpen,
  PlusCircle,
  FolderUp,
  ShieldCheck,
  History,
  Download,
  Calendar,
  Users,
  Building2,
  BarChart3,
  Lock,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Overview() {
  const { user, isAdmin, isPrincipal, isChairman, isTeacher } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const statsRes = await api.getDashboardStats();
        setStats(statsRes);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.role]);

  const teacherSubjects = stats?.assigned_subjects || user?.assigned_subjects || (
    user?.subject_specialization
      ? user.subject_specialization.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className={isChairman ? 'text-purple-600' : isPrincipal ? 'text-emerald-600' : isAdmin ? 'text-amber-600' : 'text-blue-600'}>
              {isChairman
                ? 'Institutional Governance'
                : isPrincipal
                ? 'School Academic Leadership'
                : isAdmin
                ? 'System Administrator Portal'
                : 'Faculty Assessment Operations'}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isChairman
              ? 'Institutional Chairman Portal'
              : isPrincipal
              ? `Principal Dashboard — ${user?.full_name || 'Administrator'}`
              : isAdmin
              ? 'ExamForge AI Administration'
              : `Welcome, ${user?.full_name || 'Faculty Member'}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isChairman
              ? 'Monitor principal appointments and academic subject strength across teaching positions.'
              : 'Tamil Nadu State Board / Samacheer Kalvi Automated Assessment System (Classes 6–12).'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isChairman ? (
            <Link
              to="/chairman/principals"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/30 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manage Principals</span>
            </Link>
          ) : isPrincipal ? (
            <>
              <Link
                to="/principal/teachers"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Faculty Management</span>
              </Link>
              <Link
                to="/generate-paper"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Generate Examination</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/question-bank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Question Bank</span>
              </Link>
              <Link
                to="/generate-paper"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Generate Examination</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. CHAIRMAN DASHBOARD VIEW (ACADEMIC LEADERSHIP & TEACHER COUNTS ONLY) */}
      {/* ===================================================================== */}
      {isChairman ? (
        <div className="space-y-6">
          {/* Chairman Aggregate Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Appointed Principals</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-purple-900">
                {stats?.principals_count || 0}
              </div>
              <div className="text-[11px] text-slate-400">Institutional administrators</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Faculty Positions</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.teachers_count || 0}
              </div>
              <div className="text-[11px] text-slate-400">School teaching staff</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Faculty</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-600">
                {stats?.active_teachers || 0}
              </div>
              <div className="text-[11px] text-slate-400">Authorized for paper generation</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Inactive Faculty</span>
                <AlertCircle className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-500">
                {stats?.inactive_teachers || 0}
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
                  <span>Subject-Wise Faculty Strength (Live Counts)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregate teacher count grouped by subject specialization (no teacher PII or credentials exposed).
                </p>
              </div>
              <Link
                to="/chairman/principals"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>Manage Principals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {Object.keys(stats?.subject_breakdown || {}).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No subject assignments recorded in faculty database.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(stats?.subject_breakdown || {}).map(([subject, count]) => (
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
        </div>
      ) : isPrincipal ? (
        /* ===================================================================== */
        /* 2. PRINCIPAL DASHBOARD VIEW (FACULTY MANAGEMENT & OPERATIONS)        */
        /* ===================================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Managed Faculty</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.teachers_count || 0}
              </div>
              <div className="text-[11px] text-slate-400">Registered teaching staff</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Teachers</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-600">
                {stats?.active_teachers || 0}
              </div>
              <div className="text-[11px] text-slate-400">Authorized for paper generation</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>TN Question Bank</span>
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.total_questions || 0}
              </div>
              <div className="text-[11px] text-slate-400">Classes 6 to 12 syllabus items</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Papers Generated</span>
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.papers_generated || 0}
              </div>
              <div className="text-[11px] text-slate-400">School examination blueprints</div>
            </div>
          </div>

          {/* Principal Quick Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/principal/teachers"
              className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Faculty Subject Management</h3>
              <p className="text-xs text-slate-500">
                Assign curriculum subjects to teachers, create faculty accounts, manage activation status, and reset teacher passwords.
              </p>
            </Link>

            <Link
              to="/generate-paper"
              className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Launch Question Paper Studio</h3>
              <p className="text-xs text-slate-500">
                Synthesize official Tamil Nadu State Board question papers with mark-wise section distribution starting at Section A.
              </p>
            </Link>
          </div>
        </div>
      ) : isAdmin ? (
        <div className="space-y-6">
          {/* Admin Telemetry Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Faculty Accounts</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.staff_count || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Authorized teaching staff
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tamil Nadu Question Bank</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.total_tn_questions || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Classes 6 to 12 verified items
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>CSV Datasets Ingested</span>
                <FolderUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.dataset_uploads_count || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Validated past papers
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Papers Generated</span>
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.papers_generated || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Formal examination papers
              </div>
            </div>
          </div>

          {/* Quick Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/staff"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Staff Management</h3>
              <p className="text-xs text-slate-500">
                Add faculty members, configure subject assignments, and manage access credentials.
              </p>
            </Link>

            <Link
              to="/admin/datasets"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FolderUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Dataset Management</h3>
              <p className="text-xs text-slate-500">
                Upload CSV question papers, map schema columns, deduplicate, and run validation audits.
              </p>
            </Link>

            <Link
              to="/admin/models"
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Model Training (Random Forest)</h3>
              <p className="text-xs text-slate-500">
                Train TF-IDF + Random Forest pipelines, review held-out test metrics and activate versioned artifacts.
              </p>
            </Link>
          </div>

          {/* Active Models & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Model Status */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Active Production Models (Random Forest)</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Bloom's Taxonomy Classifier</div>
                    <div className="text-[11px] text-slate-500">
                      Version: {stats?.active_models?.bloom?.version || 'Default Active Pipeline'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Difficulty Classifier</div>
                    <div className="text-[11px] text-slate-500">
                      Version: {stats?.active_models?.difficulty?.version || 'Default Active Pipeline'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/admin/models"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View full evaluation reports & confusion matrices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Recent Administrative Audit Logs */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <span>Recent System Activity</span>
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(stats?.recent_activity || []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No recent activity logged.</div>
                ) : (
                  stats.recent_activity.map((act) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 font-mono text-[11px]">{act.action}</div>
                        <div className="text-[10px] text-slate-400">{act.user_email || 'System'}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* 4. TEACHER DASHBOARD VIEW (SUBJECT SPECIALIZATION & GENERATION)       */
        /* ===================================================================== */
        <div className="space-y-6">
          {/* Teacher Subject Assignment Badge Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Your Authorized Academic Subject(s)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You are authorized to generate question papers and search questions only for your assigned subjects.
                </p>
              </div>
            </div>

            <div>
              {teacherSubjects.length === 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No subject assigned. Please contact your Principal.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teacherSubjects.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Teacher Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>My Generated Papers</span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.papers_generated_by_user || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Examination blueprints created by you
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>TN State Board Question Bank</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                {stats?.total_questions_available || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Classes 6–12 syllabus items
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Verified Classes</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900">
                7
              </div>
              <div className="text-[11px] text-slate-400">
                Classes 6, 7, 8, 9, 10, 11, and 12
              </div>
            </div>
          </div>

          {/* Quick Start Action Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/15 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Generate a Question Paper Now</h3>
              <p className="text-xs text-blue-100 max-w-xl">
                Choose class from 6 to 12, select your subject and textbook chapters, configure total marks and cognitive distribution, and download a printable A4 examination PDF.
              </p>
            </div>
            <Link
              to="/generate-paper"
              className="px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Launch Paper Generator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Recent Papers Table (Teacher-Scoped) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">My Recent Examination Papers</h3>
              <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All History
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading your examination papers...</div>
            ) : (stats?.recent_papers || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                You have not generated any examination papers yet.{' '}
                <Link to="/generate-paper" className="text-blue-600 underline ml-1">
                  Generate your first paper
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-3 px-6">Examination Title</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Questions</th>
                      <th className="py-3 px-4">Total Marks</th>
                      <th className="py-3 px-6 text-right">PDF Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recent_papers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-6 font-semibold text-slate-900">{p.title}</td>
                        <td className="py-3 px-4 text-slate-600">{p.class_grade}</td>
                        <td className="py-3 px-4 text-slate-600">{p.subject}</td>
                        <td className="py-3 px-4 font-mono">{p.num_questions}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.total_marks}</td>
                        <td className="py-3 px-6 text-right">
                          <a
                            href={api.getPaperDownloadUrl(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors cursor-pointer text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
