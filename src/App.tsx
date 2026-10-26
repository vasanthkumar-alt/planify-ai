/**
 * Planify AI - Full-Stack Project Review Schedule Automation System
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AllProjectsDashboard } from './components/AllProjectsDashboard';
import { FileUploadModal } from './components/FileUploadModal';
import { InteractiveReviewModal } from './components/InteractiveReviewModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';
import { Project } from './types/index';
import { Loader2, Sparkles, FolderPlus, Video, Database } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [reviewProject, setReviewProject] = useState<Project | null>(null);
  const [previewEmailId, setPreviewEmailId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to load projects');
      }
    } catch (err: any) {
      console.error('Fetch projects error:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Seed sample data
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/seed?force=true', { method: 'POST' });
      await fetchProjects();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Open detail with full enriched data
  const handleOpenDetail = async (p: Project) => {
    try {
      const res = await fetch(`/api/projects/${p.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailProject(data.project);
      } else {
        setDetailProject(p);
      }
    } catch {
      setDetailProject(p);
    }
  };

  // Open review with full enriched data
  const handleOpenReview = async (p: Project) => {
    try {
      const res = await fetch(`/api/projects/${p.id}`);
      const data = await res.json();
      if (data.success) {
        setReviewProject(data.project);
      } else {
        setReviewProject(p);
      }
    } catch {
      setReviewProject(p);
    }
  };

  const handleReviewEvaluated = async () => {
    await fetchProjects();
    if (reviewProject) {
      handleOpenReview(reviewProject);
    }
  };

  const totalProjects = projects.length;
  const scheduledReviews = projects.filter(
    (p) => p.status === 'review_scheduled' && p.completion_pct < 100
  ).length;
  const completedProjects = projects.filter(
    (p) => p.completion_pct >= 100 || p.status === 'completed'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        totalProjects={totalProjects}
        scheduledReviews={scheduledReviews}
        completedProjects={completedProjects}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Full-Stack Project Review Automation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Automated Milestones, Google Meet Scheduling & Recursive AI Reviews
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Upload your developer sheet to parse projects, generate Gemini AI milestone flowcharts, automatically assign randomized Google Meet review slots (hosted by Admin), and recursively evaluate progress until 100% completion.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Upload Excel / CSV</span>
              </button>

              <button
                onClick={() => setIsDocsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-xl border border-slate-700 transition-colors"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>View Architecture & Schema</span>
              </button>
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-40 -top-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading project reviews and SQLite database...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
            <p className="text-sm font-semibold text-rose-300">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <AllProjectsDashboard
            projects={projects}
            onOpenDetail={handleOpenDetail}
            onOpenReview={handleOpenReview}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <p>
          Planify AI • Automated Project Review Schedule Pipeline • SQLite & Gemini 3.8 Flash
        </p>
      </footer>

      {/* MODALS */}
      {/* 1. Excel/CSV Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchProjects();
        }}
      />

      {/* 2. Interactive Review Day Dashboard Modal */}
      <InteractiveReviewModal
        project={reviewProject}
        isOpen={!!reviewProject}
        onClose={() => setReviewProject(null)}
        onReviewEvaluated={handleReviewEvaluated}
        onViewEmail={(emailId) => setPreviewEmailId(emailId)}
      />

      {/* 3. Project Detail & Flowchart Modal */}
      <ProjectDetailModal
        project={detailProject}
        isOpen={!!detailProject}
        onClose={() => setDetailProject(null)}
        onOpenReviewModal={(p) => {
          setDetailProject(null);
          handleOpenReview(p);
        }}
        onViewEmail={(emailId) => setPreviewEmailId(emailId)}
      />

      {/* 4. Dispatched Email HTML Preview Modal */}
      <EmailPreviewModal
        emailId={previewEmailId}
        isOpen={!!previewEmailId}
        onClose={() => setPreviewEmailId(null)}
      />

      {/* 5. System Architecture & Database Schema Modal */}
      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
