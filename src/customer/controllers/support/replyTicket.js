import pool from "../../../config/db.js";

export const replyTicket = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { ticket_id, message } = req.body;

    if (!ticket_id || !message) {
      return res.status(400).json({
        success: false,
        message: "ticket_id and message are required"
      });
    }

    // Check ticket exists
    const ticketCheck = await pool.query(
      `
      SELECT *
      FROM tbl_cus_support_tickets
      WHERE ticket_id = $1
      `,
      [ticket_id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Prevent reply if ticket closed
    if (ticketCheck.rows[0].status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reply to closed ticket"
      });
    }

    // Insert reply
    const result = await pool.query(
      `
      INSERT INTO tbl_ticket_messages
      (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [
        ticket_id,
        "customer",
        user_id,
        message
      ]
    );

    // Update ticket updated_at
    await pool.query(
      `
      UPDATE tbl_cus_support_tickets
      SET updated_at = NOW()
      WHERE ticket_id = $1
      `,
      [ticket_id]
    );

    return res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Reply Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};