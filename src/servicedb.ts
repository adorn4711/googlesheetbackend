import { neon } from '@neondatabase/serverless';
import { WorkItem } from './workitem';
import { loadJson } from './serviceJson';

/**
 * Adds a comment to the comments table in Neon database
 * @param comment The comment text to add
 * @returns Promise<void>
 */
export async function addComment(comment: string): Promise<void> {
    try {
        // Connect to the Neon database
        console.log(`Connecting to Neon database... ${process.env.DATABASE_URL}`);
        const sql = neon(`${process.env.DATABASE_URL}`);

        // Insert the comment into the comments table
        //await sql('INSERT INTO comments (comment) VALUES ($1)', [comment]);
        console.log('Comment added successfully');
    } catch (error) {
        console.error('Error adding comment:', error);
        throw new Error(`Failed to add comment to database: ${error}`);
    }
}

/**
 * Fetches all records from playing_with_neon table
 * @returns Promise containing all records from the table
 */
export async function getPlayingWithNeon() {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`);
        const result = await sql`SELECT * FROM playing_with_neon`;
        return result;
    } catch (error) {
        console.error('Error fetching data from playing_with_neon:', error);
        throw new Error(`Failed to fetch data: ${error}`);
    }
}

/**
 * Reads work items from data/data.json file
 * @returns Promise<WorkItem[]> Array of work items from JSON
 */
export async function readWorkItemsFromJson(): Promise<WorkItem[]> {
    return await loadJson();
}

/**
 * Inserts work items into the workitems table in Neon database
 * Handles nested subitems recursively by setting parent_id
 * @param workItems Array of work items to insert
 * @returns Promise<void>
 */
export async function insertWorkItemsToDb(sql:any,workItems: WorkItem[]): Promise<void> {
    try {
        
        // Recursive function to insert work item and its subitems
        async function insertWorkItem(item: WorkItem, parentId: string | null = null): Promise<void> {
            // Insert the current work item
            await sql`
                INSERT INTO workitems (id, title, verdict, estimate, description, estimate_explanation, parent_id)
                VALUES (
                    ${item.id},
                    ${item.title},
                    ${item.verdict},
                    ${item.estimate},
                    ${item.description},
                    ${item.estimateExplanation || null},
                    ${parentId}
                )
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    verdict = EXCLUDED.verdict,
                    estimate = EXCLUDED.estimate,
                    description = EXCLUDED.description,
                    estimate_explanation = EXCLUDED.estimate_explanation,
                    parent_id = EXCLUDED.parent_id,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            // Recursively insert subitems if they exist
            if (item.subitems && item.subitems.length > 0) {
                for (const subitem of item.subitems) {
                    await insertWorkItem(subitem, item.id);
                }
            }
        }
        
        // Insert all top-level work items and their subitems
        for (const workItem of workItems) {
            await insertWorkItem(workItem);
        }
        
        console.log(`Successfully inserted ${workItems.length} work items to database`);
    } catch (error) {
        console.error('Error inserting work items to database:', error);
        throw new Error(`Failed to insert work items: ${error}`);
    }
}

/**
 * Reads work items from the database and reconstructs the nested structure
 * @returns Promise<WorkItem[]> Array of work items with nested subitems
 */
export async function readWorkItemsFromDb(sql:any): Promise<WorkItem[]> {
    try {
        
        // Fetch all work items from database
        const rows = await sql`SELECT id, title, verdict, estimate, description, estimate_explanation, parent_id FROM workitems`;
        
        // Map database rows to WorkItem objects
        const allItems = rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            verdict: row.verdict as 'yes' | 'no' | 'maybe',
            estimate: row.estimate,
            description: row.description,
            estimateExplanation: row.estimate_explanation || undefined,
            parentId: row.parent_id,
            subitems: [] as WorkItem[]
        }));
        
        // Create a map for quick lookup
        const itemMap = new Map<string, any>();
        allItems.forEach(item => itemMap.set(item.id, item));
        
        // Build the hierarchical structure
        const topLevelItems: WorkItem[] = [];
        
        allItems.forEach(item => {
            if (item.parentId) {
                // This is a subitem, add it to its parent's subitems
                const parent = itemMap.get(item.parentId);
                if (parent) {
                    parent.subitems.push(item);
                }
            } else {
                // This is a top-level item
                topLevelItems.push(item);
            }
        });
        
        // Clean up: remove parentId and empty subitems arrays
        function cleanItem(item: any): WorkItem {
            const cleaned: WorkItem = {
                id: item.id,
                title: item.title,
                verdict: item.verdict,
                estimate: item.estimate,
                description: item.description
            };
            
            if (item.estimateExplanation) {
                cleaned.estimateExplanation = item.estimateExplanation;
            }
            
            if (item.subitems && item.subitems.length > 0) {
                cleaned.subitems = item.subitems.map(cleanItem);
            }
            
            return cleaned;
        }
        
        return topLevelItems.map(cleanItem);
        
    } catch (error) {
        console.error('Error reading work items from database:', error);
        throw new Error(`Failed to read work items from database: ${error}`);
    }
}

async function testDb(sql: any) {
    const result = await sql`SELECT * FROM workitems`;
    console.log('Data from workitems:', result);
}

async function createDbConnection() {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`);
        return sql;
    } catch (error) {
        console.error('Error creating database connection:', error);
        throw new Error(`Failed to create database connection: ${error}`);
    }
}



export async function loadJsonDB(): Promise<WorkItem[]> {
    const sql = await createDbConnection();
    return await readWorkItemsFromDb(sql);
}

/**
 * Updates a single work item in the database
 * Ignores id (used for WHERE clause) and subitems fields
 * @param workItem The work item to update
 * @returns Promise<void>
 */
export async function saveJsonDB(workItem: WorkItem): Promise<void> {
    try {
        const sql = await createDbConnection();
        
        await sql`
            UPDATE workitems 
            SET 
                title = ${workItem.title},
                verdict = ${workItem.verdict},
                estimate = ${workItem.estimate},
                description = ${workItem.description},
                estimate_explanation = ${workItem.estimateExplanation || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${workItem.id}
        `;
        
        console.log(`Successfully updated work item ${workItem.id}`);
    } catch (error) {
        console.error('Error updating work item:', error);
        throw new Error(`Failed to update work item ${workItem.id}: ${error}`);
    }
}

async function main() {
    const sql = await createDbConnection();
    //await insertWorkItemsToDb(sql, await readWorkItemsFromJson());
    //await testDb(sql);
    const workItems = await readWorkItemsFromDb(sql);
    console.log('Work items from database:', workItems);
}

// Only run main if this file is executed directly (not imported)
if (import.meta.main) {
    main().catch((error) => {
        console.error('Error in main function:', error);
    });
}