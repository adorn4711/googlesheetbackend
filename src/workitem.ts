// Work Item structure
export interface WorkItem {
  id: string;
  title: string;
  verdict: 'yes' | 'no' | 'maybe';
  estimate: number
  description: string;
  estimateExplanation?: string;
  subitems?: WorkItem[];
}

export interface WorkItem_with_parent {
  id: string;
  title: string;
  verdict: 'yes' | 'no' | 'maybe';
  estimate: number
  description: string;
  estimateExplanation?: string;
  subitems?: WorkItem_with_parent[];
  parentId?: string;
}
