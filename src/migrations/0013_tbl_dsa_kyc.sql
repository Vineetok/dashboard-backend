CREATE TABLE
  tbl_dsa_kyc (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES tbl_registeredusers (id) ON DELETE CASCADE,
    bank_name VARCHAR(150),
    bank_account_number VARCHAR(30),
    ifsc_code VARCHAR(15),
    bank_verified BOOLEAN DEFAULT FALSE,
    aadhaar_number VARCHAR(12),
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    gst_number VARCHAR(15),
    gst_verified BOOLEAN DEFAULT FALSE,
    kyc_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_image_key TEXT,
    profile_image_url TEXT,
    aadhaar_kyc_data JSONB,
    gst_kyc_data JSONB,
    phone_number VARCHAR(12),
    phone_verified BOOLEAN DEFAULT FALSE,
    pan_aadhaar_linked BOOLEAN DEFAULT FALSE
  );
