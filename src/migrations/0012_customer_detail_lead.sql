-- 📌 Table: tbl_customers
CREATE TABLE tbl_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (mobile)
);

-- 📌 Table: tbl_customer_detail_leads
CREATE TABLE tbl_customer_detail_leads (
  id SERIAL PRIMARY KEY,
  customer_detail_lead_id VARCHAR(30) UNIQUE NOT NULL,
  customer_id INT NOT NULL REFERENCES tbl_customers(id),
  rm_id INT,                 -- assigned RM
  department_head_id INT,
  department VARCHAR(100) NOT NULL,
  product_type VARCHAR(100) NOT NULL,
  sub_category VARCHAR(200) NOT NULL,
  lead_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(30) DEFAULT 'INCOMING_LEAD',
  form_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--📌 Uploaded Documents
CREATE TABLE tbl_customer_detail_lead_documents (
  id SERIAL PRIMARY KEY,
  customer_detail_lead_id INT REFERENCES tbl_customer_detail_leads(id),
  document_key VARCHAR(50) NOT NULL,
  document_label VARCHAR(150),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📌 Required Documents
CREATE TABLE tbl_customer_detail_lead_required_documents (
  id SERIAL PRIMARY KEY,
  customer_detail_lead_db_id INT NOT NULL
    REFERENCES tbl_customer_detail_leads(id)
    ON DELETE CASCADE,
  document_key VARCHAR(50) NOT NULL,
  document_label VARCHAR(150) NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  uploaded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (customer_detail_lead_db_id, document_key)
);
