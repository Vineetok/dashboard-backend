import pool from '../../config/db.js';

// Get pending transactions (if you implement status = 'PENDING' in transactions)
export const getPendingTransactions = async (req, res) => {
  try {
    const {rows} = await pool.query (`
      SELECT t.id, u.name AS user_name, c.company_name, t.transaction_type, t.shares, t.price, t.total_amount, t.created_at
      FROM  tbl_unlisted_transactions t
      JOIN tbl_registeredusers u ON u.id = t.user_id
      JOIN tbl_shares c ON c.id = t.company_id
      WHERE t.status='PENDING'
      ORDER BY t.created_at DESC
    `);
    res.json (rows);
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Failed to fetch pending transactions'});
  }
};

// Approve transaction
export const approveTransaction = async (req, res) => {
  try {
    const {id} = req.body;
    if (!id)
      return res.status (400).json ({message: 'Transaction ID required'});
    // Update transaction status
    await pool.query (`UPDATE transactions SET status='APPROVED' WHERE id=$1`, [
      id,
    ]);
    res.json ({message: 'Transaction approved successfully'});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Failed to approve transaction'});
  }
};

// Reject transaction
export const rejectTransaction = async (req, res) => {
  try {
    const {id} = req.body;
    if (!id)
      return res.status (400).json ({message: 'Transaction ID required'});
    await pool.query (`UPDATE transactions SET status='REJECTED' WHERE id=$1`, [
      id,
    ]);

    res.json ({message: 'Transaction rejected successfully'});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Failed to reject transaction'});
  }
};
