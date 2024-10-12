import {Ebooks}  from '../models/Ebooks.js'; 
import { User } from '../models/User.js'; 
import { instance } from '../index.js';
import crypto from 'crypto';

import {EbookPayment}  from '../models/EbookPayment.js'; 
import TryCatch from '../middlewares/TryCatch.js'; 


export const getAllEbooks = async (req, res) => {
    try {
        
        const ebooks = await Ebooks.find();
        
        
       return res.status(200).json({ ebooks });
    } catch (error) {
        
        res.status(500).json({
            message: "Error retrieving eBooks",
            error: error.message
        });
    }
};

export const getSingleEbook = async (req, res) => {
    try {
        
        const ebook = await Ebooks.findById(req.params.id);
        
        
        if (!ebook) {
            return res.status(404).json({ message: 'E-book not found' });
        }
        
        
        return res.status(200).json({ebook} );
    } catch (error) {
        
        res.status(500).json({
            message: "Error retrieving eBook",
            error: error.message
        });
    }
};



export const getMyEbooks = async (req, res) => {
    try {
        
        const user = await User.findById(req.user.id).populate('purchasedEbooks');
        
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        
        const ebooks = user.purchasedEbooks;
        
        
        res.status(200).json({ ebooks });
    } catch (error) {
        
        res.status(500).json({
            message: 'Error retrieving eBooks',
            error: error.message
        });
    }
};






import cloudinary from 'cloudinary'; // Ensure you have cloudinary configured

export const getEbookPdf = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }
      console.log('User:', user);
      
      if (!user.purchasedEbooks.includes(req.params.id)) {
        console.log("User has not purchased this eBook");
        return res.status(403).json({ message: "You have not purchased this eBook" });
      }
  
      const ebook = await Ebooks.findById(req.params.id);
      if (!ebook) {
        console.log("eBook not found");
        return res.status(404).json({ message: "eBook not found" });
      }
  
      const pdfUrl = cloudinary.url(ebook.ebookPdf, { 
        resource_type: "raw" 
      });
      res.status(200).json({ pdfPath: pdfUrl });
    } catch (error) {
      console.error("Error retrieving eBook PDF:", error); 
      res.status(500).json({
        message: "Error retrieving eBook PDF",
        error: error.message,
      });
    }
  };
  




  




export const ebookCheckout = TryCatch(async (req, res) => {
  try{
  const user = await User.findById(req.user._id);
  const ebook = await Ebooks.findById(req.params.id);

  if (!ebook) {
      return res.status(404).json({
          message: "E-book not found",
      });
  }

  if (user.purchasedEbooks.includes(ebook._id)) {
      return res.status(400).json({
          message: "You already own this e-book",
      });
  }

  // Create order with Razorpay
  const options = {
      amount: Number(ebook.price * 100), // Convert price to paise
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`
  };

  
      const order = await instance.orders.create(options);

      // Respond with order details
      res.status(201).json({
          order,
          ebook
      });
  } catch (error) {
      res.status(500).json({
          message: "Error creating order",
          error: error.message
      });
  }
});



export const ebookVerification = TryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Verify the Razorpay signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
      // Record the payment
      await EbookPayment.create({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
      });

      // Find the user and eBook
      const user = await User.findById(req.user._id);
      const ebook = await Ebooks.findById(req.params.id);

      if (!user || !ebook) {
          return res.status(404).json({ message: "User or eBook not found" });
      }

      // Add the eBook to user's purchased eBooks
      user.purchasedEbooks.push(ebook._id);

      await user.save();

      res.status(200).json({
          message: "eBook Purchased Successfully",
      });
  } else {
      return res.status(400).json({
          message: "Payment Failed",
      });
  }
});
  



