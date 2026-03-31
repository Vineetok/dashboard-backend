import pool from '../../../config/db.js';

export const getWishlistById = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM tbl_wishlist
       WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Get Wishlist By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist item"
    });
  }
};