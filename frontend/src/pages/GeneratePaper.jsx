import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

export default function GeneratePaper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: 'Mid-Term Assessment Examination 2026',
    board: 'CBSE',
    className: 'Class 12',
    subject: 'Computer Science',
    topic: '',
    totalMarks: 50,
    numQuestions: 15,
    bloomDistribution: {
      Remember: 25,
      Understand: 25,
      Apply: 20,
      Analyze: 15,
      Evaluate: 10,
      Create: 5
    },
    difficultyDistribution: {
      Easy: 30,
      Medium: 50,
      Hard: 20
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'totalMarks' || name === 'numQuestions' ? Number(value) : value
    }));
  };

  const handleBloomChange = (level, val) => {
    setForm((prev) => ({
      ...prev,
      bloomDistribution: {
        ...prev.bloomDistribution,
        [level]: Number(val)
      }
    }));
  };

  const handleDifficultyChange = (diff, val) => {
    setForm((prev) => ({
      ...prev,
      difficultyDistribution: {
        ...prev.difficultyDistribution,
        [diff]: Number(val)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        board: form.board,
        class_grade: form.className,
        subject: form.subject,
        topic: form.topic || null,
        total_marks: form.totalMarks,
        num_questions: form.numQuestions,
        bloom_distribution: form.bloomDistribution,
        difficulty_distribution: form.difficultyDistribution
      };

      const res = await api.generatePaper(payload);
      if (res.paper_id) {
        navigate('/preview', { state: { paperId: res.paper_id, paperData: res } });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Generate Balanced Question Paper</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure examination blueprint with Bloom's taxonomy proportions and difficulty targets.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Constraint Validation Error:</span> {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Examination Details */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-blue-700">
            1. Examination Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Examination Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Board</label>
              <select
                name="board"
                value={form.board}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="CBSE">CBSE (Central Board)</option>
                <option value="State Board">State Board</option>
                <option value="ICSE">ICSE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Class / Grade</label>
              <input
                type="text"
                name="className"
                value={form.className}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Questions & Marks Targets */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-blue-700">
            2. Quantitative Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                name="totalMarks"
                min="5"
                max="100"
                value={form.totalMarks}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Number of Questions</label>
              <input
                type="number"
                name="numQuestions"
                min="1"
                max="50"
                value={form.numQuestions}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Cognitive & Difficulty Balancing */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-blue-700">
            3. Bloom's Taxonomy & Difficulty Target Distribution (%)
          </h3>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-3">Bloom's Taxonomy Levels</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BLOOM_LEVELS.map((level) => (
                <div key={level} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-slate-700">{level}</span>
                    <span className="font-bold text-blue-600">{form.bloomDistribution[level]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.bloomDistribution[level]}
                    onChange={(e) => handleBloomChange(level, e.target.value)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-3">Difficulty Spectrum</h4>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_LEVELS.map((diff) => (
                <div key={diff} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-slate-700">{diff}</span>
                    <span className="font-bold text-indigo-600">{form.difficultyDistribution[diff]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.difficultyDistribution[diff]}
                    onChange={(e) => handleDifficultyChange(diff, e.target.value)}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>Processing Paper Blueprint...</>
            ) : (
              <>
                Generate Question Paper
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
