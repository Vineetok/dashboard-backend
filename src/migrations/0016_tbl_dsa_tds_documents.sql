CREATE TABLE
    IF NOT EXISTS tbl_dsa_tds (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES tbl_registeredusers (id) ON DELETE CASCADE,
        adv_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        pan VARCHAR(10) UNIQUE,
        q1_count INT DEFAULT 0,
        q2_count INT DEFAULT 0,
        q3_count INT DEFAULT 0,
        q_total INT DEFAULT 0,
        q1_pdf_url TEXT,
        q2_pdf_url TEXT,
        q3_pdf_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id)
    );