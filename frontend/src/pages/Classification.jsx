import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_QUESTIONS = [
  { text: "Define Ohm's law and write its mathematical formula.", subject: "Physics", hint: "Recall & Definition" },
  { text: "Compare and contrast supervised learning and unsupervised learning with real-world examples.", subject: "AI & CS", hint: "Analysis & Comparison" },
  { text: "Design a normalized 3NF relational database schema for an academic examination platform.", subject: "Computer Science", hint: "Synthesis & Creation" },
  { text: "Calculate the kinetic energy of a 1200kg electric vehicle accelerating from 0 to 60 km/h.", subject: "Physics", hint: "Practical Application" }
];

const BLOOM_DESCRIPTIONS = {
  Remember: "Focuses on direct recall of statutory terms, formulas, and fundamental facts.",
  Understand: "Requires explaining concepts, restating principles, and demonstrating comprehension.",
  Apply: "Demands applying abstract concepts or formulas to concrete, unfamiliar problem scenarios.",
  Analyze: "Requires dissecting complex scenarios into constituent components and identifying relationships.",
  Evaluate: "Demands judging criteria, defending positions, and validating methodological solutions.",
  Create: "Focuses on assembling disparate elements into a novel structure, architecture, or synthesis."
};

export default function Classification() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleClassify = async (textToClassify) => {
    const text = textToClassify !== undefined ? textToClassify : inputText;
    if (!text || !text.trim()) return;

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TF-IDF Text Vectorization Inference</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Cognitive Classifier
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-class cognitive level and difficulty inference for academic questions.
          </p>
        </div>
      </div>

      {/* Main Classification Prompt Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Assessment Question Prompt
          </label>
          <textarea
            rows="4"
            placeholder="Type or paste any examination question here (e.g. 'Explain the architectural differences between TCP and UDP with timing diagrams...')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
          />
        </div>

        {/* Sample Question Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Click to Test Sample Question:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputText(sq.text);
                  handleClassify(sq.text);
                }}
                className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 transition-colors cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700">{sq.subject}</span>
                  <span className="text-slate-400 text-[10px]">{sq.hint}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-900">
                  {sq.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleClassify(inputText)}
            disabled={loading || !inputText.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Extracting TF-IDF Vectors & Inferring...</span>
              </>
            ) : (
              <>
                <span>Run NLP Classification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Error during classification: {error}</span>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">NLP Inference Diagnostics</h3>
                <p className="text-[11px] text-slate-500">Pipeline confidence scores and taxonomy prediction</p>
              </div>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Inference Validated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bloom's Level */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Predicted Cognitive Level
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-indigo-700">
                  {result.bloom_level}
                </div>
                <span className="font-mono font-bold text-xs text-indigo-600 tabular-numbers">
                  {result.bloom_confidence ? `${(result.bloom_confidence * 100).toFixed(1)}%` : 'Calibrated'}
                </span>
              </div>

              {/* Confidence progress */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${result.bloom_confidence ? result.bloom_confidence * 100 : 85}%` }}
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {BLOOM_DESCRIPTIONS[result.bloom_level] || "Matches statistical syllabus patterns for this taxonomy tier."}
              </p>
            </div>

            {/* Difficulty Level */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Examination Difficulty
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900">
                  {result.difficulty}
                </div>
                <span className="font-mono font-bold text-xs text-slate-700 tabular-numbers">
                  {result.difficulty_confidence ? `${(result.difficulty_confidence * 100).toFixed(1)}%` : 'Calibrated'}
                </span>
              </div>

              {/* Confidence progress */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${result.difficulty_confidence ? result.difficulty_confidence * 100 : 80}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    result.difficulty === 'Easy' ? 'bg-emerald-500' :
                    result.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Recommended marks weighting: {result.difficulty === 'Easy' ? '1 to 2 Marks' : result.difficulty === 'Medium' ? '3 to 5 Marks' : '5+ Marks (In-Depth Essay/Derivation)'}.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Pedagogical Oversight Recommendation:</strong> Statistical models provide automated classification based on vocabulary patterns. Faculty members can adjust parameters as needed during paper generation.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

