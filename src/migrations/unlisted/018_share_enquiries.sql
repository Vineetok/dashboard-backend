CREATE TABLE IF NOT EXISTS tbl_share_enquiries (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES tbl_shares(id) ON DELETE CASCADE,
    enquiry_type VARCHAR(10) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 5000,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Indexes (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_share_enquiries_company_id
ON tbl_share_enquiries(company_id);

CREATE INDEX IF NOT EXISTS idx_share_enquiries_created_at
ON tbl_share_enquiries(created_at);

CREATE INDEX IF NOT EXISTS idx_share_enquiries_enquiry_type
ON tbl_share_enquiries(enquiry_type);

