import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Database,
  Cpu,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [hRes, mRes] = await Promise.allSettled([
        api.getHealth(),
        api.getModelStatus()
      ]);
      if (hRes.status === 'fulfilled') setHealth(hRes.value);
      if (mRes.status === 'fulfilled') setModelStatus(mRes.value);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & Health</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status of Flask REST API, ML inference engines, and SQLite database.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Backend Service Health
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">API Status</span>
            <div className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {health ? health.status : 'Connecting...'}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Framework</span>
            <div className="font-bold text-slate-800 mt-1">Python Flask (RESTful)</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          Machine Learning Classifiers
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Bloom's Taxonomy Model</span>
            <div className="font-bold text-slate-800 mt-1">
              {modelStatus?.bloom_model_loaded ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Loaded (Joblib)
                </span>
              ) : (
                <span className="text-amber-600">Pending Training</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Difficulty Model</span>
            <div className="font-bold text-slate-800 mt-1">
              {modelStatus?.difficulty_model_loaded ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Loaded (Joblib)
                </span>
              ) : (
                <span className="text-amber-600">Pending Training</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-purple-600" />
          Data & Persistence
        </h3>
        <div className="text-xs text-slate-600 space-y-2">
          <p>• Database: SQLite (via SQLAlchemy ORM)</p>
          <p>• PDF Engine: ReportLab 5.0+</p>
          <p>• Dataset: EduBloom Question Bank (Normalized CBSE/State Board format)</p>
        </div>
      </div>
    </div>
  );
}
