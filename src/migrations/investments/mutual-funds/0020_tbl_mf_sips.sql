CREATE TABLE tbl_mf_sips (
    id SERIAL PRIMARY KEY,
    
    user_id INTEGER NOT NULL 
        REFERENCES tbl_registeredusers(id) 
        ON DELETE CASCADE,

    scheme_code VARCHAR(20) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,

    amount NUMERIC(18, 2) NOT NULL,


    frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',

    installment_day INTEGER NOT NULL,

    next_installment_date DATE,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);