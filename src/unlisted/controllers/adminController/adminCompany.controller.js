// import pool from "../../../config/db.js";

// /* ===============================
//    GET all companies
// ================================ */
// const getAllCompanies = async (req, res) => {
//   try {
//     const { rows } = await pool.query(
//       "SELECT * FROM unlisted_companies ORDER BY id DESC"
//     );
//     res.status(200).json(rows);
//   } catch (err) {
//     console.error("GET COMPANIES ERROR:", err);
//     res.status(500).json({ message: "Failed to fetch companies" });
//   }
// };

// /* ===============================
//    ADD company
// ================================ */
// export const addCompany = async (req, res) => {
//   try {
//     const { name, sector, price, min_investment, available_shares, status } = req.body;

//     if (!name) {
//       return res.status(400).json({ message: "Company name is required" });
//     }

//     const result = await pool.query(
//       `INSERT INTO unlisted_companies 
//        (name, sector, price, min_investment, available_shares, status, "createdat", "updatedat")
//        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
//        RETURNING *`,
//       [
//         name,
//         sector || null,
//         price || 0,
//         min_investment || 0,
//         available_shares || 0,
//         status || 'ACTIVE'
//       ]
//     );

//     res.status(201).json({
//       success: true,
//       message: "Company added successfully",
//       data: result.rows[0]
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



// /* ===============================
//    UPDATE company (ALL FIELDS)
// ================================ */
// const updateCompany = async (req, res) => {
//   try {
//     const {
//       id,
//       name,
//       sector,
//       price,
//       min_investment,
//       available_shares,
//       status
//     } = req.body;

//     if (!id || !name) {
//       return res.status(400).json({
//         message: "ID and name are required"
//       });
//     }

//     const result = await pool.query(
//       `UPDATE unlisted_companies
//        SET name = $1,
//            sector = $2,
//            price = $3,
//            min_investment = $4,
//            available_shares = $5,
//            status = $6,
//            updatedat = NOW()
//        WHERE id = $7
//        RETURNING *`,
//       [
//         name,
//         sector || null,
//         price ?? 0,
//         min_investment ?? 0,
//         available_shares ?? 0,
//         status || "ACTIVE",
//         id
//       ]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({
//         message: "Company not found"
//       });
//     }

//     res.json({
//       message: "Company updated successfully",
//       company: result.rows[0]
//     });

//   } catch (err) {
//     console.error("UPDATE COMPANY ERROR:", err);
//     res.status(500).json({
//       message: "Failed to update company"
//     });
//   }
// };


// /* ===============================
//    DELETE company
// ================================ */
// const deleteCompany = async (req, res) => {
//   try {
//     const { id } = req.body;

//     if (!id) {
//       return res.status(400).json({ message: "Company ID required" });
//     }

//     const result = await pool.query(
//       "DELETE FROM unlisted_companies WHERE id = $1",
//       [id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     res.json({ message: "Company deleted successfully" });
//   } catch (err) {
//     console.error("DELETE COMPANY ERROR:", err);
//     res.status(500).json({ message: "Failed to delete company" });
//   }
// };

// export {
//   getAllCompanies,
//   updateCompany,
//   deleteCompany
// };
