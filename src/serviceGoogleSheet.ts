import { GoogleSpreadsheet } from 'google-spreadsheet';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

/*
Service Account angular_backend
  angular-backend@adorn4711test.iam.gserviceaccount.com

  Example sheet: https://docs.google.com/spreadsheets/d/1QpNG99Pnm_Sfz2Wle1deEnkne5Wi-49sUTy_Xu_xXqI/edit?gid=0#gid=0
*/
export const DEFAULT_SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || '1QpNG99Pnm_Sfz2Wle1deEnkne5Wi-49sUTy_Xu_xXqI';

function readCredsFromFile(): { client_email: string; private_key: string } | null {
  const defaultPath = path.resolve(__dirname, '..', 'key', 'adorn4711test-a51513af553d.json');
  const filePath = process.env.GOOGLE_CREDENTIALS_PATH || defaultPath;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    return { client_email: json.client_email, private_key: json.private_key };
  } catch {
    return null;
  }
}

function createAuth(): JWT {
  const envEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const envKey = process.env.GOOGLE_PRIVATE_KEY;
  const fallback = readCredsFromFile();
  const email = envEmail || fallback?.client_email;
  const key = (envKey ? envKey.replace(/\\n/g, '\n') : fallback?.private_key) as string | undefined;

  if (!email || !key) {
    throw new Error(
      'Missing Google credentials. Provide GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY envs or set GOOGLE_CREDENTIALS_PATH to a JSON key file.'
    );
  }

  return new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function getSpreadsheetDoc(spreadsheetId: string = DEFAULT_SPREADSHEET_ID) {
  const auth = createAuth();
  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();
  return doc;
}

export async function getSpreadsheetSummary(spreadsheetId?: string) {
  const doc = await getSpreadsheetDoc(spreadsheetId);
  return {
    id: doc.spreadsheetId,
    title: doc.title,
    sheets: doc.sheetsByIndex.map((s, idx) => ({ index: idx, id: s.sheetId, title: s.title, rowCount: s.rowCount })),
  };
}

export async function getRows(sheetRef: number | string, options?: { spreadsheetId?: string; offset?: number; limit?: number }) {
  const { spreadsheetId = DEFAULT_SPREADSHEET_ID, offset = 0, limit } = options || {};
  const doc = await getSpreadsheetDoc(spreadsheetId);
  const sheet = typeof sheetRef === 'number' ? doc.sheetsByIndex[sheetRef] : doc.sheetsByTitle[sheetRef];
  if (!sheet) {
    throw new Error('Sheet not found');
  }
  const rows = await sheet.getRows();
  const sliced = rows.slice(offset, limit ? offset + limit : undefined);
  return sliced.map((r) => r.toObject());
}

export async function getSpreadsheetTitle(spreadsheetId?: string) {
  const doc = await getSpreadsheetDoc(spreadsheetId);
  return doc.title;
}

export function getSheetsApi() {
  const auth = createAuth();
  return google.sheets({ version: 'v4', auth });
}
