import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Token missing."
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please login again."
        });
      }

      return res.status(403).json({
        message: "Invalid token."
      });
    }

    // ✅ Attach user to request
    req.user = decoded;
    next();
  });
};
