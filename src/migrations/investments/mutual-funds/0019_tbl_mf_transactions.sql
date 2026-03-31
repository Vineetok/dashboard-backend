
CREATE TABLE tbl_mf_transactions (
    id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES tbl_registeredusers(id) ON DELETE CASCADE,
    
   
    scheme_code VARCHAR(20) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    
   
    transaction_type VARCHAR(20) NOT NULL, 
    amount NUMERIC(18, 2) NOT NULL,        
    units NUMERIC(18, 4),                  
    nav NUMERIC(18, 4),                    
    
   
    status VARCHAR(20) DEFAULT 'PENDING',  
    folio_number VARCHAR(50),              
    transaction_date TIMESTAMP DEFAULT NOW(),
    
   
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE INDEX idx_mf_user_id ON tbl_mf_transactions(user_id);
CREATE INDEX idx_mf_scheme_code ON tbl_mf_transactions(scheme_code);
CREATE INDEX idx_mf_status ON tbl_mf_transactions(status);


COMMENT ON COLUMN tbl_mf_transactions.transaction_type IS 'Type of mutual fund transaction: BUY, SELL, SIP, REDEEM';
COMMENT ON COLUMN tbl_mf_transactions.status IS 'Current state of the transaction: PENDING, COMPLETED, FAILED, CANCELLED';
