import pool from '../../../config/db.js';
import bcrypt from 'bcrypt';

/* ===============================
   GET USER PROFILE
================================= */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {rows} = await pool.query (
      `SELECT id, name, email,mobile
       FROM tbl_registeredusers
       WHERE id = $1`,
      [userId]
    );

    if (!rows.length) {
      return res.status (404).json ({
        success: false,
        message: 'User not found',
      });
    }

    res.status (200).json ({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error ('Get Profile Error:', error);
    res.status (500).json ({
      success: false,
      message: 'Internal server error',
    });
  }
};

/* ===============================
   UPDATE PROFILE (NO IMAGE)
================================= */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let {name, mobile} = req.body;

    if (!name && !mobile) {
      return res.status (400).json ({
        success: false,
        message: 'At least one field (name or mobile) is required',
      });
    }

    if (name) {
      name = name.trim ();
      if (name.length < 3) {
        return res.status (400).json ({
          success: false,
          message: 'Name must be at least 3 characters',
        });
      }
    }

    if (mobile) {
      mobile = mobile.trim ();

      // Basic mobile validation (10 digits)
      const mobileRegex = /^[0-9]{10}$/;

      if (!mobileRegex.test (mobile)) {
        return res.status (400).json ({
          success: false,
          message: 'Invalid mobile number format',
        });
      }

      const mobileCheck = await pool.query (
        `SELECT id FROM tbl_registeredusers 
         WHERE mobile = $1 AND id != $2`,
        [mobile, userId]
      );

      if (mobileCheck.rows.length > 0) {
        return res.status (400).json ({
          success: false,
          message: 'Mobile number already exists',
        });
      }
    }

    const result = await pool.query (
      `UPDATE tbl_registeredusers
       SET name = COALESCE($1, name),
           mobile = COALESCE($2, mobile),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, mobile`,
      [name || null, mobile || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status (404).json ({
        success: false,
        message: 'User not found',
      });
    }

    return res.status (200).json ({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error ('Update Profile Error:', error);
    return res.status (500).json ({
      success: false,
      message: 'Internal server error',
    });
  }
};

/* ===============================
   CHANGE PASSWORD
================================= */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    let {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
      return res.status (400).json ({
        success: false,
        message: 'Both current and new password are required',
      });
    }

    currentPassword = currentPassword.trim ();
    newPassword = newPassword.trim ();

    if (newPassword.length < 6) {
      return res.status (400).json ({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    if (currentPassword === newPassword) {
      return res.status (400).json ({
        success: false,
        message: 'New password cannot be same as current password',
      });
    }

    const user = await pool.query (
      `SELECT password FROM tbl_registeredusers WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status (404).json ({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare (
      currentPassword,
      user.rows[0].password
    );

    if (!isMatch) {
      return res.status (400).json ({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash (newPassword, 12);

    await pool.query (
      `UPDATE tbl_registeredusers
       SET password = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.status (200).json ({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error ('Change Password Error:', error);
    return res.status (500).json ({
      success: false,
      message: 'Internal server error',
    });
  }
};

// /* ===============================
//    DELETE ACCOUNT
// ================================= */
// export const deleteAccount = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const {
//       rowCount,
//     } = await pool.query (`DELETE FROM tbl_registeredusers WHERE id = $1`, [
//       userId,
//     ]);

//     if (!rowCount) {
//       return res.status (404).json ({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     res.status (200).json ({
//       success: true,
//       message: 'Account deleted successfully',
//     });
//   } catch (error) {
//     console.error ('Delete Account Error:', error);
//     res.status (500).json ({
//       success: false,
//       message: 'Internal server error',
//     });
//   }
// };
