CREATE TABLE IF NOT EXISTS tbl_cibil_requests (
    id SERIAL PRIMARY KEY,              
    request_id SERIAL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    cibil_score INT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gender VARCHAR(10) NOT NULL,
    raw_report JSONB
);