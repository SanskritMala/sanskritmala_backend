import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { Book } from "../models/Books.js";
import { rm } from "fs";
import { promisify } from "util";
import { User } from "../models/User.js";
import { Ebooks } from "../models/Ebooks.js";
import { Notes } from "../models/Notes.js";
import fs from "fs";
import TryCatch from "../middlewares/TryCatch.js";

export const createCourse = async (req, res) => {
  try {
    const { title, description, category, createdBy, duration, price, youtubeLink } = req.body;

    // Extract video ID from the YouTube link
    const videoId = youtubeLink.split('v=')[1]?.split('&')[0] || youtubeLink.split('/').pop();
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Create the course with the thumbnail URL
    await Courses.create({
      title,
      description,
      category,
      createdBy,
      duration,
      price,
      image: thumbnailUrl, // Use the thumbnail URL instead of a file upload
      youtubeLink,
    });

    res.status(201).json({
      message: "Course created successfully",
      data: { title, description, category, createdBy, duration, price, youtubeLink, thumbnailUrl }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
import multer from 'multer';

const upload = multer(); // Create a multer instance

export const addLectures = async (req, res) => {
  console.log("Request Body:", req.body); // Log the incoming request body

  try {
    const course = await Courses.findById(req.params.id);

    if (!course) return res.status(404).json({
      message: "Course not found"
    });

    const { title, description, youtubeLink } = req.body;

    if (!title || !description || !youtubeLink) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Extract video ID for the lecture thumbnail
    const videoId = youtubeLink.split('v=')[1]?.split('&')[0] || youtubeLink.split('/').pop();
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const lecture = await Lecture.create({
      title,
      description,
      youtubeLink,
      course: course._id
    });

    res.status(201).json({
      message: "Lecture added successfully",
      lecture,
    });
  } catch (error) {
    console.error("Error adding lecture:", error); // Log the error for debugging
    res.status(500).json({
      message: error.message
    });
  }
};



export const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) return res.status(404).json({
      message: "Lecture not found"
    });

    await lecture.deleteOne();
    res.status(200).json({
      message: "Lecture deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};




export const deleteCourse = async (req, res) => {
  console.log("Received ID:", req.params.id); // Log received ID

  try {
    const course = await Courses.findById(req.params.id);
    console.log("Found Course:", course); // Log found course

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Delete all lectures associated with the course
    const deleteLectures = await Lecture.deleteMany({ course: course._id });
    console.log("Deleted Lectures Count:", deleteLectures.deletedCount); // Log deleted lectures count

    // Delete the course
    await course.deleteOne(); // Ensure this line executes without error

    // Remove course from all users' subscriptions
    const updateUsers = await User.updateMany({}, { $pull: { subscription: req.params.id } });
    console.log("Updated Users Count:", updateUsers.modifiedCount); // Log users updated count

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error); // Log the error
    res.status(500).json({ message: error.message });
  }
};








export const createBook = async (req, res) => {
  try {
    const { title, author, price, description } = req.body;

    // Ensure the cover image is uploaded
    if (!req.files || !req.files.coverImage) {
      return res.status(400).json({ message: "Cover image is required." });
    }

    // Use secure_url from Cloudinary response for the cover image
    const coverImagePath = req.files.coverImage[0].path || req.files.coverImage[0].secure_url;

    // Create the Book document in the database with the Cloudinary URL for the cover image
    const book = new Book({
      title,
      author,
      price,
      description,
      coverImage: coverImagePath, // Assign the Cloudinary URL for the cover image
    });

    // Save the new book document
    await book.save();

    // Respond with success message and book data
    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    console.error("Error in createBook:", error); // Log the error
    res.status(400).json({ message: "Error creating book", error: error.message });
  }
};


export const deleteBook=async(req,res)=>{
    try{
        const book=await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        rm(book.image,()=>{
            console.log(" Book Image Deleted");
           });
           res.json({ message: "Book deleted successfully" });
    }
    catch(error){
        res.status(500).json({
            message:error.message
            })
    }

}

  
export const getAllstats = async(req,res)=>{
    try{

        const totalCourses=(await Courses.find()).length;
        const totalBooks=(await Book.find()).length;
        const totalUser=(await User.find()).length;
        const totalEbooks=(await Ebooks.find()).length;
        const totalNotes=(await Notes.find()).length;
       

        const stats={
            totalCourses,
            totalBooks,
            totalUser,
            totalEbooks,
            totalNotes
          
        }

        res.json({
            stats
        })

    }
    catch(error){
        res.status(500).json({
            message:error.message
            })
    }
}

export const getAllUser = TryCatch(async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password"
    );
    res.json({ users });
});

export const updateRole = TryCatch(async (req, res) => {
    if (req.user.mainrole !== "superadmin")
      return res.status(403).json({
        message: "This endpoint is assign to superadmin",
      });
    const user = await User.findById(req.params.id);
  
    if (user.role === "user") {
      user.role = "admin";
      await user.save();
  
      return res.status(200).json({
        message: "Role updated to admin",
      });
    }
  
    if (user.role === "admin") {
      user.role = "user";
      await user.save();
  
      return res.status(200).json({
        message: "Role updated",
      });
    }
  });

 
 // Assuming this is where your Book model is located
  
 export const updateBook = async (req, res) => {
  const { title, author, price, description } = req.body;
  const { id } = req.params;

  try {
    // Find the book by ID
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Construct the updated book object
    const updatedBookData = {
      title: title || book.title,
      author: author || book.author,
      price: price || book.price,
      description: description || book.description,
    };

    // Log the received data
    console.log("Received data: ", { title, author, price, description });
    console.log("File received: ", req.file);

    // If a new cover image is uploaded, upload it to Cloudinary and update the image URL
    if (req.file) {
      try {
        const imageResult = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: '/uploads',
        });
        updatedBookData.image = imageResult.secure_url;
        console.log('Book image updated: ', updatedBookData.image);
      } catch (error) {
        console.error('Image upload error: ', error);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    // Update the book in the database
    const updatedBook = await Book.findByIdAndUpdate(id, updatedBookData, { new: true });

    // If the book isn't updated, handle the error
    if (!updatedBook) {
      return res.status(500).json({ message: "Failed to update the book" });
    }

    // Return the updated book
    res.status(200).json({ message: "Book updated successfully", book: updatedBook });

    // Log the updated book
    console.log('Book updated successfully: ', updatedBook);
  } catch (error) {
    console.error('Error updating the book: ', error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

  




  
  export const createEbook = async (req, res) => {
    try {
        const { title, author, price, description } = req.body;

        // Log the uploaded files to confirm structure
        console.log("Uploaded files:", req.files);

        // Ensure both cover image and ebook PDF are uploaded
        if (!req.files || !req.files.coverImage || !req.files.ebookPdf) {
            return res.status(400).json({ message: "Both cover image and ebook PDF are required." });
        }

        // Access the file URLs or paths properly
        const coverImagePath = req.files.coverImage[0].path || req.files.coverImage[0].secure_url; // Ensure path or secure_url is used
        const ebookPdfPath = req.files.ebookPdf[0].path || req.files.ebookPdf[0].secure_url; // Same for ebookPdf

        // Create the eBook document in the database
        const ebook = new Ebooks({
            title,
            author,
            price,
            description,
            coverImage: coverImagePath, // Assign the correct path/URL
            ebookPdf: ebookPdfPath,      // Assign the correct path/URL
        });

        // Save the new eBook document
        await ebook.save();

        // Respond with success message and ebook data
        res.status(201).json({ message: "EBook created successfully", ebook });
    } catch (error) {
        console.error("Error in createEbook:", error); // Log the error
        res.status(400).json({ message: "Error creating eBook", error: error.message }); // Return the error message
    }
};





  

import cloudinary from "cloudinary"; // Assuming you've configured Cloudinary

// Delete eBook from Cloudinary and database
export const deleteEbook = async (req, res) => {
  try {
    // Find the eBook by ID
    const ebook = await Ebooks.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({ message: 'E-book not found' });
    }

    // Delete eBook PDF from Cloudinary
    if (ebook.ebookPdf) {
      const publicIdPdf = ebook.ebookPdf.split('/').pop().split('.')[0]; // Extract the public ID
      await cloudinary.v2.uploader.destroy(publicIdPdf, { resource_type: "raw" });
      console.log('E-book PDF deleted');
    }

    // Delete cover image from Cloudinary
    if (ebook.coverImage) {
      const publicIdImage = ebook.coverImage.split('/').pop().split('.')[0]; // Extract the public ID
      await cloudinary.v2.uploader.destroy(publicIdImage);
      console.log('Cover image deleted');
    }

    // Remove the eBook from the database
    await ebook.deleteOne();

    // Update all users to remove the deleted eBook from their purchased eBooks
    await User.updateMany({}, { $pull: { purchasedEbooks: req.params.id } });

    // Send response
    res.status(200).json({
      message: 'E-book deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting eBook:', error);
    res.status(500).json({ message: error.message });
  }
};


  


// Update eBook with new data and handle Cloudinary uploads (without deleting old files)
export const updateEbook = TryCatch(async (req, res) => {
  const { title, author, price, description } = req.body;
  const ebookId = req.params.id;

  // Find the eBook to update
  const ebook = await Ebooks.findById(ebookId);
  if (!ebook) {
      return res.status(404).json({ message: 'eBook not found' });
  }

  // Handle file uploads for cover image
  if (req.files && req.files.coverImage) {
      // Upload new cover image to Cloudinary (without deleting the old one)
      const coverImageResult = await cloudinary.v2.uploader.upload(req.files.coverImage[0].path, {
          folder: 'ebooks/coverImages',
      });

      // Update eBook with the new cover image URL (old cover image stays in Cloudinary)
      ebook.coverImage = coverImageResult.secure_url;
  }

  // Handle file uploads for eBook PDF
  if (req.files && req.files.ebookPdf) {
      // Upload new eBook PDF to Cloudinary (without deleting the old one)
      const ebookPdfResult = await cloudinary.v2.uploader.upload(req.files.ebookPdf[0].path, {
          folder: 'ebooks/pdfFiles',
          resource_type: 'raw',
          access_mode: 'public', // Make the file public
      });

      // Update eBook with the new eBook PDF URL (old PDF stays in Cloudinary)
      ebook.ebookPdf = ebookPdfResult.secure_url;
  }

  // Update eBook details
  ebook.title = title || ebook.title;
  ebook.author = author || ebook.author;
  ebook.price = price || ebook.price;
  ebook.description = description || ebook.description;

  // Save updated eBook
  await ebook.save();

  res.status(200).json({ message: 'eBook updated successfully', ebook });
});






export const createNotes = async (req, res) => {
  try {
    const { title, author, price, description } = req.body;

    // Log the uploaded files to confirm structure
    console.log("Uploaded files:", req.files);

    // Ensure both cover image and note PDF are uploaded
    if (!req.files || !req.files.coverImage || !req.files.notePdf) {
      return res.status(400).json({ message: "Both cover image and note PDF are required." });
    }

    // Access the file URLs or paths properly
    const coverImagePath = req.files.coverImage[0].path || req.files.coverImage[0].secure_url; // Ensure path or secure_url is used
    const notePdfPath = req.files.notePdf[0].path || req.files.notePdf[0].secure_url; // Same for notePdf

    // Create the note document in the database
    const note = new Notes({
      title,
      author,
      price,
      description,
      coverImage: coverImagePath, // Assign the correct path/URL
      notePdf: notePdfPath,       // Assign the correct path/URL
    });

    // Save the new note document
    await note.save();

    // Respond with success message and note data
    res.status(201).json({ message: "Note created successfully", note });
  } catch (error) {
    console.error("Error in createNotes:", error); // Log the error
    res.status(400).json({ message: "Error creating note", error: error.message }); // Return the error message
  }
};



export const deleteNote = async (req, res) => {
  try {
    // Find the note by its ID
    const note = await Notes.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Extract public IDs from the stored Cloudinary URLs
    const pdfPublicId = note.notePdf && note.notePdf.split('/').pop().split('.')[0]; // Get public_id from notePdf URL
    const coverImagePublicId = note.coverImage && note.coverImage.split('/').pop().split('.')[0]; // Get public_id from coverImage URL

    // Delete note PDF from Cloudinary
    if (pdfPublicId) {
      await cloudinary.uploader.destroy(pdfPublicId, { resource_type: 'raw' }); // Use resource_type: 'raw' for PDFs
      console.log('Note PDF deleted from Cloudinary');
    }

    // Delete cover image from Cloudinary
    if (coverImagePublicId) {
      await cloudinary.uploader.destroy(coverImagePublicId); // For images, no need to specify resource_type
      console.log('Cover image deleted from Cloudinary');
    }

    // Delete the note from the database
    await note.deleteOne();

    // Remove the deleted note from any user's purchased notes
    await User.updateMany({}, { $pull: { purchasedNotes: req.params.id } });

    res.status(200).json({
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: error.message });
  }
};








export const updateNote = async (req, res) => {
  const { title, price, description } = req.body;
  const { id } = req.params;

  try {
    // Find the note by ID
    const note = await Notes.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Construct the updated note object
    const updatedNoteData = {
      title: title || note.title,
      price: price || note.price,
      description: description || note.description,
    };

    // Log the received form data
    console.log("Received data: ", { title, price, description });
    console.log("Files received: ", req.files);

    // If a new cover image is uploaded, update the cover image URL
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
      try {
        const coverImageResult = await cloudinary.v2.uploader.upload(req.files.coverImage[0].path, {
          folder: '/uploads',
        });
        updatedNoteData.coverImage = coverImageResult.secure_url;
        console.log('Cover Image updated: ', updatedNoteData.coverImage);
      } catch (error) {
        console.error('Cover Image upload error: ', error);
        return res.status(500).json({ message: "Cover Image upload failed" });
      }
    }

    // If a new note PDF is uploaded, update the note PDF URL
    if (req.files && req.files.notePdf && req.files.notePdf.length > 0) {
      try {
        const notePdfResult = await cloudinary.v2.uploader.upload(req.files.notePdf[0].path, {
          folder: '/uploads',
          resource_type: 'raw', // For non-image files like PDFs
        });
        updatedNoteData.notePdf = notePdfResult.secure_url;
        console.log('Note PDF updated: ', updatedNoteData.notePdf);
      } catch (error) {
        console.error('Note PDF upload error: ', error);
        return res.status(500).json({ message: "Note PDF upload failed" });
      }
    }

    // Update the note in the database
    const updatedNote = await Notes.findByIdAndUpdate(id, updatedNoteData, { new: true });

    // If the note isn't updated, handle the error
    if (!updatedNote) {
      return res.status(500).json({ message: "Failed to update the note" });
    }

    // Return the updated note
    res.status(200).json({ message: "Note updated successfully", note: updatedNote });

    // Log the updated note
    console.log('Note updated successfully: ', updatedNote);
  } catch (error) {
    console.error('Error updating the note: ', error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};






