import React from 'react';
import {
  Video,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Mail,
} from 'lucide-react';
import { Project } from '../types/index';

interface ProjectTableProps {
  projects: Project[];
  onOpenDetail: (project: Project) => void;
  onOpenReview: (project: Project) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onOpenDetail,
  onOpenReview,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3.5">Project Details</th>
              <th className="px-4 py-3.5">Developer / User</th>
              <th className="px-4 py-3.5">Current State & Progress</th>
              <th className="px-4 py-3.5">Scheduled Review & Meet Link</th>
              <th className="px-4 py-3.5">Upload Date</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No projects match your current filters.
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const isCompleted = project.completion_pct >= 100 || project.status === 'completed';
                const scheduledReview = project.latestReview;

                return (
                  <tr
                    key={project.id}
                    onClick={() => onOpenDetail(project)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Project Name & Category */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                          {project.category || 'Automated Pipeline'}
                        </span>
                        <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {project.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {project.modules?.length || 5} AI Milestone Modules Decomposed
                        </p>
                      </div>
                    </td>

                    {/* Developer */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                          {project.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{project.user_name}</div>
                          <div className="text-[11px] text-slate-400">{project.user_email}</div>
                        </div>
                      </div>
                    </td>

                    {/* State & Progress */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`font-semibold ${
                              isCompleted ? 'text-emerald-400' : 'text-blue-400'
                            }`}
                          >
                            {isCompleted
                              ? 'Completed'
                              : project.status === 'review_scheduled'
                              ? 'Review Scheduled'
                              : 'In Progress'}
                          </span>
                          <span className="font-bold text-white">
                            {project.completion_pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${project.completion_pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Scheduled Review & Meet */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {scheduledReview ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span>{scheduledReview.scheduled_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={scheduledReview.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                            >
                              <Video className="w-3 h-3" />
                              <span>Join Meet</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            {scheduledReview.calendar_link && (
                              <a
                                href={scheduledReview.calendar_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                                title="Add to Google Calendar"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Cal</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No pending review</span>
                      )}
                    </td>

                    {/* Upload Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                      {project.upload_date}
                    </td>

                    {/* Quick Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReview(project);
                          }}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs shadow-md transition-colors flex items-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Host Review</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(project);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Project Roadmap"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
