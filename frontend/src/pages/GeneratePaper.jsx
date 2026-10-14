import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  GraduationCap,
  Clock,
  RotateCcw,
  Zap,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../services/api';

const TN_CLASSES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12'
];

const BLOOM_LEVELS = [
  { key: 'Remember', label: 'Remember', description: 'Recall facts & basic definitions', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { key: 'Understand', label: 'Understand', description: 'Explain ideas & concepts', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { key: 'Apply', label: 'Apply', description: 'Use knowledge in new situations', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { key: 'Analyze', label: 'Analyze', description: 'Examine & break into parts', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { key: 'Evaluate', label: 'Evaluate', description: 'Justify a stance or decision', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  { key: 'Create', label: 'Create', description: 'Produce original solutions', color: 'text-purple-700 bg-purple-50 border-purple-200' }
];

const DIFFICULTY_LEVELS = [
  { key: 'Easy', label: 'Easy', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', barColor: 'bg-emerald-500' },
  { key: 'Medium', label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200', barColor: 'bg-amber-500' },
  { key: 'Hard', label: 'Hard', color: 'text-rose-700 bg-rose-50 border-rose-200', barColor: 'bg-rose-500' }
];

const PRESETS = [
  {
    name: 'TN State Board Balanced Blueprint',
    bloom: { Remember: 25, Understand: 30, Apply: 20, Analyze: 15, Evaluate: 5, Create: 5 },
    diff: { Easy: 30, Medium: 50, Hard: 20 }
  },
  {
    name: 'Higher-Order HOTS & Analytical',
    bloom: { Remember: 10, Understand: 20, Apply: 25, Analyze: 25, Evaluate: 10, Create: 10 },
    diff: { Easy: 15, Medium: 45, Hard: 40 }
  },
  {
    name: 'Formative / Foundational Test',
    bloom: { Remember: 40, Understand: 35, Apply: 15, Analyze: 10, Evaluate: 0, Create: 0 },
    diff: { Easy: 50, Medium: 40, Hard: 10 }
  }
];

export default function GeneratePaper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic curriculum state
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  const [form, setForm] = useState({
    title: 'Tamil Nadu State Board Mid-Term Examination 2026',
    board: 'Tamil Nadu State Board',
    class_grade: 'Class 10',
    subject: 'Science',
    duration_minutes: 90,
    total_marks: 50,
    num_questions: 12,
    bloom_distribution: {
      Remember: 25,
      Understand: 30,
      Apply: 20,
      Analyze: 15,
      Evaluate: 5,
      Create: 5
    },
    difficulty_distribution: {
      Easy: 30,
      Medium: 50,
      Hard: 20
    }
  });

  // Load subjects whenever class changes
  useEffect(() => {
    async function fetchSubjects() {
      setLoadingCurriculum(true);
      try {
        const res = await api.getCurriculumSubjects(form.class_grade);
        const subjects = res.subjects || [];
        setAvailableSubjects(subjects);

        // Pick first subject if current subject not valid for new class
        if (subjects.length > 0 && !subjects.includes(form.subject)) {
          setForm((prev) => ({ ...prev, subject: subjects[0] }));
        }
      } catch (err) {
        console.error('Failed to load curriculum subjects:', err);
      } finally {
        setLoadingCurriculum(false);
      }
    }
    fetchSubjects();
  }, [form.class_grade]);

  // Load chapters whenever subject or class changes
  useEffect(() => {
    async function fetchChapters() {
      if (!form.subject) return;
      try {
        const res = await api.getCurriculumChapters(form.class_grade, form.subject);
        const chapters = res.chapters || [];
        setAvailableChapters(chapters);
        // Default to all chapters selected
        setSelectedChapters(chapters);
      } catch (err) {
        console.error('Failed to load curriculum chapters:', err);
      }
    }
    fetchChapters();
  }, [form.class_grade, form.subject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'total_marks' || name === 'num_questions' || name === 'duration_minutes' ? Number(value) : value
    }));
  };

  const handleBloomChange = (level, val) => {
    setForm((prev) => ({
      ...prev,
      bloom_distribution: {
        ...prev.bloom_distribution,
        [level]: Number(val)
      }
    }));
  };

  const handleDifficultyChange = (diff, val) => {
    setForm((prev) => ({
      ...prev,
      difficulty_distribution: {
        ...prev.difficulty_distribution,
        [diff]: Number(val)
      }
    }));
  };

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      bloom_distribution: { ...preset.bloom },
      difficulty_distribution: { ...preset.diff }
    }));
  };

  const toggleChapter = (chapter) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter]
    );
  };

  const toggleAllChapters = () => {
    if (selectedChapters.length === availableChapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters([...availableChapters]);
    }
  };

  const totalBloom = Object.values(form.bloom_distribution).reduce((a, b) => a + b, 0);
  const totalDiff = Object.values(form.difficulty_distribution).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (totalDiff !== 100) {
      setError(`Difficulty distribution must total exactly 100% (currently ${totalDiff}%).`);
      setLoading(false);
      return;
    }

    if (totalBloom !== 100) {
      setError(`Bloom's Taxonomy distribution must total exactly 100% (currently ${totalBloom}%).`);
      setLoading(false);
      return;
    }

    if (selectedChapters.length === 0) {
      setError('Please select at least one syllabus chapter or topic.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        board: 'Tamil Nadu State Board',
        class_grade: form.class_grade,
        subject: form.subject,
        chapters: selectedChapters,
        duration_minutes: form.duration_minutes,
        total_marks: form.total_marks,
        num_questions: form.num_questions,
        difficulty_distribution: form.difficulty_distribution,
        bloom_distribution: form.bloom_distribution,
      };

      const result = await api.generatePaper(payload);

      if (result.success) {
        navigate('/preview', {
          state: {
            paper: result,
            downloadUrl: api.getPaperDownloadUrl(result.paper_id)
          }
        });
      } else {
        setError(result.error || 'Failed to generate question paper.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during paper generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Tamil Nadu State Board Assessment Studio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Generate Examination Paper
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create verified, print-ready question papers for Classes 6 to 12 adhering strictly to Samacheer Kalvi curriculum.
          </p>
        </div>

        {/* Blueprint Presets Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Presets:</span>
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/70 transition-all cursor-pointer"
            >
              {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Generation Notice:</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Examination Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Curriculum Parameters</span>
            </h3>

            {/* Board (Locked to Tamil Nadu State Board) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Educational Board
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>Tamil Nadu State Board (Samacheer Kalvi)</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Mandatory</span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Mandatory Class Selection (6 to 12) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class / Grade <span className="text-rose-500">*</span>
              </label>
              <select
                name="class_grade"
                value={form.class_grade}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                {TN_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} — Tamil Nadu Samacheer
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Marks & Question Count & Duration */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  name="total_marks"
                  min="10"
                  max="100"
                  step="5"
                  value={form.total_marks}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-center font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Questions
                </label>
                <input
                  type="number"
                  name="num_questions"
                  min="3"
                  max="50"
                  value={form.num_questions}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-center font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration
                </label>
                <select
                  name="duration_minutes"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 text-center font-mono font-medium"
                >
                  <option value="60">60 Min</option>
                  <option value="90">90 Min</option>
                  <option value="120">120 Min</option>
                  <option value="150">150 Min</option>
                  <option value="180">180 Min</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chapters / Topics Multi-Selector */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified Chapters ({selectedChapters.length}/{availableChapters.length})</span>
              </h3>
              <button
                type="button"
                onClick={toggleAllChapters}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                {selectedChapters.length === availableChapters.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {availableChapters.map((chap) => {
                const isSelected = selectedChapters.includes(chap);
                return (
                  <label
                    key={chap}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/50 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleChapter(chap)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="leading-tight">{chap}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy & Difficulty Distributions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Difficulty Blueprint */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Difficulty Distribution Target</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allocate proportions across standard difficulty tiers (must equal 100%).
                </p>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  totalDiff === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                Total: {totalDiff}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DIFFICULTY_LEVELS.map((diff) => {
                const val = form.difficulty_distribution[diff.key] || 0;
                return (
                  <div key={diff.key} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{diff.label}</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={val}
                      onChange={(e) => handleDifficultyChange(diff.key, e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${diff.barColor}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloom's Taxonomy Blueprint */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Cognitive Dimensions Blueprint (Bloom's Taxonomy)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Align question distribution with cognitive complexity standards.
                </p>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  totalBloom === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                Total: {totalBloom}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BLOOM_LEVELS.map((level) => {
                const val = form.bloom_distribution[level.key] || 0;
                return (
                  <div key={level.key} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800">{level.label}</span>
                        <div className="text-[10px] text-slate-400">{level.description}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={val}
                      onChange={(e) => handleBloomChange(level.key, e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Target: <b className="text-slate-800">{form.num_questions} Questions</b> |{' '}
              <b className="text-slate-800">{form.total_marks} Marks</b> ({form.duration_minutes} Mins)
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md ${
                loading
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Examination Paper...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Tamil Nadu State Board Paper</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
