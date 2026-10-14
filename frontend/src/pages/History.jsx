import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History as HistoryIcon,
  FileText,
  Download,
  Calendar,
  BookOpen,
  PlusCircle,
  Clock,
  Eye,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await api.getHistory();
        setPapers(res.papers || res.history || []);
      } catch (err) {
        setError(err.message || 'Failed to load examination history.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handlePreview = (paper) => {
    navigate('/preview', {
      state: {
        paper: paper,
        downloadUrl: api.getPaperDownloadUrl(paper.id)
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Tamil Nadu State Board Examination Archive</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAdmin ? 'All Generated Examination Papers' : 'My Examination Papers History'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'Institutional log of all examination papers generated across faculty members.'
              : 'Archive of examination papers generated under your faculty account with PDF export.'}
          </p>
        </div>

        <Link
          to="/generate-paper"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Examination Paper</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          Notice: {error}
        </div>
      )}

      {/* Archive Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="py-3.5 px-6">Examination Title</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Questions</th>
                <th className="py-3.5 px-4">Marks</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Generated Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading examination archive...</span>
                    </div>
                  </td>
                </tr>
              ) : papers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-slate-700">No examination papers found</div>
                      <p className="text-[11px] text-slate-400">
                        Generated examination papers will appear here with instant printable PDF download options.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{paper.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: #{paper.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {paper.class_grade || 'Class 10'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {paper.subject}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {paper.num_questions}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {paper.total_marks}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {paper.duration_minutes || 90} Mins
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(paper)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <a
                          href={api.getPaperDownloadUrl(paper.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-semibold text-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
