import React from 'react';
import {
  Calendar,
  Video,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Project } from '../types/index';

interface ProjectKanbanProps {
  projects: Project[];
  onOpenDetail: (project: Project) => void;
  onOpenReview: (project: Project) => void;
}

export const ProjectKanban: React.FC<ProjectKanbanProps> = ({
  projects,
  onOpenDetail,
  onOpenReview,
}) => {
  const columns = [
    {
      id: 'col_1',
      title: 'Milestone 1 Initiation',
      badge: 'Planning & Setup',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      filter: (p: Project) => p.completion_pct <= 25 && p.status !== 'completed',
    },
    {
      id: 'col_2',
      title: 'Active Development',
      badge: 'Milestone 2 - 3',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      filter: (p: Project) =>
        p.completion_pct > 25 && p.completion_pct <= 75 && p.status !== 'completed',
    },
    {
      id: 'col_3',
      title: 'Final Review Stage',
      badge: 'Testing & Polish',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      filter: (p: Project) =>
        p.completion_pct > 75 && p.completion_pct < 100 && p.status !== 'completed',
    },
    {
      id: 'col_4',
      title: 'Completed & Certified',
      badge: '100% Approved',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      filter: (p: Project) => p.completion_pct >= 100 || p.status === 'completed',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colProjects = projects.filter(col.filter);

        return (
          <div
            key={col.id}
            className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden min-h-[480px]"
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {col.title}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${col.color}`}>
                  {col.badge}
                </span>
              </div>
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                {colProjects.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {colProjects.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                  No projects in this stage
                </div>
              ) : (
                colProjects.map((p) => {
                  const isCompleted = p.completion_pct >= 100 || p.status === 'completed';
                  return (
                    <div
                      key={p.id}
                      className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all shadow-md group space-y-3 cursor-pointer"
                      onClick={() => onOpenDetail(p)}
                    >
                      {/* Category & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-blue-300 border border-slate-700/60 truncate max-w-[150px]">
                          {p.category || 'Automated Pipeline'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? 'Completed' : `${p.completion_pct}%`}
                        </span>
                      </div>

                      {/* Project Title */}
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                        {p.name}
                      </h4>

                      {/* Developer Info */}
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                          {p.user_name.charAt(0)}
                        </div>
                        <span className="truncate">{p.user_name}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${p.completion_pct}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Review Info / Meet */}
                      {p.latestReview && (
                        <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">
                              {p.latestReview.scheduled_date}
                            </span>
                          </div>

                          <a
                            href={p.latestReview.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-400 hover:text-emerald-300 shrink-0"
                            title="Open Google Meet Link"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReview(p);
                          }}
                          className="flex-1 py-1 px-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Conduct Review</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(p);
                          }}
                          className="py-1 px-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors"
                        >
                          Roadmap
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
