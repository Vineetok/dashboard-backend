// controllers/enquiryController.js
import pool from '../../../config/db.js';

export const createEnquiry = async (req, res) => {
  const {
    company_id,
    enquiry_type,
    full_name,
    email,
    phone,
    quantity,
  } = req.body;

  // Basic validation
  if (!company_id || !enquiry_type || !full_name || !email || !phone) {
    return res
      .status (400)
      .json ({message: 'All required fields must be filled'});
  }

  try {
    const query = `
      INSERT INTO tbl_share_enquiries (company_id, enquiry_type, full_name, email, phone, quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      company_id,
      enquiry_type,
      full_name,
      email,
      phone,
      quantity || 5000,
    ];

    const result = await pool.query (query, values);

    res.status (201).json ({
      message: 'Enquiry submitted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error (error);
    res.status (500).json ({message: 'Internal server error'});
  }
};

// controllers/enquiryController.js

export const getAllEnquiries = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        company_id,
        enquiry_type,
        full_name,
        email,
        phone,
        quantity,
        created_at
      FROM tbl_share_enquiries
      ORDER BY created_at DESC;
    `;

    const {rows} = await pool.query (query);

    res.status (200).json ({
      message: 'Enquiries fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error ('GET ENQUIRIES ERROR:', error);
    res.status (500).json ({message: 'Internal server error'});
  }
};
