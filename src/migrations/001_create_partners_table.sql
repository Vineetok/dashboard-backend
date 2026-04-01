CREATE TABLE
  IF NOT EXISTS tbl_registeredusers (
    id SERIAL PRIMARY KEY,
    adv_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    pan VARCHAR(10) UNIQUE DEFAULT 'NA',
    city VARCHAR(100) DEFAULT 'Other',
    head VARCHAR(100) DEFAULT 'Unspecified',
    category VARCHAR(800) DEFAULT 'Unspecified',
    password VARCHAR(128) NOT NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'DSA',
    department VARCHAR(100) DEFAULT 'NA',
    sub_category VARCHAR(200) DEFAULT 'NA',
    referral_code VARCHAR(20) UNIQUE,
    referred_by_rm INT REFERENCES tbl_registeredusers (id) ON DELETE SET NULL,
    pan_verified BOOLEAN DEFAULT FALSE,
    state VARCHAR(100) DEFAULT 'Other',
    entity_type VARCHAR(20) NOT NULL DEFAULT 'Individual',
    email_verified BOOLEAN DEFAULT FALSE
  );

ALTER TABLE tbl_registeredusers ADD CONSTRAINT chk_entity_type CHECK (entity_type IN ('Individual', 'Non-Individual'));
