CREATE TABLE tbl_cus_demat_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES tbl_registeredusers(id) ON DELETE CASCADE,
    dp_id VARCHAR(20) NOT NULL,
    client_id VARCHAR(20) NOT NULL,
    depository VARCHAR(10) CHECK (depository IN ('NSDL','CDSL')),
    demat_name VARCHAR(150) NOT NULL,
    demat_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE tbl_cus_demat_accounts  
ADD CONSTRAINT unique_demat UNIQUE (dp_id, client_id);
