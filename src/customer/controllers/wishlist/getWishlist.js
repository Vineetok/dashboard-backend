import pool from '../../../config/db.js';

export const getWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT *
       FROM tbl_wishlist
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      total: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Get Wishlist Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist"
    });
  }
};