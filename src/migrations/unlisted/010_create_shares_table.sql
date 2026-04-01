CREATE TABLE tbl_shares (
    id SERIAL PRIMARY KEY,
    shares_name VARCHAR(255) NOT NULL UNIQUE,      
    logo_url VARCHAR(500),                         
    price NUMERIC(18,2) NOT NULL,                 
    depository_applicable VARCHAR(50),           
    min_lot_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE tbl_shares
ALTER COLUMN shares_name TYPE CITEXT;

ALTER TABLE tbl_shares
ADD CONSTRAINT unique_share_name UNIQUE (shares_name);

ALTER TABLE tbl_shares
ADD COLUMN is_active BOOLEAN DEFAULT true;

ALTER TABLE tbl_shares DROP COLUMN is_active;

ALTER TABLE tbl_shares 
ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

ALTER TABLE tbl_shares
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true; 
