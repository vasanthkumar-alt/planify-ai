import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Clock,
  FolderGit2,
  TrendingUp,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Project } from '../types/index';
import { ProjectKanban } from './ProjectKanban';
import { ProjectTable } from './ProjectTable';

interface AllProjectsDashboardProps {
  projects: Project[];
  onOpenDetail: (project: Project) => void;
  onOpenReview: (project: Project) => void;
  onOpenUpload: () => void;
}

export const AllProjectsDashboard: React.FC<AllProjectsDashboardProps> = ({
  projects,
  onOpenDetail,
  onOpenReview,
  onOpenUpload,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

  // Metrics
  const totalCount = projects.length;
  const scheduledCount = projects.filter((p) => p.status === 'review_scheduled' && p.completion_pct < 100).length;
  const completedCount = projects.filter((p) => p.completion_pct >= 100 || p.status === 'completed').length;
  const avgCompletion = totalCount > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.completion_pct || 0), 0) / totalCount)
    : 0;

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.user_name.toLowerCase().includes(q) ||
        p.user_email.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'scheduled') return p.status === 'review_scheduled' && p.completion_pct < 100;
      if (statusFilter === 'in_progress') return p.completion_pct > 0 && p.completion_pct < 100;
      if (statusFilter === 'completed') return p.completion_pct >= 100 || p.status === 'completed';

      return true;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalCount}</div>
            <div className="text-xs text-slate-400 font-medium">Ingested Projects</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{scheduledCount}</div>
            <div className="text-xs text-slate-400 font-medium">Reviews Queued</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{completedCount}</div>
            <div className="text-xs text-slate-400 font-medium">Completed Projects</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{avgCompletion}%</div>
            <div className="text-xs text-slate-400 font-medium">Average Progress</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Status Filter, and View Mode Toggle */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name, developer, email, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter & View Mode */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all" className="bg-slate-800">All Statuses</option>
              <option value="scheduled" className="bg-slate-800">Review Scheduled</option>
              <option value="in_progress" className="bg-slate-800">In Progress</option>
              <option value="completed" className="bg-slate-800">Completed</option>
            </select>
          </div>

          {/* Toggle Kanban / Table */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Render */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No projects found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search keywords or status filter.'
              : 'Upload an Excel or CSV sheet to ingest projects and launch AI milestone pipelines.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Excel Sheet</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <ProjectKanban
          projects={filteredProjects}
          onOpenDetail={onOpenDetail}
          onOpenReview={onOpenReview}
        />
      ) : (
        <ProjectTable
          projects={filteredProjects}
          onOpenDetail={onOpenDetail}
          onOpenReview={onOpenReview}
        />
      )}
    </div>
  );
};
