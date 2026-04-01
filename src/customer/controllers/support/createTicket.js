import pool from "../../../config/db.js";

const generateTicketId = () => {
  const now = new Date();
  return `FTX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const createSupportTicket = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const {
      category,
      product_type,
      reference_id,
      issue_type,
      severity,
      subject,
      description
    } = req.body;

    if (!category || !product_type || !issue_type || !subject || !description) {
      return res.status(400).json({
        status: false,
        message: "Required fields missing"
      });
    }

    const ticket_id = generateTicketId();

    const result = await pool.query(
      `
      INSERT INTO tbl_cus_support_tickets 
      (
        ticket_id,
        customer_id,
        category,
        product_type,
        reference_id,
        issue_type,
        severity,
        subject,
        description
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        ticket_id,
        customer_id,
        category,
        product_type,
        reference_id || null,
        issue_type,
        severity || "Medium",
        subject,
        description
      ]
    );

    return res.status(201).json({
      status: true,
      message: "Ticket created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};