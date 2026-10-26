import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Mail,
  ListChecks,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, ModuleItem, ReviewItem } from '../types/index';

interface InteractiveReviewModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewEvaluated: () => void;
  onViewEmail: (emailId: string) => void;
}

export const InteractiveReviewModal: React.FC<InteractiveReviewModalProps> = ({
  project,
  isOpen,
  onClose,
  onReviewEvaluated,
  onViewEmail,
}) => {
  const [activeReview, setActiveReview] = useState<ReviewItem | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [demoFeedback, setDemoFeedback] = useState('');
  const [checkedDeliverables, setCheckedDeliverables] = useState<Record<string, boolean>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize data when project opens
  useEffect(() => {
    if (project) {
      setModules(project.modules || []);
      // Find latest scheduled review or create active reference
      const pendingReview =
        project.reviews?.find((r) => r.status === 'scheduled') ||
        project.latestReview ||
        null;
      setActiveReview(pendingReview);
      setAdminNotes('');
      setDemoFeedback('');
      setEvaluationResult(null);
      setError(null);

      // Pre-check deliverables for already completed modules
      const initialChecked: Record<string, boolean> = {};
      (project.modules || []).forEach((m) => {
        if (m.status === 'completed') {
          m.deliverables?.forEach((_, dIdx) => {
            initialChecked[`${m.id}_${dIdx}`] = true;
          });
        }
      });
      setCheckedDeliverables(initialChecked);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const toggleDeliverable = (moduleId: string, dIdx: number) => {
    const key = `${moduleId}_${dIdx}`;
    setCheckedDeliverables((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleModuleStatusChange = (
    moduleId: string,
    newStatus: ModuleItem['status']
  ) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === moduleId) {
          // If marked completed, check all its deliverables
          if (newStatus === 'completed') {
            const nextChecked = { ...checkedDeliverables };
            m.deliverables?.forEach((_, dIdx) => {
              nextChecked[`${m.id}_${dIdx}`] = true;
            });
            setCheckedDeliverables(nextChecked);
          }
          return { ...m, status: newStatus };
        }
        return m;
      })
    );
  };

  const handleRunAiEvaluation = async () => {
    if (!activeReview) {
      setError('No active scheduled review found for this project.');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const payload = {
        projectId: project.id,
        reviewId: activeReview.id,
        moduleStatuses: modules.map((m) => ({
          id: m.id,
          status: m.status,
        })),
        adminNotes: adminNotes.trim(),
        demoFeedback: demoFeedback.trim(),
      };

      const res = await fetch('/api/reviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Evaluation failed');
      }

      setEvaluationResult(data);

      if (data.isCompleted) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onReviewEvaluated();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentReviewNum = activeReview ? activeReview.review_number : 1;
  const meetLink = activeReview?.meet_link || 'https://meet.google.com';
  const scheduledDate = activeReview?.scheduled_date || 'Scheduled within business hours';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Review #{currentReviewNum} Day
                </span>
                <span className="text-xs text-slate-400">
                  Developer: <strong className="text-slate-200">{project.user_name}</strong>
                </span>
              </div>
              <h2 className="text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                {project.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Meeting Banner */}
        <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border-b border-indigo-900/40 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-blue-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Random Assigned Slot: <strong>{scheduledDate}</strong></span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Host: <strong>Admin (You)</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Google Meet as Host</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Evaluation Success Screen */}
          {evaluationResult ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div
                className={`p-6 rounded-2xl border ${
                  evaluationResult.isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-blue-950/30 border-blue-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                        evaluationResult.isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {evaluationResult.isCompleted
                        ? '🏆 Project Completed & Certified'
                        : `Review #${currentReviewNum} Evaluated`}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">
                      {evaluationResult.isCompleted
                        ? 'All Milestones Successfully Approved!'
                        : 'Review Successfully Evaluated by Gemini AI'}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      {evaluationResult.completionPct}%
                    </div>
                    <span className="text-xs text-slate-400">Total Completion</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      evaluationResult.isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${evaluationResult.completionPct}%` }}
                  ></div>
                </div>

                {/* Feedback Text */}
                <div className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Gemini AI Evaluation Analysis:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-slate-300">
                    {evaluationResult.aiEvaluation?.summaryFeedback}
                  </p>
                </div>

                {/* Next Steps / Next Review */}
                {evaluationResult.nextReview ? (
                  <div className="mt-4 p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-300 font-bold">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>
                          Recursive Review #{evaluationResult.nextReview.reviewNumber} Scheduled
                        </span>
                      </div>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        Email Brief Sent
                      </span>
                    </div>

                    <p className="text-slate-300">
                      <strong>Next Review Date:</strong>{' '}
                      {evaluationResult.nextReview.scheduledDate}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={evaluationResult.nextReview.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        <Video className="w-3 h-3" />
                        <span>Open Next Meet Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                    <p className="font-semibold">
                      🎉 Final Completion Brief Dispatched to {project.user_email}!
                    </p>
                    <p className="text-slate-400 mt-1">
                      The student developer has received the final sign-off and certificate of completion.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Active Review Day Interface */
            <div className="space-y-6">
              {/* Instructions */}
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <ListChecks className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Live Demo Verification Protocol:</span>
                  <p className="text-slate-400 mt-0.5">
                    As the administrator hosting the Google Meet, observe the developer's live code & functionality demo. Check off completed deliverables below and mark the module status. Planify AI will synthesize progress and automate recursive scheduling.
                  </p>
                </div>
              </div>

              {/* Modules & Deliverables Checklist */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Project Milestones & Deliverables ({modules.length} Modules)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Completed: {modules.filter((m) => m.status === 'completed').length} / {modules.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {modules.map((mod) => (
                    <div
                      key={mod.id}
                      className={`p-4 rounded-xl border transition-all ${
                        mod.status === 'completed'
                          ? 'bg-emerald-950/15 border-emerald-500/30'
                          : mod.status === 'in_progress'
                          ? 'bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/20'
                          : 'bg-slate-800/40 border-slate-700/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              mod.status === 'completed'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {mod.step_number}
                          </span>
                          <span className="font-semibold text-sm text-white">
                            {mod.title}
                          </span>
                        </div>

                        {/* Status Selector */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          {(['pending', 'in_progress', 'completed'] as const).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleModuleStatusChange(mod.id, st)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                                  mod.status === st
                                    ? st === 'completed'
                                      ? 'bg-emerald-600 text-white font-semibold'
                                      : st === 'in_progress'
                                      ? 'bg-blue-600 text-white font-semibold'
                                      : 'bg-slate-700 text-slate-200'
                                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                                }`}
                              >
                                {st.replace('_', ' ')}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2">{mod.description}</p>

                      {/* Deliverables Checklist */}
                      <div className="mt-3 pt-2 border-t border-slate-800/70">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                          Verified Demo Deliverables:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {mod.deliverables?.map((del, dIdx) => {
                            const isChecked = !!checkedDeliverables[`${mod.id}_${dIdx}`];
                            return (
                              <label
                                key={dIdx}
                                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-950/30 text-emerald-200 border border-emerald-500/20'
                                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleDeliverable(mod.id, dIdx)}
                                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                                />
                                <span className="leading-tight">{del}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrator Demo Observations & Feedback Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Administrator Live Demo Observations
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Demonstrated API endpoints, responsive UI layout working well. Need better error toast on invalid inputs."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Developer Feedback & Reported Blockers
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Developer reported challenges with rate limiting or third-party webhooks."
                    value={demoFeedback}
                    onChange={(e) => setDemoFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!evaluationResult && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleRunAiEvaluation}
              disabled={isEvaluating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Synthesizing Progress & Scheduling Next Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate with Gemini & Trigger Next Iteration</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
