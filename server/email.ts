/**
 * Email Dispatcher and HTML Template Engine for Planify AI
 */
import { Database } from 'sql.js';
import { runExec } from './db.js';

export interface SendEmailParams {
  db: Database;
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  emailType: 'initial_plan' | 'review_scheduled' | 'review_evaluation' | 'project_completed';
  payload: {
    projectName: string;
    reviewNumber?: number;
    reviewDate?: string;
    meetLink?: string;
    calendarLink?: string;
    completionPct?: number;
    modules?: Array<{
      stepNumber: number;
      title: string;
      description: string;
      deliverables: string[];
      status: string;
    }>;
    aiEvaluation?: string;
    nextActionPlan?: string;
    adminNotes?: string;
  };
}

export function generateEmailHtml(type: SendEmailParams['emailType'], payload: SendEmailParams['payload'], recipientName: string): string {
  const brandColor = '#2563eb';
  const headerBg = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';

  let contentHtml = '';

  if (type === 'initial_plan') {
    const modulesHtml = (payload.modules || [])
      .map(
        (m) => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #1e293b; font-size: 15px;">Step ${m.stepNumber}: ${m.title}</strong>
            <span style="background-color: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px;">Pending Review 1</span>
          </div>
          <p style="color: #475569; font-size: 13px; margin: 4px 0 8px 0; line-height: 1.5;">${m.description}</p>
          <div style="font-size: 12px; color: #64748b;">
            <strong>Target Deliverables:</strong>
            <ul style="margin: 4px 0 0 18px; padding: 0;">
              ${m.deliverables.map((d) => `<li style="margin-bottom: 2px;">${d}</li>`).join('')}
            </ul>
          </div>
        </div>
      `
      )
      .join('');

    contentHtml = `
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Welcome to <strong>Planify AI</strong>! Your project <em>"${payload.projectName}"</em> has been ingested into our automated schedule & review pipeline.
      </p>
      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 4px 0; color: #1e40af; font-size: 14px;">📅 Milestone 1 Review Scheduled</h4>
        <p style="margin: 0; color: #1e3a8a; font-size: 13px;">
          <strong>Date & Time:</strong> ${payload.reviewDate || 'Within 7 days'}<br/>
          <strong>Meet Link:</strong> <a href="${payload.meetLink}" style="color: #2563eb; font-weight: 600;">${payload.meetLink}</a>
        </p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${payload.meetLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 8px;">
          Join Google Meet
        </a>
        ${
          payload.calendarLink
            ? `<a href="${payload.calendarLink}" style="display: inline-block; background-color: #f1f5f9; color: #334155; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; border: 1px solid #cbd5e1;">
                Add to Google Calendar
              </a>`
            : ''
        }
      </div>

      <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">
        🤖 AI-Generated Development Roadmap & Modules
      </h3>
      ${modulesHtml}

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-top: 20px; font-size: 12px; color: #64748b;">
        💡 <strong>Review Instructions:</strong> Please be prepared to present a working demo of Step 1 modules during the Google Meet review session. The administrator will check off completed items, and Planify AI will synthesize your next milestone iteration.
      </div>
    `;
  } else if (type === 'review_evaluation') {
    contentHtml = `
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Your project review <strong>#${payload.reviewNumber || 1}</strong> for <em>"${payload.projectName}"</em> has been evaluated!
      </p>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <div style="font-size: 13px; color: #166534; font-weight: 600; margin-bottom: 4px;">Overall Completion Progress:</div>
        <div style="background-color: #dcfce7; border-radius: 9999px; height: 12px; width: 100%; overflow: hidden;">
          <div style="background-color: #16a34a; height: 100%; width: ${payload.completionPct || 0}%;"></div>
        </div>
        <div style="text-align: right; font-size: 13px; font-weight: 700; color: #15803d; margin-top: 4px;">
          ${payload.completionPct || 0}% Complete
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">🧠 Gemini AI Evaluation & Feedback</h4>
        <div style="color: #334155; font-size: 13px; line-height: 1.6; white-space: pre-line;">
          ${payload.aiEvaluation || 'Evaluation successfully recorded.'}
        </div>
      </div>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">🚀 Actionable Next Steps</h4>
        <div style="color: #1e3a8a; font-size: 13px; line-height: 1.6; white-space: pre-line;">
          ${payload.nextActionPlan || 'Proceed with remaining milestone deliverables.'}
        </div>
      </div>

      ${
        payload.meetLink && payload.reviewDate
          ? `
        <div style="background-color: #faf5ff; border-left: 4px solid #9333ea; padding: 14px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 4px 0; color: #6b21a8; font-size: 14px;">📅 Next Review Scheduled (#${(payload.reviewNumber || 1) + 1})</h4>
          <p style="margin: 0; color: #581c87; font-size: 13px;">
            <strong>Scheduled Date:</strong> ${payload.reviewDate}<br/>
            <strong>Google Meet Link:</strong> <a href="${payload.meetLink}" style="color: #7e22ce; font-weight: 600;">${payload.meetLink}</a>
          </p>
          <div style="margin-top: 10px;">
            <a href="${payload.meetLink}" style="display: inline-block; background-color: #9333ea; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px;">
              Join Next Google Meet
            </a>
          </div>
        </div>
      `
          : ''
      }
    `;
  } else if (type === 'project_completed') {
    contentHtml = `
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Congratulations <strong>${recipientName}</strong>! 🎉
      </p>
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border-radius: 8px; padding: 24px; text-align: center; margin: 16px 0;">
        <h2 style="margin: 0 0 8px 0; font-size: 20px;">🏆 Project Completed Successfully!</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.95;">
          All milestone modules for <strong>"${payload.projectName}"</strong> have been successfully verified and approved through Planify AI reviews.
        </p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">Final AI Review Summary</h4>
        <p style="color: #334155; font-size: 13px; line-height: 1.6;">
          ${payload.aiEvaluation || 'All functional deliverables met verification criteria.'}
        </p>
      </div>
    `;
  } else {
    contentHtml = `
      <p style="font-size: 15px; color: #334155;">Hello ${recipientName},</p>
      <p style="font-size: 14px; color: #334155;">A new review has been scheduled for your project <strong>${payload.projectName}</strong>.</p>
      <p>Date: ${payload.reviewDate}</p>
      <p><a href="${payload.meetLink}">Join Google Meet</a></p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${payload.projectName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9;">
        <div style="max-width: 640px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: ${headerBg}; padding: 28px 24px; color: #ffffff; text-align: left;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="background-color: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
                Planify AI
              </span>
            </div>
            <h1 style="margin: 8px 0 4px 0; font-size: 22px; font-weight: 700;">
              Project Review Schedule Automation
            </h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
              Automated Milestones • Google Meet Reviews • Continuous Iteration
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            ${contentHtml}
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 4px 0;">This is an automated review notification dispatched by <strong>Planify AI</strong>.</p>
            <p style="margin: 0;">Google Meet links and AI milestone timelines are updated continuously.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendAndLogEmail(params: SendEmailParams): Promise<string> {
  const { db, projectId, recipientEmail, recipientName, subject, emailType, payload } = params;
  const htmlContent = generateEmailHtml(emailType, payload, recipientName);
  const emailId = 'em_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  runExec(
    db,
    `INSERT INTO email_logs (id, project_id, recipient_email, recipient_name, subject, email_type, html_content, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [emailId, projectId, recipientEmail, recipientName, subject, emailType, htmlContent, now]
  );

  return emailId;
}
