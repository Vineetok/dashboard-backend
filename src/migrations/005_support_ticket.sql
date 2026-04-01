CREATE TABLE
    IF NOT EXISTS tbl_support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(30) UNIQUE NOT NULL,
        user_id INT NOT NULL REFERENCES tbl_registeredusers (id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        admin_solution TEXT,
        admin_id INT REFERENCES tbl_registeredusers (id) ON DELETE SET NULL,
        solved_at TIMESTAMP,
    );