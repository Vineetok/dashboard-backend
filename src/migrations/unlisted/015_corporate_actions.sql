CREATE TABLE tbl_corporate_actions (
    id SERIAL PRIMARY KEY,
    share_id INTEGER REFERENCES tbl_shares(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (
        type IN ('ARTICLE', 'PRESS', 'REPORT', 'BONUS', 'SPLIT', 'DIVIDEND')
    ),
    source VARCHAR(255),          
    source_url TEXT,
    action_date DATE,
    record_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tbl_corporate_actions
ADD CONSTRAINT unique_title UNIQUE (title);

CREATE INDEX idx_corporate_share ON tbl_corporate_actions(share_id);

CREATE INDEX idx_corporate_type ON tbl_corporate_actions(type);

CREATE INDEX idx_corporate_created_at ON tbl_corporate_actions(created_at DESC);
