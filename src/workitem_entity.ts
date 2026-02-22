// Work Item structure
export interface WorkItem_Entity {
  id: string;
  title: string;
  verdict: 'yes' | 'no' | 'maybe';
  estimate: number
  description: string;
  estimate_explanation?: string;
  parent_id?: string;
}

