import pool from '../../../config/db.js';
import {Parser} from 'json2csv';

//  SHARES SUMMARY
export const getSharesSummary = async (req, res) => {
  try {
    const sharesResult = await pool.query (`
      SELECT 
        COALESCE(SUM(min_lot_size), 0) AS total_shares,
        COALESCE(SUM(price * min_lot_size), 0) AS total_min_investment,
        COALESCE(MAX(price), 0) AS highest_price,
        COALESCE(MIN(price), 0) AS lowest_price
      FROM tbl_shares
    `);

    const companiesResult = await pool.query (`
      SELECT COUNT(*) AS total_companies 
      FROM tbl_shares
    `);

    const shareData = sharesResult.rows[0];
    const companyData = companiesResult.rows[0];

    res.json ({
      success: true,
      totalCompanies: Number (companyData.total_companies),
      totalShares: Number (shareData.total_shares),
      totalMinInvestment: Number (shareData.total_min_investment),
      highestSharePrice: Number (shareData.highest_price),
      lowestSharePrice: Number (shareData.lowest_price),
    });
  } catch (err) {
    console.error ('Shares Summary Error:', err);
    res.status (500).json ({
      success: false,
      message: 'Failed to fetch shares summary',
    });
  }
};

//  ALERTS
export const getHighInvestmentShares = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id AS share_id,
        shares_name AS company_name,
        price,
        min_lot_size,
        (price * min_lot_size) AS min_investment
      FROM tbl_shares
      WHERE (price * min_lot_size) > 100000
      ORDER BY min_investment DESC
    `);

    res.status(200).json({
      success: true,
      totalRecords: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("HIGH INVESTMENT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch high investment shares",
      error: err.message
    });
  }
};

//  CSV EXPORT
export const exportSharesCSV = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        shares_name,
        logo_url,
        price,
        depository_applicable,
        min_lot_size,
        status,
        created_at,
        updated_at
      FROM tbl_shares
      ORDER BY id ASC
    `;

    const { rows } = await pool.query(query);

    const fields = [
      'id',
      'shares_name',
      'logo_url',
      'price',
      'depository_applicable',
      'min_lot_size',
      'status',
      'created_at',
      'updated_at',
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=unlisted_shares.csv'
    );

    return res.status(200).send(csv);

  } catch (error) {
    console.error('Export Shares CSV Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to export shares CSV',
      error: error.message,
    });
  }
};

export const exportTransactionsCSV = async (req, res) => {
  try {
    const result = await pool.query (`SELECT * FROM tbl_unlisted_transactions`);
    const parser = new Parser ();
    const csv = parser.parse (result.rows);

    res.header ('Content-Type', 'text/csv');
    res.attachment ('transactions.csv');
    res.send (csv);
  } catch (err) {
    console.error (err);
    res.status (500).json ({error: err.message});
  }
};

//  FILTER / SEARCH
export const filterShares = async (req, res) => {
  try {
    const { minPrice, maxPrice, minLotSize, depository, status } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (minPrice) {
      conditions.push(`s.price >= $${idx++}`);
      values.push(Number(minPrice));
    }

    if (maxPrice) {
      conditions.push(`s.price <= $${idx++}`);
      values.push(Number(maxPrice));
    }

    if (minLotSize) {
      conditions.push(`s.min_lot_size >= $${idx++}`);
      values.push(Number(minLotSize));
    }

    if (depository) {
      conditions.push(`s.depository_applicable = $${idx++}`);
      values.push(depository);
    }

    if (status) {
      conditions.push(`s.status = $${idx++}`);
      values.push(status);
    }

    const query = `
      SELECT 
        s.id,
        s.shares_name,
        s.price,
        s.min_lot_size,
        s.depository_applicable,
        s.status,
        s.created_at,
        s.updated_at,

        -- Transaction analytics
        COUNT(t.id) AS total_transactions,
        COALESCE(SUM(t.quantity), 0) AS total_traded_quantity,
        COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) AS pending_transactions

      FROM tbl_shares s
      LEFT JOIN  tbl_unlisted_transactions t ON s.id = t.share_id
      ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    const { rows } = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      totalRecords: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("Filter Shares Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to filter shares",
      error: error.message
    });
  }
};

export const filterTransactions = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) {
      conditions.push(`t.status = $${idx++}`);
      values.push(status);
    }

    if (startDate) {
      conditions.push(`t.createdAt >= $${idx++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.createdAt <= $${idx++}`);
      values.push(endDate);
    }

    const query = `
      SELECT 
        t.id AS txn_id,
        u.name AS user_name,
        s.shares_name AS asset_name,
        t.type AS transaction_type,
        t.quantity,
        s.price,
        (t.quantity * s.price) AS total_amount,
        t.status,
        t.createdAt AS timestamp
      FROM tbl_unlisted_transactions t
      LEFT JOIN tbl_registeredusers u ON u.id = t.user_id
      LEFT JOIN tbl_shares s ON s.id = t.share_id
      ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
      ORDER BY t.createdAt DESC
    `;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      totalRecords: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error("FILTER TRANSACTIONS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to filter transactions",
      error: err.message
    });
  }
};

  //  BUY / SELL TRENDS For charts in frontend
export const getBuySellTrends = async (req, res) => {
  try {
    const result = await pool.query (`
      SELECT 
        DATE(t.createdat) AS date,
        t.type AS transaction_type,
        SUM(t.quantity * s.price) AS total_amount
      FROM  tbl_unlisted_transactions t
      JOIN tbl_shares s ON s.id = t.share_id
      GROUP BY DATE(t.createdat), t.type
      ORDER BY DATE(t.createdat) ASC
    `);

    const trends = {};

    result.rows.forEach (row => {
      const date = row.date.toISOString ().split ('T')[0];

      if (!trends[date]) {
        trends[date] = {BUY: 0, SELL: 0};
      }

      trends[date][row.transaction_type.toUpperCase ()] = Number (
        row.total_amount
      );
    });

    res.json (trends);
  } catch (err) {
    console.error ('Buy/Sell Trends Error:', err);
    res.status (500).json ({error: err.message});
  }
};

export const getSharePriceTrends = async (req, res) => {
  try {
    const result = await pool.query (`
      SELECT DATE(updated_at) AS date,
             AVG(price) AS avg_price
      FROM tbl_shares
      GROUP BY DATE(updated_at)
      ORDER BY DATE(updated_at) ASC
    `);
    res.json (result.rows);
  } catch (err) {
    console.error (err);
    res.status (500).json ({error: err.message});
  }
};
