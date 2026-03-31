// import pool from '../../../config/db.js';

// /* ===========================
//    GET ALL ORDERS
// =========================== */
// export const getAllOrders = async (req, res) => {
//   try {
//     const result = await pool.query (`
//       SELECT 
//         o.id AS order_id,
//         u.name AS user_name,
//         c.name AS company_name,
//         o.quantity,
//         o.status,
//         o.created_at,
//         o.updated_at
//       FROM orders o
//       JOIN tbl_registeredusers u ON u.id = o.user_id
//       JOIN shares c ON c.id = o.shares_id
//       ORDER BY o.created_at DESC
//     `);
//     res.json (result.rows);
//   } catch (err) {
//     console.error (err);
//     res.status (500).json ({error: err.message});
//   }
// };

// /* ===========================
//    GET PENDING ORDERS
// =========================== */
// export const getPendingOrders = async (req, res) => {
//   try {
//     const result = await pool.query (`
//       SELECT
//         o.id,
//         o.user_id,
//         o.company_id,
//         o.order_type,
//         o.quantity,
//         o.price,
//         o.status,
//         o.created_at
//       FROM orders o
//       WHERE o.status = 'PENDING'
//       ORDER BY o.created_at DESC
//     `);

//     res.json (result.rows);
//   } catch (err) {
//     console.error ('GET PENDING ORDERS ERROR:', err);
//     res.status (500).json ({error: err.message});
//   }
// };

// /* ===========================
//    APPROVE ORDER
// =========================== */
// export const approveOrder = async (req, res) => {
//   try {
//     const {orderId} = req.params;
//     if (!orderId)
//       return res.status (400).json ({message: 'Order ID is required'});

//     await pool.query (
//       `UPDATE orders SET status='APPROVED', updated_at=NOW() WHERE id=$1`,
//       [orderId]
//     );

//     res.json ({message: 'Order approved successfully'});
//   } catch (err) {
//     console.error (err);
//     res.status (500).json ({error: err.message});
//   }
// };

// /* ===========================
//    REJECT ORDER
// =========================== */
// export const rejectOrder = async (req, res) => {
//   try {
//     const {orderId} = req.params;
//     if (!orderId)
//       return res.status (400).json ({message: 'Order ID is required'});

//     await pool.query (
//       `UPDATE orders SET status='REJECTED', updated_at=NOW() WHERE id=$1`,
//       [orderId]
//     );

//     res.json ({message: 'Order rejected successfully'});
//   } catch (err) {
//     console.error (err);
//     res.status (500).json ({error: err.message});
//   }
// };
