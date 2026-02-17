import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getSpreadsheetSummary, getRows, DEFAULT_SPREADSHEET_ID } from './serviceGoogleSheet';
import { WorkItem } from "./workitem";
import { provideDataAsJson } from "./serviceExcel";
import { loadJson, saveJson } from "./serviceJson";
import { loadJsonDB, saveJsonDB } from "./servicedb";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

//app.get('/dbinfo', (_req, res) => {
//  res.json({ key: process.env.DATABASE_URL ? 'Database URL is set' : 'Database URL is NOT set' });
//});

app.get('/dbinfosecret', (_req, res) => {
  res.json({ key: process.env.DATABASE_URL  });
});

app.post('/workitems/save', async (req, res) => {
  try {
    const body = req.body;
    
    // Check if body is a single work item (object) or array
    if (Array.isArray(body)) {
      // Multiple work items - save to JSON file
      await saveJson(body);
      res.json({ message: 'Work items saved successfully' });
    } else if (body && typeof body === 'object' && body.id) {
      // Single work item - save to database (ignore subitems)
      const workItem: WorkItem = body;
      await saveJsonDB(workItem);
      res.json({ message: `Work item ${workItem.id} updated successfully` });
    } else {
      console.error('Invalid request body:', body);
      return res.status(400).json({ error: 'Request body must be a work item object or an array of work items' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

app.get('/workitems', async (req, res) => {
  try {
    const dbJson = await loadJsonDB();
    
    // If id query parameter is provided, find and return specific work item
    const id = req.query.id as string | undefined;
    if (id) {
      const workItem = findWorkItemById(dbJson, id);
      if (!workItem) {
        return res.status(404).json({ error: `Work item with id '${id}' not found` });
      }
      return res.json(workItem);
    }
    
    // Otherwise return all work items
    res.json(dbJson);
  } catch (err: any) {  
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

/**
 * Recursively searches for a work item by ID in the nested structure
 * @param workItems Array of work items to search
 * @param id The ID to search for
 * @returns The found work item with its subitems, or null if not found
 */
function findWorkItemById(workItems: WorkItem[], id: string): WorkItem | null {
  for (const item of workItems) {
    // Check if this is the item we're looking for
    if (item.id === id) {
      return item;
    }
    
    // Recursively search in subitems if they exist
    if (item.subitems && item.subitems.length > 0) {
      const found = findWorkItemById(item.subitems, id);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

app.get('/workitemsExcel', async (_req, res) => {
  try {
    const json = await provideDataAsJson();
    res.json(json);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});
app.get('/workitemsExcel', async (_req, res) => {
  try {
    const json = await provideDataAsJson();
    res.json(json);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});
app.get('/sheet', async (req, res) => {
  try {
    const spreadsheetId = (req.query.spreadsheetId as string) || DEFAULT_SPREADSHEET_ID;
    const summary = await getSpreadsheetSummary(spreadsheetId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

app.get('/sheet/:sheet/rows', async (req, res) => {
  try {
    const spreadsheetId = (req.query.spreadsheetId as string) || DEFAULT_SPREADSHEET_ID;
    const sheetParam = req.params.sheet;
    const sheetRef = /^\d+$/.test(sheetParam) ? Number(sheetParam) : sheetParam;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const rows = await getRows(sheetRef as any, { spreadsheetId, offset, limit });
    res.json({ count: rows.length, rows });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
