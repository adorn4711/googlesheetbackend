import { promises as fs } from 'fs';
import * as path from 'path';
import { WorkItem } from './workitem';

/**
 * Loads work items from the JSON data file
 * @returns Promise<WorkItem[]> Array of work items
 */
export async function loadJson(): Promise<WorkItem[]> {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: WorkItem[] = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error('Error loading JSON file:', error);
    throw new Error(`Failed to load data from data.json: ${error}`);
  }
}

/**
 * Saves work items to the JSON data file
 * @param workItems Array of work items to save
 * @returns Promise<void>
 */
export async function saveJson(workItems: WorkItem[]): Promise<void> {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'data.json');
    const jsonContent = JSON.stringify(workItems, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');
  } catch (error) {
    console.error('Error saving JSON file:', error);
    throw new Error(`Failed to save data to data.json: ${error}`);
  }
}
