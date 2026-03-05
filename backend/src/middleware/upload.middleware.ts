import multer from "multer";

/**
 * Configure Multer for memory storage.
 * Files are kept in memory as buffers before being uploaded to Supabase Storage.
 */
const storage = multer.memoryStorage();

/**
 * Middleware for handling Organisation Logo uploads.
 * - Max size: 2MB
 * - Allowed types: png, jpg, jpeg, webp
 */
export const uploadLogo = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (png, jpg, jpeg, webp) are allowed"));
    }
  },
});
