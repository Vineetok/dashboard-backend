import pool from "../../../config/db.js";

export const closeTicket = async (req, res) => {
  try {
    const { ticket_id } = req.body;

    if (!ticket_id) {
      return res.status(400).json({
        success: false,
        message: "ticket_id required"
      });
    }

    const existing = await pool.query(
      `
      SELECT * FROM tbl_cus_support_tickets
      WHERE ticket_id = $1
      `,
      [ticket_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    if (existing.rows[0].status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Ticket already closed"
      });
    }

    const result = await pool.query(
      `
      UPDATE tbl_cus_support_tickets
      SET status = 'Closed',
          updated_at = NOW()
      WHERE ticket_id = $1
      RETURNING *
      `,
      [ticket_id]
    );

    return res.json({
      success: true,
      message: "Ticket closed successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Close Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};