CREATE TABLE tbl_support_categories (
    id SERIAL PRIMARY KEY,

    category_name VARCHAR(100) UNIQUE NOT NULL,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO tbl_support_categories (category_name)
VALUES
('Transaction Issue'),
('Investment Issue'),
('KYC Verification'),
('Payment Failure'),
('Portfolio Mismatch'),
('Redemption Delay'),
('Account Security'),
('Tax Statement'),
('Research Access');

