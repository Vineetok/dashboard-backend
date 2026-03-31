CREATE TABLE IF NOT EXISTS tbl_career_applications (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    current_city VARCHAR(100) NOT NULL,
    total_experience VARCHAR(20) NOT NULL,
    notice_period VARCHAR(20) NOT NULL,
    current_ctc DECIMAL(10,2) NOT NULL,
    expected_ctc DECIMAL(10,2) NOT NULL,
    linkedin_url TEXT,
    applying_for VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'Applied',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
