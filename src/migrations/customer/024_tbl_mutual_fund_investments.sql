CREATE TABLE IF NOT EXISTS tbl_mutual_fund_investments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES tbl_registeredusers(id) ON DELETE CASCADE,
    scheme_code VARCHAR(100),
    fund_name VARCHAR(255) NOT NULL,
    units DECIMAL(18, 4) NOT NULL,
    nav_at_investment DECIMAL(18, 4) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    invested_date DATE DEFAULT CURRENT_DATE,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
