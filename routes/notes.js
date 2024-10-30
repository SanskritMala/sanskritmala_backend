import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { accessNote, getAllNotes, getMyNotes, getNotePdf, getSingleNote } from '../controllers/notes.js';


const router = express.Router();

router.get('/notes/all', getAllNotes);
router.get('/notes/:id',getSingleNote);
router.get('/mynotes',isAuth,getMyNotes);
router.get("/notes/:id/pdf", isAuth, getNotePdf);
router.post('/notes/access/:id',isAuth,accessNote)
export default router;
