import express from 'express';
import { isAdmin, isAuth } from '../middlewares/isAuth.js';
import multer from 'multer';
import { uploadEbookFiles,uploadFiles,uploadNoteFiles } from '../middlewares/multer.js';
import { 
  addLectures, 
  createBook, 
  createCourse, 
  createEbook, 
  createNotes, 
  deleteBook, 
  deleteCourse, 
  deleteEbook, 
  deleteLecture, 
  deleteNote, 
  getAllstats, 
  updateBook, 
  updateEbook, 
  updateNote 
} from '../controllers/admin.js';
import { updateRole, getAllUser } from '../controllers/admin.js';

const router = express.Router();
const upload = multer(); // Create a multer instance
// Course routes
router.post('/course/new', isAuth, isAdmin, createCourse); // Removed uploadFiles middleware
router.post('/course/:id', isAuth, isAdmin, upload.none(), addLectures); // Removed uploadFiles middleware
router.delete('/lecture/:id', isAuth, isAdmin, deleteLecture);
router.delete('/course/:id', isAuth, isAdmin, deleteCourse);

// Stats and User Management routes
router.get('/stats', isAuth, isAdmin, getAllstats);
router.put("/user/:id", isAuth, updateRole);
router.get("/users", isAuth, isAdmin, getAllUser);

// Book routes
router.post('/book/new', isAuth, isAdmin,uploadEbookFiles, createBook); // Removed uploadFiles middleware
router.delete('/book/:id', isAuth, isAdmin, deleteBook);
router.put('/book/:id', isAuth, isAdmin,uploadEbookFiles, updateBook); // Removed uploadFiles middleware

// Ebook routes
router.post('/ebook/new', isAuth, isAdmin, uploadEbookFiles , createEbook); 
router.delete('/ebook/:id', isAuth, isAdmin, deleteEbook);
router.put('/ebook/:id', isAuth, isAdmin,uploadEbookFiles, updateEbook); // Removed uploadEbookFiles middleware

// Notes routes
router.post('/notes/new', isAuth, isAdmin,uploadNoteFiles, createNotes); // Removed uploadNoteFiles middleware
router.delete('/notes/:id', isAuth, isAdmin, deleteNote);
router.put('/notes/:id', isAuth, isAdmin,uploadNoteFiles, updateNote); // Removed uploadNoteFiles middleware

export default router;
