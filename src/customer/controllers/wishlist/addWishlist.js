import pool from '../../../config/db.js';

export const addWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      product_type,
      product_id,
      product_name
    } = req.body;

    const existing = await pool.query(
      `SELECT * FROM tbl_wishlist
       WHERE user_id = $1 AND product_type = $2 AND product_id = $3`,
      [user_id, product_type, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Already added to wishlist"
      });
    }

    const result = await pool.query(
      `INSERT INTO tbl_wishlist
       (user_id, product_type, product_id, product_name)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [user_id, product_type, product_id, product_name]
    );

    res.status(201).json({
      success: true,
      message: "Added to wishlist successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Add Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add wishlist"
    });
  }
};