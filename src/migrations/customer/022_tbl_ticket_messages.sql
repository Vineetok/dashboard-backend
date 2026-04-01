CREATE TABLE tbl_ticket_messages (
    id SERIAL PRIMARY KEY,

    ticket_id VARCHAR(30) NOT NULL,

    sender_type VARCHAR(20) NOT NULL,

    sender_id INT,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);