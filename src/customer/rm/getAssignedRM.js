import pool from "../../config/db.js";

export const getAssignedRM = async (req, res) => {
  try {
    const customerId = req.user.id;

    /* FETCH ALL RMs */
    const rmResult = await pool.query(`
      SELECT id, name, email, mobile
      FROM tbl_registeredusers
      WHERE role = 'RM'
      ORDER BY id ASC
    `);

    const rms = rmResult.rows;

    if (!rms.length) {
      return res.status(400).json({
        success: false,
        message: "No RM available"
      });
    }

    /* COUNT CUSTOMER POSITION */
    const customerResult = await pool.query(`
      SELECT id
      FROM tbl_registeredusers
      WHERE role = 'CUSTOMER'
      ORDER BY id ASC
    `);

    const customers = customerResult.rows;

    const customerIndex = customers.findIndex(
      customer => customer.id === customerId
    );

    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    /* LOOP RM ASSIGN */
    const assignedRM = rms[customerIndex % rms.length];

    return res.status(200).json({
      success: true,
      data: assignedRM
    });

  } catch (error) {
    console.error("Assigned RM Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};