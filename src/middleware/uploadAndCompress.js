import multer from "multer";
import sharp from "sharp";
import { s3 } from "../config/s3.js";
import path from "path";
import crypto from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

// ---------------------------- For Detail Lead Document Uploads ----------------------------
export const uploadAndCompress = upload.array("documents");

const sanitizeForS3 = (value) =>
  value.replace(/[^a-zA-Z0-9-_]/g, "_");

export const compressAndUploadToS3 = async (
  file,
  { userId, leadCode, department, document_key }
) => {
  const isImage = file.mimetype.startsWith("image/");
  const ext = path.extname(file.originalname).toLowerCase();

  let finalBuffer = file.buffer;
  let contentType = file.mimetype;
  let finalExt = ext;

  if (isImage) {
    finalBuffer = await sharp(file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 50 })
      .toBuffer();

    contentType = "image/jpeg";
    finalExt = ".jpg";
  }

  const uniqueId = crypto.randomUUID();
  const safeLeadCode = sanitizeForS3(leadCode);

  const s3Key = `users/${userId}/leads/${safeLeadCode}/${department}/${document_key}/${uniqueId}${finalExt}`;

  const uploadRes = await s3.upload({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: finalBuffer,
      ContentType: contentType,
      // ContentDisposition: "inline",
    })
    .promise();

    return {
      key: uploadRes.Key,
      url: uploadRes.Location, // ✅ THIS IS THE LIVE URL
    };
};

// ---------------------------- For Profile Picture Uploads ----------------------------
export const uploadProfileImageMiddleware = upload.single("profile_photo");

export const uploadProfileImageToS3 = async (file, userId) => {
  if (!file.mimetype.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const buffer = await sharp(file.buffer)
    .resize({ width: 500, height: 500, fit: "cover" })
    .jpeg({ quality: 60 })
    .toBuffer();

  const key = `users/${userId}/profile/profile.jpg`;

  const uploadRes = await s3
    .upload({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
    .promise();

  return {
    key: uploadRes.Key,
    url: uploadRes.Location,
  };
};
   