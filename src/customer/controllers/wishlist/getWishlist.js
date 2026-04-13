import pool from '../../../config/db.js';
import * as mfApiService from '../../../services/mfApiService.js';

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

    let wishlist = result.rows;

    // ===========================
    // ✅ STEP 1: Parse JSON safely
    // ===========================
    wishlist = wishlist.map(item => ({
      ...item,
      product_data:
        typeof item.product_data === "string"
          ? JSON.parse(item.product_data)
          : item.product_data
    }));



    // ===========================
    // ✅ STEP 3: Fetch latest NAV & Sync DB
    // ===========================
    await Promise.all(
      wishlist.map(async (item) => {
        if (item.product_type !== "mutual_fund") return;

        try {
          const freshData = await mfApiService.getNav(item.product_id);

          if (freshData && freshData.nav) {
            // Update in-memory item for immediate response
            item.product_data.nav = freshData.nav;
            item.product_data.nav_date = freshData.date;
            item.product_data.is_fallback = false;

            // ✅ Async DB Update (Don't await if you want max performance, but here we await inside Promise.all)
            await pool.query(
              `UPDATE tbl_wishlist SET product_data = $1 WHERE id = $2`,
              [JSON.stringify(item.product_data), item.id]
            );
          }
        } catch (err) {
          console.error(`Lazy update failed for ${item.product_id}:`, err.message);
        }
      })
    );

    // ===========================
    // ✅ RESPONSE
    // ===========================
    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      count: wishlist.length,
      data: wishlist
    });

  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist"
    });
  }
};