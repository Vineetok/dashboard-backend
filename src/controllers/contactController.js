import pool from "../config/db.js";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

export const contactUs = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const query = `
      INSERT INTO tbl_contactus (name, email, phone, message)
      VALUES ($1, $2, $3, $4)
      RETURNING enquiry_id, entry_time
    `;

    const values = [name, email, phone, message];

    const { rows } = await pool.query(query, values);

    // SEND CONFIRMATION EMAIL TO USER
    try {
      await resend.emails.send({
        from: "Infinity Arthvishva <no-reply@infinityarthvishva.com>",
        to: email,
        subject: "We Received Your Enquiry – Infinity Arthvishva",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 5px;">
          <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden;">
            
            <div style="text-align: center; padding: 20px 0;">
              <img src="https://www.infinityarthvishva.com/logo.png " alt="Infinity Arthvishva Logo" style="width: 150px; height: auto;" />
            </div>

            <div style="background: linear-gradient(90deg, #2076C7, #1CADA3); color: #ffffff; padding: 20px 20px;">
              <h2 style="margin: 0; font-size: 22px;">Thank You for Contacting Infinity Arthvishva</h2>
            </div>

            <div style="padding: 25px; color: #333333; line-height: 1.6;">
              <p style="font-size: 16px;">Dear ${name},</p>

              <p style="font-size: 15px;">
                Thank you for reaching out to <b>Infinity Arthvishva</b>.  
                We have successfully received your enquiry and our team will contact you soon.
              </p>

              <div style="margin-top: 15px; font-size: 15px;">
                <p><b>Your Details</b></p>
                <p><b>Enquiry ID:</b> ${rows[0].enquiry_id}</p>
                <p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Phone:</b> ${phone}</p>
              </div>

              <p style="margin-top: 20px; font-size: 15px;">
                Our support team strives to respond at the earliest.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;"/>

              <p style="font-size: 14px; margin: 0;">📧 <b>Email:</b> info@infinityarthvishva.com</p>
              <p style="font-size: 14px; margin: 5px 0;">📞 <b>Toll-Free Number:</b> 1800 532 7600</p>
              <p style="font-size: 14px; margin: 5px 0 20px;">🌐 <b>Website:</b> <a href="https://www.infinityarthvishva.com" style="color: #2076C7; text-decoration: none;">www.infinityarthvishva.com</a></p>

              <p style="font-weight: bold; margin-top: 20px;">Best regards,<br/>Team Infinity Arthvishva</p>

              <small style="display: block; color: #888888; font-size: 12px; text-align: center; margin-top: 25px;">
                This is an automated email. Please do not reply.
              </small>
            </div>
          </div>
        </div>
        `,
      });
    } catch (emailErr) {
      console.error("Resend Email Error:", emailErr);
    }

    res.status(201).json({
      message: "Enquiry submitted successfully!",
      enquiry_id: rows[0].enquiry_id,
      entry_time: rows[0].entry_time,
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
