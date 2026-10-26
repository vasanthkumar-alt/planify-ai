/**
 * Excel (.xlsx) and CSV Ingestion Engine for Planify AI
 */
import * as xlsx from 'xlsx';

export interface IngestedRow {
  userName: string;
  email: string;
  projectName: string;
  uploadDate: string;
}

export interface IngestionResult {
  success: boolean;
  totalParsed: number;
  validRows: IngestedRow[];
  errors: Array<{ rowNumber: number; reason: string }>;
}

export function parseExcelBuffer(buffer: Buffer): IngestionResult {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        totalParsed: 0,
        validRows: [],
        errors: [{ rowNumber: 0, reason: 'Workbook contains no sheets.' }],
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: Record<string, any>[] = xlsx.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    const validRows: IngestedRow[] = [];
    const errors: Array<{ rowNumber: number; reason: string }> = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // account for header line

      // Find keys flexibly
      const keys = Object.keys(row);
      const findVal = (regex: RegExp) => {
        const match = keys.find((k) => regex.test(k.trim().toLowerCase()));
        if (match && row[match] !== undefined && String(row[match]).trim() !== '') {
          return String(row[match]).trim();
        }
        return '';
      };

      // User / Member / Student Name
      let userName = findVal(/^(user(\s*_?name)?|member(\s*_?name)?|student(\s*_?name)?|developer|candidate|author|name)$/i);
      if (!userName) {
        userName = findVal(/(user|member|student|developer|name)/i);
      }

      // Email
      let email = findVal(/^(email(\s*_?id)?|e-mail|mail|emailaddress|user(\s*_?email))$/i);
      if (!email) {
        email = findVal(/(email|mail)/i);
      }

      // Project Name / Title
      let projectName = findVal(/^(project(\s*_?name)?|project(\s*_?title)?|title|topic|domain)$/i);
      if (!projectName) {
        projectName = findVal(/(project|title|topic)/i);
      }

      // Upload Date
      let uploadDate = findVal(/^(date(\s*_?of\s*_?upload)?|upload(\s*_?date)?|date|timestamp|submission(\s*_?date)?)$/i);
      if (!uploadDate) {
        uploadDate = findVal(/(date|upload|submission|time)/i);
      }
      if (!uploadDate) {
        uploadDate = new Date().toISOString().split('T')[0];
      }

      // If entire row is blank, skip
      if (!userName && !projectName && !email) {
        return;
      }

      // Fallback if headers were unnamed (column A, B, C...)
      const values = Object.values(row).map((v) => String(v).trim()).filter(Boolean);
      if (!userName && values.length > 0) userName = values[0];
      if (!email && values.length > 1 && values[1].includes('@')) email = values[1];
      if (!projectName && values.length > 2) projectName = values[2];
      else if (!projectName && values.length > 1 && !values[1].includes('@')) projectName = values[1];

      if (!userName) {
        errors.push({ rowNumber: rowNum, reason: 'Missing "User Name" / "Member Name" column' });
        return;
      }

      if (!projectName) {
        // Fallback project name
        projectName = `${userName}'s Engineering Project`;
      }

      if (!email || !email.includes('@')) {
        // Auto-generate valid email if missing or invalid
        const cleanName = userName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        email = `${cleanName || 'member'}@example.com`;
      }

      validRows.push({
        userName,
        email,
        projectName,
        uploadDate,
      });
    });

    return {
      success: validRows.length > 0,
      totalParsed: rawRows.length,
      validRows,
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      totalParsed: 0,
      validRows: [],
      errors: [{ rowNumber: 0, reason: `Failed to parse file: ${err.message || 'Unknown error'}` }],
    };
  }
}

/**
 * Generates a sample CSV template for users to download
 */
export function generateSampleCsv(): string {
  return [
    'User Name,Email ID,Project Name,Date of Upload',
    'Alex Rivers,alex.rivers@example.com,AI Code Review Assistant,2026-10-26',
    'Sophia Chen,sophia.chen@example.com,Autonomous Drone Fleet Dispatcher,2026-10-26',
    'Marcus Thorne,marcus.t@example.com,Decentralized Medical Records Vault,2026-10-27',
    'Elena Rostova,elena.rostova@example.com,Real-Time Collaborative Whiteboard,2026-10-28',
    'David Miller,david.m@example.com,Smart Energy Grid Optimizer,2026-10-29',
  ].join('\n');
}
