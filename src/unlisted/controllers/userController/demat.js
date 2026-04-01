
import pool from "../../../config/db.js"
export const addDematAccount = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    let { dp_id, client_id, depository, demat_name } = req.body;

    // Trim inputs
    dp_id = dp_id?.toString().trim();
    client_id = client_id?.toString().trim();
    depository = depository?.toString().trim();
    demat_name = demat_name?.toString().trim();

    if (!dp_id || !client_id || !depository || !demat_name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    await client.query("BEGIN");

    // Check if user already added demat
    const existingUserDemat = await client.query(
      "SELECT id FROM tbl_cus_demat_accounts WHERE user_id = $1",
      [userId]
    );

    if (existingUserDemat.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Demat account already added for this user"
      });
    }

    // Optional: Prevent duplicate DP + Client combination globally
    const duplicateAccount = await client.query(
      `SELECT id FROM tbl_cus_demat_accounts 
       WHERE dp_id = $1 AND client_id = $2`,
      [dp_id, client_id]
    );

    if (duplicateAccount.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "This Demat account already exists"
      });
    }

    await client.query(
      `INSERT INTO tbl_cus_demat_accounts
       (user_id, dp_id, client_id, depository, demat_name, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [userId, dp_id, client_id, depository, demat_name]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Demat details saved successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ADD DEMAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save demat details"
    });
  } finally {
    client.release();
  }
};

export const getDematAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        id,
        user_id,
        dp_id,
        client_id,
        depository,
        demat_name,
        created_at
      FROM tbl_cus_demat_accounts
      WHERE user_id = $1
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Demat account not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error("ADMIN GET DEMAT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch demat details"
    });
  }
};