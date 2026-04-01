import pool from "../../../config/db.js";

export const getTicketDetails = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const ticket = await pool.query(
      `
      SELECT *
      FROM tbl_cus_support_tickets
      WHERE ticket_id = $1
      `,
      [ticket_id]
    );

    if (ticket.rows.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found"
      });
    }

    const messages = await pool.query(
      `
      SELECT *
      FROM tbl_ticket_messages
      WHERE ticket_id = $1
      ORDER BY created_at ASC
      `,
      [ticket_id]
    );

    return res.json({
      status: true,
      ticket: ticket.rows[0],
      messages: messages.rows
    });

  } catch (error) {
    console.error("Ticket Details Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};