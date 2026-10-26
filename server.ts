/**
 * Planify AI - Server Entry Point
 * Express.js backend with SQLite, Gemini AI integration, and Vite middleware
 */
import express from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { getDb, queryAll, queryOne, runExec } from './server/db.js';
import { generateProjectBreakdown, evaluateReviewProgress } from './server/gemini.js';
import { generateMeetLink, generateRandomMeetingTime, generateCalendarLink } from './server/meet.js';
import { sendAndLogEmail } from './server/email.js';
import { parseExcelBuffer, generateSampleCsv } from './server/excel.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- API ROUTES ---

// 1. Download Sample CSV Template
app.get('/api/sample-csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="planify_sample_template.csv"');
  res.send(generateSampleCsv());
});

// 2. Get All Projects with metrics
app.get('/api/projects', async (req, res) => {
  try {
    const db = await getDb();
    const projects = queryAll(
      db,
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM projects p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    // Attach modules and latest review to each project
    const enriched = projects.map((p) => {
      const modules = queryAll(
        db,
        `SELECT id, step_number, title, status, estimated_days FROM modules WHERE project_id = ? ORDER BY step_number ASC`,
        [p.id]
      );
      const latestReview = queryOne(
        db,
        `SELECT * FROM reviews WHERE project_id = ? ORDER BY review_number DESC LIMIT 1`,
        [p.id]
      );

      return {
        ...p,
        modules,
        latestReview,
      };
    });

    res.json({ success: true, projects: enriched });
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Project Detail with modules, reviews, and email logs
app.get('/api/projects/:id', async (req, res) => {
  try {
    const db = await getDb();
    const project = queryOne(
      db,
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM projects p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const rawModules = queryAll(
      db,
      `SELECT * FROM modules WHERE project_id = ? ORDER BY step_number ASC`,
      [project.id]
    );
    const modules = rawModules.map((m) => ({
      ...m,
      deliverables: JSON.parse(m.deliverables || '[]'),
      verificationCriteria: JSON.parse(m.verification_criteria || '[]'),
    }));

    const reviews = queryAll(
      db,
      `SELECT * FROM reviews WHERE project_id = ? ORDER BY review_number ASC`,
      [project.id]
    );

    const emailLogs = queryAll(
      db,
      `SELECT id, subject, email_type, recipient_email, recipient_name, sent_at
       FROM email_logs WHERE project_id = ? ORDER BY sent_at DESC`,
      [project.id]
    );

    res.json({
      success: true,
      project: {
        ...project,
        modules,
        reviews,
        emailLogs,
      },
    });
  } catch (err: any) {
    console.error('Error fetching project detail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Shared ingestion worker that processes rows concurrently
async function processIngestedRows(validRows: any[]) {
  const db = await getDb();
  const now = new Date().toISOString();

  // Process rows concurrently with Promise.all
  const createdProjects = await Promise.all(
    validRows.map(async (row) => {
      try {
        // 1. Find or create user
        let user = queryOne(db, `SELECT * FROM users WHERE email = ?`, [row.email]);
        const userId = user ? user.id : 'usr_' + Math.random().toString(36).substring(2, 11);

        if (!user) {
          runExec(
            db,
            `INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)`,
            [userId, row.userName, row.email, now]
          );
        }

        // 2. Create Project
        const projectId = 'prj_' + Math.random().toString(36).substring(2, 11);
        runExec(
          db,
          `INSERT INTO projects (id, user_id, name, status, current_module_index, completion_pct, upload_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [projectId, userId, row.projectName, 'review_scheduled', 0, 0, row.uploadDate || now.split('T')[0], now, now]
        );

        // 3. Trigger Gemini AI Module Generation (with timeout race)
        const aiResult = await generateProjectBreakdown(row.projectName, row.userName);

        // Update project category & description
        runExec(
          db,
          `UPDATE projects SET category = ?, description = ? WHERE id = ?`,
          [aiResult.category, aiResult.summary, projectId]
        );

        // 4. Save Modules
        const savedModules: any[] = [];
        for (const mod of aiResult.modules) {
          const modId = 'mod_' + Math.random().toString(36).substring(2, 11);
          const modStatus = mod.stepNumber === 1 ? 'in_progress' : 'pending';
          runExec(
            db,
            `INSERT INTO modules (id, project_id, step_number, title, description, deliverables, verification_criteria, estimated_days, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              modId,
              projectId,
              mod.stepNumber,
              mod.title,
              mod.description,
              JSON.stringify(mod.deliverables),
              JSON.stringify(mod.verificationCriteria),
              mod.estimatedDays || 7,
              modStatus,
            ]
          );
          savedModules.push({
            id: modId,
            stepNumber: mod.stepNumber,
            title: mod.title,
            description: mod.description,
            deliverables: mod.deliverables,
            status: modStatus,
          });
        }

        // 5. Automated Scheduling for Review #1 (Randomized meeting time during business hours, hosted by admin)
        const meetingTime = generateRandomMeetingTime(row.uploadDate);
        const meetLink = generateMeetLink();
        const calendarLink = generateCalendarLink(
          `Planify AI Review #1: ${row.projectName}`,
          `Milestone 1 Demo and Architecture Review for ${row.projectName}`,
          meetingTime.iso,
          meetLink
        );
        const reviewId = 'rev_' + Math.random().toString(36).substring(2, 11);

        runExec(
          db,
          `INSERT INTO reviews (id, project_id, review_number, scheduled_date, meet_link, calendar_link, status, email_sent, email_sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [reviewId, projectId, 1, meetingTime.formatted, meetLink, calendarLink, 'scheduled', now]
        );

        // 6. Send Automated Email Brief
        await sendAndLogEmail({
          db,
          projectId,
          recipientEmail: row.email,
          recipientName: row.userName,
          subject: `[Planify AI] Roadmap & Review #1 Scheduled: ${row.projectName}`,
          emailType: 'initial_plan',
          payload: {
            projectName: row.projectName,
            reviewNumber: 1,
            reviewDate: meetingTime.formatted,
            meetLink,
            calendarLink,
            modules: savedModules,
          },
        });

        return {
          id: projectId,
          userName: row.userName,
          email: row.email,
          projectName: row.projectName,
          category: aiResult.category,
          reviewDate: meetingTime.formatted,
          meetLink,
          modulesCount: savedModules.length,
        };
      } catch (err) {
        console.error('Error processing row for project:', row.projectName, err);
        return null;
      }
    })
  );

  return createdProjects.filter(Boolean);
}

// 4a. Ingest Excel / CSV Upload via multipart file or CSV text
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    let buffer: Buffer | null = null;

    if (req.file) {
      buffer = req.file.buffer;
    } else if (req.body.csvContent) {
      buffer = Buffer.from(req.body.csvContent, 'utf-8');
    } else if (req.body.rows && Array.isArray(req.body.rows)) {
      // Direct rows payload
      const validRows = req.body.rows;
      const createdProjects = await processIngestedRows(validRows);
      return res.json({
        success: true,
        message: `Successfully processed ${createdProjects.length} projects with AI pipelines!`,
        totalParsed: validRows.length,
        validCount: createdProjects.length,
        projects: createdProjects,
      });
    } else {
      return res.status(400).json({ success: false, error: 'No file or CSV content provided.' });
    }

    const ingestionResult = parseExcelBuffer(buffer);
    if (!ingestionResult.success || ingestionResult.validRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid records found in the uploaded file.',
        details: ingestionResult.errors,
      });
    }

    const createdProjects = await processIngestedRows(ingestionResult.validRows);

    res.json({
      success: true,
      message: `Successfully processed ${createdProjects.length} projects with AI pipelines and Google Meet scheduling!`,
      totalParsed: ingestionResult.totalParsed,
      validCount: createdProjects.length,
      errors: ingestionResult.errors,
      projects: createdProjects,
    });
  } catch (err: any) {
    console.error('Upload processing failed:', err);
    res.status(500).json({ success: false, error: err.message || 'File processing failed' });
  }
});

// 4b. Direct JSON rows ingestion (bypasses multipart proxy constraints)
app.post('/api/upload-json', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No rows provided in JSON payload.' });
    }

    const createdProjects = await processIngestedRows(rows);
    res.json({
      success: true,
      message: `Successfully processed ${createdProjects.length} projects with AI pipelines and Google Meet scheduling!`,
      totalParsed: rows.length,
      validCount: createdProjects.length,
      projects: createdProjects,
    });
  } catch (err: any) {
    console.error('upload-json error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to ingest rows' });
  }
});

// 5. Manual Single Project Creation (for quick testing)
app.post('/api/projects/manual', async (req, res) => {
  try {
    const { userName, email, projectName, uploadDate } = req.body;
    if (!userName || !email || !projectName) {
      return res.status(400).json({ success: false, error: 'User name, email, and project name are required.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    let user = queryOne(db, `SELECT * FROM users WHERE email = ?`, [email]);
    const userId = user ? user.id : 'usr_' + Math.random().toString(36).substring(2, 11);
    if (!user) {
      runExec(db, `INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)`, [userId, userName, email, now]);
    }

    const projectId = 'prj_' + Math.random().toString(36).substring(2, 11);
    runExec(
      db,
      `INSERT INTO projects (id, user_id, name, status, current_module_index, completion_pct, upload_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)`,
      [projectId, userId, projectName, 'review_scheduled', uploadDate || now.split('T')[0], now, now]
    );

    // AI Pipeline
    const aiResult = await generateProjectBreakdown(projectName, userName);
    runExec(db, `UPDATE projects SET category = ?, description = ? WHERE id = ?`, [aiResult.category, aiResult.summary, projectId]);

    const savedModules: any[] = [];
    for (const mod of aiResult.modules) {
      const modId = 'mod_' + Math.random().toString(36).substring(2, 11);
      const modStatus = mod.stepNumber === 1 ? 'in_progress' : 'pending';
      runExec(
        db,
        `INSERT INTO modules (id, project_id, step_number, title, description, deliverables, verification_criteria, estimated_days, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [modId, projectId, mod.stepNumber, mod.title, mod.description, JSON.stringify(mod.deliverables), JSON.stringify(mod.verificationCriteria), mod.estimatedDays || 7, modStatus]
      );
      savedModules.push({
        id: modId,
        stepNumber: mod.stepNumber,
        title: mod.title,
        description: mod.description,
        deliverables: mod.deliverables,
        status: modStatus,
      });
    }

    // Schedule Review 1
    const meetingTime = generateRandomMeetingTime(uploadDate);
    const meetLink = generateMeetLink();
    const calendarLink = generateCalendarLink(`Planify AI Review #1: ${projectName}`, `Milestone 1 Demo for ${projectName}`, meetingTime.iso, meetLink);
    const reviewId = 'rev_' + Math.random().toString(36).substring(2, 11);

    runExec(
      db,
      `INSERT INTO reviews (id, project_id, review_number, scheduled_date, meet_link, calendar_link, status, email_sent, email_sent_at)
       VALUES (?, ?, 1, ?, ?, ?, 'scheduled', 1, ?)`,
      [reviewId, projectId, meetingTime.formatted, meetLink, calendarLink, now]
    );

    // Send email
    await sendAndLogEmail({
      db,
      projectId,
      recipientEmail: email,
      recipientName: userName,
      subject: `[Planify AI] Roadmap & Review #1 Scheduled: ${projectName}`,
      emailType: 'initial_plan',
      payload: {
        projectName,
        reviewNumber: 1,
        reviewDate: meetingTime.formatted,
        meetLink,
        calendarLink,
        modules: savedModules,
      },
    });

    res.json({ success: true, projectId, message: 'Project initialized and AI roadmap generated.' });
  } catch (err: any) {
    console.error('Manual project creation failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Interactive Review Evaluation & Recursive Progress Iteration
app.post('/api/reviews/evaluate', async (req, res) => {
  try {
    const { projectId, reviewId, moduleStatuses, adminNotes, demoFeedback } = req.body;
    if (!projectId || !reviewId) {
      return res.status(400).json({ success: false, error: 'Project ID and Review ID are required.' });
    }

    const db = await getDb();
    const project = queryOne(
      db,
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM projects p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [projectId]
    );

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const review = queryOne(db, `SELECT * FROM reviews WHERE id = ?`, [reviewId]);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // 1. Update module statuses if provided from live demo checklist
    const now = new Date().toISOString();
    if (moduleStatuses && Array.isArray(moduleStatuses)) {
      for (const ms of moduleStatuses) {
        runExec(
          db,
          `UPDATE modules SET status = ?, completed_at = ? WHERE id = ? AND project_id = ?`,
          [ms.status, ms.status === 'completed' ? now : null, ms.id, projectId]
        );
      }
    }

    // Retrieve refreshed modules
    const rawModules = queryAll(db, `SELECT * FROM modules WHERE project_id = ? ORDER BY step_number ASC`, [projectId]);
    const modules = rawModules.map((m) => ({
      ...m,
      deliverables: JSON.parse(m.deliverables || '[]'),
      verificationCriteria: JSON.parse(m.verification_criteria || '[]'),
    }));

    // 2. Call Gemini AI to evaluate review demo progress
    const aiEvaluation = await evaluateReviewProgress({
      projectName: project.name,
      userName: project.user_name,
      reviewNumber: review.review_number,
      modules: modules.map((m) => ({
        stepNumber: m.step_number,
        title: m.title,
        status: m.status,
        deliverables: m.deliverables,
        verificationCriteria: m.verificationCriteria,
      })),
      adminNotes: adminNotes || '',
      demoFeedback: demoFeedback || '',
    });

    const completionPct = aiEvaluation.completionPct;
    const isCompleted = completionPct >= 100 || modules.every((m) => m.status === 'completed');

    // 3. Update current review record
    const nextStepsFormatted = (aiEvaluation.actionableNextSteps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
    runExec(
      db,
      `UPDATE reviews SET
        status = 'completed',
        admin_notes = ?,
        demo_feedback = ?,
        ai_evaluation = ?,
        next_action_plan = ?,
        completed_at = ?
       WHERE id = ?`,
      [adminNotes || '', demoFeedback || '', aiEvaluation.summaryFeedback, nextStepsFormatted, now, reviewId]
    );

    // 4. Recursive Iteration: Schedule next review or mark completed
    let nextReview: any = null;

    if (!isCompleted) {
      // Find the first pending module and mark as in_progress
      const nextPending = modules.find((m) => m.status === 'pending');
      if (nextPending) {
        runExec(db, `UPDATE modules SET status = 'in_progress' WHERE id = ?`, [nextPending.id]);
      }

      const nextReviewNum = review.review_number + 1;
      const meetingTime = generateRandomMeetingTime();
      const meetLink = generateMeetLink();
      const calendarLink = generateCalendarLink(
        `Planify AI Review #${nextReviewNum}: ${project.name}`,
        `Review #${nextReviewNum} Progress Demo for ${project.name}. Focus: Next iteration deliverables.`,
        meetingTime.iso,
        meetLink
      );
      const nextReviewId = 'rev_' + Math.random().toString(36).substring(2, 11);

      runExec(
        db,
        `INSERT INTO reviews (id, project_id, review_number, scheduled_date, meet_link, calendar_link, status, email_sent, email_sent_at)
         VALUES (?, ?, ?, ?, ?, ?, 'scheduled', 1, ?)`,
        [nextReviewId, projectId, nextReviewNum, meetingTime.formatted, meetLink, calendarLink, now]
      );

      // Update project status
      runExec(
        db,
        `UPDATE projects SET status = 'review_scheduled', completion_pct = ?, updated_at = ? WHERE id = ?`,
        [completionPct, now, projectId]
      );

      // Send evaluation & next review email
      await sendAndLogEmail({
        db,
        projectId,
        recipientEmail: project.user_email,
        recipientName: project.user_name,
        subject: `[Planify AI] Review #${review.review_number} Results & Review #${nextReviewNum} Scheduled`,
        emailType: 'review_evaluation',
        payload: {
          projectName: project.name,
          reviewNumber: review.review_number,
          completionPct,
          reviewDate: meetingTime.formatted,
          meetLink,
          calendarLink,
          aiEvaluation: aiEvaluation.summaryFeedback,
          nextActionPlan: nextStepsFormatted,
          adminNotes,
        },
      });

      nextReview = {
        id: nextReviewId,
        reviewNumber: nextReviewNum,
        scheduledDate: meetingTime.formatted,
        meetLink,
        calendarLink,
      };
    } else {
      // All modules complete!
      runExec(
        db,
        `UPDATE projects SET status = 'completed', completion_pct = 100, updated_at = ? WHERE id = ?`,
        [now, projectId]
      );

      await sendAndLogEmail({
        db,
        projectId,
        recipientEmail: project.user_email,
        recipientName: project.user_name,
        subject: `🎉 [Planify AI] Congratulations! Project "${project.name}" Completed Successfully`,
        emailType: 'project_completed',
        payload: {
          projectName: project.name,
          completionPct: 100,
          aiEvaluation: aiEvaluation.summaryFeedback,
        },
      });
    }

    res.json({
      success: true,
      completionPct,
      isCompleted,
      aiEvaluation,
      nextReview,
      message: isCompleted
        ? 'Project completed! Final certificate email sent.'
        : `Review evaluated. Next review #${(nextReview && nextReview.reviewNumber) || ''} scheduled with new Google Meet link and dispatched via email.`,
    });
  } catch (err: any) {
    console.error('Review evaluation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Get Email Content (for Preview in UI)
app.get('/api/emails/:id', async (req, res) => {
  try {
    const db = await getDb();
    const email = queryOne(db, `SELECT * FROM email_logs WHERE id = ?`, [req.params.id]);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email log not found' });
    }
    res.json({ success: true, email });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Seed sample data if database is empty
app.post('/api/seed', async (req, res) => {
  try {
    const db = await getDb();
    const existing = queryAll(db, `SELECT COUNT(*) as count FROM projects`);
    if (existing[0]?.count > 0 && !req.query.force) {
      return res.json({ success: true, message: 'Database already has projects.' });
    }

    // Seed 3 realistic projects across diverse stages
    const samples = [
      {
        userName: 'Alex Rivers',
        email: 'alex.rivers@example.com',
        projectName: 'AI Real-Time Code Reviewer & Security Auditing Agent',
        category: 'AI & Developer Tools',
        uploadDate: '2026-10-22',
        initialCompletion: 25,
      },
      {
        userName: 'Sophia Chen',
        email: 'sophia.chen@example.com',
        projectName: 'Autonomous Drone Fleet Dispatcher & Telemetry Hub',
        category: 'Robotics & IoT Cloud',
        uploadDate: '2026-10-24',
        initialCompletion: 50,
      },
      {
        userName: 'Marcus Thorne',
        email: 'marcus.t@example.com',
        projectName: 'Decentralized Zero-Knowledge Medical Records Vault',
        category: 'Cybersecurity & HealthTech',
        uploadDate: '2026-10-18',
        initialCompletion: 100,
      },
    ];

    for (const s of samples) {
      const now = new Date().toISOString();
      const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
      runExec(db, `INSERT OR IGNORE INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)`, [userId, s.userName, s.email, now]);

      const projectId = 'prj_' + Math.random().toString(36).substring(2, 9);
      const status = s.initialCompletion === 100 ? 'completed' : 'review_scheduled';
      runExec(
        db,
        `INSERT INTO projects (id, user_id, name, category, status, completion_pct, upload_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, userId, s.projectName, s.category, status, s.initialCompletion, s.uploadDate, now, now]
      );

      // AI modules
      const aiResult = await generateProjectBreakdown(s.projectName, s.userName);
      runExec(db, `UPDATE projects SET description = ? WHERE id = ?`, [aiResult.summary, projectId]);

      const savedMods: any[] = [];
      const totalMods = aiResult.modules.length;
      const completedCount = Math.round((s.initialCompletion / 100) * totalMods);

      aiResult.modules.forEach((mod, idx) => {
        const modId = 'mod_' + Math.random().toString(36).substring(2, 9);
        let modStatus = 'pending';
        if (idx < completedCount) modStatus = 'completed';
        else if (idx === completedCount) modStatus = 'in_progress';

        runExec(
          db,
          `INSERT INTO modules (id, project_id, step_number, title, description, deliverables, verification_criteria, estimated_days, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [modId, projectId, mod.stepNumber, mod.title, mod.description, JSON.stringify(mod.deliverables), JSON.stringify(mod.verificationCriteria), mod.estimatedDays || 7, modStatus]
        );
        savedMods.push({
          stepNumber: mod.stepNumber,
          title: mod.title,
          description: mod.description,
          deliverables: mod.deliverables,
          status: modStatus,
        });
      });

      // Reviews
      const review1Date = generateRandomMeetingTime(s.uploadDate);
      const meetLink1 = generateMeetLink();
      const rev1Id = 'rev_' + Math.random().toString(36).substring(2, 9);
      runExec(
        db,
        `INSERT INTO reviews (id, project_id, review_number, scheduled_date, meet_link, status, email_sent, email_sent_at)
         VALUES (?, ?, 1, ?, ?, ?, 1, ?)`,
        [rev1Id, projectId, review1Date.formatted, meetLink1, s.initialCompletion > 25 ? 'completed' : 'scheduled', now]
      );

      // Welcome Email
      await sendAndLogEmail({
        db,
        projectId,
        recipientEmail: s.email,
        recipientName: s.userName,
        subject: `[Planify AI] Roadmap & Review #1 Scheduled: ${s.projectName}`,
        emailType: 'initial_plan',
        payload: {
          projectName: s.projectName,
          reviewNumber: 1,
          reviewDate: review1Date.formatted,
          meetLink: meetLink1,
          modules: savedMods,
        },
      });

      if (s.initialCompletion >= 50) {
        const review2Date = generateRandomMeetingTime();
        const meetLink2 = generateMeetLink();
        const rev2Id = 'rev_' + Math.random().toString(36).substring(2, 9);
        runExec(
          db,
          `INSERT INTO reviews (id, project_id, review_number, scheduled_date, meet_link, status, email_sent, email_sent_at)
           VALUES (?, ?, 2, ?, ?, ?, 1, ?)`,
          [rev2Id, projectId, review2Date.formatted, meetLink2, s.initialCompletion === 100 ? 'completed' : 'scheduled', now]
        );
      }
    }

    res.json({ success: true, message: 'Seeded sample projects successfully.' });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-seed on startup if empty
async function autoSeedIfEmpty() {
  try {
    const db = await getDb();
    const existing = queryAll(db, `SELECT COUNT(*) as count FROM projects`);
    if (existing[0]?.count === 0) {
      console.log('Seeding initial demo data for Planify AI...');
      const internalRes = {
        json: () => {},
        status: () => ({ json: () => {} }),
      } as any;
      // Trigger dummy request to seed
    }
  } catch (e) {
    console.error('Auto seed check error:', e);
  }
}

// Catch-all for undefined /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.path}` });
});

// Explicit API error handler to prevent HTML fallthrough
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    console.error('API Error handler:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  }
  next(err);
});

// Mount Vite or static dist in production
async function startServer() {
  await getDb(); // Ensure DB is initialized
  await autoSeedIfEmpty();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planify AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
