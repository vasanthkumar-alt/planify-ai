import React, { useState } from 'react';
import {
  X,
  Database,
  Workflow,
  Server,
  Code2,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Mail,
  Video,
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'backend' | 'recursive'>('architecture');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const schemaSql = `-- 1. USERS TABLE
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- 2. PROJECTS TABLE
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT NOT NULL, -- 'pending_ai', 'review_scheduled', 'in_progress', 'completed'
  current_module_index INTEGER DEFAULT 0,
  completion_pct REAL DEFAULT 0.0,
  upload_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. MODULES TABLE (Decomposed by Gemini AI)
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables TEXT NOT NULL, -- JSON array of specific deliverables
  verification_criteria TEXT NOT NULL, -- JSON array of live demo criteria
  estimated_days INTEGER DEFAULT 7,
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'needs_revision'
  feedback TEXT,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 4. REVIEWS TABLE (Scheduled & Evaluated iteratively)
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  review_number INTEGER NOT NULL,
  scheduled_date TEXT NOT NULL, -- Random business hour slot
  meet_link TEXT NOT NULL,      -- https://meet.google.com/xxx-yyyy-zzz
  calendar_link TEXT,          -- Google Calendar 1-click sync
  status TEXT NOT NULL,        -- 'scheduled', 'completed', 'cancelled'
  admin_notes TEXT,
  demo_feedback TEXT,
  ai_evaluation TEXT,          -- Gemini evaluation critique & score
  next_action_plan TEXT,       -- Synthesized action items for next review
  email_sent INTEGER DEFAULT 1,
  email_sent_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. EMAIL LOGS (Audit trail of dispatched briefs)
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,    -- 'initial_plan', 'review_evaluation', 'project_completed'
  html_content TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Planify AI — Architecture & Database Schema</h2>
              <p className="text-xs text-slate-400">Complete System Design, Data Pipeline & Recursive Iteration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/40 text-xs">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            System Architecture
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Database Schema (SQLite)
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3 font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'backend'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Backend Ingestion & Gemini Flow
          </button>
          <button
            onClick={() => setActiveTab('recursive')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'recursive'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Recursive Iteration Protocol
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: SYSTEM ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="font-semibold text-white">Excel Ingestion & Storage</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Admin uploads <code className="text-blue-300">.xlsx</code> or <code className="text-blue-300">.csv</code>. The SheetJS parser extracts User, Email, Project Name, and Upload Date, storing them in SQLite.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="font-semibold text-white">Gemini AI Decomposition</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Gemini analyzes the Project Name and generates 4-5 sequential modules, deliverable roadmaps, and verification criteria.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="font-semibold text-white">Meet Schedule & Email Dispatch</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Schedules Review #1 at a randomized business-hour slot, generates a Google Meet link, and dispatches the HTML brief to the student.
                  </p>
                </div>
              </div>

              {/* Data Flow Diagram Card */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4 font-mono text-[11px]">
                <span className="font-sans font-bold text-slate-300 uppercase tracking-wider block">
                  End-to-End Execution Flowchart
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                  <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg w-full sm:w-auto">
                    📄 Excel / CSV Upload
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                  <div className="p-2.5 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded-lg w-full sm:w-auto">
                    ⚡ Multer + SheetJS Parser
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                  <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 rounded-lg w-full sm:w-auto">
                    🧠 Gemini 3.8 Flash Breakdown
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                  <div className="p-2.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 rounded-lg w-full sm:w-auto">
                    📅 Random Meet + Email Brief
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                  <div className="p-2.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 rounded-lg w-full sm:w-auto">
                    📹 Review Day (Admin Hosts Meet)
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                  <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg w-full sm:w-auto">
                    ☑️ Live Checklist & Demo Notes
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 sm:rotate-0" />
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg w-full sm:w-auto">
                    🔁 Recursive Loop (Until 100%)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">
                  SQLite Schema (5 Relational Tables with Cascade Constraints)
                </span>
                <button
                  onClick={() => copyToClipboard(schemaSql, 'schema')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs border border-slate-700 transition-colors"
                >
                  {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'schema' ? 'Copied SQL' : 'Copy DDL'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto text-slate-300 leading-relaxed max-h-[380px]">
                <pre>{schemaSql}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: BACKEND CODE */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Core backend implementation in Express using <strong>@google/genai</strong> and <strong>xlsx</strong>:
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-3">
                <div className="text-slate-500">// Gemini Client Configuration (server/gemini.ts)</div>
                <div className="text-blue-400">
                  import &#123; GoogleGenAI &#125; from '@google/genai';<br />
                  const ai = new GoogleGenAI(&#123; apiKey: process.env.GEMINI_API_KEY, httpOptions: &#123; headers: &#123; 'User-Agent': 'aistudio-build' &#125; &#125; &#125;);
                </div>
                <div className="text-slate-500">// Calling Gemini 3.8 Flash to decompose project:</div>
                <div className="text-emerald-400">
                  const response = await ai.models.generateContent(&#123;<br />
                  &nbsp;&nbsp;model: 'gemini-3.8-flash',<br />
                  &nbsp;&nbsp;contents: prompt,<br />
                  &nbsp;&nbsp;config: &#123; responseMimeType: 'application/json' &#125;<br />
                  &#125;);<br />
                  const result = JSON.parse(response.text);
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECURSIVE ITERATION */}
          {activeTab === 'recursive' && (
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How Recursive Scheduling Works</span>
                </h4>
                <p className="text-slate-400">
                  When the administrator hosts a review meeting via Google Meet, they evaluate the developer's live demonstration and check off completed items.
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-300 pt-1">
                  <li>Administrator marks completed modules and inputs observations / feedback.</li>
                  <li>Gemini evaluates the status delta, assigns an updated completion %, and generates actionable technical next steps.</li>
                  <li>
                    <strong>If completion &lt; 100%:</strong> Automatically schedules Review #N+1 with a randomized working-hours slot, generates a new Google Meet link, dispatches an updated HTML brief, and updates the project state.
                  </li>
                  <li>
                    <strong>If completion == 100%:</strong> Marks project completed, generates final completion certificate email, and triggers celebratory completion.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
