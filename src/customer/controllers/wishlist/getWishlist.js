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
    // ✅ STEP 2: Get MF items
    // ===========================
    const mfItems = wishlist.filter(
      item => item.product_type === "mutual_fund"
    );

    // ===========================
    // ✅ STEP 3: Fetch latest NAV
    // ===========================
    const navMap = {};

    await Promise.all(
      mfItems.map(async (item) => {
        try {
          const data = await mfApiService.getNav(item.product_id);

          navMap[item.product_id] = {
            nav: data?.nav,
            date: data?.date
          };
        } catch (err) {
          console.error("NAV fetch failed:", item.product_id);
        }
      })
    );

    // ===========================
    // ✅ STEP 4: Merge NAV into wishlist
    // ===========================
    wishlist = wishlist.map(item => {
      if (item.product_type === "mutual_fund") {
        const fresh = navMap[item.product_id];

        return {
          ...item,
          product_data: {
            ...item.product_data,
            nav: fresh?.nav || item.product_data.nav,
            nav_date: fresh?.date || item.product_data.nav_date
          }
        };
      }
      return item;
    });

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