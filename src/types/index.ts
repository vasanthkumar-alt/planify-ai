export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface ModuleItem {
  id: string;
  project_id: string;
  step_number: number;
  title: string;
  description: string;
  deliverables: string[];
  verificationCriteria: string[];
  estimated_days: number;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_revision';
  feedback?: string;
  completed_at?: string;
}

export interface ReviewItem {
  id: string;
  project_id: string;
  review_number: number;
  scheduled_date: string;
  meet_link: string;
  calendar_link?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  demo_feedback?: string;
  ai_evaluation?: string;
  next_action_plan?: string;
  email_sent: number;
  email_sent_at?: string;
  completed_at?: string;
}

export interface EmailLogItem {
  id: string;
  project_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  email_type: 'initial_plan' | 'review_scheduled' | 'review_evaluation' | 'project_completed';
  html_content?: string;
  sent_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  name: string;
  category?: string;
  description?: string;
  status: 'pending_ai' | 'review_scheduled' | 'in_progress' | 'completed';
  current_module_index: number;
  completion_pct: number;
  upload_date: string;
  created_at: string;
  updated_at: string;
  modules?: ModuleItem[];
  latestReview?: ReviewItem;
  reviews?: ReviewItem[];
  emailLogs?: EmailLogItem[];
}
