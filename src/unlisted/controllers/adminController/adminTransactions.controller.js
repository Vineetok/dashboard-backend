import pool from '../../../config/db.js';

/* ===========================
   GET ALL TRANSACTIONS
=========================== */
export const getAllTransactions = async (req, res) => {
  try {
    const {rows} = await pool.query (`
      SELECT 
        t.id AS txn_id,
        u.name AS user_name,
        s.shares_name AS asset_name,
        t.type AS transaction_type,
        t.quantity,
        s.price,
        (t.quantity * s.price) AS total_amount,
        t.status,
        t.createdat AS timestamp
      FROM  tbl_unlisted_transactions t
      LEFT JOIN tbl_registeredusers u ON u.id = t.user_id
      LEFT JOIN tbl_shares s ON s.id = t.share_id
      ORDER BY t.createdat DESC
    `);

    res.status (200).json (rows);
  } catch (err) {
    console.error ('GET TRANSACTIONS ERROR:', err);
    res.status (500).json ({message: 'Failed to fetch transactions'});
  }
};

/* ===========================
   GET PENDING TRANSACTIONS
=========================== */
export const getPendingTransactions = async (req, res) => {
  try {
    const {rows} = await pool.query (`
      SELECT 
        t.id AS txn_id,
        u.name AS user_name,
        s.shares_name AS asset_name,
        t.type AS transaction_type,
        t.quantity,
        s.price,
        (t.quantity * s.price) AS total_amount,
        t.status,
        t.created tbl_unlisted_transactionsat AS timestamp
      FROM unlisted_transactions t
      LEFT JOIN tbl_registeredusers u ON u.id = t.user_id
      LEFT JOIN tbl_shares s ON s.id = t.share_id
      WHERE t.status = 'PENDING'
      ORDER BY t.createdat DESC
    `);

    res.status (200).json (rows);
  } catch (err) {
    console.error ('GET PENDING TRANSACTIONS ERROR:', err);
    res.status (500).json ({message: 'Failed to fetch pending transactions'});
  }
};

/* ===========================
   ADD NEW TRANSACTION
=========================== */
export const addTransaction = async (req, res) => {
  try {
    const {user_id, share_id, quantity, type} = req.body;

    /* ===========================
       VALIDATION
    =========================== */
    if (!user_id || !share_id || !quantity || !type) {
      return res.status (400).json ({message: 'Missing required fields'});
    }

    if (quantity <= 0) {
      return res
        .status (400)
        .json ({message: 'Quantity must be greater than 0'});
    }

    if (!['BUY', 'SELL'].includes (type.toUpperCase ())) {
      return res.status (400).json ({message: 'Type must be BUY or SELL'});
    }

    /* ===========================
       FETCH SHARE DETAILS
    =========================== */
    const shareResult = await pool.query (
      `SELECT id, shares_name, price, min_lot_size 
       FROM shares 
       WHERE id = $1`,
      [share_id]
    );

    if (shareResult.rows.length === 0) {
      return res.status (404).json ({message: 'Share not found'});
    }

    const share = shareResult.rows[0];

    /* ===========================
       CHECK MIN LOT SIZE
    =========================== */
    if (quantity < share.min_lot_size) {
      return res.status (400).json ({
        message: `Minimum lot size is ${share.min_lot_size}`,
      });
    }

    /* ===========================
       CALCULATE TOTAL
    =========================== */
    const totalAmount = quantity * share.price;

    /* ===========================
       INSERT TRANSACTION
    =========================== */
    const {rows} = await pool.query (
      `INSERT INTO  tbl_unlisted_transactions
       (user_id, share_id, quantity, type, status, createdat, updatedat)
       VALUES ($1, $2, $3, $4, 'PENDING', NOW(), NOW())
       RETURNING *`,
      [user_id, share_id, quantity, type.toUpperCase ()]
    );

    /* ===========================
       RESPONSE
    =========================== */
    res.status (201).json ({
      message: 'Transaction created successfully',
      transaction: rows[0],
      share_details: {
        shares_name: share.shares_name,
        price: share.price,
        min_lot_size: share.min_lot_size,
        total_amount: totalAmount,
      },
    });
  } catch (err) {
    console.error ('ADD TRANSACTION ERROR:', err);
    res.status (500).json ({message: 'Failed to add transaction'});
  }
};

/* ===========================
   APPROVE TRANSACTION
=========================== */
export const approveTransaction = async (req, res) => {
  try {
    const {transaction_id} = req.body;

    if (!transaction_id) {
      return res.status (400).json ({message: 'Missing transaction_id'});
    }

    const {rows} = await pool.query (
      `UPDATE tbl_unlisted_transactions
       SET status = 'APPROVED', updatedat = NOW()
       WHERE id = $1
       RETURNING *`,
      [transaction_id]
    );

    if (rows.length === 0) {
      return res.status (404).json ({message: 'Transaction not found'});
    }

    res.status (200).json (rows[0]);
  } catch (err) {
    console.error ('APPROVE TRANSACTION ERROR:', err);
    res.status (500).json ({message: 'Failed to approve transaction'});
  }
};

/* ===========================
   REJECT TRANSACTION
=========================== */
export const rejectTransaction = async (req, res) => {
  try {
    const {transaction_id} = req.body;

    if (!transaction_id) {
      return res.status (400).json ({message: 'Missing transaction_id'});
    }

    const {rows} = await pool.query (
      `UPDATE tbl_unlisted_transactions
       SET status = 'REJECTED', updatedat = NOW()
       WHERE id = $1
       RETURNING *`,
      [transaction_id]
    );

    if (rows.length === 0) {
      return res.status (404).json ({message: 'Transaction not found'});
    }

    res.status (200).json (rows[0]);
  } catch (err) {
    console.error ('REJECT TRANSACTION ERROR:', err);
    res.status (500).json ({message: 'Failed to reject transaction'});
  }
};
