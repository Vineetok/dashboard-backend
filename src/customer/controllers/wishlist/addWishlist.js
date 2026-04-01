import pool from '../../../config/db.js';

export const addWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      product_type,
      product_id
    } = req.body;

    const existing = await pool.query(
      `
      SELECT * FROM tbl_wishlist
      WHERE user_id = $1 AND product_type = $2 AND product_id = $3
      `,
      [user_id, product_type, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Already added to wishlist"
      });
    }

    let product = null;

    if (product_type === "unlisted_share") {
      const share = await pool.query(
        `
        SELECT *
        FROM tbl_shares
        WHERE id = $1
        `,
        [product_id]
      );

      product = share.rows[0];
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO tbl_wishlist
      (
        user_id,
        product_type,
        product_id,
        product_name,
        product_data
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        user_id,
        product_type,
        product_id,
        product.shares_name,
        product
      ]
    );

    res.status(201).json({
      success: true,
      message: "Added to wishlist successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to add wishlist"
    });
  }
};