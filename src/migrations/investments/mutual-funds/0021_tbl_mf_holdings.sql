CREATE TABLE tbl_mf_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_registeredusers(id) ON DELETE CASCADE,
    
    scheme_code VARCHAR(20) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    
    total_units NUMERIC(18, 4) DEFAULT 0,
    invested_value NUMERIC(18, 2) DEFAULT 0,        -- Total historical cost
    average_nav NUMERIC(18, 4) DEFAULT 0,           -- Average cost per unit
    
    last_updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, scheme_code)
);
CREATE INDEX idx_mf_holdings_user_id ON tbl_mf_holdings(user_id);
