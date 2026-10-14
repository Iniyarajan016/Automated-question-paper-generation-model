import React, { useEffect, useState } from 'react';
import {
  Database,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  X,
  GraduationCap
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

const BLOOM_COLORS = {
  Remember: 'bg-blue-50 text-blue-700 border-blue-200',
  Understand: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Apply: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Analyze: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Evaluate: 'bg-violet-50 text-violet-700 border-violet-200',
  Create: 'bg-purple-50 text-purple-700 border-purple-200',
};

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBloom, setSelectedBloom] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // New question modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    subject: 'Science',
    topic: 'General',
    board: 'Tamil Nadu State Board',
    class_grade: 'Class 10',
    question_type: 'Short Answer',
    marks: 2,
    bloom_level: 'Understand',
    difficulty: 'Medium'
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.getQuestions({
        page,
        per_page: 15,
        search,
        class_grade: selectedClass,
        subject: selectedSubject,
        bloom_level: selectedBloom,
        difficulty: selectedDifficulty
      });
      setQuestions(res.questions || []);
      setTotalPages(res.total_pages || 1);
      setTotalItems(res.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, selectedClass, selectedSubject, selectedBloom, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.createQuestion(newQuestion);
      setModalOpen(false);
      setNewQuestion({
        question: '',
        subject: 'Science',
        topic: 'General',
        board: 'Tamil Nadu State Board',
        class_grade: 'Class 10',
        question_type: 'Short Answer',
        marks: 2,
        bloom_level: 'Understand',
        difficulty: 'Medium'
      });
      fetchQuestions();
    } catch (err) {
      setError(err.message || 'Failed to save question.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Tamil Nadu State Board Question Bank</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Approved Examination Questions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified repository of Samacheer Kalvi textbook and past examination questions for Classes 6 to 12.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Question</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions by keyword or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Classes (6–12)</option>
            {TN_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Bloom Filter */}
          <select
            value={selectedBloom}
            onChange={(e) => {
              setSelectedBloom(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Bloom Levels</option>
            {Object.keys(BLOOM_COLORS).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Difficulties</option>
            {Object.keys(DIFFICULTY_COLORS).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading approved Tamil Nadu State Board questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No questions match your filter criteria. Try broadening your search or selecting all classes.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-5 hover:bg-slate-50/50 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm text-slate-900 font-serif leading-relaxed">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 font-sans pt-1">
                      <span className="font-semibold text-slate-700">{q.class_grade || 'Class 10'}</span>
                      <span>•</span>
                      <span>{q.subject}</span>
                      {q.topic && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 italic">{q.topic}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {q.bloom_level && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        BLOOM_COLORS[q.bloom_level] || 'bg-slate-100 text-slate-600'
                      }`}>
                        {q.bloom_level}
                      </span>
                    )}

                    {q.difficulty && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        DIFFICULTY_COLORS[q.difficulty] || 'bg-slate-100 text-slate-600'
                      }`}>
                        {q.difficulty}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      {q.marks || 2}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Total <b className="text-slate-800">{totalItems}</b> questions available
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <b>{page}</b> of <b>{totalPages}</b>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add Question to Question Bank</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question Text</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter the full question text here..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Grade</label>
                  <select
                    value={newQuestion.class_grade}
                    onChange={(e) => setNewQuestion({ ...newQuestion, class_grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {TN_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chapter / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g., Laws of Motion"
                    value={newQuestion.topic}
                    onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bloom's Taxonomy</label>
                  <select
                    value={newQuestion.bloom_level}
                    onChange={(e) => setNewQuestion({ ...newQuestion, bloom_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {Object.keys(BLOOM_COLORS).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty Level</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {Object.keys(DIFFICULTY_COLORS).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
