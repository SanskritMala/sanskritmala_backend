import { Notes } from "../models/Notes.js";
import { User } from "../models/User.js";
import TryCatch from '../middlewares/TryCatch.js';

export const getAllNotes = async (req, res) => {
    try {
        const notes = await Notes.find();
        return res.status(200).json({ notes });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving notes",
            error: error.message
        });
    }
};

export const getSingleNote = async (req, res) => {
    try {
        const note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        return res.status(200).json({ note });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving note",
            error: error.message
        });
    }
};

export const getMyNotes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('purchasedNotes');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const notes = user.purchasedNotes;
        res.status(200).json({ notes });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving notes',
            error: error.message
        });
    }
};

export const getNotePdf = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.purchasedNotes.includes(req.params.id)) {
            return res.status(403).json({ message: "You have not accessed this note" });
        }
        const note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(200).json({ pdfPath: note.notePdf });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving note PDF",
            error: error.message,
        });
    }
};

// New function to allow free access to notes
export const accessNote = TryCatch(async (req, res) => {
    const user = await User.findById(req.user._id);
    const note = await Notes.findById(req.params.id);

    if (!note) {
        return res.status(404).json({ message: "Note not found" });
    }
    
    // Add note directly to the user's collection
    if (!user.purchasedNotes.includes(note._id)) {
        user.purchasedNotes.push(note._id);
        await user.save();
    }

    res.status(200).json({
        message: "Note added successfully",
        note
    });
});
