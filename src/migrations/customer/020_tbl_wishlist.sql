CREATE TABLE tbl_wishlist (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL 
        REFERENCES tbl_registeredusers(id) 
        ON DELETE CASCADE,

    product_type VARCHAR(50) NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_data JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, product_type, product_id)
);