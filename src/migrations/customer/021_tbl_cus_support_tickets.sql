CREATE TABLE tbl_cus_support_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(30) UNIQUE NOT NULL,

    customer_id BIGINT REFERENCES tbl_registeredusers(id) ON DELETE CASCADE,

    category VARCHAR(100) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    reference_id VARCHAR(100),
    issue_type VARCHAR(100) NOT NULL,

    severity VARCHAR(20) DEFAULT 'Medium',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    status VARCHAR(20) DEFAULT 'Open',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_ticket_customer_id 
ON tbl_cus_support_tickets(customer_id);

CREATE INDEX idx_support_ticket_ticket_id 
ON tbl_cus_support_tickets(ticket_id);

CREATE INDEX idx_support_ticket_status 
ON tbl_cus_support_tickets(status);