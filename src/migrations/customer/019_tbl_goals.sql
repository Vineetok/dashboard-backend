CREATE TABLE tbl_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,

    goal_name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
    target_years INTEGER NOT NULL CHECK (target_years > 0),
    expected_return NUMERIC(5,2) NOT NULL CHECK (expected_return >= 0),
    current_savings NUMERIC(15,2) DEFAULT 0 CHECK (current_savings >= 0),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_goal_user 
    FOREIGN KEY (user_id)
    REFERENCES tbl_registeredusers(id)
    ON DELETE CASCADE
);