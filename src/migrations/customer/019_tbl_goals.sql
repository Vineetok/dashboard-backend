CREATE TABLE tbl_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,

    goal_name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    target_years INTEGER NOT NULL,
    expected_return NUMERIC(5,2) NOT NULL,
    current_savings NUMERIC(15,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tbl_goals
ADD CONSTRAINT fk_goal_user
FOREIGN KEY (user_id)
REFERENCES tbl_registeredusers(id)
ON DELETE CASCADE;

ALTER TABLE tbl_goals
ADD CONSTRAINT chk_target_amount
CHECK (target_amount > 0);

ALTER TABLE tbl_goals
ADD CONSTRAINT chk_target_years
CHECK (target_years > 0);

ALTER TABLE tbl_goals
ADD CONSTRAINT chk_expected_return
CHECK (expected_return >= 0);

ALTER TABLE tbl_goals
ADD CONSTRAINT chk_current_savings
CHECK (current_savings >= 0);