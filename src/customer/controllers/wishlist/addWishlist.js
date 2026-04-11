import pool from '../../../config/db.js';
import * as mfApiService from '../../../services/mfApiService.js';

export const addWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      product_type,
      product_id
    } = req.body;

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
    // ✅ MUTUAL FUND (FIXED)
    // ===========================
    else if (product_type === "mutual_fund") {
      const details = await mfApiService.getFullFundDetails(product_id);

      // ❌ If API fails or invalid
      if (!details || !details.meta) {
        return res.status(404).json({
          success: false,
          message: "Mutual fund not found"
        });
      }

      const latestNav = details.data?.[0];

      // ✅ Normalize structure (IMPORTANT)
      product = {
        product_name: details.meta.scheme_name,
        scheme_code: product_id,

        nav: latestNav?.nav || null,
        nav_date: latestNav?.date || null,

        fund_house: details.meta.fund_house || null,
        scheme_type: details.meta.scheme_type || null,
        scheme_category: details.meta.scheme_category || null,

        category: details.meta.category,
        type: details.meta.type,
        risk: details.meta.risk,
        riskWidth: details.meta.riskWidth
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