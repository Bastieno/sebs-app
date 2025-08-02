import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Define allowed file types for receipts
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB default

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-uuid.extension
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    (error as any).code = 'INVALID_FILE_TYPE';
    return cb(error);
  }

  // Check file extension as additional security
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    const error = new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
    (error as any).code = 'INVALID_FILE_EXTENSION';
    return cb(error);
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow one file at a time
  },
});

// Middleware for single receipt upload
export const uploadReceipt = upload.single('receipt');

// Middleware for handling upload errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: 'Only one file is allowed'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
        error: 'File must be uploaded in the "receipt" field'
      });
    }
  }
  
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file',
      error: error.message
    });
  }
  
  // Generic upload error
  return res.status(500).json({
    success: false,
    message: 'File upload failed',
    error: error.message || 'Unknown upload error'
  });
};

// Utility function to get file URL
export const getFileUrl = (filename: string): string => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3002}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Utility function to validate file exists
export const validateFileExists = (filename: string): boolean => {
  const fs = require('fs');
  const filePath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', filename);
  return fs.existsSync(filePath);
};

// Utility function to delete file
export const deleteFile = (filename: string): boolean => {
  try {
    const fs = require('fs');
    const filePath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
