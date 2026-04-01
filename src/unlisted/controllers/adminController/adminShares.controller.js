import pool from '../../../config/db.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

/* ===========================
   FILE UPLOAD CONFIG
=========================== */
const storage = multer.memoryStorage();

const uploadFile = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExt = ['.xls', '.xlsx'];
    if (
      !allowedExt.includes(path.extname(file.originalname).toLowerCase())
    ) {
      return cb(new Error('Only XLS/XLSX files are allowed'));
    }
    cb(null, true);
  },
}).single('file');


/* ===========================
   GET ALL SHARES
=========================== */
export const getAllShares = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tbl_shares ORDER BY updated_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET SHARES ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch shares' });
  }
};

/* ===========================
   ADD SINGLE SHARE
=========================== */
export const addShare = async (req, res) => {
  try {
    const {
      shares_name,
      logo_url,
      price,
      min_lot_size,
      depository_applicable,
    } = req.body;

    if (!shares_name || price == null) {
      return res
        .status(400)
        .json({ message: 'Shares Name and Price are required' });
    }

    const result = await pool.query(
      `
      INSERT INTO tbl_shares
        (shares_name, logo_url, price, depository_applicable, min_lot_size, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
      ON CONFLICT (shares_name)
      DO UPDATE SET
        price = EXCLUDED.price,
        logo_url = COALESCE(EXCLUDED.logo_url, shares.logo_url),
        min_lot_size = COALESCE(EXCLUDED.min_lot_size, shares.min_lot_size),
        depository_applicable = COALESCE(EXCLUDED.depository_applicable, shares.depository_applicable),
        updated_at = NOW()
      RETURNING id
      `,
      [
        shares_name,
        logo_url || null,
        price,
        depository_applicable || null,
        min_lot_size || null,
      ]
    );

    res.json({
      message: 'Share added/updated successfully',
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error('ADD SHARE ERROR:', err);
    res.status(500).json({ message: 'Failed to add share' });
  }
};

/* ===========================
   UPDATE SINGLE SHARE
=========================== */
export const updateShare = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Share ID is required',
      });
    }

    const {
      shares_name,
      logo_url,
      price,
      min_lot_size,
      depository_applicable,
    } = req.body;

    // Convert numeric fields safely
    const numericPrice = price !== undefined && price !== null && price !== ''
      ? Number(price)
      : null;

    const numericLotSize = min_lot_size !== undefined &&
      min_lot_size !== null &&
      min_lot_size !== ''
      ? Number(min_lot_size)
      : null;

    const result = await pool.query(
      `
      UPDATE tbl_shares SET
        shares_name = COALESCE($1, shares_name),
        logo_url = COALESCE($2, logo_url),
        price = COALESCE($3, price),
        min_lot_size = COALESCE($4, min_lot_size),
        depository_applicable = COALESCE($5, depository_applicable),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [
        shares_name ? shares_name.trim() : null,
        logo_url ? logo_url.trim() : null,
        numericPrice,
        numericLotSize,
        depository_applicable ? depository_applicable.trim() : null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Share updated successfully',
      data: result.rows[0],
    });
    
  } catch (err) {
    console.error('UPDATE SHARE ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update share',
    });
  }
};

/* ===========================
   DELETE SINGLE SHARE
=========================== */
export const deleteShare = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tbl_shares WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Share not found' });
    }

    res.json({ message: 'Share deleted successfully' });
  } catch (err) {
    console.error('DELETE SHARE ERROR:', err);
    res.status(500).json({ message: 'Failed to delete share' });
  }
};

/* ===========================
   BULK UPLOAD (ONE FILE → SHARES + HISTORY)
=========================== */

export const uploadSharesWithHistory = async (req, res) => {

  uploadFile(req, res, async (err) => {

    if (err) {
      return res.status(400).json({ success:false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success:false, message:"Excel file required"});
    }

    const { mode = "daily" } = req.query;

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const workbook = xlsx.read(req.file.buffer,{type:"buffer"});
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet,{raw:true});

      if (!rows.length) {
        throw new Error("Excel file empty");
      }

      let processed = 0;
      let skipped = 0;

      for (const row of rows) {

        /* -------- NORMALIZE SHARE NAME -------- */

        const shares_name = (row["Shares Name"] || "")
          .toString()
          .replace(/\s+/g," ")
          .trim();

        const price = parseFloat(
          (row["Price"] || "")
          .toString()
          .replace(/[^0-9.]/g,"")
        );

        if (!shares_name || !price) {
          skipped++;
          continue;
        }

        /* -------- DATE HANDLING -------- */

        let price_date;

        if (mode === "history") {

          const excelDate = row["Price Date"];

          if (!excelDate) {
            skipped++;
            continue;
          }

          let parsed;

          if (typeof excelDate === "number") {
            parsed = new Date((excelDate - 25569) * 86400 * 1000);
          } else {
            parsed = new Date(excelDate);
          }

          if (isNaN(parsed)) {
            skipped++;
            continue;
          }

          price_date = parsed.toISOString().split("T")[0];

        } else {

          price_date = new Date().toISOString().split("T")[0];

        }

        const logo_url = row["Logo URL"] || null;
        const min_lot_size = row["Minimum Lot Size"] || 1;
        const depository_applicable = row["Depository Applicable"] || null;

        /* ---------------------------
           FIND SHARE (SAFE MATCH)
        ---------------------------- */

        let share = await client.query(
          `SELECT id FROM tbl_shares 
           WHERE LOWER(TRIM(shares_name)) = LOWER(TRIM($1))`,
          [shares_name]
        );

        let shareId;

        /* ---------------------------
           INSERT SHARE IF NOT FOUND
        ---------------------------- */

        if (share.rows.length === 0) {

          const insertShare = await client.query(
            `INSERT INTO tbl_shares
            (shares_name,logo_url,price,depository_applicable,min_lot_size)
            VALUES (TRIM($1),$2,$3,$4,$5)
            RETURNING id`,
            [
              shares_name,
              logo_url,
              price,
              depository_applicable,
              min_lot_size
            ]
          );

          shareId = insertShare.rows[0].id;

        } else {

          shareId = share.rows[0].id;

          /* ---------------------------
             UPDATE ONLY IN DAILY MODE
          ---------------------------- */

          if (mode === "daily") {

            await client.query(
              `UPDATE tbl_shares
               SET price=$1,
               updated_at=NOW()
               WHERE id=$2`,
              [price,shareId]
            );

          }

        }

        /* ---------------------------
           INSERT HISTORY
        ---------------------------- */

        await client.query(
          `INSERT INTO tbl_share_price_history
          (share_id,price,price_date)
          VALUES ($1,$2,$3)
          ON CONFLICT (share_id,price_date)
          DO UPDATE SET price = EXCLUDED.price`,
          [shareId,price,price_date]
        );

        processed++;

      }

      await client.query("COMMIT");

      return res.json({
        success:true,
        message:"Upload successful",
        mode,
        rowsProcessed:processed,
        rowsSkipped:skipped
      });

    } catch (error) {

      await client.query("ROLLBACK");

      console.error("UPLOAD ERROR:",error);

      return res.status(500).json({
        success:false,
        message:error.message
      });

    } finally {

      client.release();

    }

  });

};

/* ===========================
   GRAPH API
=========================== */
export const getSharePriceGraph = async (req, res) => {
  try {
    const shareId = parseInt(req.params.share_id, 10);
    const { view = "daily" } = req.query;

    if (isNaN(shareId)) {
      return res.status(400).json({ success: false, message: "Invalid share_id" });
    }

    let query = "";

    if (view === "daily") {
      query = `
        SELECT 
          price_date,
          price AS market_price
        FROM tbl_share_price_history
        WHERE share_id = $1
          AND price_date >= CURRENT_DATE - INTERVAL '1 year'
        ORDER BY price_date ASC
      `;
    } else if (view === "weekly") {
      query = `
        SELECT
          DATE_TRUNC('week', price_date)::date AS price_date,
          ROUND(AVG(price), 2) AS market_price
        FROM tbl_share_price_history
        WHERE share_id = $1
          AND price_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY 1
        ORDER BY 1 ASC
      `;
    } else if (view === "monthly") {
      query = `
        SELECT
          DATE_TRUNC('month', price_date)::date AS price_date,
          ROUND(AVG(price), 2) AS market_price
        FROM tbl_share_price_history
        WHERE share_id = $1
          AND price_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY 1
        ORDER BY 1 ASC
      `;
    } else {
      return res.status(400).json({ success: false, message: "Invalid view type" });
    }

    const { rows } = await pool.query(query, [shareId]);

    const graph = rows.map(r => ({
      price_date: r.price_date,
      market_price: Number(r.market_price),
    }));

    return res.status(200).json({
      success: true,
      share_id: shareId,
      view,
      graph,
    });

  } catch (err) {
    console.error("SHARE GRAPH ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Graph fetch failed",
      error: err.message,
    });
  }
};
/* ===========================
   OVERALL MARKET GRAPH
=========================== */
export const getOverallMarketGraph = async (req, res) => {
  try {
    const { view = "daily" } = req.query;
    let graphQuery = "";

    if (view === "daily") {
      graphQuery = `
        SELECT price_date, ROUND(AVG(price), 2) AS market_price
        FROM tbl_share_price_history
        WHERE price_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY price_date
        ORDER BY price_date ASC
      `;
    } else if (view === "weekly") {
      graphQuery = `
        SELECT DATE_TRUNC('week', price_date)::date AS price_date,
               ROUND(AVG(price), 2) AS market_price
        FROM tbl_share_price_history
        WHERE price_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY 1
        ORDER BY 1 ASC
      `;
    } else if (view === "monthly") {
      graphQuery = `
        SELECT DATE_TRUNC('month', price_date)::date AS price_date,
               ROUND(AVG(price), 2) AS market_price
        FROM tbl_share_price_history
        WHERE price_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY 1
        ORDER BY 1 ASC
      `;
    } else {
      return res.status(400).json({ message: "Invalid view type" });
    }

    const graphResult = await pool.query(graphQuery);
    const graphData = graphResult.rows.map(r => ({
      price_date: r.price_date,
      market_price: Number(r.market_price),
    }));

    return res.json({ success: true, graph: graphData });
  } catch (err) {
    console.error("OVERALL GRAPH ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch overall graph" });
  }
};

export const getTopMoversPublic = async (req, res) => {
  try {
    const { type = 'gainers', limit = 5 } = req.query;

    if (!['gainers', 'losers'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const query = `
      WITH ranked_prices AS (
        SELECT 
          s.id,
          s.shares_name,
          h.price,
          h.price_date,
          ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY h.price_date DESC) AS rn
        FROM tbl_shares s
        JOIN tbl_share_price_history h ON s.id = h.share_id
      ),
      latest_prices AS (
        SELECT 
          r1.id,
          r1.shares_name,
          r1.price AS latest_price,
          r2.price AS previous_price
        FROM ranked_prices r1
        LEFT JOIN ranked_prices r2
          ON r1.id = r2.id AND r2.rn = 2
        WHERE r1.rn = 1
      )
      SELECT 
        id,
        shares_name,
        latest_price,
        ROUND(
          ((latest_price - previous_price) / NULLIF(previous_price,0)) * 100,
          2
        ) AS percentage_change
      FROM latest_prices
      WHERE previous_price IS NOT NULL
      ORDER BY percentage_change ${type === 'losers' ? 'ASC' : 'DESC'}
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit]);

    res.json({
      success: true,
      type,
      data: rows,
    });
  } catch (err) {
    console.error('PUBLIC TOP MOVERS ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch top movers' });
  }
};



