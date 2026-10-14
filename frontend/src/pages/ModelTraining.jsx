import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  History,
  TrendingUp,
  BarChart3,
  Layers,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function ModelTraining() {
  const [selectedTask, setSelectedTask] = useState('bloom_level');
  const [nEstimators, setNEstimators] = useState(100);
  const [training, setTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadVersions();
  }, [selectedTask]);

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await api.getModelVersions(selectedTask);
      setVersions(res.versions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleStartTraining = async () => {
    setTraining(true);
    setError('');
    setSuccess('');
    setTrainingResult(null);

    try {
      const res = await api.trainRandomForestModel({
        task_name: selectedTask,
        dataset_source: 'db',
        n_estimators: nEstimators,
        auto_activate: false
      });
      setTrainingResult(res);
      setSuccess(`Random Forest training completed in ${res.duration_seconds}s with Test Accuracy of ${(res.evaluation.test_accuracy * 100).toFixed(1)}%. Review held-out metrics below.`);
      loadVersions();
    } catch (err) {
      setError(err.message || 'Model training failed.');
    } finally {
      setTraining(false);
    }
  };

  const handleActivate = async (versionId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.activateModelVersion(versionId);
      setSuccess(res.message);
      loadVersions();
    } catch (err) {
      setError(err.message || 'Failed to activate model version.');
    }
  };

  // Find active version for display
  const activeVersion = versions.find((v) => v.is_active);
  const activeEval = trainingResult?.evaluation || activeVersion?.evaluation_metrics;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
          <Cpu className="w-4 h-4" />
          <span>Supervised Machine Learning Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Random Forest Model Training & Evaluation
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Train supervised TF-IDF + Random Forest classification pipelines on verified Tamil Nadu State Board question items.
          Models are evaluated on held-out stratified test sets with strict template leakage prevention and versioned joblib persistence.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Training Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Training Configuration</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Classification Task</label>
            <div className="space-y-2">
              <label
                onClick={() => setSelectedTask('bloom_level')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedTask === 'bloom_level'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="task"
                  checked={selectedTask === 'bloom_level'}
                  onChange={() => setSelectedTask('bloom_level')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Bloom's Taxonomy Classifier</div>
                  <div className="text-[11px] text-slate-500">6 Cognitive levels (Remember to Create)</div>
                </div>
              </label>

              <label
                onClick={() => setSelectedTask('difficulty')}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  selectedTask === 'difficulty'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="task"
                  checked={selectedTask === 'difficulty'}
                  onChange={() => setSelectedTask('difficulty')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Difficulty Level Classifier</div>
                  <div className="text-[11px] text-slate-500">3 Ordinal tiers (Easy, Medium, Hard)</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Algorithm</label>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">RandomForestClassifier</div>
              <div className="text-[11px] text-slate-500 font-sans">
                Feature Extractor: TF-IDF (1–2 n-grams, sublinear scaling)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Random Forest Estimators</label>
            <select
              value={nEstimators}
              onChange={(e) => setNEstimators(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="50">50 Decision Trees (Fast)</option>
              <option value="100">100 Decision Trees (Balanced, Recommended)</option>
              <option value="200">200 Decision Trees (Exhaustive Ensemble)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Safety Guarantee:</div>
            <div>
              Training runs strictly on a held-out 80/20 stratified split. A newly trained model will never replace your currently active model until explicitly activated.
            </div>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={training}
            className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md ${
              training
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {training ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Fitting Random Forest Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Train Random Forest Model</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Active Model Telemetry & Genuine Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          {activeEval ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {trainingResult ? 'Newly Evaluated Training Run' : 'Active Model Performance Report'}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeEval.task_name === 'bloom_level' ? "Bloom's Taxonomy Performance" : 'Difficulty Performance'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                    Held-out Test Split: {activeEval.test_samples} Samples
                  </span>
                </div>
              </div>

              {/* Key genuine metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/60">
                  <div className="text-[11px] font-semibold text-blue-900 uppercase">Test Accuracy</div>
                  <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
                    {(activeEval.test_accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Train Fit: {(activeEval.train_accuracy * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Macro F1-Score</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {activeEval.macro_f1}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Baseline: {activeEval.baseline?.macro_f1 || '—'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Macro Precision</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {activeEval.macro_precision}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Across all classes</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Macro Recall</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {activeEval.macro_recall}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Balanced recall</div>
                </div>
              </div>

              {/* Baseline Comparison Alert */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Random Forest surpasses majority baseline accuracy of{' '}
                    <b>{((activeEval.baseline?.accuracy || 0) * 100).toFixed(1)}%</b> by{' '}
                    <b>
                      {(((activeEval.test_accuracy || 0) - (activeEval.baseline?.accuracy || 0)) * 100).toFixed(1)}%
                    </b>.
                  </span>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              {activeEval.confusion_matrix && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Held-Out Confusion Matrix (Actual Rows vs. Predicted Columns)</span>
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-center text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                          <th className="p-2 text-left font-sans">Actual \ Pred</th>
                          {activeEval.confusion_matrix.labels.map((lbl) => (
                            <th key={lbl} className="p-2">
                              {lbl.slice(0, 5)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeEval.confusion_matrix.matrix.map((row, rIdx) => {
                          const actualLabel = activeEval.confusion_matrix.labels[rIdx];
                          return (
                            <tr key={actualLabel} className="hover:bg-slate-50/50">
                              <td className="p-2 text-left font-semibold font-sans text-slate-800 bg-slate-50/40">
                                {actualLabel}
                              </td>
                              {row.map((val, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`p-2 ${
                                    rIdx === cIdx && val > 0
                                      ? 'bg-blue-50 text-blue-700 font-bold'
                                      : val > 0
                                      ? 'text-slate-600'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Per-class breakdown table */}
              {activeEval.per_class && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-800">Per-Class Performance Metrics</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-2 px-3">Class</th>
                          <th className="py-2 px-3">Precision</th>
                          <th className="py-2 px-3">Recall</th>
                          <th className="py-2 px-3">F1-Score</th>
                          <th className="py-2 px-3">Test Support</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {Object.entries(activeEval.per_class).map(([cls, m]) => (
                          <tr key={cls} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold font-sans text-slate-800">{cls}</td>
                            <td className="py-2 px-3">{m.precision}</td>
                            <td className="py-2 px-3">{m.recall}</td>
                            <td className="py-2 px-3 font-bold text-blue-600">{m.f1_score}</td>
                            <td className="py-2 px-3 text-slate-500">{m.support}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Generalization Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <b>Generalization Note:</b> {activeEval.generalization_note || 'Held-out test split evaluation reflects performance on the Tamil Nadu State Board question format.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
              <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No model evaluation report available yet. Select parameters and click Train Random Forest Model.</span>
            </div>
          )}
        </div>
      </div>

      {/* Model Versions History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Trained Model Version Registry</span>
          </h3>
          <div className="text-xs text-slate-500 font-medium">
            Active models are locked for live inference until new versions pass administrative validation.
          </div>
        </div>

        {loadingVersions ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading model versions...</div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No trained model versions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Version Label</th>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Test Accuracy</th>
                  <th className="py-3 px-4">Macro F1</th>
                  <th className="py-3 px-4">Train Samples</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {versions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-mono font-semibold text-slate-900">{ver.version}</td>
                    <td className="py-3 px-4 capitalize text-slate-700">{ver.task_name.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{ver.algorithm}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {ver.accuracy ? `${(ver.accuracy * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono">{ver.macro_f1 || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{ver.training_sample_count}</td>
                    <td className="py-3 px-4">
                      {ver.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Active Live</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          Standby
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {!ver.is_active && (
                        <button
                          onClick={() => handleActivate(ver.id)}
                          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Activate Model
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
