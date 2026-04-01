CREATE TABLE IF NOT EXISTS tbl_unlisted_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES tbl_registeredusers(id) ON DELETE CASCADE,
    share_id INT REFERENCES tbl_shares(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    type VARCHAR(10) NOT NULL, -- BUY / SELL
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
