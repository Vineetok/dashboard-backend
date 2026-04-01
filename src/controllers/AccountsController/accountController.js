import pool from "../../config/db.js"

// 🔹 GET DEPARTMENT HEAD PROFILE
export const getAccountsProfile = async (req, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
  
      // 🔐 Role check
      if (!userRole || userRole !== "ACCOUNTS") {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }
  
      const query = `
        SELECT 
          name,
          email,
          mobile,
          role,
          department,
          sub_category,
          city,
          date_joined,
          updated_at
        FROM tbl_registeredusers
        WHERE id = $1 AND role = 'ACCOUNTS'
        LIMIT 1;
      `;
  
      const { rows } = await pool.query(query, [userId]);
  
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department Head profile not found.",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Profile fetched successfully.",
        user: rows[0],
      });
    } catch (error) {
      console.error("Department Head Profile Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };
  