import React from 'react';
import { Sparkles, UploadCloud, Database, RefreshCw, Video, UserCheck } from 'lucide-react';

interface NavbarProps {
  totalProjects: number;
  scheduledReviews: number;
  completedProjects: number;
  onOpenUpload: () => void;
  onOpenDocs: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalProjects,
  scheduledReviews,
  completedProjects,
  onOpenUpload,
  onOpenDocs,
  onSeedData,
  isSeeding,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  Planify AI
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  v1.0 Automation
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated Project Review & Milestone Pipeline
              </p>
            </div>
          </div>

          {/* Review Host Badge & Quick Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span><strong>{totalProjects}</strong> Projects</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400"><strong>{scheduledReviews}</strong> Reviews Queued</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400"><strong>{completedProjects}</strong> Finished</span>
            </div>

            {/* Admin Host Indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Review Host: <strong className="text-white">Admin</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenDocs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="View System Architecture and Database Schema"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Architecture & Schema</span>
            </button>

            <button
              onClick={onSeedData}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="Reset or Load Sample Projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSeeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Load Samples</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Excel Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
