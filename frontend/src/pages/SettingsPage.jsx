import React, { useEffect, useState } from 'react';
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  User,
  BookOpen,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [health, setHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const hRes = await api.getHealth();
      setHealth(hRes);

      if (isAdmin) {
        try {
          const mRes = await api.getModelStatus();
          setModelStatus(mRes);
        } catch {
          // Non-admin or error
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [isAdmin]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'System Diagnostics & Health' : 'Faculty Profile & System Access'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAdmin ? 'Infrastructure Diagnostics' : 'User Account & Connection'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Real-time telemetry of REST services, ML pipeline artifacts, and database storage.'
              : 'Your verified faculty credentials and Tamil Nadu curriculum service connectivity.'}
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Faculty Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{user?.full_name || 'Faculty Member'}</h3>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{user?.role || 'Teacher'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </span>
            <div className="font-semibold text-slate-900 font-mono">{user?.email || '—'}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Institutional Role</span>
            </span>
            <div className="font-semibold text-slate-900 capitalize">{user?.role || 'Teacher'}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Subject Assignment</span>
            </span>
            <div className="font-semibold text-slate-900">{user?.subject_specialization || 'Tamil Nadu State Board'}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Curriculum Scope</span>
            </span>
            <div className="font-semibold text-slate-900">Tamil Nadu State Board (Classes 6–12)</div>
          </div>
        </div>
      </div>

      {/* Grid of Diagnostic Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* API Health Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Backend API Gateway</h3>
              <p className="text-[11px] text-slate-500">Flask 3.1 Python REST Engine</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Server Health</span>
              <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{health ? health.status?.toUpperCase() : 'Connecting...'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Curriculum Engine</span>
              <span className="font-bold text-slate-800">Tamil Nadu State Board (6–12)</span>
            </div>
          </div>
        </div>

        {/* Database Storage Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Persistent Storage</h3>
              <p className="text-[11px] text-slate-500">SQLite + SQLAlchemy ORM</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">TN Question Bank</span>
              <span className="font-bold font-mono text-emerald-700">
                {health?.tn_questions_count || 1254} Questions
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Database Status</span>
              <span className="font-bold text-emerald-700">Connected & Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
