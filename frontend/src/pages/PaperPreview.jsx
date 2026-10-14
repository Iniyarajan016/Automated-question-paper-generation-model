import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ArrowLeft,
  Printer,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';

export default function PaperPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const paperData = location.state?.paper || location.state?.paperData || null;
  const downloadUrl = location.state?.downloadUrl || (paperData?.paper_id ? api.getPaperDownloadUrl(paperData.paper_id) : null);

  if (!paperData) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">No Examination Paper Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate an examination paper first using the assessment generator or view previously created papers in your history.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/generate-paper')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            Launch Paper Studio
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Open Examination History
          </button>
        </div>
      </div>
    );
  }

  const questions = paperData.questions || [];
  const sections = paperData.sections || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200/90 shadow-xs print:hidden">
        <button
          onClick={() => navigate('/generate-paper')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Paper Generator</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Paper</span>
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Printable PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* Formal Paper Sheet (A4 print preview styling) */}
      <div className="bg-white border border-slate-300/80 rounded-2xl shadow-lg shadow-slate-200/50 p-8 sm:p-14 space-y-8 print:border-0 print:shadow-none print:p-0">
        {/* Paper Header: Authentic Academic Format */}
        <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
          <div className="text-[11px] font-bold tracking-[0.2em] text-slate-600 uppercase font-sans">
            TAMIL NADU STATE BOARD — SAMACHEER KALVI
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 uppercase tracking-tight font-serif">
            {paperData.title}
          </h1>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-xs text-slate-700 font-medium font-sans pt-2">
            <span>Class: <strong className="text-slate-900">{paperData.class_grade || 'Class 10'}</strong></span>
            <span>Subject: <strong className="text-slate-900">{paperData.subject}</strong></span>
            <span>Maximum Marks: <strong className="text-slate-900 font-mono">{paperData.total_marks}</strong></span>
            <span>Duration: <strong className="text-slate-900">{paperData.duration_minutes || 90} Mins</strong></span>
          </div>
        </div>

        {/* Candidate & Instructions Section */}
        <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 text-xs font-sans text-slate-700 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
            <span>General Instructions:</span>
            <span className="text-[11px] text-slate-500 font-normal">Candidate Copy</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
            <li>All questions are compulsory. Marks are indicated against each question.</li>
            <li>Verify that this question paper contains exactly <strong>{questions.length}</strong> questions before attempting.</li>
            <li>Write neatly and legibly. All rough work must be carried out in the designated space.</li>
          </ol>
        </div>

        {/* Questions Rendered by Section or List */}
        <div className="space-y-8">
          {sections && sections.length > 0 ? (
            sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <div className="pb-1.5 border-b border-slate-300">
                  <h3 className="font-bold text-sm tracking-wide text-slate-900 font-sans uppercase">
                    {sec.name}
                  </h3>
                  {sec.instructions && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">{sec.instructions}</div>
                  )}
                </div>

                <div className="space-y-5">
                  {(sec.questions || []).map((q, qIdx) => (
                    <div key={q.id || qIdx} className="flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-serif text-sm leading-relaxed text-slate-900">
                          <span className="font-bold font-sans mr-2 text-slate-950">
                            {q.display_number || qIdx + 1}.
                          </span>
                          <span>{q.question}</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-700 shrink-0">
                        [{q.marks || 2}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-5">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-serif text-sm leading-relaxed text-slate-900">
                      <span className="font-bold font-sans mr-2 text-slate-950">{idx + 1}.</span>
                      <span>{q.question}</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-700 shrink-0">
                    [{q.marks || 2}]
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paper End Mark */}
        <div className="pt-8 border-t border-slate-200 text-center text-xs font-sans text-slate-400 tracking-widest uppercase">
          *** END OF QUESTION PAPER ***
        </div>
      </div>
    </div>
  );
}
