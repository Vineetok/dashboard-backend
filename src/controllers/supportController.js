import pool from "../config/db.js";
import { generateTicketId } from "../utils/generateTicketId.js";

// 🔹 Create Support Ticket
export const createSupportTicket = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { category, subject, description } = req.body;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized. User not found." });

    if (!category || !subject || !description)
      return res.status(400).json({ message: "All fields are required." });

    // Fetch user info
    const { rows: users } = await pool.query(
      "SELECT name, email, mobile FROM tbl_registeredusers WHERE id = $1",
      [userId]
    );

    if (users.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = users[0];

    // Generate ticket ID
    const ticket_id = generateTicketId();

    const insertQuery = `INSERT INTO tbl_support_tickets (ticket_id, user_id, name, email, mobile, category, subject, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, ticket_id, name, category, subject, description, status, created_at;`;

    const { rows } = await pool.query(insertQuery, [
      ticket_id,
      userId,
      user.name,
      user.email,
      user.mobile,
      category,
      subject,
      description,
    ]);

    return res.status(201).json({
      message: "Support ticket submitted successfully.",
      ticket: rows[0],
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 🔹 Get all tickets for logged-in user
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query = `
      SELECT ticket_id, name, category, subject, description, status, admin_solution,
      solved_at, created_at
      FROM tbl_support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return res.status(200).json({
      message: "Tickets fetched successfully.",
      tickets: rows,
    });
  } catch (err) {
    console.error("Fetch User Tickets Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
