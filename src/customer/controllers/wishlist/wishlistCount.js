import pool from '../../../config/db.js';

export const wishlistCount = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) FROM tbl_wishlist WHERE user_id = $1`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      count: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error("Wishlist Count Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist count"
    });
  }
};