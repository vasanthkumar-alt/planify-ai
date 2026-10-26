/**
 * Gemini AI Integration for Planify AI
 * Model: gemini-3.8-flash
 */
import { GoogleGenAI } from '@google/genai';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeneratedModule {
  stepNumber: number;
  title: string;
  description: string;
  deliverables: string[];
  verificationCriteria: string[];
  estimatedDays: number;
}

export interface ProjectBreakdownResponse {
  category: string;
  summary: string;
  recommendedTechStack: string[];
  flowchartNodes: Array<{
    id: string;
    label: string;
    stage: string;
    dependencies: string[];
  }>;
  modules: GeneratedModule[];
}

export interface ReviewEvaluationResult {
  completionPct: number;
  summaryFeedback: string;
  strengths: string[];
  actionableNextSteps: string[];
  riskAnalysis: string;
  recommendedReviewIntervalDays: number;
  revisedDeliverables?: string[];
}

/**
 * Generate step-by-step development modules and flowchart for a project
 */
export async function generateProjectBreakdown(
  projectName: string,
  userName: string
): Promise<ProjectBreakdownResponse> {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `
You are an expert Chief Technology Officer, Technical Project Manager, and Software Architect at Planify AI.
Analyze the following project name and student/developer details, then decompose it into 4 to 5 rigorous, practical sequential development modules for a comprehensive project review schedule automation pipeline.

Project Name: "${projectName}"
Developer: "${userName}"

Generate a clean JSON response adhering to this schema:
{
  "category": "e.g. Full-Stack Web, AI/ML System, Mobile App, Cloud/DevOps, IoT/Embedded, etc.",
  "summary": "2 sentence executive summary of the architecture and end-goal",
  "recommendedTechStack": ["e.g. React", "FastAPI", "PostgreSQL", "Docker"],
  "flowchartNodes": [
    {"id": "node-1", "label": "Step 1: Core Foundation", "stage": "Planning & Architecture", "dependencies": []},
    {"id": "node-2", "label": "Step 2: Backend & DB", "stage": "Development", "dependencies": ["node-1"]}
  ],
  "modules": [
    {
      "stepNumber": 1,
      "title": "Clear concise module title",
      "description": "What needs to be engineered in this step",
      "deliverables": ["Specific deliverable 1", "Specific deliverable 2", "Specific deliverable 3"],
      "verificationCriteria": ["Concrete demo checklist item 1", "Checklist item 2"],
      "estimatedDays": 7
    }
  ]
}

Ensure the steps form a logical dependency chain suitable for scheduled milestone reviews (Step 1 -> Step 2 -> Step 3 -> Step 4 -> Step 5).
Provide only raw JSON without backticks or markdown if possible, or standard markdown json.
`;

      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      // 4.5 second timeout per call so batch requests never hit proxy gateway timeouts
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 4500)
      );

      const response = await Promise.race([geminiCall, timeoutPromise]);
      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
        return parsed as ProjectBreakdownResponse;
      }
    } catch (err) {
      console.warn('Gemini breakdown generation bypassed/fallback used:', err);
    }
  }

  // Resilient intelligent fallback based on project keywords
  return generateFallbackBreakdown(projectName);
}

/**
 * Evaluates progress during/after an interactive review session
 */
export async function evaluateReviewProgress(params: {
  projectName: string;
  userName: string;
  reviewNumber: number;
  modules: Array<{
    stepNumber: number;
    title: string;
    status: string; // 'pending' | 'in_progress' | 'completed' | 'needs_revision'
    deliverables: string[];
    verificationCriteria: string[];
  }>;
  adminNotes: string;
  demoFeedback: string;
}): Promise<ReviewEvaluationResult> {
  const { projectName, userName, reviewNumber, modules, adminNotes, demoFeedback } = params;
  const ai = getAiClient();

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const totalCount = modules.length;
  const calculatedPct = Math.round((completedCount / (totalCount || 1)) * 100);

  if (ai) {
    try {
      const prompt = `
You are an expert Review Lead and System Architect evaluating a milestone demo session for Planify AI.
Project: "${projectName}"
Developer: "${userName}"
Review Number: ${reviewNumber}

Current Modules Status:
${JSON.stringify(modules, null, 2)}

Administrator Live Demo Notes:
"${adminNotes || 'Demonstrated core functional endpoints and UI screens.'}"

Developer Demo Feedback / Challenges Reported:
"${demoFeedback || 'No major blockers reported, working on integrations.'}"

Current completed count: ${completedCount} out of ${totalCount}.

Analyze the demo thoroughly and return JSON with:
{
  "completionPct": ${calculatedPct},
  "summaryFeedback": "Detailed, encouraging yet constructive 2-3 paragraph critique of the demo.",
  "strengths": ["Key architectural strength or good practice demonstrated"],
  "actionableNextSteps": ["Very specific technical task 1 for the upcoming review", "Specific technical task 2", "Specific technical task 3"],
  "riskAnalysis": "Potential edge cases, scaling bottlenecks, or test gaps to address",
  "recommendedReviewIntervalDays": 7,
  "revisedDeliverables": ["Any newly refined deliverables for the upcoming module"]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        completionPct: typeof parsed.completionPct === 'number' ? parsed.completionPct : calculatedPct,
        summaryFeedback: parsed.summaryFeedback || 'Milestone reviewed and validated.',
        strengths: parsed.strengths || ['System architecture aligns with initial module specs'],
        actionableNextSteps: parsed.actionableNextSteps || ['Proceed with next sequential module'],
        riskAnalysis: parsed.riskAnalysis || 'Ensure comprehensive test coverage before production deployment.',
        recommendedReviewIntervalDays: parsed.recommendedReviewIntervalDays || 7,
        revisedDeliverables: parsed.revisedDeliverables || [],
      };
    } catch (err) {
      console.error('Gemini review evaluation error, using fallback:', err);
    }
  }

  // Fallback evaluation
  return {
    completionPct: calculatedPct,
    summaryFeedback: `Review #${reviewNumber} conducted successfully. The developer verified ${completedCount} of ${totalCount} modules (${calculatedPct}%). Demonstrated good code structure and functional alignment with review criteria. ${adminNotes ? 'Administrator remarks: ' + adminNotes : ''}`,
    strengths: [
      'Core architecture and requirements decomposition well understood',
      'Progressive implementation aligns with scheduled timeline',
    ],
    actionableNextSteps: [
      'Complete remaining module verification checklist items',
      'Address edge case handling and data validation',
      'Prepare automated end-to-end demo flow for the next review session',
    ],
    riskAnalysis: 'Maintain consistency in test assertions and error responses.',
    recommendedReviewIntervalDays: calculatedPct === 100 ? 0 : 7,
    revisedDeliverables: [],
  };
}

function generateFallbackBreakdown(projectName: string): ProjectBreakdownResponse {
  const pLower = projectName.toLowerCase();
  const isAi = pLower.includes('ai') || pLower.includes('ml') || pLower.includes('bot') || pLower.includes('vision');
  const isEcom = pLower.includes('shop') || pLower.includes('e-commerce') || pLower.includes('store') || pLower.includes('pay');

  let category = 'Full-Stack Application';
  let stack = ['React', 'TypeScript', 'Node.js/Express', 'SQLite/PostgreSQL', 'Tailwind CSS'];

  if (isAi) {
    category = 'AI-Powered Intelligent System';
    stack = ['React', 'FastAPI/Node', 'Gemini API', 'Vector DB/Embeddings', 'Tailwind CSS'];
  } else if (isEcom) {
    category = 'E-Commerce & Transaction Platform';
    stack = ['React 19', 'Express.js', 'Stripe API', 'Relational DB', 'Tailwind CSS'];
  }

  return {
    category,
    summary: `Structured engineering roadmap for ${projectName}, establishing modular milestones from architecture design to deployment.`,
    recommendedTechStack: stack,
    flowchartNodes: [
      { id: 'm1', label: '1. Architecture & Data Schema', stage: 'Initiation', dependencies: [] },
      { id: 'm2', label: '2. Core Backend & Business Logic', stage: 'Core Backend', dependencies: ['m1'] },
      { id: 'm3', label: '3. Frontend & Interactive UI', stage: 'Client UI', dependencies: ['m2'] },
      { id: 'm4', label: '4. Integration & Security', stage: 'System Integration', dependencies: ['m3'] },
      { id: 'm5', label: '5. Testing, Polish & Deployment', stage: 'Release Ready', dependencies: ['m4'] },
    ],
    modules: [
      {
        stepNumber: 1,
        title: 'Architecture, Wireframing & Data Modeling',
        description: `Set up the repository foundation, database ER diagram, and foundational API contracts for ${projectName}.`,
        deliverables: [
          'Initial Git repository and CI configuration',
          'Database schema and migrations defined',
          'High-fidelity UX wireframes and component hierarchy',
        ],
        verificationCriteria: [
          'Live demo of database connections and schema queries',
          'Walkthrough of component wireframes and project specification',
        ],
        estimatedDays: 6,
      },
      {
        stepNumber: 2,
        title: 'Core Business Logic & Backend APIs',
        description: 'Implement primary CRUD endpoints, business rules, and external service connectors.',
        deliverables: [
          'RESTful / GraphQL endpoints for core entities',
          'Authentication / authorization middleware',
          'Postman / OpenAPI documentation with sample payloads',
        ],
        verificationCriteria: [
          'Demonstrate successful API requests and error handling via Postman/cURL',
          'Verify data validation and database transaction integrity',
        ],
        estimatedDays: 7,
      },
      {
        stepNumber: 3,
        title: 'Client UI & Interactive Views',
        description: 'Construct responsive user interfaces, dashboard controls, and real-time state management.',
        deliverables: [
          'Responsive dashboard and user navigation views',
          'Data ingestion / user input forms with validation',
          'Client-side state management and API integration',
        ],
        verificationCriteria: [
          'Interactive UI walkthrough with live data populating from API',
          'Demonstrate mobile/tablet responsive layouts and loading states',
        ],
        estimatedDays: 7,
      },
      {
        stepNumber: 4,
        title: 'Third-Party Services & Pipeline Automation',
        description: 'Connect notification dispatchers, automated scheduling hooks, and third-party integrations.',
        deliverables: [
          'Automated event triggers and webhook receivers',
          'Email and communication template dispatching',
          'Security hardening and rate limiting',
        ],
        verificationCriteria: [
          'Trigger end-to-end integration event with live confirmation',
          'Verify error recovery and audit logging',
        ],
        estimatedDays: 7,
      },
      {
        stepNumber: 5,
        title: 'End-to-End Testing, Optimization & Release',
        description: 'Execute integration test suites, performance optimization, and production deployment configuration.',
        deliverables: [
          'Automated unit and integration test suite passing',
          'Lighthouse audit score > 90 and bundle optimization',
          'Containerized deployment build and documentation',
        ],
        verificationCriteria: [
          'Full live demo of complete user journey from start to finish',
          'Review of production readiness checklist and final sign-off',
        ],
        estimatedDays: 7,
      },
    ],
  };
}
