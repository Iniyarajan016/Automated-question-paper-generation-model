import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function Classification() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sampleQuestions = [
    "Define Ohm's law and write its mathematical formula.",
    "Compare and contrast supervised learning and unsupervised learning with real-world examples.",
    "Design a relational database schema for an e-commerce platform and explain normalization up to 3NF.",
    "Calculate the acceleration of a vehicle moving uniformly from 0 to 100 km/h in 5 seconds."
  ];

  const handleClassify = async (textToClassify) => {
    const text = textToClassify || inputText;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.classifyQuestion(text);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Question Classifier</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time inference using TF-IDF NLP pipelines for cognitive level and difficulty prediction.
        </p>
      </div>

      {/* Main classification card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Input Question Text
          </label>
          <textarea
            rows="4"
            placeholder="Type or paste an exam question here to analyze its Bloom's Taxonomy and difficulty rating..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Try sample question:</span>
            {sampleQuestions.slice(0, 2).map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputText(sq);
                  handleClassify(sq);
                }}
                className="text-blue-600 hover:underline truncate max-w-[140px] cursor-pointer"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleClassify(inputText)}
            disabled={loading || !inputText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Analyzing with NLP...' : 'Run Classification'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Classification Results</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              Inference Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bloom's Level */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Bloom's Taxonomy Level
              </span>
              <div className="text-xl font-bold text-blue-700">
                {result.bloom_level}
              </div>
              <p className="text-xs text-slate-600">
                Confidence: <strong>{result.bloom_confidence ? `${(result.bloom_confidence * 100).toFixed(1)}%` : 'Calibrated'}</strong>
              </p>
            </div>

            {/* Difficulty Level */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Predicted Difficulty
              </span>
              <div className="text-xl font-bold text-indigo-700">
                {result.difficulty}
              </div>
              <p className="text-xs text-slate-600">
                Confidence: <strong>{result.difficulty_confidence ? `${(result.difficulty_confidence * 100).toFixed(1)}%` : 'Calibrated'}</strong>
              </p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Teacher Verification Note:</strong> Model predictions reflect statistical word distribution and should be verified by subject matter experts prior to final examination publishing.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
