import React, { useState } from 'react';
import {
  X,
  Workflow,
  CheckCircle2,
  Clock,
  Video,
  Mail,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Project, ModuleItem, ReviewItem } from '../types/index';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReviewModal: (project: Project) => void;
  onViewEmail: (emailId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onOpenReviewModal,
  onViewEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'modules' | 'reviews' | 'emails'>('flowchart');

  if (!isOpen || !project) return null;

  const modules = project.modules || [];
  const reviews = project.reviews || [];
  const emailLogs = project.emailLogs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {project.category || 'Automated Pipeline'}
              </span>
              <span className="text-xs text-slate-400">
                Uploaded: {project.upload_date}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{project.name}</h2>
            <p className="text-xs text-slate-400">
              Developer: <strong className="text-slate-200">{project.user_name}</strong> ({project.user_email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReviewModal(project)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all hover:scale-[1.02]"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Conduct Review</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/40 text-xs">
          <button
            onClick={() => setActiveTab('flowchart')}
            className={`py-3 font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'flowchart'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            AI Step-by-Step Flowchart
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-3 font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'modules'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Milestone Modules ({modules.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Scheduled & Past Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'emails'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Dispatched Emails ({emailLogs.length})
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: AI FLOWCHART */}
          {activeTab === 'flowchart' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-white mb-1">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Gemini Architecture Roadmap</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {project.description ||
                    'Decomposed by Planify AI into sequential milestone modules with dependencies and Google Meet review touchpoints.'}
                </p>
              </div>

              {/* Connected Flowchart Nodes */}
              <div className="relative space-y-4">
                {modules.map((mod, index) => {
                  const isCompleted = mod.status === 'completed';
                  const isInProgress = mod.status === 'in_progress';
                  return (
                    <div key={mod.id} className="relative">
                      {/* Connecting Line */}
                      {index < modules.length - 1 && (
                        <div
                          className={`absolute left-5 top-12 w-0.5 h-10 -ml-px ${
                            isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        />
                      )}

                      <div
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : isInProgress
                            ? 'bg-blue-950/25 border-blue-500/40 ring-1 ring-blue-500/30'
                            : 'bg-slate-800/50 border-slate-700/60 opacity-80'
                        }`}
                      >
                        {/* Node Indicator */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isInProgress
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : mod.step_number}
                        </div>

                        {/* Node Content */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                              Stage {mod.step_number}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isInProgress
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-700/60 text-slate-400'
                              }`}
                            >
                              {mod.status.replace('_', ' ')}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-white">{mod.title}</h4>
                          <p className="text-xs text-slate-400">{mod.description}</p>

                          {/* Deliverables snippet */}
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {mod.deliverables?.map((d, dIdx) => (
                              <span
                                key={dIdx}
                                className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300"
                              >
                                • {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED MODULES */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                        {mod.step_number}
                      </span>
                      <h4 className="font-semibold text-sm text-white">{mod.title}</h4>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        mod.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {mod.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{mod.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-300 block mb-1">
                        🎯 Specific Deliverables:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400">
                        {mod.deliverables?.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-300 block mb-1">
                        🔍 Live Demo Verification Criteria:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400">
                        {mod.verificationCriteria?.map((vc, i) => (
                          <li key={i}>{vc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: REVIEWS TIMELINE */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Review #{rev.review_number}
                      </span>
                      <span className="text-xs text-slate-300">
                        Scheduled: <strong>{rev.scheduled_date}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={rev.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        <Video className="w-3 h-3" />
                        <span>Google Meet Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {rev.ai_evaluation ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                        <span className="font-semibold text-blue-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Gemini AI Review Synthesis:
                        </span>
                        <p className="whitespace-pre-line text-slate-400">{rev.ai_evaluation}</p>
                      </div>

                      {rev.next_action_plan && (
                        <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/30 text-indigo-200">
                          <span className="font-semibold block mb-1">Target Next Action Plan:</span>
                          <p className="whitespace-pre-line text-slate-300">{rev.next_action_plan}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting live demo review session.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: EMAILS DISPATCH LOG */}
          {activeTab === 'emails' && (
            <div className="space-y-3">
              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No automated emails logged yet.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300">
                          {log.email_type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[11px]">{new Date(log.sent_at).toLocaleString()}</span>
                      </div>
                      <p className="font-semibold text-white truncate">{log.subject}</p>
                      <p className="text-slate-400 truncate">Recipient: {log.recipient_name} ({log.recipient_email})</p>
                    </div>

                    <button
                      onClick={() => onViewEmail(log.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors font-medium shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inspect HTML Email</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Progress: <strong className="text-white">{project.completion_pct}%</strong>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
