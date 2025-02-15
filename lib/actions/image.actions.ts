"use server";

import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import { revalidatePath } from "next/cache";
import User from "../database/models/user.models";
import Image from "../database/models/image.model";
import { redirect } from "next/navigation";
import mongoose from "mongoose";

interface IImage {
  _id: string;
  author: mongoose.Types.ObjectId;
  // Add other properties of the image as needed
}

import { v2 as cloudinary } from 'cloudinary';
const populateUser = (query: mongoose.Query<IImage | IImage[], IImage>) => query.populate({
    path: 'author',
    model: User,
    select: '_id firstName lastName clerkId'
});
  
  // ADD IMAGE
  export async function addImage({ image, userId, path }: AddImageParams) {
    try {
      await connectToDatabase();
  
      const author = await User.findById(userId);
  
      if (!author) {
        throw new Error("User not found");
      }
  
      const newImage = await Image.create({
        ...image,
        author: author._id,
      })
  
      revalidatePath(path);
  
      return JSON.parse(JSON.stringify(newImage));
    } catch (error) {
      handleError(error)
    }
  }
  
  // UPDATE IMAGE
  export async function updateImage({ image, userId, path }: UpdateImageParams) {
    try {
      await connectToDatabase();
  
      const imageToUpdate = await Image.findById(image._id);
  
      if (!imageToUpdate || imageToUpdate.author.toHexString() !== userId) {
        throw new Error("Unauthorized or image not found");
      }
  
      const updatedImage = await Image.findByIdAndUpdate(
        imageToUpdate._id,
        image,
        { new: true }
      )
  
      revalidatePath(path);
  
      return JSON.parse(JSON.stringify(updatedImage));
    } catch (error) {
      handleError(error)
    }
  }
  
  // DELETE IMAGE
  export async function deleteImage(imageId: string) {
    try {
      await connectToDatabase();
  
      await Image.findByIdAndDelete(imageId);
    } catch (error) {
      handleError(error)
    } finally{
      redirect('/')
    }
  }
  
  // GET IMAGE
  export async function getImageById(imageId: string) {
    try {
      await connectToDatabase();
  
      const imageQuery = Image.findById(imageId);
      const image = await populateUser(imageQuery);

      if (!image) {
        throw new Error("Image not found");
      }
  
      if(!image) throw new Error("Image not found");
  
      return JSON.parse(JSON.stringify(image));
    } catch (error) {
      handleError(error)
    }
  }
  
  // GET IMAGES
  export async function getAllImages({ limit = 9, page = 1, searchQuery = '' }: {
    limit?: number;
    page: number;
    searchQuery?: string;
  }) {
    try {
      await connectToDatabase();
  
      cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      })
  
      let expression = 'folder=imaginify';
  
      if (searchQuery) {
        expression += ` AND ${searchQuery}`
      }
  
      const { resources } = await cloudinary.search
        .expression(expression)
        .execute();
  
     
      let query = {};
  
      if(searchQuery) {
        query = {
          publicId: {
            $in: resources.map((resource: { public_id: string }) => resource.public_id)
          }
        }
      }
  
      const skipAmount = (Number(page) -1) * limit;
  
      const images = await populateUser(Image.find(query))
        .sort({ updatedAt: -1 })
        .skip(skipAmount)
        .limit(limit);
      
      const totalImages = await Image.find(query).countDocuments();
      const savedImages = await Image.find().countDocuments();
  
      return {
        data: JSON.parse(JSON.stringify(images)),
        totalPage: Math.ceil(totalImages / limit),
        savedImages,
      }
    } catch (error) {
      handleError(error)
    }
  }
  
  // GET IMAGES BY USER
  export async function getUserImages({
    limit = 9,
    page = 1,
    userId,
  }: {
    limit?: number;
    page: number;
    userId: string;
  }) {
    try {
      await connectToDatabase();
  
      const skipAmount = (Number(page) - 1) * limit;
  
      const images = await populateUser(Image.find({ author: userId }))
        .sort({ updatedAt: -1 })
        .skip(skipAmount)
        .limit(limit);
  
      const totalImages = await Image.find({ author: userId }).countDocuments();
  
      return {
        data: JSON.parse(JSON.stringify(images)),
        totalPages: Math.ceil(totalImages / limit),
      };
    } catch (error) {
      handleError(error);
    }
  }