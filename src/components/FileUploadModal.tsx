import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2, Sparkles, UserPlus } from 'lucide-react';
import * as xlsx from 'xlsx';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  // Manual form fields
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualProject, setManualProject] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const [allParsedRows, setAllParsedRows] = useState<any[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processSelectedFile(dropped);
    }
  };

  const processSelectedFile = (selected: File) => {
    setFile(selected);
    setErrorMessage(null);
    setSuccessInfo(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = xlsx.read(data, { type: 'binary', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });
        setAllParsedRows(json);
        setParsedPreview(json.slice(0, 10)); // preview first 10
      } catch (err: any) {
        console.error('File preview error:', err);
        setErrorMessage('Failed to preview file: ' + err.message);
      }
    };
    reader.readAsBinaryString(selected);
  };

  const handleDownloadSample = () => {
    window.location.href = '/api/sample-csv';
  };

  const handleSubmitUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStep('1/4: Parsing sheet records & mapping columns...');

    try {
      // Map rows from allParsedRows or fallback to FormData
      let data: any = null;

      if (allParsedRows.length > 0) {
        const mappedRows = allParsedRows.map((r, i) => {
          const keys = Object.keys(r);
          const getVal = (regex: RegExp) => {
            const k = keys.find((key) => regex.test(key.trim().toLowerCase()));
            return k && r[k] !== undefined ? String(r[k]).trim() : '';
          };
          let userName =
            getVal(/^(user(\s*_?name)?|member(\s*_?name)?|student(\s*_?name)?|developer|candidate|author|name)$/i) ||
            getVal(/(user|member|student|developer|name)/i);
          let email =
            getVal(/^(email(\s*_?id)?|e-mail|mail|emailaddress|user(\s*_?email))$/i) ||
            getVal(/(email|mail)/i);
          let projectName =
            getVal(/^(project(\s*_?name)?|project(\s*_?title)?|title|topic|domain)$/i) ||
            getVal(/(project|title|topic)/i);
          let uploadDate =
            getVal(/^(date(\s*_?of\s*_?upload)?|upload(\s*_?date)?|date|timestamp|submission(\s*_?date)?)$/i) ||
            getVal(/(date|upload|submission|time)/i);

          const values = Object.values(r).map((v) => String(v).trim()).filter(Boolean);
          if (!userName && values.length > 0) userName = values[0];
          if (!email && values.length > 1 && values[1].includes('@')) email = values[1];
          if (!projectName && values.length > 2) projectName = values[2];
          else if (!projectName && values.length > 1 && !values[1].includes('@')) projectName = values[1];

          if (!userName) userName = `Developer ${i + 1}`;
          if (!projectName) projectName = `${userName}'s Project`;
          if (!email || !email.includes('@')) {
            const clean = userName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
            email = `${clean || 'member'}@example.com`;
          }
          if (!uploadDate) uploadDate = new Date().toISOString().split('T')[0];

          return { userName, email, projectName, uploadDate };
        });

        setCurrentStep('2/4: Initializing SQLite database & users...');
        setTimeout(() => setCurrentStep('3/4: Gemini AI generating milestone flowcharts...'), 500);
        setTimeout(() => setCurrentStep('4/4: Scheduling Google Meet slots & dispatching emails...'), 1200);

        const res = await fetch('/api/upload-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: mappedRows }),
        });

        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server returned status ${res.status}: ${text.slice(0, 100)}`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }
      } else {
        // Fallback to FormData multipart upload
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server returned status ${res.status}: ${text.slice(0, 100)}`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }
      }

      setSuccessInfo(data);
      onUploadSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during ingestion.');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualEmail || !manualProject) {
      setErrorMessage('Please fill in User Name, Email ID, and Project Name.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStep('Gemini AI generating milestone breakdown & Google Meet schedule...');

    try {
      const res = await fetch('/api/projects/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: manualName,
          email: manualEmail,
          projectName: manualProject,
          uploadDate: manualDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create project');
      }

      setSuccessInfo({
        message: 'Project created and initialized with AI milestones and Google Meet schedule!',
        validCount: 1,
        projects: [
          {
            userName: manualName,
            projectName: manualProject,
            email: manualEmail,
          },
        ],
      });
      onUploadSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating project');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Ingest Projects & Trigger AI Pipeline</h2>
              <p className="text-xs text-slate-400">Upload Excel (.xlsx/.csv) with User, Email, Project & Date</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/30">
          <button
            onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
            className={`py-3 text-xs sm:text-sm font-medium border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel / CSV Upload
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setErrorMessage(null); }}
            className={`py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Quick Manual Entry
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <div>
                <p className="font-semibold">Upload Error</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successInfo ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-emerald-300">
                  Pipeline Successfully Executed!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {successInfo.message || `Processed ${successInfo.validCount} project(s).`}
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl text-xs text-left text-slate-300 space-y-1.5 border border-slate-700/60">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Projects Ingested:</span>
                  <strong className="text-white">{successInfo.validCount}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gemini AI Roadmaps:</span>
                  <span className="text-blue-400 font-semibold">Generated & Decomposed</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Review #1 Google Meet:</span>
                  <span className="text-emerald-400 font-semibold">Random Slot Scheduled & Host Assigned</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Automated Emails:</span>
                  <span className="text-indigo-400 font-semibold">Dispatched with HTML briefs</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSuccessInfo(null);
                    setFile(null);
                    setParsedPreview([]);
                    onClose();
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/30 transition-colors"
                >
                  View In Dashboard
                </button>
              </div>
            </div>
          ) : activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-blue-500/60 bg-blue-500/5'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center mx-auto mb-3 border border-slate-700 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Drop Excel (.xlsx) or CSV file here, or <span className="text-blue-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Required columns: <code className="text-blue-300 bg-slate-800 px-1 py-0.5 rounded">User Name</code>,{' '}
                      <code className="text-blue-300 bg-slate-800 px-1 py-0.5 rounded">Email ID</code>,{' '}
                      <code className="text-blue-300 bg-slate-800 px-1 py-0.5 rounded">Project Name</code>,{' '}
                      <code className="text-blue-300 bg-slate-800 px-1 py-0.5 rounded">Date of Upload</code>
                    </p>
                  </div>
                )}
              </div>

              {/* Sample Template & Help */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Need a ready-to-use template?</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>
              </div>

              {/* Parsed Preview Table */}
              {parsedPreview.length > 0 && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Parsed Preview ({parsedPreview.length} rows detected)</span>
                    <span className="text-emerald-400 font-normal">Ready for AI Ingestion</span>
                  </div>
                  <div className="max-h-40 overflow-x-auto overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-1.5">#</th>
                          <th className="px-3 py-1.5">User Name</th>
                          <th className="px-3 py-1.5">Email ID</th>
                          <th className="px-3 py-1.5">Project Name</th>
                          <th className="px-3 py-1.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {parsedPreview.map((row, idx) => {
                          const keys = Object.keys(row);
                          const getVal = (pattern: string) => {
                            const found = keys.find(k => k.toLowerCase().includes(pattern));
                            return found ? row[found] : '';
                          };
                          return (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-1.5 font-medium text-slate-200">{getVal('user') || getVal('name') || Object.values(row)[0]}</td>
                              <td className="px-3 py-1.5 text-slate-400">{getVal('email') || Object.values(row)[1]}</td>
                              <td className="px-3 py-1.5 text-blue-300 font-medium">{getVal('project') || Object.values(row)[2]}</td>
                              <td className="px-3 py-1.5 text-slate-400">{getVal('date') || getVal('upload') || Object.values(row)[3]}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Form */
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Developer / User Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email ID</label>
                <input
                  type="email"
                  placeholder="e.g. maya.lin@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. AI-Powered Autonomous Warehouse Navigation Robot"
                  value={manualProject}
                  onChange={(e) => setManualProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Date of Upload</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{currentStep || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>Create Project & Run Gemini AI Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Processing Progress Indicator */}
          {isProcessing && (
            <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Automated Pipeline in Action...</span>
              </div>
              <p className="text-xs text-slate-300 pl-6">{currentStep}</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'upload' && !successInfo && (
            <button
              onClick={handleSubmitUpload}
              disabled={!file || isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingesting Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Process Sheet with AI Pipeline</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
