CREATE TABLE workitems (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  verdict VARCHAR(10) NOT NULL CHECK (verdict IN ('yes', 'no', 'maybe')),
  estimate INTEGER NOT NULL,
  description TEXT NOT NULL,
  estimate_explanation TEXT,
  parent_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES workitems(id) ON DELETE CASCADE
);

CREATE INDEX idx_parent_id ON workitems(parent_id);