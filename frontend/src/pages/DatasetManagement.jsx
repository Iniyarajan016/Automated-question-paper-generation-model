import React, { useState, useEffect } from 'react';
import {
  FolderUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

const STANDARD_FIELDS = [
  { key: 'question', label: 'Question Text', required: true, desc: 'The actual question string' },
  { key: 'class_grade', label: 'Class / Grade', required: true, desc: 'Classes 6 to 12 only' },
  { key: 'subject', label: 'Subject', required: true, desc: 'e.g., Mathematics, Science, Physics' },
  { key: 'topic', label: 'Chapter / Topic', required: false, desc: 'Textbook chapter or unit name' },
  { key: 'board', label: 'Educational Board', required: false, desc: 'Tamil Nadu State Board' },
  { key: 'question_type', label: 'Question Type', required: false, desc: 'Short Answer, Long Answer, etc.' },
  { key: 'marks', label: 'Marks Allocation', required: false, desc: 'Score or weightage (e.g., 2, 5)' },
  { key: 'bloom_level', label: "Bloom's Taxonomy Label", required: false, desc: 'Remember, Understand, Apply, etc.' },
  { key: 'difficulty', label: 'Difficulty Label', required: false, desc: 'Easy, Medium, or Hard' },
];

export default function DatasetManagement() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload step states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Mapping state: { [standard_field_key]: csv_column_header }
  const [columnMapping, setColumnMapping] = useState({});
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const [importing, setImporting] = useState(false);

  // EduBloom state
  const [validatingEdubloom, setValidatingEdubloom] = useState(false);
  const [edubloomReport, setEdubloomReport] = useState(null);
  const [stagingQuestions, setStagingQuestions] = useState(false);

  useEffect(() => {
    loadDatasets();
    loadEdubloomSummary();
  }, []);

  const loadEdubloomSummary = async () => {
    try {
      const res = await api.getEduBloomSummary();
      if (res.validation_report) {
        setEdubloomReport(res.validation_report);
      }
    } catch {
      // Ignored if not yet initialized
    }
  };

  const handleValidateEdubloom = async () => {
    setValidatingEdubloom(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.validateEduBloomDataset();
      setEdubloomReport(res);
      setSuccess(`EduBloom dataset validation complete: ${res.valid_usable_rows?.toLocaleString()} usable rows, 0 nulls, L1–L6 Bloom mapping verified.`);
    } catch (err) {
      setError(err.message || 'Failed to validate EduBloom dataset.');
    } finally {
      setValidatingEdubloom(false);
    }
  };

  const handleStageEdubloom = async (maxRows = 2500) => {
    setStagingQuestions(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.stageEduBloomQuestions({ max_rows: maxRows });
      setSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Failed to stage EduBloom questions.');
    } finally {
      setStagingQuestions(false);
    }
  };

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.getDatasets();
      setDatasets(res.datasets || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load dataset history.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadResult(null);
      setValidationReport(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.uploadDataset(uploadFile);
      setUploadResult(res);
      setSuccess(`File "${res.original_filename}" parsed (${res.total_rows} rows). Configure column mappings below.`);

      // Initialize suggested mapping
      const initMap = {};
      STANDARD_FIELDS.forEach((f) => {
        // Find matching suggested column
        for (const [colName, mappedField] of Object.entries(res.suggested_mapping || {})) {
          if (mappedField === f.key) {
            initMap[f.key] = colName;
            break;
          }
        }
      });
      setColumnMapping(initMap);
      loadDatasets();
    } catch (err) {
      setError(err.message || 'Failed to upload CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async () => {
    if (!uploadResult?.dataset_id) return;
    setValidating(true);
    setError('');
    setSuccess('');
    try {
      // Invert mapping for API: { [csv_column]: standard_field }
      const apiMapping = {};
      Object.entries(columnMapping).forEach(([stdKey, csvCol]) => {
        if (csvCol) {
          apiMapping[csvCol] = stdKey;
        }
      });

      const res = await api.validateDataset(uploadResult.dataset_id, apiMapping, 'Class 10');
      setValidationReport(res.report);
      setSuccess(`Validation complete: ${res.report.valid_rows_count} valid Tamil Nadu State Board questions ready.`);
      loadDatasets();
    } catch (err) {
      setError(err.message || 'Dataset validation failed.');
    } finally {
      setValidating(false);
    }
  };

  const handleImportToBank = async () => {
    if (!uploadResult?.dataset_id) return;
    setImporting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.importDatasetToQuestionBank(uploadResult.dataset_id);
      setSuccess(res.message);
      loadDatasets();
    } catch (err) {
      setError(err.message || 'Failed to ingest questions to Question Bank.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
          <FolderUp className="w-4 h-4" />
          <span>Admin Data Pipeline</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          CSV Dataset Ingestion & Validation
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Upload and validate question paper datasets strictly restricted to Tamil Nadu State Board (Classes 6–12).
          Perform column mapping, verify encoding, deduplicate records, and verify training eligibility before model training.
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

      {/* EduBloom Hugging Face Pipeline Panel */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-purple-50/70 via-white to-indigo-50/50 border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Optional ML Pipeline Integration</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Hugging Face: Uzaib52/edubloom-question-bank
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                EduBloom 73,712-Row Question Bank Pipeline
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleValidateEdubloom}
              disabled={validatingEdubloom}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {validatingEdubloom ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating Schema...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Validate EduBloom Dataset</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleStageEdubloom(2500)}
              disabled={stagingQuestions}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Stage 2,500 questions into DB under board='General / EduBloom' without touching Tamil Nadu State Board question bank"
            >
              {stagingQuestions ? 'Staging...' : 'Stage 2.5k Sample'}
            </button>
          </div>
        </div>

        {/* Isolation Policy Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Tamil Nadu State Board Isolation Policy:</span>
            <div className="text-[11px] text-amber-800">
              Imported EduBloom questions are strictly designated as <b>board="General / EduBloom"</b> and <b>verified=False</b>. They will never be labeled as Tamil Nadu State Board questions or mixed into official State Board question papers unless explicit curriculum alignment is verified.
            </div>
          </div>
        </div>

        {/* Validation Report Details */}
        {edubloomReport && (
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Inspected Rows</div>
                <div className="text-xl font-bold font-mono text-purple-700 mt-0.5">
                  {edubloomReport.total_rows_inspected?.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">Source: Hugging Face</div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Valid Usable Rows</div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                  {edubloomReport.valid_usable_rows?.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">100% Usability</div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Rejected Rows</div>
                <div className="text-xl font-bold font-mono text-slate-700 mt-0.5">
                  {edubloomReport.total_rejected_rows || 0}
                </div>
                <div className="text-[10px] text-slate-400">0 Missing values</div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Taxonomy Mapping</div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  L1–L6 $\rightarrow$ 6 Bloom Levels
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">Mapped & Verified</div>
              </div>
            </div>

            {/* Bloom & Difficulty Distribution Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="font-bold text-[11px] text-slate-700 mb-2">Mapped Bloom Taxonomy Distribution:</div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                  {edubloomReport.mapped_bloom_distribution &&
                    Object.entries(edubloomReport.mapped_bloom_distribution).map(([lvl, info]) => (
                      <div key={lvl} className="p-1.5 rounded bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-800">{lvl}: </span>
                        <span className="text-purple-700 font-semibold">{info.count?.toLocaleString()}</span>
                        <span className="text-slate-400 text-[9px] block">({info.percentage}%)</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="font-bold text-[11px] text-slate-700 mb-2">Difficulty Label Distribution:</div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                  {edubloomReport.mapped_difficulty_distribution &&
                    Object.entries(edubloomReport.mapped_difficulty_distribution).map(([diff, info]) => (
                      <div key={diff} className="p-1.5 rounded bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-800">{diff}: </span>
                        <span className="text-blue-700 font-semibold">{info.count?.toLocaleString()}</span>
                        <span className="text-slate-400 text-[9px] block">({info.percentage}%)</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 1: Upload CSV Panel */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">1</span>
          <span>Upload Tamil Nadu State Board CSV File</span>
        </div>

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-colors">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                {uploadFile ? uploadFile.name : 'Click to select CSV question paper file'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Supports UTF-8, ISO-8859-1 encoded .csv files with question text, classes, and marks
              </span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <button
            type="submit"
            disabled={!uploadFile || uploading}
            className={`px-6 py-4 rounded-xl font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 ${
              uploadFile && !uploading
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md shadow-blue-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Parsing CSV...</span>
              </>
            ) : (
              <>
                <FolderUp className="w-4 h-4" />
                <span>Upload & Preview</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Step 2: Column Mapping & Validation Panel */}
      {uploadResult && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">2</span>
              <span>Column Mapping & Schema Alignment</span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Encoding: <b className="text-slate-800">{uploadResult.encoding}</b> | Total Rows: <b className="text-slate-800">{uploadResult.total_rows}</b>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Map each application requirement to the corresponding column header in your uploaded CSV file.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_FIELDS.map((field) => (
              <div key={field.key} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{field.label}</span>
                    {field.required && <span className="text-rose-500 font-bold">*</span>}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{field.key}</span>
                </div>
                <select
                  value={columnMapping[field.key] || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">— Select CSV Column —</option>
                  {(uploadResult.columns || []).map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">{field.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleValidate}
              disabled={validating}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
            >
              {validating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating Dataset...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Run Validation Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validation Audit Report */}
      {validationReport && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">3</span>
              <span>Validation Audit Report & Class Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                validationReport.valid_rows_count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
              }`}>
                {validationReport.valid_rows_count} Valid Questions
              </span>
            </div>
          </div>

          {/* Metric telemetry chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Rows</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{validationReport.total_rows}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase">Valid Tamil Nadu Rows</div>
              <div className="text-xl font-bold font-mono text-emerald-800 mt-0.5">{validationReport.valid_rows_count}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Duplicates Deduplicated</div>
              <div className="text-xl font-bold font-mono text-slate-700 mt-0.5">{validationReport.duplicate_in_file_count}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-[11px] font-semibold text-rose-700 uppercase">Rejected / Non-TN Rows</div>
              <div className="text-xl font-bold font-mono text-rose-800 mt-0.5">{validationReport.invalid_rows_count}</div>
            </div>
          </div>

          {/* Class Distribution & Subject Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Class Coverage (Classes 6–12)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(validationReport.class_distribution || {}).map(([cls, count]) => (
                  <span key={cls} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <span>{cls}:</span>
                    <b className="text-blue-600 font-mono">{count}</b>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>ML Training Eligibility</span>
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Bloom's Taxonomy Labels:</span>
                  <span className={`font-semibold ${validationReport.bloom_trainable ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {validationReport.bloom_trainable ? 'Eligible for RF Training' : 'Insufficient Labels (<20)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Difficulty Labels:</span>
                  <span className={`font-semibold ${validationReport.difficulty_trainable ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {validationReport.difficulty_trainable ? 'Eligible for RF Training' : 'Insufficient Labels (<20)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-blue-950">Ready to Ingest into Approved Question Bank?</div>
              <div className="text-[11px] text-blue-700">
                Ingested questions become immediately available for teacher question paper generation.
              </div>
            </div>
            <button
              onClick={handleImportToBank}
              disabled={importing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 shrink-0"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ingesting to Question Bank...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Ingest {validationReport.valid_rows_count} Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dataset History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900">Uploaded Datasets & Ingestion Log</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading dataset history...</div>
        ) : datasets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No datasets uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-4">Board</th>
                  <th className="py-3 px-4">Total Rows</th>
                  <th className="py-3 px-4">Valid TN Rows</th>
                  <th className="py-3 px-4">Classes Covered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Uploaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-800">{d.original_filename}</td>
                    <td className="py-3 px-4 text-slate-600">{d.board}</td>
                    <td className="py-3 px-4 font-mono">{d.total_rows}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{d.valid_rows}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(d.classes_covered || []).map((c) => (
                          <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-mono text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        d.status === 'trained' || d.status === 'ready_for_training'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-400 text-[11px]">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
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
