CREATE TABLE
    tbl_referral_leads (
        id SERIAL PRIMARY KEY,
        ref_id VARCHAR(20) UNIQUE NOT NULL,
        dsa_id INT NOT NULL REFERENCES tbl_registeredusers (id),
        rm_id INT REFERENCES tbl_registeredusers (id),
        lead_name VARCHAR(150) NOT NULL,
        contact_number VARCHAR(15) NOT NULL,
        email VARCHAR(255),
        department VARCHAR(100) NOT NULL,
        sub_category VARCHAR(200) NOT NULL,
        notes TEXT,
        status VARCHAR(30) DEFAULT 'NEW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        department_head_id INT REFERENCES tbl_registeredusers (id),
        assigned_rm_id INT REFERENCES tbl_registeredusers (id),
        referral_lead_status VARCHAR(30) DEFAULT 'SUBMITTED',
        rejection_note TEXT,
    );