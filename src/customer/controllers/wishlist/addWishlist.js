import pool from '../../../config/db.js';
import * as mfApiService from '../../../services/mfApiService.js';

export const addWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      product_type,
      product_id,
      product_name
    } = req.body;

    console.log("Wishlist Add Request - Type:", product_type, "ID:", product_id, "Name:", product_name);

    // ✅ Check if already exists
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

    // ===========================
    // ✅ UNLISTED SHARE
    // ===========================
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

      if (product) {
        product.product_name = product.shares_name;
      }
    }

    // ===========================
    // ✅ MUTUAL FUND (NO EXTERNAL API)
    // ===========================
    else if (product_type === "mutual_fund") {
      const { nav, risk } = req.body;

      // ✅ Store minimal data (NO API CALL)
      product = {
        product_name: product_name || "Mutual Fund",
        scheme_code: product_id,
        nav: nav || null,
        risk: risk || null,
        is_fallback: true
      };
    }

    // ===========================
    // ❌ PRODUCT NOT FOUND
    // ===========================
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // ===========================
    // ✅ INSERT INTO DB
    // ===========================
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
        product.product_name,
        JSON.stringify(product)
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