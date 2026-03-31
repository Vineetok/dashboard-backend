import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
import { Resend } from "resend";
const otpStore = new Map();
import axios from "axios";

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

// 🔹 SEND REGISTER OTP
export const sendRegisterOtp = async (req, res) => {
  try {
    const { mobile, email } = req.body;

    if (!mobile) return res.status(400).json({ message: "Mobile is required" });
    if (!/^[6-9]\d{9}$/.test(mobile))
      return res.status(400).json({ message: "Invalid mobile number" });

    // (Optional) validate email format if you pass it here
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return res.status(400).json({ message: "Invalid email" });

    // Ensure mobile not already registered
    const mobileCheck = await pool.query(
      `SELECT id FROM tbl_registeredusers WHERE mobile = $1 LIMIT 1`,
      [mobile],
    );
    if (mobileCheck.rows.length > 0) {
      return res.status(400).json({
        message:
          "This mobile number is already in use. Try registering with a different number.",
      });
    }

    // Ensure email not already registered (if provided)
    if (email) {
      const emailCheck = await pool.query(
        `SELECT id FROM tbl_registeredusers WHERE email = $1 LIMIT 1`,
        [email.trim().toLowerCase()],
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          message:
            "This email is already associated with an existing account. Try using another email.",
        });
      }
    }

    // Send OTP via UDO
    const response = await axios.post(
      process.env.UDO_VERIFY_URL,
      {
        configId: process.env.UDO_CONFIG_ID,
        to: `91${mobile}`,
      },
      {
        headers: {
          apikey: process.env.UDO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const { verifyId } = response.data;

    // store verifyId for 2 minutes (tune as needed)
    otpStore.set(mobile, {
      verifyId,
      expiresAt: Date.now() + 2 * 60 * 1000,
      purpose: "register",
    });

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("sendRegisterOtp error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

// 🔹 VERIFY REGISTER OTP  (returns registerToken)
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { mobile, otp, email } = req.body;

    if (!mobile || !otp)
      return res.status(400).json({ message: "Mobile and OTP are required" });

    const record = otpStore.get(mobile);
    if (
      !record ||
      record.purpose !== "register" ||
      Date.now() > record.expiresAt
    ) {
      otpStore.delete(mobile);
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    let response;
    try {
      response = await axios.post(
        process.env.UDO_VALIDATE_URL,
        {
          verifyId: record.verifyId,
          otp,
        },
        {
          headers: {
            apikey: process.env.UDO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      if (err.response?.status === 401) {
        return res.status(400).json({ message: "Incorrect or expired OTP" });
      }
      throw err;
    }

    if (response.data?.error) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP valid → remove from store
    otpStore.delete(mobile);

    // Issue short-lived token to allow register call
    const registerToken = jwt.sign(
      {
        purpose: "register",
        mobile,
        email: email ? email.trim().toLowerCase() : undefined,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    return res.status(200).json({
      message: "OTP verified",
      registerToken,
    });
  } catch (err) {
    console.error("verifyRegisterOtp error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

// 🔹 REGISTER PARTNER
export const registerPartner = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      state,
      city,
      password,
      confirm_password,
      rm_referral,
      registerToken,
      entity_type,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !email ||
      !mobile ||
      !state ||
      !city ||
      !password ||
      !confirm_password
    )
      return res.status(400).json({ message: "All fields are required." });

    if (
      !entity_type ||
      !["Individual", "Non-Individual"].includes(entity_type)
    ) {
      return res.status(400).json({
        message: "Please select valid entity type.",
      });
    }

    if (password !== confirm_password)
      return res.status(400).json({ message: "Passwords do not match." });

    // ✅ Validate registerToken (OTP verified)
    if (!registerToken || typeof registerToken !== "string") {
      return res.status(401).json({
        message: "Invalid or missing OTP verification token. Verify OTP again.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(registerToken.trim(), process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verify error:", err.message);
      return res.status(401).json({
        message: "OTP session expired or invalid. Verify OTP again.",
      });
    }

    if (decoded.purpose !== "register")
      return res.status(401).json({ message: "Invalid OTP token." });

    // Must match mobile/email used during OTP verify (email optional, but if present must match)
    const normalizedEmail = email.trim().toLowerCase();

    if (decoded.mobile !== mobile)
      return res
        .status(401)
        .json({ message: "Mobile mismatch. Verify OTP again." });

    if (decoded.email && decoded.email !== normalizedEmail)
      return res
        .status(401)
        .json({ message: "Email mismatch. Verify OTP again." });

    // Check Email / Mobile not already registered
    const emailCheck = await pool.query(
      `SELECT id FROM tbl_registeredusers WHERE email = $1 LIMIT 1`,
      [normalizedEmail],
    );
    if (emailCheck.rows.length > 0)
      return res.status(400).json({ message: "Email already registered." });

    const mobileCheck = await pool.query(
      `SELECT id FROM tbl_registeredusers WHERE mobile = $1 LIMIT 1`,
      [mobile],
    );
    if (mobileCheck.rows.length > 0)
      return res
        .status(400)
        .json({ message: "Mobile number already registered." });

    // 3️⃣ Resolve RM from referral code (OPTIONAL)
    let referredByRM = null;
    if (rm_referral && rm_referral.trim() !== "") {
      const rmResult = await pool.query(
        `
        SELECT id
        FROM tbl_registeredusers
        WHERE referral_code = $1
        AND role IN ('RM')
        LIMIT 1
        `,
        [rm_referral.trim()],
      );

      if (rmResult.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid RM referral code.",
        });
      }

      referredByRM = rmResult.rows[0].id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ No adv_id in query — PostgreSQL trigger handles it
    const insertQuery = `
      INSERT INTO tbl_registeredusers (name, email, mobile, state, city, password, referred_by_rm, entity_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, adv_id, name, email, mobile, entity_type;
    `;

    const { rows } = await pool.query(insertQuery, [
      name,
      normalizedEmail,
      mobile,
      state,
      city,
      hashedPassword,
      referredByRM,
      entity_type,
    ]);

    const user = rows[0];

    await pool.query(
      `INSERT INTO tbl_dsa_kyc (user_id, phone_number, phone_verified)
      VALUES ($1, $2, TRUE)`,
      [user.id, mobile],
    );

    // ✅ Send welcome email via Resend
    try {
      await resend.emails.send({
        from: "Infinity Arthvishva <no-reply@infinityarthvishva.com>",
        to: normalizedEmail,
        subject: "Welcome to Infinity Arthvishva!",
        html: `
       <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 5px;">
          <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden;">

           <div style="text-align: center; padding: 20px 0;">
              <img src="https://www.infinityarthvishva.com/logo.png " alt="Infinity Arthvishva Logo" style="width: 150px; height: auto;" />
            </div>

            <div style="background: linear-gradient(90deg, #2076C7, #1CADA3); color: #ffffff; padding: 20px 20px;">
              <h2 style="margin: 0; font-size: 22px;">Advisory Code Activated Successfully – Welcome to Infinity Arthvishva</h2>
            </div>

        <div style="padding: 25px; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px;">Dear ${name},</p>

          <p style="font-size: 15px;">
            We&rsquo;re pleased to inform you that your Advisory Code has been successfully activated!<br/>
            Welcome to <b>Infinity Arthvishva.</b>.
          </p>

          <div style="margin-top: 15px; font-size: 15px;">
            <p><b>Advisory Code:</b> ${user.adv_id}</p>
            <p><b>Username:</b> ${normalizedEmail}</p>
            <p><b>Password:</b> ${confirm_password}</p>
          </div>

          <p style="margin-top: 20px; font-size: 15px;">
            You can now log in to your DSA Portal to explore your dashboard, manage clients, and access exclusive advisory tools and resources.
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;"/>

          <p style="font-size: 14px; margin: 0;">📧 <b>Email:</b> info@infinityarthvishva.com</p>
          <p style="font-size: 14px; margin: 5px 0;">📞 <b>Toll-Free Number:</b> 1800 532 7600</p>
          <p style="font-size: 14px; margin: 5px 0 20px;">🌐 <b>Website:</b> <a href="https://www.infinityarthvishva.com" style="color: #2076C7; text-decoration: none;">www.infinityarthvishva.com</a></p>

          <p style="font-size: 15px;">Thank you for being a valued part of our advisory network. We look forward to a successful journey together!</p>

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

    // 🔸 Respond success
    return res.status(201).json({
      message: "Registration successful! A confirmation email has been sent,",
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 🔹 REGISTER PARTNER
export const customerRegisterPartner = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      state,
      city,
      password,
      confirm_password,
      role,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !email ||
      !mobile ||
      !state ||
      !city ||
      !password ||
      !confirm_password ||
      !role
    )
      return res.status(400).json({ message: "All fields are required." });

    if (password !== confirm_password)
      return res.status(400).json({ message: "Passwords do not match." });

    // Must match mobile/email used during OTP verify (email optional, but if present must match)
    const normalizedEmail = email.trim().toLowerCase();

    // Check Email / Mobile not already registered
    const emailCheck = await pool.query(
      `SELECT id FROM tbl_registeredusers WHERE email = $1 LIMIT 1`,
      [normalizedEmail],
    );
    if (emailCheck.rows.length > 0)
      return res.status(400).json({ message: "Email already registered." });

    const mobileCheck = await pool.query(
      `SELECT id FROM tbl_registeredusers WHERE mobile = $1 LIMIT 1`,
      [mobile],
    );
    if (mobileCheck.rows.length > 0)
      return res
        .status(400)
        .json({ message: "Mobile number already registered." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ No adv_id in query — PostgreSQL trigger handles it
    const insertQuery = `
      INSERT INTO tbl_registeredusers (name, email, mobile, state, city, password, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, adv_id, name, email, mobile, role;
    `;

    const { rows } = await pool.query(insertQuery, [
      name,
      normalizedEmail,
      mobile,
      state,
      city,
      hashedPassword,
      role,
    ]);

    const user = rows[0];

    // ✅ Send welcome email via Resend
    try {
      await resend.emails.send({
        from: "Infinity Arthvishva <no-reply@infinityarthvishva.com>",
        to: normalizedEmail,
        subject: "Welcome to Infinity Arthvishva!",
        html: `
       <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 5px;">
          <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden;">

           <div style="text-align: center; padding: 20px 0;">
              <img src="https://www.infinityarthvishva.com/logo.png " alt="Infinity Arthvishva Logo" style="width: 150px; height: auto;" />
            </div>

            <div style="background: linear-gradient(90deg, #2076C7, #1CADA3); color: #ffffff; padding: 20px 20px;">
              <h2 style="margin: 0; font-size: 22px;">Account Activated Successfully – Welcome to Infinity Arthvishva</h2>
            </div>

        <div style="padding: 25px; color: #333333; line-height: 1.6;">
            <p style="font-size: 16px;">Dear ${name},</p>

          <p style="font-size: 15px;">
            We&rsquo;re pleased to inform you that your Account has been successfully activated!<br/>
            Welcome to <b>Infinity Arthvishva.</b>.
          </p>

          <div style="margin-top: 15px; font-size: 15px;">
            <p><b>Username:</b> ${normalizedEmail}</p>
            <p><b>Password:</b> ${confirm_password}</p>
          </div>

          <p style="margin-top: 20px; font-size: 15px;">
            You can now log in to your Portal to explore your dashboard, manage portfolio, and access exclusive products tools and resources.
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;"/>

          <p style="font-size: 14px; margin: 0;">📧 <b>Email:</b> info@infinityarthvishva.com</p>
          <p style="font-size: 14px; margin: 5px 0;">📞 <b>Toll-Free Number:</b> 1800 532 7600</p>
          <p style="font-size: 14px; margin: 5px 0 20px;">🌐 <b>Website:</b> <a href="https://www.infinityarthvishva.com" style="color: #2076C7; text-decoration: none;">www.infinityarthvishva.com</a></p>

          <p style="font-size: 15px;">Thank you for being a valued part of our community. We look forward to a successful journey together!</p>

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

    // 🔸 Respond success
    return res.status(201).json({
      message: "Registration successful! A confirmation email has been sent,",
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 🔹 LOGIN PARTNER
export const loginPartner = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res
        .status(400)
        .json({ message: "Email/Phone and password required." });

    // const query = `SELECT * FROM tbl_registeredusers WHERE email = $1 OR mobile = $1 OR adv_id = $1 LIMIT 1;`;
    let query = "";
    if (identifier.startsWith("ADV_") || identifier.startsWith("NA")) {
      query = "SELECT * FROM tbl_registeredusers WHERE adv_id = $1 LIMIT 1";
    } else if (/^\d{10}$/.test(identifier)) {
      query = "SELECT * FROM tbl_registeredusers WHERE mobile = $1 LIMIT 1";
    } else {
      query = "SELECT * FROM tbl_registeredusers WHERE email = $1 LIMIT 1";
    }

    const { rows } = await pool.query(query, [identifier]);

    if (rows.length === 0)
      return res
        .status(400)
        .json({ message: "Invalid Email or Mobile or ADV ID" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password." });

    // Create JWT payload
    const payload = {
      id: user.id,
      adv_id: user.adv_id,
      email: user.email,
      role: user.role,
    };

    // Generate JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30h",
    });

    delete user.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        role: user.role,
      },
    });
    // return res
    //   .cookie("authToken", token, {
    //     httpOnly: true, // 👈 This is the key security setting
    //     secure: process.env.NODE_ENV === "production",
    //     maxAge: 30 * 60 * 60 * 1000, // 30 hours in milliseconds
    //     path: "/",
    //     sameSite: "Lax",
    //   })
    //   .status(200)
    //   .json({
    //     message: "Login successful",
    //     user: { id: user.id, role: user.role },
    //     // NOTE: The token itself does not need to be in the JSON body anymore!
    //   });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 🔹 SEND LOGIN OTP
export const sendLoginOtp = async (req, res) => {
  const { identifier } = req.body;

  const checkUserQuery = `
      SELECT id 
      FROM tbl_registeredusers 
      WHERE email = $1 OR mobile = $1
      LIMIT 1;
    `;

  const { rows } = await pool.query(checkUserQuery, [identifier]);

  if (rows.length === 0) {
    return res.status(404).json({
      exists: false,
      message: "User not registered",
    });
  }

  if (!/^[0-9]{10}$/.test(identifier)) {
    return res.status(400).json({ message: "Invalid mobile number" });
  }

  const response = await axios.post(
    process.env.UDO_VERIFY_URL,
    {
      configId: process.env.UDO_CONFIG_ID,
      to: `91${identifier}`,
    },
    {
      headers: {
        apikey: process.env.UDO_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  const { verifyId } = response.data;

  // 🔐 Store in memory for 1 minute
  otpStore.set(identifier, {
    verifyId,
    expiresAt: Date.now() + 2 * 60 * 1000,
  });

  return res.json({
    message: "OTP sent successfully",
  });
};

// 🔹 VERIFY LOGIN OTP
export const verifyLoginOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const record = otpStore.get(identifier);
    if (!record || Date.now() > record.expiresAt) {
      otpStore.delete(identifier);
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    let response;
    try {
      response = await axios.post(
        process.env.UDO_VALIDATE_URL,
        {
          verifyId: record.verifyId,
          otp,
        },
        {
          headers: {
            apikey: process.env.UDO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      if (err.response?.status === 401) {
        return res.status(400).json({ message: "Incorrect or expired OTP" });
      }
      throw err;
    }

    if (response.data.error) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 2️⃣ OTP is valid → remove from store
    otpStore.delete(identifier);

    // 3️⃣ FETCH USER (SAME AS loginPartner)
    const { rows } = await pool.query(
      `SELECT * FROM tbl_registeredusers WHERE mobile = $1`,
      [identifier],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // 4️⃣ CREATE JWT (SAME PAYLOAD AS loginPartner)
    const payload = {
      id: user.id,
      adv_id: user.adv_id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30h",
    });

    // 5️⃣ RETURN SAME RESPONSE STRUCTURE
    return res.status(200).json({
      message: "OTP login successful",
      token,
      user: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

// 🔹 VERIFY PROFILE
export const verifyUser = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Identifier is required" });
    }

    const query = `
      SELECT id 
      FROM tbl_registeredusers 
      WHERE email = $1 OR mobile = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [identifier]);

    if (rows.length === 0) {
      return res.status(404).json({
        exists: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      exists: true,
      // user: rows[0],
      message: "User exists",
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔹 UPDATE PASSWORD
export const updatePassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check if user exists via email or mobile
    const checkQuery = `
      SELECT id 
      FROM tbl_registeredusers
      WHERE email = $1 OR mobile = $1
      LIMIT 1;
    `;

    const result = await pool.query(checkQuery, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Account not found." });
    }

    const userId = result.rows[0].id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateQuery = `
      UPDATE tbl_registeredusers
      SET password = $1, updated_at = NOW()
      WHERE id = $2;
    `;

    await pool.query(updateQuery, [hashedPassword, userId]);

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
