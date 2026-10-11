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
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, evalRes] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getModelEvaluation()
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value);
        } else {
          setError(statsRes.reason.message);
        }

        if (evalRes.status === 'fulfilled') {
          setEvalData(evalRes.value);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Driven Educational Assessment System
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Automated Question Paper Generation System
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            CBSE & State Board compliant test paper generator mapped across six Bloom's Taxonomy cognitive dimensions and calibrated difficulty levels.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/generate-paper"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors shadow-md shadow-purple-600/30 cursor-pointer"
            >
              Generate Question Paper
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/question-bank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium text-sm transition-colors border border-slate-700 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Explore Question Bank
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Questions</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {stats ? stats.total_questions?.toLocaleString() : '...'}
          </div>
          <p className="mt-1 text-xs text-slate-500">Verified and categorized</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Subjects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {stats ? stats.subjects?.length : '...'}
          </div>
          <p className="mt-1 text-xs text-slate-500">Physics, Chemistry, Maths & CS</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloom Classifier</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats?.models_status?.bloom_trained ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {stats?.models_status?.bloom_trained ? 'Active' : 'Unloaded'}
          </div>
          <p className="mt-1 text-xs text-slate-500">TF-IDF + Logistic Regression</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Papers Generated</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {stats ? stats.generated_papers_count : '...'}
          </div>
          <p className="mt-1 text-xs text-slate-500">Persisted in database</p>
        </div>
      </div>

      {/* End-to-End Workflow Architecture */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          System Workflow Architecture
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          How questions flow from raw data through machine learning classification to finalized question papers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-3">1</div>
            <h4 className="font-semibold text-sm text-slate-900">Dataset ETL</h4>
            <p className="text-xs text-slate-600 mt-1">Normalized labels, deduplicated items, verified schema.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mb-3">2</div>
            <h4 className="font-semibold text-sm text-slate-900">ML Classification</h4>
            <p className="text-xs text-slate-600 mt-1">Bloom's 6 levels + 3-tier difficulty predicted via NLP.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center mb-3">3</div>
            <h4 className="font-semibold text-sm text-slate-900">Constraint Selection</h4>
            <p className="text-xs text-slate-600 mt-1">Exact marks sum validation and cognitive distribution enforcement.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-3">4</div>
            <h4 className="font-semibold text-sm text-slate-900">PDF Compilation</h4>
            <p className="text-xs text-slate-600 mt-1">ReportLab high-fidelity print paper with teacher analytics summary.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
