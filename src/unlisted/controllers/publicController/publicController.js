import pool from "../../../config/db.js";

// ✅ Get all corporate actions
export const getCorporateActions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ca.id, s.shares_name, ca.title, ca.description, ca.type,
             ca.source, ca.source_url, ca.action_date
      FROM tbl_corporate_actions ca
      JOIN tbl_shares s ON s.id = ca.share_id
      ORDER BY ca.action_date DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("❌ Corporate Actions API Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Corporate Actions By Share
export const getCorporateActionsByShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const result = await pool.query(`
      SELECT ca.id, s.shares_name, ca.title, ca.description, ca.type,
             ca.source, ca.source_url, ca.action_date
      FROM tbl_corporate_actions ca
      JOIN tbl_shares s ON s.id = ca.share_id
      WHERE ca.share_id = $1
      ORDER BY ca.action_date DESC
    `, [shareId]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("❌ Error fetching share actions:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Corporate Actions By Type
export const getCorporateActionsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const result = await pool.query(`
      SELECT ca.id, s.shares_name, ca.title, ca.description, ca.type,
             ca.source, ca.source_url, ca.action_date
      FROM tbl_corporate_actions ca
      JOIN tbl_shares s ON s.id = ca.share_id
      WHERE ca.type = $1
      ORDER BY ca.action_date DESC
    `, [type.toUpperCase()]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("❌ Error fetching type actions:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};












