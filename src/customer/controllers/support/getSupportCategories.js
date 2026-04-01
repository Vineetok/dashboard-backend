import pool from "../../../config/db.js";

export const getSupportCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        category_name
      FROM tbl_support_categories
      WHERE is_active = true
      ORDER BY category_name ASC
      `
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch support categories"
    });
  }
};