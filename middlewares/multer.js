import {  cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary'; // Import CloudinaryStorage

// Configure Cloudinary
cloudinary.config({
  cloud_name: "drcmiptb8",
  api_key: 953963766182745,
  api_secret: "81eo6LtC1k6FdNxBMsH3lbW7f-s",
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // Determine the folder and resource type based on the file type
    let resource_type = 'auto'; // Automatically set resource type based on file extension
    let folder = 'uploads'; // The folder in Cloudinary where the files will be stored

    // Check the file type and set resource type
    if (file.mimetype.startsWith('image/')) {
      resource_type = 'image'; // For images
    } else if (file.mimetype === 'application/pdf') {
      resource_type = 'raw'; // For PDFs
    }

    return {
      folder,
      resource_type, // Set resource type dynamically
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], // Allowed file formats
    };
  },
});

// Middleware for handling eBook uploads
export const uploadEbookFiles = multer({ storage }).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'ebookPdf', maxCount: 1 },
]);

// Middleware for handling notes uploads
export const uploadNoteFiles = multer({ storage }).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'notePdf', maxCount: 1 },
]);

// Middleware for handling single file uploads for other cases
export const uploadFiles = multer({ storage }).single('file');

// Optional: Cloudinary upload function (if you need custom upload logic)
export const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'uploads', // Specify the folder in Cloudinary
    });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};
