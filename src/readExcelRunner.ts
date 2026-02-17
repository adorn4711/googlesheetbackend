import { readSchaetzungTest,readAndConvertSchaetzungTest } from "./serviceExcel";
import { WorkItem } from "./workitem";

async function run() {
  try {
    const rows = await readSchaetzungTest();
    console.log(JSON.stringify(rows, null, 2));
    const workItems: WorkItem[] = await readAndConvertSchaetzungTest();
    console.log(JSON.stringify(workItems, null, 2));
  } catch (err) {
    console.error("Failed to read schaetzung_test.xlsx:", err);
    process.exit(1);
  }
}

run();
