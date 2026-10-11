import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function PaperPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(location.state?.paperData || null);
  const [paperId, setPaperId] = useState(location.state?.paperId || null);

  if (!paper) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Paper Selected for Preview</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Generate a question paper first or select a previously created exam from the generation history.
        </p>
        <button
          onClick={() => navigate('/generate-paper')}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          Go to Generator
        </button>
      </div>
    );
  }

  const questions = paper.questions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <button
          onClick={() => navigate('/generate-paper')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Generator
        </button>

        <div className="flex items-center gap-3">
          {paperId && (
            <a
              href={api.getPaperDownloadUrl(paperId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Examination PDF
            </a>
          )}
        </div>
      </div>

      {/* Formal Paper Container (A4 preview style) */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-md p-8 sm:p-12 space-y-6 font-serif">
        {/* Paper Header */}
        <div className="text-center border-b border-slate-300 pb-6 space-y-2 font-sans">
          <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase">
            {paper.board || 'CBSE'} EXAMINATION 2026
          </p>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
            {paper.title}
          </h1>
          <div className="flex justify-center items-center gap-6 text-xs text-slate-600 font-medium">
            <span>Subject: <strong>{paper.subject}</strong></span>
            <span>Grade: <strong>{paper.class_grade || 'Class 12'}</strong></span>
            <span>Max Marks: <strong>{paper.total_marks}</strong></span>
            <span>Time: <strong>2 Hours</strong></span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-sans text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">General Instructions:</p>
          <p>1. All questions are compulsory. Marks are indicated against each question.</p>
          <p>2. Please verify that this question paper contains {questions.length} questions before attempting.</p>
          <p>3. Write legible and concise answers with neat diagrams wherever applicable.</p>
        </div>

        {/* Questions List */}
        <div className="space-y-6 pt-4 font-sans">
          {questions.map((q, idx) => (
            <div key={q.question_id || idx} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="font-bold text-sm text-slate-900">{idx + 1}.</span>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-800 leading-relaxed">{q.question_text}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Bloom: {q.bloom_level}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Diff: {q.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                    [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
