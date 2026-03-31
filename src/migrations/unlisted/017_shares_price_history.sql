CREATE TABLE IF NOT EXISTS tbl_share_price_history (
    id SERIAL PRIMARY KEY,
    share_id INT NOT NULL REFERENCES tbl_shares(id) ON DELETE CASCADE,
    price NUMERIC(18,2) NOT NULL CHECK (price >= 0),
    price_date DATE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_share_price_date UNIQUE (share_id, price_date)
);

CREATE INDEX idx_share_price_history_share_id
ON tbl_share_price_history (share_id);

CREATE INDEX idx_share_price_history_price_date
ON tbl_share_price_history(price_date);

ALTER TABLE tbl_share_price_history
ADD CONSTRAINT unique_share_date UNIQUE (share_id, price_date);

SELECT COUNT(*) 
FROM tbl_share_price_history
WHERE share_id = 1
AND price_date >= CURRENT_DATE - INTERVAL '1 year';