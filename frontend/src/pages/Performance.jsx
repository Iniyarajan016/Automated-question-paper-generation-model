import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function Performance() {
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const data = await api.getModelEvaluation();
        setEvalData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Computing held-out test evaluation benchmarks...</span>
        </div>
      </div>
    );
  }

  const bloom = evalData?.bloom;
  const difficulty = evalData?.difficulty;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Statistical Validation on Test Set</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            ML Evaluation & Model Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-validated performance metrics across Bloom's Taxonomy cognitive dimensions and difficulty tiers.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Notice: {error}</span>
        </div>
      )}

      {/* Model A: Bloom Classifier Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Model A: Bloom's Taxonomy Classifier</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pipeline: TF-IDF Text Feature Extraction + Multi-Class Logistic Regression</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            6-Class Discrete Classification
          </span>
        </div>

        {bloom ? (
          <div className="space-y-6">
            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Accuracy</span>
                <div className="text-2xl font-extrabold text-indigo-700 tabular-numbers">
                  {(bloom.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Macro F1 Score</span>
                <div className="text-2xl font-extrabold text-blue-700 tabular-numbers">
                  {(bloom.macro_f1 * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Macro Precision</span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-numbers">
                  {(bloom.macro_precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Macro Recall</span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-numbers">
                  {(bloom.macro_recall * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Per class table with micro visual meters */}
            {bloom.per_class && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Per-Class Cognitive Category Metrics
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Cognitive Dimension</th>
                        <th className="py-3 px-4">Precision</th>
                        <th className="py-3 px-4">Recall</th>
                        <th className="py-3 px-4">F1 Score & Balance</th>
                        <th className="py-3 px-4 text-right">Test Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(bloom.per_class).map(([cls, metrics]) => {
                        const f1Percent = (metrics['f1-score'] * 100);
                        return (
                          <tr key={cls} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{cls}</td>
                            <td className="py-3.5 px-4 text-slate-600 tabular-numbers">
                              {(metrics.precision * 100).toFixed(1)}%
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 tabular-numbers">
                              {(metrics.recall * 100).toFixed(1)}%
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${f1Percent}%` }}
                                    className="h-full bg-indigo-600 rounded-full"
                                  />
                                </div>
                                <span className="font-mono font-bold text-indigo-700 tabular-numbers">
                                  {f1Percent.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-500 font-mono tabular-numbers">
                              {metrics.support} items
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
            Bloom evaluation metrics have not yet been generated. Train models to populate reports.
          </div>
        )}
      </div>

      {/* Model B: Difficulty Classifier Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Model B: Difficulty Classifier</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pipeline: N-gram Text Features + Calibrated Difficulty Classifier</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            3-Tier Complexity Spectrum
          </span>
        </div>

        {difficulty ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Accuracy</span>
                <div className="text-2xl font-extrabold text-blue-700 tabular-numbers">
                  {(difficulty.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Macro F1 Score</span>
                <div className="text-2xl font-extrabold text-indigo-700 tabular-numbers">
                  {(difficulty.macro_f1 * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Macro Precision</span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-numbers">
                  {(difficulty.macro_precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Macro Recall</span>
                <div className="text-2xl font-extrabold text-slate-900 tabular-numbers">
                  {(difficulty.macro_recall * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Per class table */}
            {difficulty.per_class && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Difficulty Level Breakdown
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Difficulty Level</th>
                        <th className="py-3 px-4">Precision</th>
                        <th className="py-3 px-4">Recall</th>
                        <th className="py-3 px-4">F1 Score & Balance</th>
                        <th className="py-3 px-4 text-right">Test Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(difficulty.per_class).map(([cls, metrics]) => {
                        const f1Percent = (metrics['f1-score'] * 100);
                        return (
                          <tr key={cls} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{cls}</td>
                            <td className="py-3.5 px-4 text-slate-600 tabular-numbers">
                              {(metrics.precision * 100).toFixed(1)}%
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 tabular-numbers">
                              {(metrics.recall * 100).toFixed(1)}%
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${f1Percent}%` }}
                                    className={`h-full rounded-full ${
                                      cls === 'Easy' ? 'bg-emerald-500' :
                                      cls === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-800 tabular-numbers">
                                  {f1Percent.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-500 font-mono tabular-numbers">
                              {metrics.support} items
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
            Difficulty evaluation metrics have not yet been produced. Train models to populate reports.
          </div>
        )}
      </div>
    </div>
  );
}

