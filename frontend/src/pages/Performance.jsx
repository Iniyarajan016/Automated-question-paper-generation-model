import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle,
  AlertCircle,
  FileText,
  Activity,
  Layers
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
    return <div className="p-8 text-center text-xs text-slate-500">Loading evaluation reports...</div>;
  }

  const bloom = evalData?.bloom;
  const difficulty = evalData?.difficulty;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Machine Learning Evaluation & Performance</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Metrics computed on held-out test datasets using standard Scikit-Learn evaluation criteria.
        </p>
      </div>

      {/* Model A: Bloom Classifier Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Model A: Bloom's Taxonomy Classifier</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pipeline: TF-IDF Text Vectorization + Multiclass Logistic Regression</p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            6-Class Classification
          </span>
        </div>

        {bloom ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Accuracy</span>
                <div className="text-xl font-bold text-blue-600 mt-1">{(bloom.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Macro F1</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">{(bloom.macro_f1 * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Macro Precision</span>
                <div className="text-xl font-bold text-slate-800 mt-1">{(bloom.macro_precision * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Macro Recall</span>
                <div className="text-xl font-bold text-slate-800 mt-1">{(bloom.macro_recall * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Per class table */}
            {bloom.per_class && (
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-2">Per-Class Breakdown (Held-out Test Set)</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Bloom Dimension</th>
                        <th className="py-2.5 px-3">Precision</th>
                        <th className="py-2.5 px-3">Recall</th>
                        <th className="py-2.5 px-3">F1-Score</th>
                        <th className="py-2.5 px-3">Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(bloom.per_class).map(([cls, metrics]) => (
                        <tr key={cls}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{cls}</td>
                          <td className="py-2.5 px-3 text-slate-600">{(metrics.precision * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-slate-600">{(metrics.recall * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 font-medium text-blue-600">{(metrics['f1-score'] * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-slate-500">{metrics.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 p-4 rounded-lg">
            Bloom evaluation metrics have not yet been produced. Train models to populate reports.
          </div>
        )}
      </div>

      {/* Model B: Difficulty Classifier Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Model B: Difficulty Classifier</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pipeline: TF-IDF Text Features + Calibrated Classifier</p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            3-Tier Spectrum
          </span>
        </div>

        {difficulty ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Accuracy</span>
                <div className="text-xl font-bold text-blue-600 mt-1">{(difficulty.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Macro F1</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">{(difficulty.macro_f1 * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Macro Precision</span>
                <div className="text-xl font-bold text-slate-800 mt-1">{(difficulty.macro_precision * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Macro Recall</span>
                <div className="text-xl font-bold text-slate-800 mt-1">{(difficulty.macro_recall * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Per class table */}
            {difficulty.per_class && (
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-2">Per-Class Breakdown (Held-out Test Set)</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Difficulty Level</th>
                        <th className="py-2.5 px-3">Precision</th>
                        <th className="py-2.5 px-3">Recall</th>
                        <th className="py-2.5 px-3">F1-Score</th>
                        <th className="py-2.5 px-3">Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(difficulty.per_class).map(([cls, metrics]) => (
                        <tr key={cls}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{cls}</td>
                          <td className="py-2.5 px-3 text-slate-600">{(metrics.precision * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-slate-600">{(metrics.recall * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 font-medium text-indigo-600">{(metrics['f1-score'] * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-3 text-slate-500">{metrics.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 p-4 rounded-lg">
            Difficulty evaluation metrics have not yet been produced. Train models to populate reports.
          </div>
        )}
      </div>
    </div>
  );
}
