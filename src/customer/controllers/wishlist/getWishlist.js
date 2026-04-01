import pool from '../../../config/db.js';

export const getWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        id,
        product_type,
        product_id,
        product_name,
        product_data,
        created_at
      FROM tbl_wishlist
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist"
    });
  }
};