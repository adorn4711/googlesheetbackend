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

