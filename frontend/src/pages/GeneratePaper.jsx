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
  Square,
  Plus,
  Trash2,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  const { user, isTeacher, isAdmin, isPrincipal, isChairman } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Parse assigned subjects for teachers
  const assignedSubjects = React.useMemo(() => {
    if (user?.assigned_subjects && Array.isArray(user.assigned_subjects)) {
      return user.assigned_subjects;
    }
    if (user?.subject_specialization) {
      return user.subject_specialization.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [user]);

  const hasNoSubject = isTeacher && assignedSubjects.length === 0;
  const isSingleSubject = isTeacher && assignedSubjects.length === 1;

  // Dynamic curriculum state
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  // Dynamic Mark-Wise Section Builder State (defaults to 2, 3, and 5 marks)
  const [sections, setSections] = useState([
    { id: 'sec-1', marks_per_question: 2, num_questions: 5 },
    { id: 'sec-2', marks_per_question: 3, num_questions: 5 },
    { id: 'sec-3', marks_per_question: 5, num_questions: 5 },
  ]);

  const calculatedQuestions = sections.reduce((sum, s) => sum + (Number(s.num_questions) || 0), 0);
  const calculatedTotalMarks = sections.reduce(
    (sum, s) => sum + (Number(s.marks_per_question) || 0) * (Number(s.num_questions) || 0),
    0
  );

  const [form, setForm] = useState({
    title: 'Tamil Nadu State Board Mid-Term Examination 2026',
    board: 'Tamil Nadu State Board',
    class_grade: 'Class 10',
    subject: isSingleSubject ? assignedSubjects[0] : 'Science',
    duration_minutes: 90,
    total_marks: 50,
    num_questions: 15,
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

  // Section builder modifiers
  const addSection = () => {
    const nextMark = sections.length === 1 ? 3 : sections.length === 2 ? 5 : 2;
    setSections((prev) => [
      ...prev,
      { id: `sec-${Date.now()}`, marks_per_question: nextMark, num_questions: 2 }
    ]);
  };

  const removeSection = (index) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: Number(value) } : s))
    );
  };

  const syncTotalMarks = () => {
    setForm((prev) => ({
      ...prev,
      total_marks: calculatedTotalMarks,
      num_questions: calculatedQuestions
    }));
  };

  // Load subjects whenever class changes
  useEffect(() => {
    async function fetchSubjects() {
      setLoadingCurriculum(true);
      try {
        const res = await api.getCurriculumSubjects(form.class_grade);
        const subjects = res.subjects || [];
        setAvailableSubjects(subjects);

        // Subject selection based on role
        if (isTeacher) {
          if (assignedSubjects.length === 1) {
            setForm((prev) => ({ ...prev, subject: assignedSubjects[0] }));
          } else if (assignedSubjects.length > 1) {
            if (!assignedSubjects.includes(form.subject)) {
              setForm((prev) => ({ ...prev, subject: assignedSubjects[0] }));
            }
          }
        } else {
          if (subjects.length > 0 && !subjects.includes(form.subject)) {
            setForm((prev) => ({ ...prev, subject: subjects[0] }));
          }
        }
      } catch (err) {
        console.error('Failed to load curriculum subjects:', err);
      } finally {
        setLoadingCurriculum(false);
      }
    }
    fetchSubjects();
  }, [form.class_grade, isTeacher, assignedSubjects.length]);

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
    setSuggestions([]);

    if (isChairman) {
      setError('Chairman accounts are institutional leadership only and cannot generate question papers.');
      setLoading(false);
      return;
    }

    if (hasNoSubject) {
      setError('No subject assigned. Please contact your Principal to assign subjects before generating question papers.');
      setLoading(false);
      return;
    }

    if (isTeacher && !assignedSubjects.includes(form.subject)) {
      setError(`Unauthorized subject '${form.subject}'. You are authorized only for: ${assignedSubjects.join(', ')}`);
      setLoading(false);
      return;
    }

    if (calculatedTotalMarks !== Number(form.total_marks)) {
      setError(
        `Dynamic section marks total (${calculatedTotalMarks} marks) does not match entered Total Marks (${form.total_marks} marks). Please adjust question counts or click "Sync Total Marks".`
      );
      setLoading(false);
      return;
    }

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
        total_marks: Number(form.total_marks),
        num_questions: calculatedQuestions,
        sections: sections
          .filter((s) => (Number(s.num_questions) || 0) > 0)
          .map((s) => ({
            marks_per_question: Number(s.marks_per_question),
            num_questions: Number(s.num_questions)
          })),
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
        setSuggestions(result.suggestions || []);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during paper generation.');
      setSuggestions(err.data?.suggestions || []);
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

      {/* No Subject Warning Banner */}
      {hasNoSubject && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 text-xs font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">Subject Authorization Notice:</div>
            <div>No subject assigned. Please contact your Principal to assign curriculum subjects before generating papers.</div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="font-bold">Generation Notice:</div>
            <div>{error}</div>
            {suggestions && suggestions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-200/60">
                <div className="font-semibold text-rose-900 mb-1">Recommended Actions:</div>
                <ul className="list-disc list-inside space-y-1 text-rose-700 font-normal">
                  {suggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}
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

            {/* Subject Selection (Restricted by Teacher Assignment) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Subject <span className="text-rose-500">*</span>
                </label>
                {isTeacher && (
                  <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                    {isSingleSubject && <Lock className="w-3 h-3 text-slate-400" />}
                    <span>Assigned Only</span>
                  </span>
                )}
              </div>

              {hasNoSubject ? (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No subject assigned. Contact Principal.</span>
                </div>
              ) : isSingleSubject ? (
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between">
                  <span>{assignedSubjects[0]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </span>
                </div>
              ) : (
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  {(isTeacher
                    ? availableSubjects.filter((s) => assignedSubjects.includes(s)).length > 0
                      ? availableSubjects.filter((s) => assignedSubjects.includes(s))
                      : assignedSubjects
                    : availableSubjects
                  ).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}
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
                  min="5"
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
                  value={calculatedQuestions}
                  readOnly
                  title="Calculated dynamically from sections"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-center font-mono font-bold text-slate-700 cursor-not-allowed"
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

        {/* Right Column: Dynamic Sections, Taxonomy & Difficulty Distributions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dynamic Mark-Wise Question Distribution Builder */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Mark-Wise Question Distribution (Section Builder)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure question count per mark tier. Every paper strictly starts at Section A in alphabetical sequence.
                </p>
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            {/* Sections Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Marks per Question</th>
                    <th className="py-2.5 px-3">Number of Questions</th>
                    <th className="py-2.5 px-3">Section Total</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.map((sec, idx) => {
                    const label = String.fromCharCode(65 + idx);
                    const secTotal = (Number(sec.marks_per_question) || 0) * (Number(sec.num_questions) || 0);
                    return (
                      <tr key={sec.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold bg-blue-100 text-blue-800 text-xs">
                            {label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={sec.marks_per_question}
                            onChange={(e) => updateSection(idx, 'marks_per_question', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="1">1 Mark (Objective / MCQ)</option>
                            <option value="2">2 Marks (Short Answer)</option>
                            <option value="3">3 Marks (Conceptual)</option>
                            <option value="5">5 Marks (Long Answer / Essay)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={sec.num_questions}
                            onChange={(e) => updateSection(idx, 'num_questions', e.target.value)}
                            className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-center font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900 text-sm">
                          {secTotal} <span className="text-[10px] text-slate-400 font-normal">Marks</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {sections.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeSection(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Required</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Live Calculation & Total Reconciliation Bar */}
            <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              calculatedTotalMarks === Number(form.total_marks)
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Questions</span>
                  <span className="font-mono font-bold text-base text-slate-900">{calculatedQuestions}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Calculated Marks</span>
                  <span className="font-mono font-bold text-base">{calculatedTotalMarks}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Entered Target</span>
                  <span className="font-mono font-bold text-base text-slate-900">{form.total_marks}</span>
                </div>
              </div>

              {calculatedTotalMarks === Number(form.total_marks) ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Section blueprint matches target ({form.total_marks} Marks)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-amber-800 font-medium">
                    Mismatch: {calculatedTotalMarks > form.total_marks ? `+${calculatedTotalMarks - form.total_marks}` : calculatedTotalMarks - form.total_marks} marks
                  </span>
                  <button
                    type="button"
                    onClick={syncTotalMarks}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer transition-colors"
                  >
                    Sync Total to {calculatedTotalMarks} Marks
                  </button>
                </div>
              )}
            </div>
          </div>

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
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Target: <b className="text-slate-800">{calculatedQuestions} Questions</b> across{' '}
              <b className="text-slate-800">{sections.length} Sections</b> |{' '}
              <b className="text-slate-800">{form.total_marks} Marks</b> ({form.duration_minutes} Mins)
            </div>

            <button
              type="submit"
              disabled={loading || hasNoSubject || isChairman}
              title={
                hasNoSubject
                  ? 'No subject assigned. Contact Principal.'
                  : isChairman
                  ? 'Chairman cannot generate question papers.'
                  : ''
              }
              className={`px-6 py-3 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md ${
                loading || hasNoSubject || isChairman
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
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
