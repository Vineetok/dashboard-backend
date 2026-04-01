CREATE TABLE tbl_dsa_agreements (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES tbl_registeredusers(id),
  external_uuid TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);