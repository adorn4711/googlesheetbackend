import { getSpreadsheetSummary, getRows, DEFAULT_SPREADSHEET_ID } from './serviceGoogleSheet';

async function fetchSheet(){
  const spreadsheetId = DEFAULT_SPREADSHEET_ID;
  const summary = await getSpreadsheetSummary(spreadsheetId);
  console.log(summary);

}

fetchSheet();
